import SQLParserPkg from "node-sql-parser";

const SQL_PARSER = new SQLParserPkg.Parser();

export function stripSqlComments(sql) {
  return (sql || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/--.*$/,""))
    .join("\n");
}

export function splitSQLStatements(raw) {
  const sql = stripSqlComments((raw || "").replace(/```[\w]*\n?/g, "").replace(/```/g, ""));
  const out = [];
  let buf = "";
  let quote = null;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1];
    buf += ch;
    if (quote) {
      if (ch === quote) {
        if (next === quote) {
          buf += next;
          i++;
        } else quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === ";") {
      const s = buf.replace(/;\s*$/, "").trim();
      if (s) out.push(s);
      buf = "";
    }
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}

function cleanPdfSqlLine(line) {
  let s = (line || "")
    .replace(/[\u0000-\u001F\uFFFD]/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  s = s.replace(/^[q§◦•]\s*/, "").trim();
  if (!s || /^\d+$/.test(s)) return "";
  s = s.replace(/\s+Step\s+\d+\..*$/i, "").replace(/\s+Apply the condition:.*$/i, "");
  if (s.includes(";")) s = s.slice(0, s.indexOf(";") + 1);
  return s.trim();
}

export function extractSQLBlocks(rawText) {
  const lines = (rawText || "").split(/\n+/).map(cleanPdfSqlLine).filter(Boolean);
  const start = /^(SELECT|WITH|CREATE\s+TABLE|INSERT\s+INTO|UPDATE|DELETE\s+FROM|ALTER\s+TABLE|DROP\s+TABLE)\b/i;
  const cont = /^(FROM|JOIN|INNER\s+JOIN|LEFT\s+(?:OUTER\s+)?JOIN|RIGHT\s+(?:OUTER\s+)?JOIN|FULL\s+(?:OUTER\s+)?JOIN|CROSS\s+JOIN|NATURAL(?:\s+(?:LEFT|RIGHT)(?:\s+OUTER)?)?\s+JOIN|ON|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|VALUES|SET|AND|OR)\b/i;
  const blocks = [];
  let cur = [];
  const finish = () => {
    if (!cur.length) return;
    let sql = cur.join("\n").replace(/\s+;/g, ";").trim();
    if (start.test(sql)) {
      if (!/;\s*$/.test(sql)) sql += ";";
      if (!blocks.some((b) => b.toLowerCase() === sql.toLowerCase())) blocks.push(sql);
    }
    cur = [];
  };
  for (const line of lines) {
    if (start.test(line)) {
      finish();
      cur = [line];
      if (line.includes(";")) finish();
      continue;
    }
    if (cur.length) {
      const joined = cur.join(" ");
      const waitingForFrom = /^\s*SELECT\b/i.test(joined) && !/\bFROM\b/i.test(joined);
      const selectListLine = waitingForFrom && /^[\w*.,\s]+(?:\s+AS\s+\w+)?$/i.test(line);
      if (cont.test(line) || selectListLine) {
        cur.push(line);
        if (line.includes(";")) finish();
      } else finish();
    }
  }
  finish();
  return blocks;
}

const SQL_IDENTIFIER_REPAIRS = [
  [/\bdept\s+name\b/gi, "dept_name"],
  [/\bdept\s+id\b/gi, "dept_id"],
  [/\bstudent\s+id\b/gi, "student_id"],
  [/\bcourse\s+id\b/gi, "course_id"],
  [/\bmanager[_\s]+id\b/gi, "manager_id"],
  [/\bmandger[_\s]+id\b/gi, "manager_id"],
  [/\bemp\s+id\b/gi, "emp_id"],
  [/\bta\s+id\b/gi, "ta_id"],
  [/\binstruct0r\b/gi, "instructor"],
  [/\binstructer\b/gi, "instructor"],
  [/\bsaiary\b/gi, "salary"],
  [/\bsal ary\b/gi, "salary"],
  [/\bAVG\s*\(\s*salary\s*\)/gi, "AVG(salary)"],
  [/\bSUM\s*\(\s*salary\s*\)/gi, "SUM(salary)"],
  [/\bCOUNT\s*\(\s*\*\s*\)/gi, "COUNT(*)"],
];

function repairKnownSqlIdentifiers(sql) {
  return SQL_IDENTIFIER_REPAIRS.reduce((out, [from, to]) => out.replace(from, to), sql || "")
    .replace(/\bcol\s+([ABXY])\b/gi, (_m, col) => `col${String(col).toUpperCase()}`)
    .replace(/\bp\s+([12])\b/gi, "p$1");
}

export function normalizeOcrSqlLine(line) {
  let s = (line || "").replace(/[\u0000-\u001F\uFFFD]/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/^[q§◦•]\s*/, "").trim();
  if (!s) return "";
  s = s.replace(/[|\[\]{}]/g, " ").replace(/[“”]/g, '"').replace(/[‘’«»]/g, " ");
  s = s.replace(/SELECT\s*\\\s*\*/gi, "SELECT *").replace(/SELECT\s+\/\s*;?/gi, "SELECT *");
  if (/^SELECT\s+\*/i.test(s) && !/\bFROM\b/i.test(s)) s = s.replace(/^(SELECT\s+\*)\s+.*/i, "$1");
  s = s.replace(/^(SELECT\s+\*)\s+.*\bSELECT\b.*/i, "$1");
  s = s.replace(/\bJ0IN\b/gi, "JOIN").replace(/\bJOlN\b/gi, "JOIN");
  s = s.replace(/\.p[lI]j?\b/gi, ".p1").replace(/\bp[lI]j?\b/gi, "p1");
  s = s.replace(/\b0N\b/g, "ON").replace(/\bO N\b/g, "ON");
  s = s.replace(/\bone[vy)]?\b/gi, "one").replace(/\btw0\b/gi, "two");
  s = repairKnownSqlIdentifiers(s);
  s = s.replace(/\bFROM\s+([A-Za-z_]\w*)\s*;\s*JOIN\b/i, "FROM $1 JOIN");
  s = s.replace(/\bFROM\s+([A-Za-z_]\w*)\s*,\s+JOIN\b/i, "FROM $1 JOIN");
  s = s.replace(/\bFROM\s+([A-Za-z_]\w*)\s*,\s+([A-Za-z_]\w*)\b/i, "FROM $1 CROSS JOIN $2");
  s = s.replace(/\bON\s+([\w.]+)\s+([\w.]+)\b/i, "ON $1 = $2");
  s = s.replace(/:\s*$/, ";");
  s = s.replace(/\s+/g, " ").trim();
  if (/\bON\b/i.test(s)) s = s.replace(/\b(ON\s+[\w.]+\s*=\s*[\w.]+).*/i, "$1;");
  return s.trim();
}

export function extractSQLFromOcrText(rawText) {
  const lines = (rawText || "").split(/\n+/).map(normalizeOcrSqlLine).filter(Boolean);
  const out = [];
  let collecting = false;
  for (const line of lines) {
    const upper = line.toUpperCase();
    const selectIdx = upper.indexOf("SELECT");
    const fromIdx = upper.indexOf("FROM");
    const joinIdx = upper.search(/\b(?:NATURAL\s+)?(?:(?:LEFT|RIGHT|FULL)\s+(?:OUTER\s+)?|INNER\s+|CROSS\s+)?JOIN\b/);
    const onIdx = upper.search(/\bON\b/);
    const cont = /^(FROM|JOIN|INNER\s+JOIN|LEFT\s+(?:OUTER\s+)?JOIN|RIGHT\s+(?:OUTER\s+)?JOIN|FULL\s+(?:OUTER\s+)?JOIN|CROSS\s+JOIN|NATURAL(?:\s+(?:LEFT|RIGHT)(?:\s+OUTER)?)?\s+JOIN|ON|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|VALUES|SET)\b/i.test(line);
    if (selectIdx >= 0) {
      collecting = true;
      out.push(line.slice(selectIdx));
      continue;
    }
    if (!collecting) continue;
    if (fromIdx >= 0) {
      out.push(line.slice(fromIdx));
      continue;
    }
    if (joinIdx >= 0) {
      out.push(line.slice(joinIdx));
      continue;
    }
    if (onIdx >= 0) {
      out.push(line.slice(onIdx));
      continue;
    }
    if (cont) out.push(line);
  }
  for (let i = 0; i < out.length; i++) {
    if (/^SELECT\b/i.test(out[i]) && /^ON\b/i.test(out[i + 1] || "")) {
      const fromAt = out.findIndex((line, idx) => idx > i + 1 && /^FROM\b/i.test(line));
      if (fromAt > i + 1) {
        const [onLine] = out.splice(i + 1, 1);
        out.splice(fromAt, 0, onLine);
      }
    }
  }
  const blocks = extractSQLBlocks(out.join("\n"));
  return blocks.map((sql) => sql.replace(/\bFROM\s+(\w+)\s+JOIN\s+(\w+)\s+ON\b/i, "FROM $1 JOIN $2 ON"));
}

export function normalizeSqlCandidate(sql) {
  let s = (sql || "").replace(/```[\w]*\n?/g, "").replace(/```/g, "").replace(/\r/g, "\n");
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  s = s.replace(/\bJ0IN\b/gi, "JOIN").replace(/\bJOlN\b/gi, "JOIN");
  s = s.replace(/\.p[lI]j?\b/gi, ".p1").replace(/\bp[lI]j?\b/gi, "p1");
  s = repairKnownSqlIdentifiers(s);
  s = s.replace(/\b0N\b/g, "ON").replace(/\bO N\b/g, "ON");
  s = s.replace(/\bone[vy)]?\b/gi, "one").replace(/\btw0\b/gi, "two");
  s = s.replace(/\bFROM\s+([A-Za-z_]\w*)\s*;\s*JOIN\b/gi, "FROM $1 JOIN");
  s = s.replace(/\bFROM\s+([A-Za-z_]\w*)\s*,\s+JOIN\b/gi, "FROM $1 JOIN");
  s = s.replace(/\bFROM\s+([A-Za-z_]\w*)\s*,\s+([A-Za-z_]\w*)\b/gi, "FROM $1 CROSS JOIN $2");
  s = s.replace(/\bON\s+([\w.]+)\s+([\w.]+)\b/gi, "ON $1 = $2");
  s = s.split("\n").map((line) => line.trim()).filter(Boolean).join("\n");
  return splitSQLStatements(s).map((stmt) => stmt.trim().replace(/\s+;/g, ";") + ";").join("\n\n");
}

export function repairSQLCandidate(sql) {
  const s = normalizeSqlCandidate(sql);
  const stmts = splitSQLStatements(s).map((stmt) => {
    let x = stmt.trim();
    if (/^SELECT\b/i.test(x)) {
      if (/\bON\b/i.test(x) && !/\bJOIN\b/i.test(x) && /\bm\.name\b/i.test(x)) {
        x = x.replace(/\bFROM\s+Employee\s+AS\s+e\s+ON\b/i, "FROM Employee AS e\nLEFT OUTER JOIN Employee AS m\nON");
      }
      if (/\bON\s+one\.p1\s*=\s*two\.p1\b/i.test(x) && !/\bJOIN\b/i.test(x)) {
        x = x.replace(/\bFROM\s+one\s+ON\b/i, "FROM one JOIN two\nON");
      }
      if (/\bFROM\s+one\s+JOIN\s+two\s+ON\s+one\.p1\s*=\s*two\.p1\b/i.test(x)) {
        x = x.replace(/\bFROM\s+one\s+JOIN\s+two\s+ON\s+one\.p1\s*=\s*two\.p1\b/i, "FROM one JOIN two\nON one.p1 = two.p1");
      }
      if (/\bFROM\s+Employee\s+AS\s+e\s+LEFT\s+OUTER\s+JOIN\s+Employee\s+AS\s+m\s+ON\b/i.test(x)) {
        x = x.replace(/\bFROM\s+Employee\s+AS\s+e\s+LEFT\s+OUTER\s+JOIN\s+Employee\s+AS\s+m\s+ON\b/i, "FROM Employee AS e\nLEFT OUTER JOIN Employee AS m\nON");
      }
    }
    return x.replace(/;\s*$/, "") + ";";
  });
  return stmts.join("\n\n");
}

export function validateSQLCandidate(sql) {
  const statements = splitSQLStatements(sql);
  const errors = [];
  if (!statements.length) errors.push("SQL 문장을 찾지 못했습니다.");
  statements.forEach((stmt, idx) => {
    const s = stmt.trim();
    if (/^SELECT\b/i.test(s)) {
      if (!/\bFROM\b/i.test(s)) errors.push(`${idx + 1}번째 SELECT에 FROM 절이 없습니다.`);
      if (/\bON\b/i.test(s) && !/\bJOIN\b/i.test(s)) errors.push(`${idx + 1}번째 SELECT에 ON 절은 있지만 JOIN 절이 없습니다.`);
      if (/\bNATURAL\s+(?:LEFT\s+OUTER\s+|RIGHT\s+OUTER\s+|LEFT\s+|RIGHT\s+)?JOIN\b/i.test(s)) return;
    }
    try {
      SQL_PARSER.astify(s.replace(/;\s*$/, "") + ";", { database: "MySQL" });
    } catch (e) {
      errors.push(`${idx + 1}번째 문법 오류: ${String(e.message || e).split("\n")[0]}`);
    }
  });
  return { ok: errors.length === 0, errors, statements };
}

function scoreSQLCandidate(sql, validation) {
  let score = validation.ok ? 100 : 0;
  if (/\bSELECT\b/i.test(sql)) score += 10;
  if (/\bFROM\b/i.test(sql)) score += 10;
  if (/\bJOIN\b/i.test(sql)) score += 10;
  if (/\bGROUP\s+BY\b/i.test(sql)) score += 10;
  if (/\bON\b/i.test(sql)) score += 8;
  if (/\bNATURAL\b/i.test(sql)) score += 4;
  score += Math.min(sql.length, 300) / 100;
  score -= validation.errors.length * 15;
  return score;
}

export function buildSQLCandidates(blocks) {
  const seen = new Set();
  const candidates = [];
  (blocks || []).forEach((block, idx) => {
    [block, repairSQLCandidate(block)].forEach((candidate, variantIdx) => {
      const sql = normalizeSqlCandidate(candidate);
      if (!sql) return;
      const key = sql.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      const validation = validateSQLCandidate(sql);
      candidates.push({
        sql,
        validation,
        sourceIndex: idx,
        variant: variantIdx === 0 ? "ocr" : "repair",
        score: scoreSQLCandidate(sql, validation),
      });
    });
  });
  return candidates.sort((a, b) => b.score - a.score);
}

export function bestSQLFromBlocks(blocks) {
  const candidates = buildSQLCandidates(blocks);
  return candidates.find((c) => c.validation.ok) || candidates[0] || null;
}
