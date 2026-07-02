import express from "express";
import fs from "fs";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import { createWorker, PSM } from "tesseract.js";
import {
  buildSQLCandidates,
  extractSQLFromOcrText,
  bestSQLFromBlocks,
} from "./sql-recognition.js";

function loadDotEnv() {
  if (!fs.existsSync(".env")) return;
  const raw = fs.readFileSync(".env", "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq < 0) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

loadDotEnv();

const app = express();
app.use(express.json({ limit: "1mb" }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng").then(async (worker) => {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        preserve_interword_spaces: "1",
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.*(),=;[]{}| \n",
      });
      return worker;
    });
  }
  return workerPromise;
}

async function preprocess(buffer) {
  const base = sharp(buffer).rotate();
  const meta = await base.metadata();
  const width = Math.max(1200, Math.round((meta.width || 800) * 2.5));
  return base
    .resize({ width, withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();
}

async function runLocalOcr(buffer) {
  const worker = await getWorker();
  const processed = await preprocess(buffer);
  const result = await worker.recognize(processed);
  return {
    rawText: result?.data?.text || "",
    provider: "server-tesseract",
  };
}

function extractWithVisionPromptFallback(rawText) {
  const blocks = extractSQLFromOcrText(rawText);
  const candidates = buildSQLCandidates(blocks);
  const best = bestSQLFromBlocks(blocks);
  return {
    sql: best?.sql || "",
    confidence: best?.validation?.ok ? Math.min(0.99, 0.78 + Math.min(best.score, 130) / 650) : 0.35,
    validated: Boolean(best?.validation?.ok),
    errors: best?.validation?.errors || ["SQL 문장을 찾지 못했습니다."],
    candidates: candidates.slice(0, 5).map((c) => ({
      sql: c.sql,
      validated: c.validation.ok,
      errors: c.validation.errors,
      score: c.score,
      variant: c.variant,
    })),
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/extract-sql", upload.single("image"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "image 파일이 필요합니다." });
    }
    const ocr = await runLocalOcr(req.file.buffer);
    const extracted = extractWithVisionPromptFallback(ocr.rawText);
    res.json({
      ...extracted,
      provider: ocr.provider,
      rawText: ocr.rawText,
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || "SQL 인식 중 오류가 발생했습니다." });
  }
});

function cleanJsonText(text) {
  return String(text || "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
}

function extractJsonObjectText(text) {
  const cleaned = cleanJsonText(text);
  const arrayStart = cleaned.indexOf("[");
  const objectStart = cleaned.indexOf("{");
  const start = objectStart >= 0 && (arrayStart < 0 || objectStart < arrayStart) ? objectStart : arrayStart;
  if (start < 0) throw new Error("AI 응답에서 JSON을 찾지 못했습니다.");

  const open = cleaned[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = start; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (escaping) {
      escaping = false;
      continue;
    }
    if (ch === "\\") {
      escaping = inString;
      continue;
    }
    if (ch === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === open) depth += 1;
    if (ch === close) depth -= 1;
    if (depth === 0) return cleaned.slice(start, i + 1);
  }

  const end = cleaned.lastIndexOf(close);
  if (end < start) throw new Error("AI 응답 JSON이 닫히지 않았습니다.");
  return cleaned.slice(start, end + 1);
}

function parseQuizJson(text) {
  const parsed = JSON.parse(extractJsonObjectText(text));
  return Array.isArray(parsed) ? { questions: parsed } : parsed;
}

const DESIRED_QUIZ_COUNT = 5;
const MIN_AI_QUIZ_COUNT = 2;
const quizCache = new Map();

function hashString(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function quizCacheKey({ book, title, readLevel, text }) {
  return [
    String(book || ""),
    String(title || ""),
    Number(readLevel || 1),
    hashString(String(text || "").slice(0, 6000)),
  ].join("|");
}

function simplifyText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[`"'“”‘’()[\]{}.,;:!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeOptionText(value) {
  return simplifyText(value)
    .replace(/^(보기|선택지|option)\s*[a-d가-라]?\s*/i, "")
    .replace(/^[a-d가-라][.)]\s*/i, "")
    .trim();
}

function equivalentOptionKey(value) {
  const base = normalizeOptionText(value);
  const commaParts = base
    .split(/\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (commaParts.length > 1) return commaParts.sort().join(",");
  return base;
}

function polishQuizText(value) {
  return String(value || "")
    .replace(/인STRUCTOR/g, "instructor")
    .replace(/Instructor/g, "instructor")
    .trim();
}

function keywordScore(text, patterns) {
  const value = String(text || "").toLowerCase();
  return patterns.reduce((score, pattern) => score + (pattern.test(value) ? 1 : 0), 0);
}

function repairAnswerIndex(question, sourceText) {
  const opts = Array.isArray(question.opts) ? question.opts : [];
  if (opts.length !== 4) return question.ans;
  const context = `${question.concept || ""}\n${question.q || ""}\n${question.exp || ""}`.toLowerCase();
  const rules = [];
  if (/avg|average|평균/.test(context)) rules.push([/avg|average|평균/]);
  if (/select|선택|반환|가져/.test(context)) rules.push([/select|선택|반환|가져/]);
  if (/group\s*by|그룹|묶/.test(context)) rules.push([/group|그룹|묶/]);
  if (/dept_name|department|dept|부서|학과/.test(context)) rules.push([/dept|department|부서|학과/]);
  if (/salary|급여|연봉/.test(context)) rules.push([/salary|급여|연봉/]);
  if (/instructor|인스트럭터|교수|강사|테이블/.test(context) && /instructor/.test(String(sourceText || "").toLowerCase())) {
    rules.unshift([/instructor|인스트럭터|강사|교수/]);
  }
  if (!rules.length) return question.ans;

  const scores = opts.map((opt) => rules.reduce((sum, patterns) => sum + keywordScore(opt, patterns), 0));
  const best = scores.reduce((bestIdx, score, idx) => score > scores[bestIdx] ? idx : bestIdx, 0);
  const current = Number(question.ans);
  if (scores[best] > 0 && (!Number.isInteger(current) || current < 0 || current > 3 || scores[best] > scores[current])) {
    return best;
  }
  return question.ans;
}

function qualityRejectReason(q, sourceText) {
  const question = String(q.q || "").trim();
  const concept = String(q.concept || "").trim();
  const exp = String(q.exp || "").trim();
  const opts = Array.isArray(q.opts) ? q.opts.map((x) => String(x || "").trim()) : [];
  const ans = Number(q.ans);
  const allText = `${concept}\n${question}\n${opts.join("\n")}\n${exp}`;
  const normalizedQuestion = simplifyText(question);
  const normalizedOpts = opts.map(normalizeOptionText);
  const uniqueOpts = new Set(normalizedOpts);
  const uniqueEquivalentOpts = new Set(opts.map(equivalentOptionKey));

  if (!question || question.length < 10 || question.length > 260) return "문제 문장이 비정상입니다.";
  if (!concept || concept.length > 60) return "개념명이 비정상입니다.";
  if (opts.length !== 4 || opts.some((x) => !x || x.length > 120)) return "보기 개수가 맞지 않습니다.";
  if (uniqueOpts.size !== 4) return "보기가 중복됩니다.";
  if (uniqueEquivalentOpts.size !== 4) return "의미상 같은 보기가 있습니다.";
  if (!Number.isInteger(ans) || ans < 0 || ans > 3) return "정답 인덱스가 비정상입니다.";
  if (!exp || exp.length < 8 || exp.length > 300) return "해설이 비정상입니다.";
  if (normalizedOpts.some((x) => /^(a|b|c|d|보기 a|보기 b|보기 c|보기 d)$/.test(x))) return "자리표시자 보기가 있습니다.";
  if (normalizedOpts.some((x) => /^(모두 정답|모두 오답|위의 모두|해당 없음|알 수 없음)$/.test(x))) return "모호한 보기가 있습니다.";
  if (/group\s+by\s+groups/i.test(allText)) return "잘못된 GROUP BY 문장이 포함됐습니다.";
  if (/select\s+.+\s+from\s+.+\s+group\s+by\s*;/i.test(allText)) return "GROUP BY 컬럼이 누락된 SQL이 있습니다.";
  if (/undefined|null|nan|\[object object\]/i.test(allText)) return "생성 오류 토큰이 포함됐습니다.";
  if (/(최고화|최저화|총화|평균화합니다|최대화합니다|최소화합니다|지우는다)/.test(allText)) return "부자연스러운 한국어 보기가 있습니다.";
  if (/^[\s;,\-_*]+$/.test(question)) return "문제 문장이 의미를 갖지 않습니다.";

  const optText = opts.join("\n").toLowerCase();
  const conceptText = `${concept}\n${question}\n${exp}`.toLowerCase();
  if (/avg|평균/.test(conceptText) && !/avg|평균/.test(optText)) return "AVG 정답 후보가 보기에 없습니다.";
  if (/select|선택|반환|가져/.test(conceptText) && !/select|선택|반환|가져/.test(optText)) return "SELECT 정답 후보가 보기에 없습니다.";
  if (/group\s*by|그룹|묶/.test(conceptText) && !/group|그룹|묶/.test(optText)) return "GROUP BY 정답 후보가 보기에 없습니다.";
  if (/dept_name|department|dept|부서|학과/.test(conceptText) && !/dept_name|department|dept|부서|학과/.test(optText)) return "dept_name 정답 후보가 보기에 없습니다.";
  if (/salary|급여|연봉/.test(conceptText) && !/salary|급여|연봉|임금/.test(optText)) return "salary 정답 후보가 보기에 없습니다.";
  if (/instructor|인스트럭터|교수|강사|테이블/.test(conceptText) && /instructor/.test(String(sourceText || "").toLowerCase()) && !/instructor|인스트럭터|교수|강사/.test(optText)) {
    return "instructor 정답 후보가 보기에 없습니다.";
  }

  const hasQuestionSignal = /[?？]|무엇|어떤|왜|언제|어디|고르|설명|역할|결과|옳|맞|틀린|해당/.test(question);
  if (!hasQuestionSignal && /^select\s/i.test(normalizedQuestion)) return "SQL 문장만 있고 질문이 없습니다.";

  const source = simplifyText(sourceText);
  if (source.length > 120) {
    const conceptKey = simplifyText(concept);
    const importantTokens = allText.match(/\b(select|from|where|group\s+by|having|join|avg|sum|count|min|max|primary\s+key|foreign\s+key|entity|relationship|normalization|dept_name|salary|instructor)\b/gi) || [];
    const conceptAppears = conceptKey && source.includes(conceptKey);
    const tokenAppears = importantTokens.some((token) => source.includes(simplifyText(token)));
    if (!conceptAppears && importantTokens.length && !tokenAppears) return "강의자료와 연결되는 핵심어가 부족합니다.";
  }

  return "";
}

function normalizeQuizQuestions(value, readLevel, { sourceText = "", limit = 8 } = {}) {
  const source = Array.isArray(value?.questions) ? value.questions : [];
  const rejected = [];
  const seenQuestions = new Set();
  const questions = source.slice(0, limit).map((q, idx) => {
    const opts = Array.isArray(q.opts) ? q.opts.slice(0, 4).map((x) => String(x || "").trim()) : [];
    const ans = Number(q.ans);
    const normalized = {
      id: Number(q.id) || Date.now() + idx,
      concept: polishQuizText(q.concept || "핵심 개념").slice(0, 40),
      q: polishQuizText(q.q),
      opts: opts.map(polishQuizText),
      ans: Number.isInteger(ans) && ans >= 0 && ans < 4 ? ans : 0,
      exp: polishQuizText(q.exp),
      pg: Number(q.pg) || 1,
      difficulty: ["easy", "apply", "hard"].includes(q.difficulty)
        ? q.difficulty
        : readLevel >= 3
          ? "hard"
          : readLevel === 2
            ? "apply"
            : "easy",
      generated: true,
    };
    return { ...normalized, ans: repairAnswerIndex(normalized, sourceText) };
  }).filter((q, idx) => {
    const reason = qualityRejectReason(q, sourceText);
    const key = simplifyText(q.q);
    if (reason) {
      rejected.push({ index: idx, reason });
      return false;
    }
    if (seenQuestions.has(key)) {
      rejected.push({ index: idx, reason: "중복 문제입니다." });
      return false;
    }
    seenQuestions.add(key);
    return true;
  });
  return { questions, rejected };
}

function buildQuizPrompt({ text, readLevel, title, book }) {
  const levelGuide = readLevel >= 3
    ? "심화/오개념 점검 문제를 중심으로 만들고, 단순 정의보다 적용 상황을 묻는다."
    : readLevel === 2
      ? "개념을 SQL 예시나 데이터베이스 상황에 적용하는 문제를 중심으로 만든다."
      : "용어와 핵심 정의를 확인하는 쉬운 문제를 중심으로 만든다.";
  const context = String(text || "").replace(/\s+/g, " ").slice(0, 5500);
  return `너는 데이터베이스 강의자료에서 객관식 퀴즈를 만드는 도우미다.

강의자료: ${title || book || "데이터베이스"}
회독 단계: ${readLevel}회독
출제 기준: ${levelGuide}

아래 강의 텍스트만 근거로 한국어 4지선다 퀴즈를 5문제 만들어라.
텍스트가 부족하면 데이터베이스/SQL 기본 개념에 맞춰 보수적으로 만들어라.

반드시 순수 JSON만 반환해라. 설명 문장, 마크다운, 코드펜스 금지.
형식:
{
  "questions": [
    {
      "concept": "GROUP BY",
      "q": "GROUP BY 절의 역할로 가장 적절한 것은?",
      "opts": ["같은 값을 가진 행을 그룹화한다", "행을 무작위로 섞는다", "테이블 구조를 삭제한다", "모든 컬럼명을 변경한다"],
      "ans": 0,
      "exp": "GROUP BY는 지정한 컬럼 값이 같은 행을 묶어 집계할 때 사용한다.",
      "pg": 1,
      "difficulty": "easy"
    }
  ]
}

주의:
- ans는 정답 보기의 0-based index다.
- opts는 정확히 4개다.
- difficulty는 easy, apply, hard 중 하나다.
- SQL 키워드와 컬럼명은 가능한 정확히 보존한다.
- 보기끼리 의미가 겹치면 안 된다.
- "A", "B", "보기 A" 같은 자리표시자 보기는 금지한다.
- 위 형식 예시의 보기 문장을 그대로 복사하지 말고, 강의 텍스트에 맞는 새 보기를 만든다.
- 설명 문장을 SQL 문장으로 오인하지 마라. 예: "GROUP BY groups rows"는 SQL이 아니다.
- SQL 문장을 출제할 때는 실제 문법에 맞는 문장만 사용한다.
- 문제마다 정답이 명확해야 하며 해설은 정답 근거를 짧게 설명한다.

강의 텍스트:
${context}`;
}

function buildCompactQuizPrompt(prompt, readLevel) {
  const marker = "강의 텍스트:";
  const sourceStart = prompt.indexOf(marker);
  const source = (sourceStart >= 0 ? prompt.slice(sourceStart + marker.length) : prompt)
    .replace(/\s+/g, " ")
    .slice(0, 3200);
  const difficulty = readLevel >= 3 ? "hard" : readLevel === 2 ? "apply" : "easy";
  return `한국어 DB/SQL 객관식 퀴즈 5문제를 만들어라.
출력은 JSON 객체 하나만 허용된다. 마크다운과 설명 문장은 금지한다.
스키마: {"questions":[{"concept":"GROUP BY","q":"GROUP BY 절의 역할로 가장 적절한 것은?","opts":["같은 값을 가진 행을 그룹화한다","행을 무작위로 섞는다","테이블 구조를 삭제한다","모든 컬럼명을 변경한다"],"ans":0,"exp":"GROUP BY는 지정한 컬럼 값이 같은 행을 묶어 집계할 때 사용한다.","pg":1,"difficulty":"${difficulty}"}]}
규칙: opts는 정확히 4개, ans는 0부터 3까지의 정수, difficulty는 easy/apply/hard 중 하나.
금지: 중복 보기, 자리표시자 보기, 잘못된 SQL, 설명 문장을 SQL로 오인한 문제.
강의 텍스트가 부족하면 SQL/데이터베이스 기본 개념으로 보수적으로 출제한다.
강의 텍스트: ${source}`;
}

function buildQualityRetryPrompt(prompt, readLevel, rejected) {
  const reasons = rejected
    .slice(0, 6)
    .map((item) => `- ${item.reason}`)
    .join("\n");
  return `${buildCompactQuizPrompt(prompt, readLevel)}

이전 생성 문제는 품질 검증에서 제외되었다. 아래 문제를 피해서 새 문제를 만들어라.
${reasons || "- 보기가 중복되거나 정답이 불명확한 문제"}

반드시 새 문제 5개를 JSON으로만 반환한다.`;
}

function buildTemplateQuizQuestions(sourceText, readLevel) {
  const text = String(sourceText || "").toLowerCase();
  const difficulty = readLevel >= 3 ? "hard" : readLevel === 2 ? "apply" : "easy";
  const hasAggregation = /group\s+by|avg\s*\(|salary|dept_name|instructor/.test(text);
  if (!hasAggregation) return [];
  return [
    {
      id: Date.now() + 1,
      concept: "GROUP BY",
      q: "GROUP BY 절의 역할로 가장 적절한 것은?",
      opts: ["같은 값을 가진 행을 그룹화한다", "행을 무작위로 섞는다", "테이블 구조를 삭제한다", "모든 컬럼명을 변경한다"],
      ans: 0,
      exp: "GROUP BY는 지정한 컬럼 값이 같은 행을 묶어 집계할 때 사용한다.",
      pg: 1,
      difficulty,
      generated: true,
    },
    {
      id: Date.now() + 2,
      concept: "AVG",
      q: "AVG(salary)의 의미로 가장 적절한 것은?",
      opts: ["salary의 평균값을 계산한다", "salary의 최댓값을 찾는다", "salary 값을 문자열로 바꾼다", "salary 컬럼을 삭제한다"],
      ans: 0,
      exp: "AVG는 평균을 구하는 집계 함수이므로 AVG(salary)는 급여 평균을 계산한다.",
      pg: 1,
      difficulty,
      generated: true,
    },
    {
      id: Date.now() + 3,
      concept: "dept_name",
      q: "GROUP BY dept_name을 사용하는 이유는 무엇인가?",
      opts: ["부서별로 행을 묶기 위해서", "이름순으로 정렬하기 위해서", "급여가 없는 행을 제거하기 위해서", "테이블을 새로 만들기 위해서"],
      ans: 0,
      exp: "dept_name으로 그룹화하면 같은 부서의 행끼리 묶여 부서별 집계를 만들 수 있다.",
      pg: 1,
      difficulty,
      generated: true,
    },
    {
      id: Date.now() + 4,
      concept: "FROM",
      q: "FROM instructor의 의미로 맞는 것은?",
      opts: ["instructor 테이블에서 데이터를 읽는다", "instructor 테이블을 삭제한다", "instructor라는 컬럼을 평균낸다", "instructor 값을 기준으로 정렬한다"],
      ans: 0,
      exp: "FROM 절은 조회할 원본 테이블을 지정한다.",
      pg: 1,
      difficulty,
      generated: true,
    },
    {
      id: Date.now() + 5,
      concept: "SELECT",
      q: "SELECT dept_name, AVG(salary)의 결과에 포함되는 값은?",
      opts: ["부서명과 부서별 평균 급여", "교수 이름과 전체 급여 합계", "학생 ID와 과목명", "테이블 이름과 컬럼 개수"],
      ans: 0,
      exp: "SELECT 절은 출력할 값을 정하며, 이 쿼리는 부서명과 부서별 평균 급여를 출력한다.",
      pg: 1,
      difficulty,
      generated: true,
    },
  ];
}

async function callGeminiQuiz(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.25, responseMimeType: "application/json" },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Gemini 호출 실패: ${response.status}`);
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "";
}

function chatMessageContentToText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.content === "string") return part.content;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

async function callOpenRouterQuiz(prompt, { readLevel = 1 } = {}) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY가 설정되지 않았습니다.");
  const models = String(
    process.env.OPENROUTER_MODEL ||
    "liquid/lfm-2.5-1.2b-instruct:free,nvidia/nemotron-3-nano-30b-a3b:free"
  )
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const postOpenRouter = async (model, messages) => {
    const timeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS || 12000);
    const controller = new AbortController();
    let timer = null;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        const err = new Error(`${model}: OpenRouter 응답 지연으로 ${timeoutMs}ms 후 중단했습니다.`);
        err.model = model;
        reject(err);
      }, timeoutMs);
    });
    const request = (async () => {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:5173",
          "X-OpenRouter-Title": process.env.OPENROUTER_SITE_NAME || "QueryNote AI",
        },
        body: JSON.stringify({
          model,
          temperature: 0.15,
          max_tokens: Number(process.env.OPENROUTER_MAX_TOKENS || 1100),
          messages,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.error?.message || data?.message || `OpenRouter 호출 실패: ${response.status}`;
        const metadata = data?.error?.metadata?.raw || data?.error?.metadata?.reason || "";
        const detail = metadata ? ` ${String(metadata).slice(0, 240)}` : "";
        const err = new Error(`${model}: ${message}${detail}`);
        err.status = response.status;
        err.model = model;
        throw err;
      }
      return chatMessageContentToText(data?.choices?.[0]?.message?.content);
    })();
    try {
      return await Promise.race([request, timeout]);
    } catch (e) {
      if (e?.name === "AbortError") {
        const err = new Error(`${model}: OpenRouter 응답 지연으로 ${timeoutMs}ms 후 중단했습니다.`);
        err.model = model;
        throw err;
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  };

  const attempts = [
    [
      {
        role: "system",
        content: "You create Korean database quizzes. Output only one valid JSON object. Do not use markdown.",
      },
      { role: "user", content: prompt },
    ],
  ];

  let lastError = null;
  for (const model of models) {
    for (const messages of attempts) {
      try {
        const raw = await postOpenRouter(model, messages);
        parseQuizJson(raw);
        return raw;
      } catch (e) {
        lastError = e;
        const msg = String(e?.message || e || "");
        if (/401|403|unauthorized|permission|API[_ -]?KEY|invalid api key|credits|402/i.test(msg)) break;
        if (/Provider returned error|응답 지연|timeout|timed out|rate[- ]?limit|quota|429|500|502|503|504|No endpoints|capacity/i.test(msg)) break;
      }
    }
  }
  throw lastError || new Error("OpenRouter 응답을 JSON으로 변환하지 못했습니다.");
}

async function callGroqQuiz(prompt, { readLevel = 1 } = {}) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY가 설정되지 않았습니다.");
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const postGroq = async (messages, useJsonMode = false) => {
    const body = {
      model,
      temperature: 0.15,
      max_completion_tokens: 1800,
      messages,
    };
    if (useJsonMode) body.response_format = { type: "json_object" };
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || `Groq 호출 실패: ${response.status}`;
      const failed = data?.error?.failed_generation ? ` failed_generation: ${data.error.failed_generation}` : "";
      throw new Error(`${message}${failed}`);
    }
    return data?.choices?.[0]?.message?.content || "";
  };

  const jsonMode = /^(1|true|json_object)$/i.test(String(process.env.GROQ_RESPONSE_FORMAT || ""));
  const attempts = [
    {
      jsonMode,
      messages: [
        {
          role: "system",
          content: "You create Korean database quizzes. Output only one valid JSON object. Do not use markdown.",
        },
        { role: "user", content: prompt },
      ],
    },
    {
      jsonMode: false,
      messages: [
        {
          role: "system",
          content: "Output only valid compact JSON. Start with { and end with }.",
        },
        { role: "user", content: buildCompactQuizPrompt(prompt, readLevel) },
      ],
    },
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      const raw = await postGroq(attempt.messages, attempt.jsonMode);
      parseQuizJson(raw);
      return raw;
    } catch (e) {
      lastError = e;
      const msg = String(e?.message || e || "");
      if (/401|403|unauthorized|permission|API[_ -]?KEY|invalid api key/i.test(msg)) break;
    }
  }
  throw lastError || new Error("Groq 응답을 JSON으로 변환하지 못했습니다.");
}

function summarizeAiError(provider, error) {
  const msg = String(error?.message || error || "");
  if (/quota|RESOURCE_EXHAUSTED|rate[- ]?limit|429|generate_content_free_tier|free[-_ ]?model|daily limit/i.test(msg)) {
    return `${provider}: 무료 할당량이 없거나 소진되었습니다. 잠시 후 재시도하거나 다른 제공자 키를 설정하세요.`;
  }
  if (/credits|insufficient balance|payment required|402/i.test(msg)) {
    return `${provider}: 크레딧이 없거나 결제 설정이 필요합니다.`;
  }
  if (/API_KEY|key|401|403|permission|unauthorized/i.test(msg)) {
    return `${provider}: API 키가 없거나 권한이 없습니다.`;
  }
  if (/failed_generation|Failed to generate JSON|JSON으로 변환|Unexpected token|JSON/i.test(msg)) {
    return `${provider}: AI 응답을 퀴즈 JSON으로 변환하지 못했습니다. 짧은 프롬프트로 재시도했지만 실패했습니다.`;
  }
  return `${provider}: ${msg.split("\n")[0].slice(0, 180)}`;
}

app.post("/api/generate-quiz", async (req, res) => {
  const readLevel = Number(req.body?.readLevel || 1);
  const sourceText = String(req.body?.text || "");
  const cacheKey = quizCacheKey({
    book: req.body?.book,
    title: req.body?.title,
    readLevel,
    text: sourceText,
  });
  if (quizCache.has(cacheKey)) {
    return res.json({ ...quizCache.get(cacheKey), cached: true });
  }
  const prompt = buildQuizPrompt({
    text: sourceText,
    readLevel,
    title: req.body?.title,
    book: req.body?.book,
  });
  const errors = [];
  const providerMap = { openrouter: callOpenRouterQuiz, gemini: callGeminiQuiz, groq: callGroqQuiz };
  const providerOrder = String(process.env.QUIZ_PROVIDER || "openrouter,groq,gemini")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter((x) => providerMap[x]);
  for (const provider of providerOrder) {
    const call = providerMap[provider];
    const accepted = [];
    const seen = new Set();
    let rejected = [];
    let providerBlocked = false;
    const maxAttempts = provider === "openrouter" ? 1 : 2;
    for (let attempt = 0; attempt < maxAttempts && accepted.length < DESIRED_QUIZ_COUNT; attempt += 1) {
      try {
        const activePrompt = attempt === 0 ? prompt : buildQualityRetryPrompt(prompt, readLevel, rejected);
        const raw = await call(activePrompt, { readLevel });
        const parsed = parseQuizJson(raw);
        const normalized = normalizeQuizQuestions(parsed, readLevel, {
          sourceText,
          limit: 10,
        });
        rejected = normalized.rejected;
        for (const question of normalized.questions) {
          const key = simplifyText(question.q);
          if (seen.has(key)) continue;
          seen.add(key);
          accepted.push(question);
          if (accepted.length >= DESIRED_QUIZ_COUNT) break;
        }
      } catch (e) {
        errors.push(summarizeAiError(provider, e));
        const msg = String(e?.message || e || "");
        if (/401|403|unauthorized|permission|API[_ -]?KEY|invalid api key|quota|429/i.test(msg)) {
          providerBlocked = true;
          break;
        }
      }
    }
    if (accepted.length >= MIN_AI_QUIZ_COUNT) {
      const payload = {
        provider,
        fallback: false,
        questions: accepted.slice(0, DESIRED_QUIZ_COUNT),
        quality: {
          accepted: Math.min(accepted.length, DESIRED_QUIZ_COUNT),
          rejected: rejected.length,
          minRequired: MIN_AI_QUIZ_COUNT,
        },
      };
      quizCache.set(cacheKey, payload);
      return res.json(payload);
    }
    if (!providerBlocked) errors.push(`${provider}: 품질 검증을 통과한 문제가 ${accepted.length}개뿐입니다.`);
  }
  const templateQuestions = buildTemplateQuizQuestions(sourceText, readLevel);
  if (templateQuestions.length) {
    return res.json({
      provider: "template",
      fallback: false,
      questions: templateQuestions,
      quality: {
        accepted: templateQuestions.length,
        rejected: 0,
        minRequired: MIN_AI_QUIZ_COUNT,
      },
      errors: [...new Set(errors)],
    });
  }
  res.json({ provider: "local", fallback: true, questions: [], errors: [...new Set(errors)] });
});

const port = Number(process.env.PORT || process.env.API_PORT || 5174);

// ── Gemini Vision: PDF 페이지 이미지에서 테이블 + SQL 추출 ──────────────────
async function extractTableAndSqlWithGemini(base64Image, mimeType = "image/png") {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const prompt = `이 강의 슬라이드 이미지를 분석해서 아래 JSON 형식으로만 반환해라. 설명이나 마크다운 없이 순수 JSON만.

{
  "tables": [
    {
      "name": "테이블명",
      "columns": ["컬럼1", "컬럼2", "컬럼3"],
      "rows": [
        {"컬럼1": "값1", "컬럼2": "값2", "컬럼3": "값3"}
      ],
      "createSql": "CREATE TABLE 테이블명 (컬럼1 VARCHAR(50), ...);",
      "insertSql": "INSERT INTO 테이블명 VALUES (...);
INSERT INTO 테이블명 VALUES (...);"
    }
  ],
  "sqlCode": "슬라이드에 있는 SQL 코드 (없으면 빈 문자열)",
  "hasTable": true,
  "hasSql": true
}

주의:
- 테이블이 여러 개면 모두 추출
- SQL 코드 박스가 있으면 정확히 추출 (오타 수정 금지)
- 테이블이 없으면 tables는 빈 배열
- SQL이 없으면 sqlCode는 빈 문자열`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { inline_data: { mime_type: mimeType, data: base64Image } },
          { text: prompt }
        ]
      }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Gemini Vision 호출 실패: ${response.status}`);
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch(e) {
    throw new Error("Gemini 응답을 JSON으로 파싱하지 못했습니다: " + text.slice(0, 200));
  }
}

app.post("/api/extract-table-sql", upload.single("image"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "image 파일이 필요합니다." });
    }
    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype || "image/png";

    // Gemini Vision으로 테이블 + SQL 추출
    const result = await extractTableAndSqlWithGemini(base64Image, mimeType);
    return res.json({ ok: true, ...result, provider: "gemini-vision" });
  } catch (e) {
    console.error("[extract-table-sql]", e.message);
    return res.status(500).json({ ok: false, error: e.message, tables: [], sqlCode: "" });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, "0.0.0.0", () => {
  console.log(`QueryNote ready on http://localhost:${port}`);
});