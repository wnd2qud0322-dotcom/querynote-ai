import React, { useState, useEffect, useMemo } from "react";
import { createWorker, PSM } from "tesseract.js";
import SQLParserPkg from "node-sql-parser";

const C={navy:"#1B2560",navyDark:"#131B4D",navyLight:"#252E72",bg:"#F4F5FB",white:"#FFFFFF",border:"#1B2560",soft:"#D8DCF0",text:"#1B2560",muted:"#6B7080",accent:"#4B6EF5",aL:"#EEF2FF",green:"#5BB44B",gL:"#EEF9EC",orange:"#F4874B",oL:"#FEF3EC",red:"#E8445A",rL:"#FEF0F2",yellow:"#F5C842",yL:"#FEFAE8",blue:"#3B8BF5",bL:"#EBF4FF"};
const SQL_PARSER=new SQLParserPkg.Parser();

const PAGES=[
  {page:1,title:"Lecture #9 SQL (1)",content:"Database · Soongsil University · Jinhong Jung",code:null},
  {page:2,title:"Outline",content:"Overview of SQL\nData Definition Language\nData Manipulation Language",code:null},
  {page:3,title:"Query Language",content:"Main categories of query language\n\nParts of a query language (such as Relational Algebra and SQL) are divided into two main categories:\n쿼리 언어 예 관계형 대수 및 SQL의 구성 요소는 크게 두 가지 범주로 나뉩니다",code:null},
  {page:4,title:"Structured Query Language (SQL)",content:"Standard language for relational database managements\n관계형 데이터베이스 관리를 위한 표준 언어\n\nDomain-specific language:\n  SQL only works on relational databases\n  Not for general purpose programming",code:null},
  {page:5,title:"Basic Types in SQL",content:"Numbers: BOOLEAN, INT, FLOAT, DECIMAL(p, s)\n\nStrings:\n  CHAR(n) – fixed length n\n  VARCHAR(n) – variable length, max length n\n  TEXT – for large value\n\nDATE, TIME, TIMESTAMP\nBLOB (Binary Large Object)\n\nEach type may include a special value called the NULL value",code:null},
  {page:6,title:"SQL Statements",content:"SQL statements overview\n\nTry SQLs by yourself:\n  https://onecompiler.com/mysql\n\nThe SQL we study today is in a textbook form, so some details may vary slightly depending on the DBMS",code:null},
  {page:7,title:"Outline — DDL",content:"Overview of SQL\nData Definition Language  ← 현재 위치\nData Manipulation Language",code:null},
  {page:8,title:"Create Table — General Form",content:"General form of the create table command\n\n  r: the name of the relation\n  Aᵢ: the name of an attribute\n  Dᵢ: the domain of attribute Aᵢ (type of Aᵢ)",code:"CREATE TABLE r (\n  A1 D1,\n  A2 D2,\n  ...\n  An Dn,\n  [integrity constraints]\n);"},
  {page:9,title:"Create Table — Integrity Constraints",content:"Integrity constraints\n\nPRIMARY KEY(A₁, ..., Aₙ)\n  속성은 관계의 기본 키를 구성합니다\n\nFOREIGN KEY(A₁, ..., Aₙ) REFERENCES s\n  해당 관계에 있는 모든 튜플의 속성 값은 다른 관계의 기본 키 값과 일치해야 합니다\n\nNOT NULL\n  null 값이 허용되지 않음",code:"CREATE TABLE Student (\n  student_id  INT          PRIMARY KEY,\n  name        VARCHAR(50)  NOT NULL,\n  major       VARCHAR(50),\n  enroll_date DATE         NOT NULL\n);"},
  {page:10,title:"Create Table (Entity Set)",content:"[이미지 페이지] Entity Set → 테이블 변환 예시\n\n핵심:\n  Entity name → relation name\n  Attributes → columns\n  Primary key: same as entity",code:null},
  {page:11,title:"Create Table — Inline",content:"[이미지 페이지] Inline representation 예시\n\n핵심:\n  관계 집합의 외래 키를 엔티티 테이블에 직접 포함\n  1:1 또는 M:1 관계에서 사용",code:null},
  {page:12,title:"Create Table (One-to-One)",content:"[이미지 페이지] 1:1 관계 ERD 및 SQL 예시\n\n핵심:\n  어느 쪽 테이블에든 외래 키 추가 가능\n  FOREIGN KEY ... REFERENCES 사용",code:null},
  {page:13,title:"Create Table (One-to-One) 계속",content:"[이미지 페이지] 1:1 관계 SQL 예시 계속\n\nUNIQUE 제약조건으로 1:1 관계 강제",code:null},
  {page:14,title:"Create Table (Many-to-Many)",content:"[이미지 페이지] M:N 관계 ERD 및 SQL 예시\n\n핵심:\n  M:N → 중간 테이블(Intersection table) 생성\n  두 외래 키의 조합이 새 테이블의 기본 키",code:null},
  {page:15,title:"Create Table (1:N)",content:"[이미지 페이지] 1:N 관계 ERD 예시\n\n핵심:\n  N 쪽 테이블에 외래 키 추가\n  1 쪽의 기본 키를 N 쪽 외래 키로 참조",code:null},
  {page:16,title:"Create Table (1:N) 계속",content:"[이미지 페이지] 1:N 관계 SQL 예시\n\nFOREIGN KEY 선언으로 참조 무결성 보장\nON DELETE CASCADE 또는 SET NULL 옵션 사용 가능",code:null},
  {page:17,title:"Create Table (Total Participation)",content:"[이미지 페이지] Total Participation 다이어그램\n\n핵심:\n  Total participation: NOT NULL로 강제\n  모든 엔티티가 반드시 관계에 참여",code:null},
  {page:18,title:"Create Table (Weak Entity Set)",content:"[이미지 페이지] Weak Entity Set 다이어그램\n\n핵심:\n  Weak entity set은 독립적으로 존재 불가\n  Identifying entity의 기본 키를 외래 키로 포함",code:null},
  {page:19,title:"Drop Table",content:"To remove a relation from an SQL database\n\n  The drop table command removes all tuples AND its schema\n  DELETE FROM removes all tuples, but retains the schema",code:"-- 테이블 완전 삭제 (구조 포함)\nDROP TABLE Student;\n\n-- 데이터만 삭제 (구조 유지)\nDELETE FROM Student;"},
  {page:20,title:"Alter Table (ADD/DROP)",content:"[이미지 페이지] ALTER TABLE 문법 예시\n\nADD: 새 컬럼 추가\nDROP COLUMN: 컬럼 삭제",code:"ALTER TABLE Student ADD email VARCHAR(100);\nALTER TABLE Student DROP COLUMN email;"},
  {page:21,title:"Outline — DML",content:"Overview of SQL\nData Definition Language\nData Manipulation Language  ← 현재 위치",code:null},
  {page:22,title:"Insert Into ... Values",content:"[이미지 페이지] INSERT INTO 문법 및 테이블 예시\n\n핵심:\n  테이블에 새로운 행(tuple)을 추가\n  컬럼 순서와 값 순서가 일치해야 함\n  NOT NULL 컬럼에 값을 넣지 않으면 오류 발생",code:"INSERT INTO Student (student_id, name, major, enroll_date)\nVALUES (2024001, 'Kim', 'IT', '2024-03-01');\n\nINSERT INTO Student (student_id, name, major, enroll_date)\nVALUES (2024002, 'Lee', 'Computer', '2024-03-01');"},
  {page:23,title:"Update … Set … Where",content:"[이미지 페이지] UPDATE 문법 및 테이블 변화 예시\n\n핵심:\n  테이블의 기존 데이터를 수정\n  WHERE 절 없이 UPDATE하면 모든 행이 수정됨 — 주의!\n  WHERE 조건으로 특정 행만 선택",code:"UPDATE Student\nSET major = 'Software'\nWHERE student_id = 2024001;"},
  {page:24,title:"Delete From … Where",content:"[이미지 페이지] DELETE 문법 예시\n\n핵심:\n  테이블에서 행을 삭제\n  WHERE 절 없이 DELETE하면 모든 행이 삭제됨 — 주의!\n  DROP TABLE과 달리 테이블 구조는 유지",code:"DELETE FROM Student WHERE student_id = 2024001;\n\n-- 모든 데이터 삭제 (구조 유지)\nDELETE FROM Student;"},
  {page:25,title:"Select * From",content:"[이미지 페이지] SELECT 문법 예시\n\n핵심:\n  테이블에서 데이터를 조회\n  SELECT * 는 모든 컬럼을 조회",code:"SELECT * FROM Student;\n\nSELECT student_id, name FROM Student;"},
  {page:26,title:"Select Specific Attribute",content:"특정 속성(컬럼) 선택\n\n  SELECT 절에 원하는 컬럼명을 나열\n  컬럼 순서는 SELECT 절에 나열한 순서를 따름",code:"SELECT student_id, name, major\nFROM Student;"},
  {page:27,title:"Select with Where",content:"WHERE 절로 조건 검색\n\n  비교 연산자: =, <>, <, >, <=, >=\n  논리 연산자: AND, OR, NOT",code:"SELECT * FROM Student WHERE major = 'IT';\n\nSELECT * FROM Student\nWHERE major = 'IT' AND student_id > 2024001;"},
  {page:28,title:"Select with Where (BETWEEN)",content:"BETWEEN 연산자\n\n  범위 조건 검색: BETWEEN a AND b",code:"SELECT * FROM Student\nWHERE student_id BETWEEN 2024001 AND 2024010;"},
  {page:29,title:"Select with Where (IN)",content:"IN 연산자\n\n  여러 값 중 하나와 일치하는 조건\n  NOT IN으로 제외 조건도 가능",code:"SELECT * FROM Student\nWHERE major IN ('IT', 'Computer', 'Software');"},
  {page:30,title:"Select Distinct",content:"DISTINCT 키워드\n\n  중복된 행을 제거하고 유일한 값만 조회",code:"SELECT DISTINCT major FROM Student;"},
  {page:31,title:"Select with Pattern Matching",content:"LIKE 연산자 — 패턴 매칭\n\n  % : 0개 이상의 임의 문자\n  _ : 정확히 1개의 임의 문자",code:"SELECT * FROM Student WHERE name LIKE 'K%';\nSELECT * FROM Student WHERE name LIKE '_i%';"},
  {page:32,title:"Order By (Ascending)",content:"ORDER BY — 오름차순 정렬\n  <> indicates !=",code:"SELECT * FROM Student ORDER BY name ASC;\n\nSELECT * FROM Student\nWHERE major <> 'IT' ORDER BY student_id ASC;"},
  {page:33,title:"Order By (Descending)",content:"ORDER BY DESC — 내림차순 정렬",code:"SELECT * FROM Student ORDER BY student_id DESC;"},
  {page:34,title:"Select with Aliases",content:"AS 키워드 — 별칭(Alias)\n\n  컬럼이나 테이블에 임시 이름 부여\n  결과 가독성 향상",code:"SELECT student_id AS id,\n       name AS student_name\nFROM Student AS S;"},
  {page:35,title:"Summary",content:"Basic SQL\n\n  DDL: Create, Alter, and Drop Tables\n  DML: Select, Insert, Update, and Delete\n\nDDL: Create Table (Types, Integrity constraints)\nDML: Insert, Update, Delete, Select (Where, Distinct, Like, Order By, Aliases)",code:null},
  {page:36,title:"Thank You",content:"감사합니다",code:null},
];

const LEGACY_DEMO_BOOK_FILENAMES=new Set(["L2_ermodel1.pdf","L9_sql1.pdf","L10_join.pdf","L12_normalization.pdf"]);
const BOOKS=[];

const QE=[
  {id:1,concept:"PRIMARY KEY",q:"student_id 컬럼에 PRIMARY KEY를 지정하는 이유로 가장 알맞은 것은?",opts:["데이터 검색 속도를 높이기 위해서","각 학생을 유일하게 식별하여 중복을 방지하기 위해서","외래 키 설정을 간편하게 하기 위해서","데이터를 암호화하기 위해서"],ans:1,exp:"PRIMARY KEY는 테이블의 각 행을 유일하게 식별하기 위한 제약조건입니다. NULL 불가, 중복 불가 조건을 자동으로 포함합니다.",pg:9},
  {id:2,concept:"NOT NULL",q:"NOT NULL 제약조건에 대한 설명으로 올바른 것은?",opts:["해당 컬럼에 중복값이 없어야 한다","해당 컬럼은 반드시 값이 존재해야 한다","해당 컬럼은 숫자만 저장할 수 있다","해당 컬럼은 기본 키여야 한다"],ans:1,exp:"NOT NULL은 해당 컬럼에 NULL 값이 허용되지 않음을 의미합니다. 데이터 삽입 시 반드시 값을 지정해야 합니다.",pg:9},
  {id:3,concept:"INSERT INTO",q:"INSERT INTO 문에서 오류가 발생하지 않는 경우는?",opts:["PRIMARY KEY 중복 삽입","NOT NULL 컬럼에 NULL 삽입","VARCHAR 컬럼에 문자열 삽입","FOREIGN KEY 참조 무결성 위반"],ans:2,exp:"VARCHAR 컬럼에 문자열을 삽입하는 것은 정상 동작입니다. 나머지는 제약조건 위반으로 오류가 발생합니다.",pg:22},
];
const QH=[
  {id:4,concept:"FOREIGN KEY",q:"FOREIGN KEY 제약조건 위반이 발생하는 상황은?",opts:["참조되는 테이블의 PRIMARY KEY 값을 삽입","참조되지 않는 값을 외래 키 컬럼에 삽입","NULL 값을 외래 키 컬럼에 삽입","기존 외래 키 값을 동일한 값으로 UPDATE"],ans:1,exp:"FOREIGN KEY는 참조 무결성을 보장합니다. 참조되는 테이블에 존재하지 않는 값을 외래 키로 삽입하면 위반 오류가 발생합니다.",pg:9},
  {id:5,concept:"DROP vs DELETE",q:"DROP TABLE과 DELETE FROM의 차이점으로 올바른 것은?",opts:["DROP은 데이터만 삭제, DELETE는 구조도 삭제","DROP은 구조도 삭제, DELETE는 데이터만 삭제","둘 다 구조와 데이터를 모두 삭제","둘 다 데이터만 삭제하고 구조를 유지"],ans:1,exp:"DROP TABLE은 스키마(구조)와 모든 데이터를 완전히 삭제합니다. DELETE FROM은 데이터만 삭제하고 구조는 유지됩니다.",pg:19},
  {id:6,concept:"SELECT DISTINCT",q:"SELECT DISTINCT를 사용하는 목적은?",opts:["NULL 값을 제외하고 조회하기 위해","중복된 행을 제거하고 유일한 값만 조회하기 위해","결과를 정렬하기 위해","특정 컬럼만 선택하기 위해"],ans:1,exp:"DISTINCT는 결과 집합에서 중복된 행을 제거합니다.",pg:30},
];

// ── 강의자료별 퀴즈 데이터 ──────────────────────────────────────────────────
const QUIZ_ER_EASY=[
  {id:101,concept:"Entity",q:"E-R 모델에서 Entity(개체)란 무엇인가요?",opts:["두 개체 사이의 연결","독립적으로 존재하는 실세계의 객체","속성의 집합","릴레이션의 행"],ans:1,exp:"Entity는 독립적으로 식별 가능한 실세계의 객체(예: 학생, 강의)입니다.",pg:5},
  {id:102,concept:"Attribute",q:"E-R 다이어그램에서 속성(Attribute)을 나타내는 기호는?",opts:["직사각형","마름모","타원","선"],ans:2,exp:"타원이 속성을 표현하며, 직사각형은 개체, 마름모는 관계를 나타냅니다.",pg:8},
  {id:103,concept:"Primary Key",q:"E-R 모델에서 기본 키(Primary Key) 속성은 어떻게 표시되나요?",opts:["이중 타원","밑줄 있는 타원","점선 타원","마름모"],ans:1,exp:"기본 키 속성은 타원 안의 속성명에 밑줄을 그어 표시합니다.",pg:10},
];
const QUIZ_ER_HARD=[
  {id:104,concept:"Weak Entity",q:"약한 개체 집합(Weak Entity Set)에 대한 설명으로 올바른 것은?",opts:["독자적인 기본 키를 가진다","식별 개체 없이 독립적으로 존재 가능하다","식별 개체의 기본 키를 외래 키로 포함한다","다중값 속성을 반드시 가진다"],ans:2,exp:"약한 개체는 식별 개체(Identifying Entity)의 기본 키를 외래 키로 포함해야 존재 가능합니다.",pg:25},
  {id:105,concept:"Cardinality",q:"1:N 관계에서 외래 키(FK)는 어느 테이블에 위치해야 하나요?",opts:["1 쪽 테이블","N 쪽 테이블","별도 중간 테이블","양쪽 모두"],ans:1,exp:"1:N 관계에서 FK는 항상 N 쪽 테이블에 위치하여 1 쪽을 참조합니다.",pg:30},
];
const QUIZ_JOIN_EASY=[
  {id:201,concept:"INNER JOIN",q:"INNER JOIN의 결과로 올바른 것은?",opts:["LEFT 테이블의 모든 행 포함","RIGHT 테이블의 모든 행 포함","두 테이블 모두에 매칭되는 행만 포함","두 테이블의 모든 행 포함"],ans:2,exp:"INNER JOIN은 조인 조건을 만족하는 행만 결과에 포함합니다.",pg:5},
  {id:202,concept:"LEFT JOIN",q:"LEFT OUTER JOIN에 대한 설명으로 올바른 것은?",opts:["오른쪽 테이블 기준 모든 행 반환","왼쪽 테이블 기준 모든 행 반환","매칭되는 행만 반환","두 테이블 교집합 반환"],ans:1,exp:"LEFT OUTER JOIN은 왼쪽 테이블의 모든 행을 반환하고, 오른쪽에 매칭이 없으면 NULL로 채웁니다.",pg:12},
  {id:203,concept:"JOIN 조건",q:"JOIN에서 ON 절의 역할은?",opts:["정렬 기준 지정","조인할 컬럼 조건 지정","그룹화 기준 지정","중복 제거"],ans:1,exp:"ON 절은 두 테이블을 어떤 컬럼을 기준으로 연결할지 조건을 지정합니다.",pg:7},
];
const QUIZ_JOIN_HARD=[
  {id:204,concept:"NATURAL JOIN",q:"NATURAL JOIN과 INNER JOIN의 차이점은?",opts:["NATURAL JOIN은 모든 컬럼을 결과에 포함","NATURAL JOIN은 자동으로 같은 이름의 컬럼으로 조인","NATURAL JOIN은 LEFT JOIN과 동일","NATURAL JOIN은 중복 행을 포함"],ans:1,exp:"NATURAL JOIN은 두 테이블에서 이름이 같은 컬럼을 자동으로 찾아 조인 조건으로 사용합니다.",pg:22},
  {id:205,concept:"CROSS JOIN",q:"CROSS JOIN의 결과 행 수는?",opts:["작은 테이블의 행 수","두 테이블 행 수의 합","두 테이블 행 수의 곱","매칭되는 행 수"],ans:2,exp:"CROSS JOIN(카르테시안 곱)은 두 테이블의 모든 조합을 만들어 행 수 = m × n 이 됩니다.",pg:28},
];
const QUIZ_NORM_EASY=[
  {id:301,concept:"1NF",q:"제1정규형(1NF)의 조건으로 올바른 것은?",opts:["모든 속성이 원자값이어야 한다","모든 비주요 속성이 기본키에 완전 함수 종속이어야 한다","이행적 함수 종속이 없어야 한다","외래 키가 존재해야 한다"],ans:0,exp:"1NF는 모든 속성 값이 원자값(Atomic Value)이어야 합니다. 즉, 반복 그룹이나 다중값이 없어야 합니다.",pg:8},
  {id:302,concept:"2NF",q:"제2정규형(2NF)을 위반하는 경우는?",opts:["이행적 종속이 있을 때","부분 함수 종속이 있을 때","다중값 속성이 있을 때","원자값이 아닌 속성이 있을 때"],ans:1,exp:"2NF는 1NF를 만족하면서 모든 비주요 속성이 기본 키 전체에 완전 함수 종속이어야 합니다. 부분 종속이 있으면 위반입니다.",pg:15},
  {id:303,concept:"3NF",q:"제3정규형(3NF)이 제거하는 종속성은?",opts:["부분 함수 종속","이행적 함수 종속","다중값 종속","조인 종속"],ans:1,exp:"3NF는 2NF를 만족하면서 비주요 속성들 간의 이행적 함수 종속(A→B→C)을 제거합니다.",pg:22},
];
const QUIZ_NORM_HARD=[
  {id:304,concept:"BCNF",q:"BCNF(보이스-코드 정규형)의 조건은?",opts:["모든 결정자가 후보 키여야 한다","모든 속성이 원자값이어야 한다","부분 종속을 제거해야 한다","이행 종속을 제거해야 한다"],ans:0,exp:"BCNF에서는 모든 함수 종속 X→Y에서 X가 슈퍼키(후보 키)여야 합니다.",pg:30},
  {id:305,concept:"정규화 목적",q:"정규화(Normalization)의 주요 목적은?",opts:["쿼리 속도 향상","데이터 중복 제거와 이상(Anomaly) 방지","테이블 수 최소화","인덱스 자동 생성"],ans:1,exp:"정규화의 핵심 목적은 데이터 중복을 줄이고 삽입·삭제·수정 이상(Anomaly)을 방지하는 것입니다.",pg:5},
];

// 강의자료 파일명 → 퀴즈 매핑
const QUIZ_MAP={
  "L9_sql1.pdf":{easy:QE,hard:QH},
  "L2_ermodel1.pdf":{easy:QUIZ_ER_EASY,hard:QUIZ_ER_HARD},
  "L10_join.pdf":{easy:QUIZ_JOIN_EASY,hard:QUIZ_JOIN_HARD},
  "L11-sql-3.pdf":{easy:QUIZ_JOIN_EASY,hard:QUIZ_JOIN_HARD},
  "L12_normalization.pdf":{easy:QUIZ_NORM_EASY,hard:QUIZ_NORM_HARD},
};
const QUIZ_LEVELS={
  1:{badge:"개념 확인",tone:"easy",desc:"용어와 정의를 확인하는 기본 문제",mix:"기본 문제 위주"},
  2:{badge:"적용 연습",tone:"apply",desc:"개념을 SQL 상황에 적용하는 문제",mix:"기본 + 적용 문제"},
  3:{badge:"심화 점검",tone:"hard",desc:"오개념과 응용 상황을 점검하는 문제",mix:"심화 + 기본 복습"},
};
function isJoinLecture(book){
  return /(^|[^A-Za-z0-9])(l?11|sql[-_\s]*3|join)([^A-Za-z0-9]|$)/i.test(book||"");
}
function getQuizBank(book){
  const lower=String(book||"").toLowerCase();
  const key=isJoinLecture(book)?"L10_join.pdf":Object.keys(QUIZ_MAP).find(k=>lower.includes(k.replace(".pdf","").toLowerCase()))||"L9_sql1.pdf";
  return{key,bank:QUIZ_MAP[key]||QUIZ_MAP["L9_sql1.pdf"]};
}
function tagQuiz(items,difficulty){
  return (items||[]).map(q=>({...q,difficulty}));
}
function uniqueQuiz(items){
  const seen=new Set();
  return (items||[]).filter(q=>{
    const key=`${q.concept}:${q.q}`;
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
}
function getQuiz(book,rl){
  const level=QUIZ_LEVELS[rl]||QUIZ_LEVELS[1];
  const {key,bank}=getQuizBank(book);
  const easy=tagQuiz(bank.easy,"easy");
  const apply=tagQuiz(bank.hard,"apply");
  const hard=tagQuiz(bank.hard,"hard");
  let questions=easy;
  if(rl===2)questions=uniqueQuiz([...easy,...apply.slice(0,Math.max(1,Math.ceil(easy.length/2)))]);
  if(rl>=3)questions=uniqueQuiz([...hard,...easy]);
  return{source:key,level,questions:questions.length?questions:tagQuiz(QE,"easy")};
}

async function ensurePdfJs(){
  if(window.pdfjsLib)return window.pdfjsLib;
  await new Promise((resolve,reject)=>{
    const script=document.createElement("script");
    script.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload=resolve;
    script.onerror=()=>reject(new Error("PDF.js를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });
  const pdfjsLib=window.pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  return pdfjsLib;
}
async function extractPdfQuizText(pdfUrl,maxPages=8){
  if(!pdfUrl)return"";
  const pdfjsLib=await ensurePdfJs();
  const doc=await pdfjsLib.getDocument({data:atob(pdfUrl.split(",")[1])}).promise;
  const pageCount=Math.min(doc.numPages,maxPages);
  const chunks=[];
  for(let pageNum=1;pageNum<=pageCount;pageNum++){
    const page=await doc.getPage(pageNum);
    const tc=await page.getTextContent();
    chunks.push(`p.${pageNum}\n${textItemsToLines(tc.items)}`);
  }
  return chunks.join("\n\n").slice(0,9000);
}
async function generateQuizWithServer({book,readLevel,pdfUrl}){
  const text=await extractPdfQuizText(pdfUrl).catch(()=>"");
  const res=await fetch("/api/generate-quiz",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({book,title:book,readLevel,text}),
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||"AI 퀴즈 생성 실패");
  return data;
}

const PDF_DB_NAME="querynote-ai-pdfs";
const PDF_DB_STORE="files";
function openPdfDb(){
  return new Promise((resolve,reject)=>{
    if(typeof window==="undefined"||!window.indexedDB){
      reject(new Error("이 브라우저는 IndexedDB를 지원하지 않습니다."));
      return;
    }
    const req=window.indexedDB.open(PDF_DB_NAME,1);
    req.onupgradeneeded=()=>{req.result.createObjectStore(PDF_DB_STORE);};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error("PDF 저장소를 열지 못했습니다."));
  });
}
async function savePdfData(id,dataUrl){
  if(!dataUrl)throw new Error("PDF 파일 데이터가 비어 있습니다.");
  const db=await openPdfDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(PDF_DB_STORE,"readwrite");
    tx.objectStore(PDF_DB_STORE).put(dataUrl,String(id));
    tx.oncomplete=()=>{db.close();resolve(true);};
    tx.onerror=()=>{db.close();reject(tx.error||new Error("PDF 파일 저장에 실패했습니다."));};
  });
}
async function loadPdfData(id){
  if(!id)return"";
  const db=await openPdfDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(PDF_DB_STORE,"readonly");
    const req=tx.objectStore(PDF_DB_STORE).get(String(id));
    req.onsuccess=()=>resolve(req.result||"");
    req.onerror=()=>reject(req.error||new Error("PDF 파일을 불러오지 못했습니다."));
    tx.oncomplete=()=>db.close();
  });
}
async function deletePdfData(id){
  if(!id)return;
  const db=await openPdfDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(PDF_DB_STORE,"readwrite");
    tx.objectStore(PDF_DB_STORE).delete(String(id));
    tx.oncomplete=()=>{db.close();resolve(true);};
    tx.onerror=()=>{db.close();reject(tx.error||new Error("PDF 파일 삭제에 실패했습니다."));};
  });
}
async function hydrateLibraryBook(book){
  if(book.dataUrl||!book.pdfStoreKey)return book;
  try{
    return{...book,dataUrl:await loadPdfData(book.pdfStoreKey)};
  }catch(e){
    return{...book,dataUrl:""};
  }
}
async function readStoredLibrary(){
  const saved=await window.storage.get("library").catch(()=>null);
  if(!saved)return[];
  try{
    return JSON.parse(saved.value).filter(b=>!LEGACY_DEMO_BOOK_FILENAMES.has(b.fn));
  }catch(e){
    return[];
  }
}
async function writeStoredLibrary(books){
  const clean=(books||[])
    .filter(b=>b&&!LEGACY_DEMO_BOOK_FILENAMES.has(b.fn))
    .map(({dataUrl,_hydrated,...book})=>book);
  await window.storage.set("library",JSON.stringify(clean));
}
function findStoredBook(books,{bookId,fn}){
  return (books||[]).find(b=>bookId&&String(b.id)===String(bookId))||(books||[]).find(b=>fn&&b.fn===fn)||null;
}
async function updateStoredBookMeta({bookId,fn},patch){
  const books=await readStoredLibrary();
  const idx=books.findIndex(b=>(bookId&&String(b.id)===String(bookId))||(!bookId&&fn&&b.fn===fn));
  if(idx<0)return null;
  const updated={...books[idx],...patch};
  books[idx]=updated;
  await writeStoredLibrary(books);
  return updated;
}

const JOIN_PAGE_TITLES={
  1:"Lecture #11 SQL (3)",2:"Recap: Aggregation",3:"Recap: HAVING",4:"Recap: Primary and Foreign Keys",5:"Outline",
  6:"Join Overview",7:"Join Requirements",8:"Outline — Natural, Inner, Cross",9:"Natural Join",10:"Natural Join Result",
  11:"Inner Join",12:"Inner Join Result",13:"Cartesian Product",14:"Cross Product Caution",15:"Cross Product → Inner Join",
  16:"Outline — Outer Joins",17:"Natural Left Outer Join",18:"Natural Left Outer Join Result",19:"Left Outer Join",20:"Left Outer Join Result",
  21:"Natural Right Outer Join",22:"Natural Right Outer Join Result",23:"Right Outer Join",24:"Right Outer Join Result",25:"Left and Right Joins",
  26:"Outer Join Examples",27:"Outline — Self Joins",28:"Self Join",29:"Self Join — Employee / Manager",30:"Self Join Result",
  31:"Self Join Practice",32:"Self Join Practice Result",33:"Summary",34:"Thank You"
};
function getPageMeta(book,pi,hasPdf){
  const page=pi+1;
  if(hasPdf){
    if(isJoinLecture(book))return{page,title:JOIN_PAGE_TITLES[page]||`SQL JOIN p.${page}`,content:"",code:null};
    return{page,title:`PDF p.${page}`,content:"",code:null};
  }
  return PAGES[pi]||{page,title:`PDF p.${page}`,content:"",code:null};
}

let SQL_OCR_WORKER_PROMISE=null;
async function getSqlOcrWorker(){
  if(!SQL_OCR_WORKER_PROMISE){
    SQL_OCR_WORKER_PROMISE=createWorker("eng").then(async(worker)=>{
      try{
        await worker.setParameters({
          tessedit_pageseg_mode:PSM.SPARSE_TEXT,
          preserve_interword_spaces:"1",
          tessedit_char_whitelist:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.*(),=;[]{}| \n"
        });
      }catch(e){}
      return worker;
    });
  }
  return SQL_OCR_WORKER_PROMISE;
}

function stripSqlComments(sql){
  return (sql||"").replace(/\/\*[\s\S]*?\*\//g,"").split("\n").map(line=>line.replace(/--.*$/,"")).join("\n");
}
function splitSQLStatements(raw){
  const sql=stripSqlComments((raw||"").replace(/```[\w]*\n?/g,"").replace(/```/g,""));
  const out=[];
  let buf="",quote=null;
  for(let i=0;i<sql.length;i++){
    const ch=sql[i],next=sql[i+1];
    buf+=ch;
    if(quote){
      if(ch===quote){
        if(next===quote){buf+=next;i++;}
        else quote=null;
      }
      continue;
    }
    if(ch==="'"||ch==='"'){quote=ch;continue;}
    if(ch===";"){
      const s=buf.replace(/;\s*$/,"").trim();
      if(s)out.push(s);
      buf="";
    }
  }
  const tail=buf.trim();
  if(tail)out.push(tail);
  return out;
}

function textItemsToLines(items){
  const rows=[];
  [...items].sort((a,b)=>{
    const dy=b.transform[5]-a.transform[5];
    if(Math.abs(dy)>2)return dy;
    return a.transform[4]-b.transform[4];
  }).forEach(item=>{
    const y=item.transform[5],x=item.transform[4];
    let row=rows.find(r=>Math.abs(r.y-y)<=3);
    if(!row){row={y,items:[]};rows.push(row);}
    row.items.push({x,str:item.str});
  });
  return rows.sort((a,b)=>b.y-a.y).map(row=>
    row.items.sort((a,b)=>a.x-b.x).map(i=>i.str).join(" ").replace(/\s+/g," ").trim()
  ).filter(Boolean).join("\n");
}
function cleanPdfSqlLine(line){
  let s=(line||"").replace(/[\u0000-\u001F\uFFFD]/g," ").replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/\s+/g," ").trim();
  s=s.replace(/^[q§◦•]\s*/,"").trim();
  if(!s||/^\d+$/.test(s))return"";
  s=s.replace(/\s+Step\s+\d+\..*$/i,"").replace(/\s+Apply the condition:.*$/i,"");
  if(s.includes(";"))s=s.slice(0,s.indexOf(";")+1);
  return s.trim();
}
function extractSQLBlocks(rawText){
  const lines=(rawText||"").split(/\n+/).map(cleanPdfSqlLine).filter(Boolean);
  const start=/^(SELECT|WITH|CREATE\s+TABLE|INSERT\s+INTO|UPDATE|DELETE\s+FROM|ALTER\s+TABLE|DROP\s+TABLE)\b/i;
  const cont=/^(FROM|JOIN|INNER\s+JOIN|LEFT\s+(?:OUTER\s+)?JOIN|RIGHT\s+(?:OUTER\s+)?JOIN|FULL\s+(?:OUTER\s+)?JOIN|CROSS\s+JOIN|NATURAL(?:\s+(?:LEFT|RIGHT)(?:\s+OUTER)?)?\s+JOIN|ON|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|VALUES|SET|AND|OR)\b/i;
  const blocks=[];
  let cur=[];
  const finish=()=>{
    if(!cur.length)return;
    let sql=cur.join("\n").replace(/\s+;/g,";").trim();
    if(start.test(sql)){
      if(!/;\s*$/.test(sql))sql+=";";
      if(!blocks.some(b=>b.toLowerCase()===sql.toLowerCase()))blocks.push(sql);
    }
    cur=[];
  };
  for(const line of lines){
    if(start.test(line)){
      finish();
      cur=[line];
      if(line.includes(";"))finish();
      continue;
    }
    if(cur.length){
      const joined=cur.join(" ");
      const waitingForFrom=/^\s*SELECT\b/i.test(joined)&&!/\bFROM\b/i.test(joined);
      const selectListLine=waitingForFrom&&/^[\w*.,\s]+(?:\s+AS\s+\w+)?$/i.test(line);
      if(cont.test(line)||selectListLine){
        cur.push(line);
        if(line.includes(";"))finish();
      }else finish();
    }
  }
  finish();
  return blocks;
}

const SQL_IDENTIFIER_REPAIRS=[
  [/\bdept\s+name\b/gi,"dept_name"],
  [/\bdept\s+id\b/gi,"dept_id"],
  [/\bstudent\s+id\b/gi,"student_id"],
  [/\bcourse\s+id\b/gi,"course_id"],
  [/\bmanager[_\s]+id\b/gi,"manager_id"],
  [/\bmandger[_\s]+id\b/gi,"manager_id"],
  [/\bemp\s+id\b/gi,"emp_id"],
  [/\bta\s+id\b/gi,"ta_id"],
  [/\binstruct0r\b/gi,"instructor"],
  [/\binstructer\b/gi,"instructor"],
  [/\bsaiary\b/gi,"salary"],
  [/\bsal ary\b/gi,"salary"],
  [/\bAVG\s*\(\s*salary\s*\)/gi,"AVG(salary)"],
  [/\bSUM\s*\(\s*salary\s*\)/gi,"SUM(salary)"],
  [/\bCOUNT\s*\(\s*\*\s*\)/gi,"COUNT(*)"],
];
function repairKnownSqlIdentifiers(sql){
  return SQL_IDENTIFIER_REPAIRS.reduce((out,[from,to])=>out.replace(from,to),sql||"")
    .replace(/\bcol\s+([ABXY])\b/gi,(_m,col)=>`col${String(col).toUpperCase()}`)
    .replace(/\bp\s+([12])\b/gi,"p$1");
}

function normalizeOcrSqlLine(line){
  let s=(line||"").replace(/[\u0000-\u001F\uFFFD]/g," ").replace(/\s+/g," ").trim();
  s=s.replace(/^[q§◦•]\s*/,"").trim();
  if(!s)return"";
  s=s.replace(/[|\[\]{}]/g," ").replace(/[“”]/g,'"').replace(/[‘’«»]/g," ");
  s=s.replace(/SELECT\s*\\\s*\*/gi,"SELECT *").replace(/SELECT\s+\/\s*;?/gi,"SELECT *");
  if(/^SELECT\s+\*/i.test(s)&&!/\bFROM\b/i.test(s))s=s.replace(/^(SELECT\s+\*)\s+.*/i,"$1");
  s=s.replace(/^(SELECT\s+\*)\s+.*\bSELECT\b.*/i,"$1");
  s=s.replace(/\bJ0IN\b/gi,"JOIN").replace(/\bJOlN\b/gi,"JOIN");
  s=s.replace(/\.p[lI]j?\b/gi,".p1").replace(/\bp[lI]j?\b/gi,"p1");
  s=s.replace(/\b0N\b/g,"ON").replace(/\bO N\b/g,"ON");
  s=s.replace(/\bone[vy)]?\b/gi,"one").replace(/\btw0\b/gi,"two");
  s=repairKnownSqlIdentifiers(s);
  s=s.replace(/\bFROM\s+([A-Za-z_]\w*)\s*;\s*JOIN\b/i,"FROM $1 JOIN");
  s=s.replace(/\bFROM\s+([A-Za-z_]\w*)\s*,\s+JOIN\b/i,"FROM $1 JOIN");
  s=s.replace(/\bFROM\s+([A-Za-z_]\w*)\s*,\s+([A-Za-z_]\w*)\b/i,"FROM $1 CROSS JOIN $2");
  s=s.replace(/\bON\s+([\w.]+)\s+([\w.]+)\b/i,"ON $1 = $2");
  s=s.replace(/:\s*$/,";");
  s=s.replace(/\s+/g," ").trim();
  if(/\bON\b/i.test(s)){
    s=s.replace(/\b(ON\s+[\w.]+\s*=\s*[\w.]+).*/i,"$1;");
  }
  return s.trim();
}

function extractSQLFromOcrText(rawText){
  const lines=(rawText||"").split(/\n+/).map(normalizeOcrSqlLine).filter(Boolean);
  const out=[];
  let collecting=false;
  for(const line of lines){
    const upper=line.toUpperCase();
    const selectIdx=upper.indexOf("SELECT");
    const fromIdx=upper.indexOf("FROM");
    const joinIdx=upper.search(/\b(?:NATURAL\s+)?(?:(?:LEFT|RIGHT|FULL)\s+(?:OUTER\s+)?|INNER\s+|CROSS\s+)?JOIN\b/);
    const onIdx=upper.search(/\bON\b/);
    const cont=/^(FROM|JOIN|INNER\s+JOIN|LEFT\s+(?:OUTER\s+)?JOIN|RIGHT\s+(?:OUTER\s+)?JOIN|FULL\s+(?:OUTER\s+)?JOIN|CROSS\s+JOIN|NATURAL(?:\s+(?:LEFT|RIGHT)(?:\s+OUTER)?)?\s+JOIN|ON|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|VALUES|SET)\b/i.test(line);
    if(selectIdx>=0){
      collecting=true;
      out.push(line.slice(selectIdx));
      continue;
    }
    if(!collecting)continue;
    if(fromIdx>=0){out.push(line.slice(fromIdx));continue;}
    if(joinIdx>=0){out.push(line.slice(joinIdx));continue;}
    if(onIdx>=0){out.push(line.slice(onIdx));continue;}
    if(cont)out.push(line);
  }
  for(let i=0;i<out.length;i++){
    if(/^SELECT\b/i.test(out[i])&&/^ON\b/i.test(out[i+1]||"")){
      const fromAt=out.findIndex((line,idx)=>idx>i+1&&/^FROM\b/i.test(line));
      if(fromAt>i+1){
        const [onLine]=out.splice(i+1,1);
        out.splice(fromAt,0,onLine);
      }
    }
  }
  const blocks=extractSQLBlocks(out.join("\n"));
  return blocks.map(sql=>sql.replace(/\bFROM\s+(\w+)\s+JOIN\s+(\w+)\s+ON\b/i,"FROM $1 JOIN $2 ON"));
}

function normalizeSqlCandidate(sql){
  let s=(sql||"").replace(/```[\w]*\n?/g,"").replace(/```/g,"").replace(/\r/g,"\n");
  s=s.replace(/[“”]/g,'"').replace(/[‘’]/g,"'");
  s=s.replace(/\bJ0IN\b/gi,"JOIN").replace(/\bJOlN\b/gi,"JOIN");
  s=s.replace(/\.p[lI]j?\b/gi,".p1").replace(/\bp[lI]j?\b/gi,"p1");
  s=repairKnownSqlIdentifiers(s);
  s=s.replace(/\b0N\b/g,"ON").replace(/\bO N\b/g,"ON");
  s=s.replace(/\bone[vy)]?\b/gi,"one").replace(/\btw0\b/gi,"two");
  s=s.replace(/\bFROM\s+([A-Za-z_]\w*)\s*;\s*JOIN\b/gi,"FROM $1 JOIN");
  s=s.replace(/\bFROM\s+([A-Za-z_]\w*)\s*,\s+JOIN\b/gi,"FROM $1 JOIN");
  s=s.replace(/\bFROM\s+([A-Za-z_]\w*)\s*,\s+([A-Za-z_]\w*)\b/gi,"FROM $1 CROSS JOIN $2");
  s=s.replace(/\bON\s+([\w.]+)\s+([\w.]+)\b/gi,"ON $1 = $2");
  s=s.split("\n").map(line=>line.trim()).filter(Boolean).join("\n");
  return splitSQLStatements(s).map(stmt=>stmt.trim().replace(/\s+;/g,";")+";").join("\n\n");
}

function repairSQLCandidate(sql){
  let s=normalizeSqlCandidate(sql);
  const stmts=splitSQLStatements(s).map(stmt=>{
    let x=stmt.trim();
    if(/^SELECT\b/i.test(x)){
      if(/\bON\b/i.test(x)&&!/\bJOIN\b/i.test(x)&&/\bm\.name\b/i.test(x)){
        x=x.replace(/\bFROM\s+Employee\s+AS\s+e\s+ON\b/i,"FROM Employee AS e\nLEFT OUTER JOIN Employee AS m\nON");
      }
      if(/\bON\s+one\.p1\s*=\s*two\.p1\b/i.test(x)&&!/\bJOIN\b/i.test(x)){
        x=x.replace(/\bFROM\s+one\s+ON\b/i,"FROM one JOIN two\nON");
      }
      if(/\bFROM\s+one\s+JOIN\s+two\s+ON\s+one\.p1\s*=\s*two\.p1\b/i.test(x)){
        x=x.replace(/\bFROM\s+one\s+JOIN\s+two\s+ON\s+one\.p1\s*=\s*two\.p1\b/i,"FROM one JOIN two\nON one.p1 = two.p1");
      }
      if(/\bFROM\s+Employee\s+AS\s+e\s+LEFT\s+OUTER\s+JOIN\s+Employee\s+AS\s+m\s+ON\b/i.test(x)){
        x=x.replace(/\bFROM\s+Employee\s+AS\s+e\s+LEFT\s+OUTER\s+JOIN\s+Employee\s+AS\s+m\s+ON\b/i,"FROM Employee AS e\nLEFT OUTER JOIN Employee AS m\nON");
      }
    }
    return x.replace(/;\s*$/,"")+";";
  });
  return stmts.join("\n\n");
}

function validateSQLCandidate(sql){
  const statements=splitSQLStatements(sql);
  const errors=[];
  if(!statements.length)errors.push("SQL 문장을 찾지 못했습니다.");
  statements.forEach((stmt,idx)=>{
    const s=stmt.trim();
    if(/^SELECT\b/i.test(s)){
      if(!/\bFROM\b/i.test(s))errors.push(`${idx+1}번째 SELECT에 FROM 절이 없습니다.`);
      if(/\bON\b/i.test(s)&&!/\bJOIN\b/i.test(s))errors.push(`${idx+1}번째 SELECT에 ON 절은 있지만 JOIN 절이 없습니다.`);
      if(/\bNATURAL\s+(?:LEFT\s+OUTER\s+|RIGHT\s+OUTER\s+|LEFT\s+|RIGHT\s+)?JOIN\b/i.test(s))return;
    }
    try{
      SQL_PARSER.astify(s.replace(/;\s*$/,"")+";",{database:"MySQL"});
    }catch(e){
      errors.push(`${idx+1}번째 문법 오류: ${String(e.message||e).split("\n")[0]}`);
    }
  });
  return{ok:errors.length===0,errors,statements};
}

function scoreSQLCandidate(sql,validation){
  let score=validation.ok?100:0;
  if(/\bSELECT\b/i.test(sql))score+=10;
  if(/\bFROM\b/i.test(sql))score+=10;
  if(/\bJOIN\b/i.test(sql))score+=10;
  if(/\bON\b/i.test(sql))score+=8;
  if(/\bNATURAL\b/i.test(sql))score+=4;
  score+=Math.min(sql.length,300)/100;
  score-=validation.errors.length*15;
  return score;
}

function buildSQLCandidates(blocks){
  const seen=new Set();
  const candidates=[];
  (blocks||[]).forEach((block,idx)=>{
    [block,repairSQLCandidate(block)].forEach((candidate,variantIdx)=>{
      const sql=normalizeSqlCandidate(candidate);
      if(!sql)return;
      const key=sql.toLowerCase();
      if(seen.has(key))return;
      seen.add(key);
      const validation=validateSQLCandidate(sql);
      candidates.push({sql,validation,sourceIndex:idx,variant:variantIdx===0?"ocr":"repair",score:scoreSQLCandidate(sql,validation)});
    });
  });
  return candidates.sort((a,b)=>b.score-a.score);
}

function bestSQLFromBlocks(blocks){
  const candidates=buildSQLCandidates(blocks);
  return candidates.find(c=>c.validation.ok)||candidates[0]||null;
}

async function recognizeSqlFromCanvas(canvas){
  if(!canvas)return[];
  const serverResult=await extractSqlWithServer(canvas).catch(()=>null);
  if(serverResult?.sql)return[serverResult.sql];
  if(serverResult?.candidates?.length)return serverResult.candidates.map(c=>c.sql).filter(Boolean);
  const worker=await getSqlOcrWorker();
  const result=await worker.recognize(canvas);
  const blocks=extractSQLFromOcrText(result?.data?.text||"");
  const best=bestSQLFromBlocks(blocks);
  return best?[best.sql]:[];
}

function canvasToBlob(canvas){
  return new Promise((resolve)=>canvas.toBlob(resolve,"image/png",1));
}

async function extractSqlWithServer(canvas){
  const blob=await canvasToBlob(canvas);
  if(!blob)throw new Error("페이지 이미지를 만들지 못했습니다.");
  const form=new FormData();
  form.append("image",blob,"sql-page.png");
  const res=await fetch("/api/extract-sql",{method:"POST",body:form});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||"서버 SQL 인식 실패");
  return data;
}

// Gemini Vision으로 테이블 + SQL 동시 추출
async function extractTableAndSqlWithGeminiVision(canvas){
  const blob=await canvasToBlob(canvas);
  if(!blob)throw new Error("페이지 이미지를 만들지 못했습니다.");
  const form=new FormData();
  form.append("image",blob,"page.png");
  const res=await fetch("/api/extract-table-sql",{method:"POST",body:form});
  const data=await res.json().catch(()=>({}));
  if(!res.ok||!data.ok)throw new Error(data.error||"Gemini Vision 인식 실패");
  return data; // { tables:[], sqlCode:"", hasTable:bool, hasSql:bool }
}

function cropCanvas(source,{x,y,w,h}){
  const canvas=document.createElement("canvas");
  const sx=Math.round(source.width*x),sy=Math.round(source.height*y),sw=Math.round(source.width*w),sh=Math.round(source.height*h);
  canvas.width=sw;canvas.height=sh;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#fff";
  ctx.fillRect(0,0,sw,sh);
  ctx.drawImage(source,sx,sy,sw,sh,0,0,sw,sh);
  return canvas;
}
async function renderPdfPageCanvas(pdfDoc,pageNum,scale=3){
  const page=await pdfDoc.getPage(pageNum);
  const viewport=page.getViewport({scale});
  const canvas=document.createElement("canvas");
  canvas.width=viewport.width;
  canvas.height=viewport.height;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#fff";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  await page.render({canvasContext:ctx,viewport}).promise;
  return canvas;
}
function hasRunnableSQL(blocks){
  return blocks.some(sql=>{
    if(/\b(CREATE\s+TABLE|INSERT\s+INTO|UPDATE|DELETE\s+FROM)\b/i.test(sql))return true;
    if(!/\bSELECT\b[\s\S]*\bFROM\b/i.test(sql))return false;
    if(/\bON\b/i.test(sql)&&!/\bJOIN\b/i.test(sql))return false;
    return true;
  });
}
function runnableSQLBlocks(blocks){
  return blocks.filter(sql=>hasRunnableSQL([sql]));
}
async function recognizeSqlFromPdfPage(pdfDoc,pageNum){
  const canvas=await renderPdfPageCanvas(pdfDoc,pageNum,3);
  const regions=[
    {x:0,y:0,w:1,h:1},
    {x:0.06,y:0.58,w:0.88,h:0.34},
    {x:0.08,y:0.52,w:0.84,h:0.40},
    {x:0.12,y:0.62,w:0.76,h:0.26},
    {x:0.16,y:0.58,w:0.68,h:0.25},
    {x:0.30,y:0.68,w:0.62,h:0.30},
  ];
  const found=[];
  for(const region of regions){
    const target=region.x===0&&region.y===0&&region.w===1&&region.h===1?canvas:cropCanvas(canvas,region);
    const serverResult=await extractSqlWithServer(target).catch(()=>null);
    if(serverResult?.candidates?.length){
      serverResult.candidates.forEach(c=>{
        if(c.sql&&!found.some(x=>x.toLowerCase()===c.sql.toLowerCase()))found.push(c.sql);
      });
    }else if(serverResult?.sql&&!found.some(x=>x.toLowerCase()===serverResult.sql.toLowerCase())){
      found.push(serverResult.sql);
    }
    if(bestSQLFromBlocks(found)?.validation.ok)break;
  }
  if(bestSQLFromBlocks(found)?.validation.ok){
    const candidates=buildSQLCandidates(found);
    return candidates.filter(c=>c.validation.ok).map(c=>c.sql);
  }
  const worker=await getSqlOcrWorker();
  for(const region of regions){
    const target=region.x===0&&region.y===0&&region.w===1&&region.h===1?canvas:cropCanvas(canvas,region);
    const result=await worker.recognize(target);
    const blocks=extractSQLFromOcrText(result?.data?.text||"");
    blocks.forEach(sql=>{if(!found.some(x=>x.toLowerCase()===sql.toLowerCase()))found.push(sql);});
    if(bestSQLFromBlocks(found)?.validation.ok)break;
  }
  const candidates=buildSQLCandidates(found);
  const valid=candidates.filter(c=>c.validation.ok);
  return valid.length?valid.map(c=>c.sql):candidates.map(c=>c.sql);
}

function parseSQL(raw){
  // 주석 제거 후 처리
  const sql=raw.trim().replace(/--[^\n]*/g,"").replace(/;\s*$/,"").trim();
  const oi=sql.indexOf("("),ci=sql.lastIndexOf(")");
  const hm=sql.slice(0,Math.max(oi,0)).match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
  if(oi<0||ci<0||!hm)return{error:"CREATE TABLE 문을 인식하지 못했어요."};
  // 중첩 괄호(FOREIGN KEY REFERENCES 등) 처리: 최상위 레벨 콤마로만 분리
  const inner=sql.slice(oi+1,ci);
  const cols=[];
  let depth=0,buf="";
  for(const ch of inner){
    if(ch==="(")depth++;
    else if(ch===")")depth--;
    if(ch===","&&depth===0){cols.push(buf.trim());buf="";}
    else buf+=ch;
  }
  if(buf.trim())cols.push(buf.trim());
  const parsed=cols.map(line=>{
    // 제약조건 라인(PRIMARY KEY(...), FOREIGN KEY..., UNIQUE..., CHECK...) 스킵
    if(/^\s*(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT)\s*[\w(]/i.test(line))return null;
    const p=line.trim().split(/\s+/).filter(Boolean);
    if(p.length<2)return null;
    // 예약어가 컬럼명으로 오는 경우 방어
    if(/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT|INDEX)$/i.test(p[0]))return null;
    return{name:p[0],type:p[1],pk:/PRIMARY\s+KEY/i.test(line)||/\bPRIMARY\b/i.test(line.replace(p[0],"").replace(p[1],"")),nn:/NOT\s+NULL/i.test(line)};
  }).filter(Boolean);
  if(!parsed.length)return{error:"컬럼을 인식하지 못했어요."};
  return{tableName:hm[1],cols:parsed};
}

function execDML(stmts,existing){
  let rows=[...existing.map(r=>({...r,_s:r._s==="new"?null:r._s}))];
  const log=[];
  for(const stmt of stmts){
    const s=stmt.trim();
    const ins=s.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    const del=s.match(/DELETE\s+FROM\s+\w+(?:\s+WHERE\s+(\w+)\s*=\s*(.+))?/i);
    const upd=s.match(/UPDATE\s+\w+\s+SET\s+(\w+)\s*=\s*(.+?)\s+WHERE\s+(\w+)\s*=\s*(.+)/i);
    if(ins){
      const cs=ins[1].split(",").map(c=>c.trim());
      const vs=ins[2].split(",").map(v=>v.trim().replace(/^'|'$/g,""));
      const row={};cs.forEach((c,i)=>{row[c]=vs[i];});
      rows.push({...row,_s:"new"});
      log.push("✅ INSERT: "+cs.map((c,i)=>`${c}=${vs[i]}`).join(", "));
    } else if(del){
      if(del[1]){const col=del[1],val=del[2].replace(/^'|'$/g,"");rows=rows.map(r=>(r[col]===val||String(r[col])===val)?{...r,_s:"del"}:r);log.push("🗑️ DELETE WHERE "+col+"="+val);}
      else{rows=rows.map(r=>({...r,_s:"del"}));log.push("🗑️ DELETE ALL");}
    } else if(upd){
      const sc=upd[1],sv=upd[2].replace(/^'|'$/g,""),wc=upd[3],wv=upd[4].replace(/^'|'$/g,"");
      rows=rows.map(r=>(r[wc]===wv||String(r[wc])===wv)?{...r,[sc]:sv,_s:"upd"}:r);
      log.push("✏️ UPDATE "+wc+"="+wv+" → "+sc+"="+sv);
    }
  }
  return{rows,log};
}

const SAMPLE_DB={
  one:{name:"one",cols:["p1","colA","colB"],rows:[
    {p1:"1",colA:"A",colB:"aa"},
    {p1:"2",colA:"B",colB:"bb"},
    {p1:"3",colA:"C",colB:"cc"},
    {p1:"4",colA:"D",colB:"dd"},
    {p1:"5",colA:"E",colB:"ee"},
    {p1:"7",colA:"G",colB:"gg"},
    {p1:"8",colA:"H",colB:"hh"},
  ]},
  two:{name:"two",cols:["p2","p1","colX","colY"],rows:[
    {p2:"9001",p1:"1",colX:"55",colY:"ABC"},
    {p2:"9002",p1:"3",colX:"77",colY:"PQR"},
    {p2:"9003",p1:"3",colX:"95",colY:"DEF"},
    {p2:"9004",p1:"7",colX:"62",colY:"GHI"},
    {p2:"9005",p1:"5",colX:"50",colY:"KLM"},
    {p2:"9006",p1:"2",colX:"42",colY:"STU"},
    {p2:"9007",p1:"7",colX:"83",colY:"XYZ"},
  ]},
  instructor:{name:"instructor",cols:["ID","name","dept_name","salary"],rows:[
    {ID:"10101",name:"Srinivasan",dept_name:"Comp. Sci.",salary:65000},
    {ID:"12121",name:"Wu",dept_name:"Finance",salary:90000},
    {ID:"15151",name:"Mozart",dept_name:"Music",salary:40000},
    {ID:"22222",name:"Einstein",dept_name:"Physics",salary:95000},
    {ID:"32343",name:"El Said",dept_name:"History",salary:60000},
    {ID:"33456",name:"Gold",dept_name:"Physics",salary:87000},
    {ID:"45565",name:"Katz",dept_name:"Comp. Sci.",salary:75000},
    {ID:"58583",name:"Califieri",dept_name:"History",salary:62000},
    {ID:"76543",name:"Singh",dept_name:"Finance",salary:80000},
    {ID:"76766",name:"Crick",dept_name:"Biology",salary:72000},
    {ID:"83821",name:"Brandt",dept_name:"Comp. Sci.",salary:92000},
    {ID:"98345",name:"Kim",dept_name:"Elec. Eng.",salary:80000},
  ]},
  Student:{name:"Student",cols:["student_id","name","dept_id","major"],rows:[
    {student_id:"2024001",name:"Kim",dept_id:"CS",major:"Computer Science"},
    {student_id:"2024002",name:"Lee",dept_id:"DB",major:"Data Science"},
    {student_id:"2024003",name:"Park",dept_id:null,major:"Software"},
  ]},
  Department:{name:"Department",cols:["dept_id","dept_name","building"],rows:[
    {dept_id:"CS",dept_name:"Computer Science",building:"Hyungnam"},
    {dept_id:"DB",dept_name:"Database Systems",building:"Jinhong Hall"},
    {dept_id:"AI",dept_name:"Artificial Intelligence",building:"Research Center"},
  ]},
  Employee:{name:"Employee",cols:["emp_id","name","manager_id"],rows:[
    {emp_id:"E01",name:"Jung",manager_id:null},
    {emp_id:"E02",name:"Kim",manager_id:"E01"},
    {emp_id:"E03",name:"Lee",manager_id:"E01"},
    {emp_id:"E04",name:"Park",manager_id:"E02"},
  ]},
  Course:{name:"Course",cols:["course_id","title"],rows:[
    {course_id:"DB",title:"Database Systems"},
    {course_id:"SA",title:"Software Analysis"},
  ]},
  TA:{name:"TA",cols:["ta_id","name","course_id"],rows:[
    {ta_id:"T01",name:"Kim",course_id:"DB"},
    {ta_id:"T02",name:"Lee",course_id:"SA"},
    {ta_id:"T03",name:"Park",course_id:"DB"},
  ]},
};
const SAMPLE_DB_ORDER=["instructor","one","two","Student","Department","Employee","Course","TA"];
function formatDbCell(value){
  if(value===null||value===undefined)return"NULL";
  return String(value);
}
function getTable(db,name){
  const key=Object.keys(db).find(k=>k.toLowerCase()===String(name||"").toLowerCase());
  return key?db[key]:null;
}
function parseTableRef(part){
  const m=(part||"").trim().replace(/,$/,"").match(/^([A-Za-z_]\w*)(?:\s+(?:AS\s+)?([A-Za-z_]\w*))?$/i);
  return m?{table:m[1],alias:m[2]||m[1]}:null;
}
function makeRows(db,ref,asNull=false){
  const table=getTable(db,ref.table);
  if(!table)throw new Error(`${ref.table} 테이블을 찾을 수 없어요.`);
  const source=asNull?[Object.fromEntries(table.cols.map(c=>[c,null]))]:table.rows;
  return source.map(row=>{
    const values={};
    table.cols.forEach(c=>{values[`${ref.alias.toLowerCase()}.${c.toLowerCase()}`]=row[c]??null;});
    return{__aliases:[{alias:ref.alias,table:table.name,cols:table.cols}],__values:values};
  });
}
function mergeJoinRows(a,b){
  return{__aliases:[...a.__aliases,...b.__aliases],__values:{...a.__values,...b.__values}};
}
function findColumnValue(row,ref){
  let token=String(ref||"").trim().replace(/[`"]/g,"");
  if(/^'.*'$/.test(token))return token.slice(1,-1);
  if(/^null$/i.test(token))return null;
  if(/^-?\d+(\.\d+)?$/.test(token))return Number(token);
  if(token.includes(".")){
    const [alias,col]=token.split(".");
    return row.__values[`${alias.toLowerCase()}.${col.toLowerCase()}`];
  }
  const matches=[];
  row.__aliases.forEach(a=>{
    a.cols.forEach(c=>{
      if(c.toLowerCase()===token.toLowerCase())matches.push(row.__values[`${a.alias.toLowerCase()}.${c.toLowerCase()}`]);
    });
  });
  return matches.find(v=>v!==undefined);
}
function valuesEqual(a,b){
  if(a===null||a===undefined||b===null||b===undefined)return false;
  return String(a)===String(b);
}
function evalCondition(row,cond){
  const c=(cond||"").replace(/;$/,"").trim();
  const eq=c.match(/^(.+?)\s*=\s*(.+)$/);
  if(eq)return valuesEqual(findColumnValue(row,eq[1]),findColumnValue(row,eq[2]));
  return true;
}
function splitSelectList(list){
  const out=[];
  let buf="",quote=null,depth=0;
  for(const ch of list){
    if(quote){buf+=ch;if(ch===quote)quote=null;continue;}
    if(ch==="'"||ch==='"'){quote=ch;buf+=ch;continue;}
    if(ch==="(")depth++;
    if(ch===")")depth--;
    if(ch===","&&depth===0){out.push(buf.trim());buf="";continue;}
    buf+=ch;
  }
  if(buf.trim())out.push(buf.trim());
  return out;
}
function evalWhere(row,whereClause){
  if(!whereClause)return true;
  const onlyBetween=whereClause.trim().match(/^(.+?)\s+BETWEEN\s+(.+?)\s+AND\s+(.+)$/i);
  if(onlyBetween){
    const v=findColumnValue(row,onlyBetween[1]),a=findColumnValue(row,onlyBetween[2]),b=findColumnValue(row,onlyBetween[3]);
    return Number(v)>=Number(a)&&Number(v)<=Number(b);
  }
  return whereClause.split(/\s+AND\s+/i).every(cond=>{
    const between=cond.match(/^(.+?)\s+BETWEEN\s+(.+?)\s+AND\s+(.+)$/i);
    if(between){
      const v=findColumnValue(row,between[1]),a=findColumnValue(row,between[2]),b=findColumnValue(row,between[3]);
      return Number(v)>=Number(a)&&Number(v)<=Number(b);
    }
    const inn=cond.match(/^(.+?)\s+IN\s*\((.+)\)$/i);
    if(inn){
      const v=findColumnValue(row,inn[1]);
      return splitSelectList(inn[2]).some(x=>valuesEqual(v,findColumnValue(row,x)));
    }
    const like=cond.match(/^(.+?)\s+LIKE\s+(.+)$/i);
    if(like){
      const v=String(findColumnValue(row,like[1])??"");
      const pattern=String(findColumnValue(row,like[2])??"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/%/g,".*").replace(/_/g,".");
      return new RegExp(`^${pattern}$`,"i").test(v);
    }
    const cmp=cond.match(/^(.+?)\s*(<>|!=|>=|<=|=|>|<)\s*(.+)$/);
    if(!cmp)return true;
    const a=findColumnValue(row,cmp[1]),b=findColumnValue(row,cmp[3]),op=cmp[2];
    if(op==="=")return valuesEqual(a,b);
    if(op==="<>"||op==="!=")return !valuesEqual(a,b);
    const na=Number(a),nb=Number(b);
    if(op===">")return na>nb;
    if(op==="<")return na<nb;
    if(op===">=")return na>=nb;
    if(op==="<=")return na<=nb;
    return true;
  });
}
function parseJoinPlan(fromPart){
  const joinRe=/\b(?:NATURAL\s+)?(?:(?:LEFT|RIGHT|FULL)\s+(?:OUTER\s+)?|INNER\s+|CROSS\s+)?JOIN\b/ig;
  const matches=[...fromPart.matchAll(joinRe)];
  if(!matches.length)return{base:parseTableRef(fromPart),joins:[]};
  const base=parseTableRef(fromPart.slice(0,matches[0].index));
  const joins=matches.map((m,i)=>{
    const next=matches[i+1]?.index??fromPart.length;
    const seg=fromPart.slice(m.index+m[0].length,next).trim();
    const on=seg.match(/\s+ON\s+([\s\S]+)$/i);
    const tablePart=on?seg.slice(0,on.index).trim():seg;
    const txt=m[0].toUpperCase();
    return{natural:/NATURAL/i.test(txt),type:/LEFT/i.test(txt)?"left":/RIGHT/i.test(txt)?"right":/CROSS/i.test(txt)?"cross":"inner",ref:parseTableRef(tablePart),on:on?on[1].trim():null};
  });
  return{base,joins};
}
function naturalColumns(rows,rightRows){
  const leftCols=new Set();
  rows[0]?.__aliases.forEach(a=>a.cols.forEach(c=>leftCols.add(c.toLowerCase())));
  return rightRows[0]?.__aliases[0].cols.filter(c=>leftCols.has(c.toLowerCase()))||[];
}
function joinRows(leftRows,rightRows,join){
  const result=[];
  const nullRight=rightRows[0]?{__aliases:rightRows[0].__aliases,__values:Object.fromEntries(Object.keys(rightRows[0].__values).map(k=>[k,null]))}:null;
  const nullLeft=leftRows[0]?{__aliases:leftRows[0].__aliases,__values:Object.fromEntries(Object.keys(leftRows[0].__values).map(k=>[k,null]))}:null;
  const common=join.natural?naturalColumns(leftRows,rightRows):[];
  const matches=(l,r)=>{
    const merged=mergeJoinRows(l,r);
    if(join.type==="cross")return true;
    if(join.natural)return common.every(c=>valuesEqual(findColumnValue(l,c),findColumnValue(r,`${r.__aliases[0].alias}.${c}`)));
    return join.on?evalCondition(merged,join.on):true;
  };
  leftRows.forEach(l=>{
    let hit=false;
    rightRows.forEach(r=>{if(matches(l,r)){hit=true;result.push(mergeJoinRows(l,r));}});
    if(!hit&&join.type==="left"&&nullRight)result.push(mergeJoinRows(l,nullRight));
  });
  if(join.type==="right"&&nullLeft){
    rightRows.forEach(r=>{
      const hit=leftRows.some(l=>matches(l,r));
      if(!hit)result.push(mergeJoinRows(nullLeft,r));
    });
  }
  return result;
}
function parseSelectDefs(selectList){
  return splitSelectList(selectList).map(p=>{
    const as=p.match(/^(.+?)\s+AS\s+([A-Za-z_]\w*)$/i);
    const expr=(as?as[1]:p).trim();
    const label=as?as[2]:expr.replace(/^([A-Za-z_]\w*)\./,"");
    return{expr,label};
  });
}
function isAggregateExpr(expr){
  return /^(COUNT|AVG|SUM|MIN|MAX)\s*\(/i.test(String(expr||"").trim());
}
function hasAggregateSelect(selectList){
  return parseSelectDefs(selectList).some(d=>isAggregateExpr(d.expr));
}
function formatAggregateNumber(n){
  if(!Number.isFinite(n))return"NULL";
  return Number.isInteger(n)?n:n.toFixed(2);
}
function aggregateValue(rows,expr){
  const m=String(expr||"").trim().match(/^(COUNT|AVG|SUM|MIN|MAX)\s*\(\s*(\*|[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?)\s*\)$/i);
  if(!m)return rows[0]?findColumnValue(rows[0],expr)??"NULL":"NULL";
  const fn=m[1].toUpperCase(),ref=m[2];
  if(fn==="COUNT"&&ref==="*")return rows.length;
  const vals=rows.map(row=>findColumnValue(row,ref)).filter(v=>v!==null&&v!==undefined&&v!=="NULL");
  if(fn==="COUNT")return vals.length;
  if(fn==="MIN")return vals.length?vals.reduce((a,b)=>String(a).localeCompare(String(b))<=0?a:b):"NULL";
  if(fn==="MAX")return vals.length?vals.reduce((a,b)=>String(a).localeCompare(String(b))>=0?a:b):"NULL";
  const nums=vals.map(Number).filter(Number.isFinite);
  if(!nums.length)return"NULL";
  const sum=nums.reduce((a,b)=>a+b,0);
  return fn==="AVG"?formatAggregateNumber(sum/nums.length):formatAggregateNumber(sum);
}
function projectGroupedRows(rows,selectList,groupClause){
  const defs=parseSelectDefs(selectList);
  const groupExprs=groupClause?splitSelectList(groupClause):[];
  const groups=new Map();
  rows.forEach(row=>{
    const key=groupExprs.length?groupExprs.map(expr=>String(findColumnValue(row,expr)??"NULL")).join("\u0001"):"__all__";
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(row);
  });
  if(!rows.length&&!groupExprs.length)groups.set("__all__",[]);
  const resultRows=[...groups.values()].map(groupRows=>Object.fromEntries(defs.map(d=>{
    const value=isAggregateExpr(d.expr)?aggregateValue(groupRows,d.expr):(groupRows[0]?findColumnValue(groupRows[0],d.expr)??"NULL":"NULL");
    return[d.label,value];
  })));
  return{cols:defs.map(d=>d.label),rows:resultRows};
}
function sortProjectedRows(rows,cols,orderClause){
  const om=orderClause.match(/^(.+?)(?:\s+(ASC|DESC))?$/i);
  const ref=om?.[1]?.trim(),dir=(om?.[2]||"ASC").toUpperCase();
  const col=cols.find(c=>c.toLowerCase()===String(ref||"").replace(/^([A-Za-z_]\w*)\./,"").toLowerCase())||ref;
  return[...rows].sort((a,b)=>String(a[col]??"").localeCompare(String(b[col]??""))*(dir==="DESC"?-1:1));
}
function projectSelectRows(rows,selectList){
  if(!rows.length)return{cols:[],rows:[]};
  if(selectList.trim()==="*"){
    const cols=[];
    rows[0].__aliases.forEach(a=>a.cols.forEach(c=>cols.push(rows[0].__aliases.length>1?`${a.alias}.${c}`:c)));
    return{cols,rows:rows.map(row=>Object.fromEntries(cols.map(col=>[col,findColumnValue(row,col)??"NULL"])))};
  }
  const defs=parseSelectDefs(selectList);
  return{cols:defs.map(d=>d.label),rows:rows.map(row=>Object.fromEntries(defs.map(d=>[d.label,findColumnValue(row,d.expr)??"NULL"])))};
}
function executeSelect(raw,db=SAMPLE_DB){
  const stmt=splitSQLStatements(raw)[0]||raw;
  let sql=stmt.replace(/\s+/g," ").replace(/;$/,"").trim();
  const m=sql.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+([\s\S]+)$/i);
  if(!m)return{error:"SELECT 문을 인식하지 못했어요."};
  let selectList=m[1].trim();
  const distinct=/^DISTINCT\b/i.test(selectList);
  if(distinct)selectList=selectList.replace(/^DISTINCT\b/i,"").trim();
  let rest=m[2].trim(),orderClause="",whereClause="",groupClause="";
  const orderIdx=rest.search(/\s+ORDER\s+BY\s+/i);
  if(orderIdx>=0){orderClause=rest.slice(orderIdx).replace(/^\s+ORDER\s+BY\s+/i,"").trim();rest=rest.slice(0,orderIdx).trim();}
  const groupIdx=rest.search(/\s+GROUP\s+BY\s+/i);
  if(groupIdx>=0){groupClause=rest.slice(groupIdx).replace(/^\s+GROUP\s+BY\s+/i,"").trim();rest=rest.slice(0,groupIdx).trim();}
  const whereIdx=rest.search(/\s+WHERE\s+/i);
  if(whereIdx>=0){whereClause=rest.slice(whereIdx).replace(/^\s+WHERE\s+/i,"").trim();rest=rest.slice(0,whereIdx).trim();}
  const plan=parseJoinPlan(rest);
  if(!plan.base)return{error:"FROM 절의 테이블을 인식하지 못했어요."};
  try{
    let rows=makeRows(db,plan.base);
    plan.joins.forEach(j=>{if(j.ref)rows=joinRows(rows,makeRows(db,j.ref),j);});
    rows=rows.filter(r=>evalWhere(r,whereClause));
    let projected;
    const aggregateMode=Boolean(groupClause)||hasAggregateSelect(selectList);
    if(aggregateMode){
      projected=projectGroupedRows(rows,selectList,groupClause);
      if(orderClause)projected={...projected,rows:sortProjectedRows(projected.rows,projected.cols,orderClause)};
    }else{
      if(orderClause){
      const om=orderClause.match(/^(.+?)(?:\s+(ASC|DESC))?$/i);
      const ref=om?.[1]?.trim(),dir=(om?.[2]||"ASC").toUpperCase();
      rows=[...rows].sort((a,b)=>String(findColumnValue(a,ref)??"").localeCompare(String(findColumnValue(b,ref)??""))*(dir==="DESC"?-1:1));
      }
      projected=projectSelectRows(rows,selectList);
    }
    if(distinct){
      const seen=new Set();
      projected.rows=projected.rows.filter(row=>{
        const key=projected.cols.map(c=>String(row[c])).join("\u0001");
        if(seen.has(key))return false;
        seen.add(key);
        return true;
      });
    }
    const log=[`🔎 SELECT 실행: ${projected.rows.length}행 반환`];
    if(groupClause)log.push(`📊 GROUP BY: ${groupClause}`);
    log.push("📦 샘플 테이블: instructor, one, two, Student, Department, Employee, Course, TA");
    return{...projected,title:"쿼리 결과",log};
  }catch(e){return{error:e.message||"SELECT 실행 중 오류가 발생했어요."};}
}

function summarizeNoteLocally(note,title){
  const lines=String(note||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const picked=lines.length?lines:[String(note||"").trim()].filter(Boolean);
  return [
    `• ${title}에서 기록한 핵심 내용을 짧은 개념 단위로 정리했습니다.`,
    ...picked.slice(0,4).map(line=>`• ${line}`),
    "• 헷갈리는 키워드는 SQL 실습 탭에서 직접 실행해 보면서 확인하세요.",
  ].join("\n");
}
function explainSqlLocally(sql,selects){
  const s=String(sql||"");
  if(/\bGROUP\s+BY\b/i.test(s)){
    return "• GROUP BY는 같은 값을 가진 행을 하나의 그룹으로 묶습니다.\n• AVG(salary)는 각 그룹 안에서 salary 평균을 계산합니다.\n• 이 쿼리는 학과별 평균 급여를 구하는 집계 예제입니다.";
  }
  if(/\bJOIN\b/i.test(s)){
    return "• JOIN은 두 테이블을 조건에 맞춰 결합합니다.\n• INNER JOIN은 조건이 맞는 행만 남기고, OUTER JOIN은 한쪽 테이블의 행을 보존합니다.\n• ON 절은 두 테이블을 연결할 컬럼 조건을 지정합니다.";
  }
  if(selects.length){
    return "• SELECT는 테이블에서 필요한 컬럼과 행을 조회합니다.\n• WHERE, ORDER BY, DISTINCT 같은 절로 결과를 필터링하거나 정렬할 수 있습니다.\n• 실행 결과의 컬럼명과 행 수를 보며 쿼리 의도를 확인하세요.";
  }
  return "• CREATE TABLE은 테이블 구조를 정의합니다.\n• INSERT INTO는 정의된 컬럼에 데이터를 삽입합니다.\n• PRIMARY KEY와 NOT NULL 같은 제약조건은 데이터 무결성을 지킵니다.";
}
function quizFeedbackLocally(q,choice,ok){
  return `${ok?"정답입니다.":"오답입니다."} ${q.exp}\n\n선택한 답: ${q.opts[choice]}\n정답: ${q.opts[q.ans]}`;
}

function Btn({children,onClick,primary,small,full,color,style:ex}){
  return (
    <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,background:primary?(color||C.accent):C.white,color:primary?"#fff":C.text,border:`2px solid ${primary?(color||C.accent):C.border}`,borderRadius:8,padding:small?"7px 14px":"10px 18px",fontSize:small?12.5:14,fontWeight:700,cursor:"pointer",width:full?"100%":"auto",...ex}}>
      {children}
    </button>
  );
}

function Pie({pct,color,size=52}){
  const r=20,circ=2*Math.PI*r,dash=circ*pct/100;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={r} fill="none" stroke={C.soft} strokeWidth="4"/>
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 24 24)"/>
      <text x="24" y="28" textAnchor="middle" fontSize="10" fontWeight="800" fill={C.navy}>{pct}%</text>
    </svg>
  );
}

function Sidebar({page,setPage}){
  const nav=[{k:"home",icon:"⌂",l:"홈"},{k:"library",icon:"▥",l:"서재"},{k:"upload",icon:"↥",l:"업로드"}];
  const active=["study"].includes(page)?"library":page;
  return (
    <aside style={{width:120,background:`linear-gradient(180deg,${C.navyDark},${C.navyLight})`,display:"flex",flexDirection:"column",alignItems:"stretch",padding:"20px 0 16px",flexShrink:0}}>
      <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
        <div style={{width:52,height:52,borderRadius:"50%",border:"3px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:26,color:"#fff"}}>Q</div>
      </div>
      {nav.map(item=>{
        const isA=active===item.k;
        const go=()=>setPage(item.k);
        return (
          <button key={item.k} onClick={go} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",border:"none",background:isA?"rgba(255,255,255,0.15)":"transparent",cursor:"pointer",color:"#fff",fontWeight:isA?800:500,fontSize:13,textAlign:"left",borderLeft:isA?"3px solid #fff":"3px solid transparent"}}>
            <span style={{fontSize:17,width:18,textAlign:"center"}}>{item.icon}</span>{item.l}
          </button>
        );
      })}
      <div style={{flex:1}}/>
      <button style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",border:"none",background:"transparent",cursor:"pointer",color:"rgba(255,255,255,0.5)",fontSize:13}}>
        <span style={{fontSize:17,width:18,textAlign:"center"}}>⚙</span>설정
      </button>
    </aside>
  );
}

function TopBar({sub,children}){
  return (
    <header style={{height:62,background:C.white,borderBottom:`2px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 28px",gap:14,flexShrink:0}}>
      <span style={{fontWeight:900,fontSize:19,color:C.navy}}>QueryNote AI</span>
      {sub&&<span style={{fontSize:12,color:C.navy,background:C.aL,padding:"4px 11px",borderRadius:14,fontWeight:700,border:`1px solid ${C.soft}`}}>{sub}</span>}
      <div style={{flex:1}}/>
      {children}
      <div style={{width:34,height:34,border:`2px solid ${C.border}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:C.navy,cursor:"pointer"}}>○</div>
      <Btn primary color={C.red} small>로그아웃</Btn>
    </header>
  );
}

function HomeView({setPage}){
  return (
    <main style={{flex:1,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,gap:32,overflow:"auto"}}>
      <div style={{textAlign:"center"}}>
        <h1 style={{fontSize:30,fontWeight:900,color:C.navy,margin:"0 0 10px"}}>✦ 안녕하세요, 학습을 시작해 볼까요?</h1>
        <p style={{fontSize:15,color:C.muted,margin:0}}>QueryNote AI가 당신의 학습을 더 똑똑하게 도와드릴게요.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:26}}>
        {[{icon:"▥",title:"서재",desc:"저장된 강의자료로 이어 학습하기",btn:"서재 열기 →",page:"library",color:C.green,light:C.gL},{icon:"↥",title:"새 학습",desc:"PDF를 업로드하고 새로운 학습 시작하기",btn:"새 학습 시작 →",page:"upload",color:C.accent,light:C.aL}].map(item=>(
          <section key={item.page} style={{background:item.light,border:`2px solid ${C.border}`,borderRadius:12,padding:28,textAlign:"center",width:250}}>
            <div style={{width:90,height:90,borderRadius:"50%",background:C.white,border:`2px solid ${C.soft}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,color:item.color,margin:"0 auto 18px"}}>{item.icon}</div>
            <h2 style={{fontSize:24,fontWeight:900,color:C.navy,margin:"0 0 8px"}}>{item.title}</h2>
            <div style={{height:1,background:C.soft,margin:"10px 0 12px"}}/>
            <p style={{fontSize:13.5,color:C.text,margin:"0 0 20px",lineHeight:1.6}}>{item.desc}</p>
            <Btn primary full color={item.color} onClick={()=>setPage(item.page)}>{item.btn}</Btn>
          </section>
        ))}
      </div>
    </main>
  );
}

function LibraryView({setPage,setBook,setBookId,setPdfUrl}){
  const [books,setBooks]=useState(BOOKS);
  const [sort,setSort]=useState("recent");
  useEffect(()=>{
    (async()=>{
      try{
        const parsed=await readStoredLibrary();
        const hydrated=await Promise.all(parsed.map(hydrateLibraryBook));
        setBooks([...hydrated,...BOOKS]);
      }catch(e){}
    })();
  },[]);
  const deleteBook=async(id)=>{
    if(!window.confirm("이 강의자료를 서재에서 삭제할까요?")) return;
    const updated=books.filter(b=>b.id!==id);
    setBooks(updated);
    try{
      const userBooks=updated.filter(b=>!BOOKS.find(d=>d.id===b.id)&&!LEGACY_DEMO_BOOK_FILENAMES.has(b.fn));
      await deletePdfData(id).catch(()=>{});
      await writeStoredLibrary(userBooks);
    }catch(e){}
  };
  const sortedBooks=[...books].sort((a,b)=>{
    if(sort==="recent") return (b.id||0)-(a.id||0);
    if(sort==="progress") return (b.pct||0)-(a.pct||0);
    if(sort==="name") return (a.fn||"").localeCompare(b.fn||"");
    return 0;
  });
  return (
    <main style={{flex:1,background:C.bg,padding:"32px 36px",overflowY:"auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:26}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span style={{fontSize:36}}>📚</span>
          <div>
            <h1 style={{fontSize:26,fontWeight:900,color:C.navy,margin:"0 0 4px"}}>내 서재</h1>
            <p style={{fontSize:13,color:C.muted,margin:0}}>저장된 강의자료와 학습 기록을 이어보세요.</p>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{height:34,fontSize:12,borderRadius:7,border:`1px solid ${C.soft}`,padding:"0 10px",background:C.white,color:C.navy,fontWeight:600}}>
            <option value="recent">최근 추가순</option>
            <option value="progress">진행률순</option>
            <option value="name">파일명순</option>
          </select>
          <Btn small onClick={()=>setPage("upload")}>+ 새 강의자료</Btn>
        </div>
      </div>
      {books.length===0&&(
        <div style={{textAlign:"center",padding:"60px 0",color:C.muted}}>
          <div style={{fontSize:40,marginBottom:12}}>📚</div>
          <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>아직 저장된 강의자료가 없어요.</div>
          <Btn primary color={C.accent} onClick={()=>setPage("upload")}>새 학습 시작하기</Btn>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {sortedBooks.map((book,idx)=>(
          <section key={book.id||idx} style={{background:C.white,border:`2px solid ${C.border}`,borderRadius:10,padding:22,boxShadow:"0 4px 12px rgba(27,37,96,0.07)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:56,height:56,border:`2px solid ${C.border}`,borderRadius:8,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12,color:book.color||C.accent}}>PDF</div>
                <div>
                  <div style={{fontWeight:800,fontSize:15,color:C.navy}}>{book.fn}</div>
                  <div style={{fontSize:12,color:C.muted}}>{book.sub} · {book.title}</div>
                </div>
              </div>
              <div style={{textAlign:"center"}}>
                <Pie pct={book.pct||0} color={book.color||C.accent}/>
                <div style={{fontSize:10,color:book.color||C.accent,marginTop:2,fontWeight:700}}>{book.rl||1}회독 · {book.rl===3?"완독":"복습 중"}</div>
              </div>
            </div>
            <div style={{height:1,background:C.soft,margin:"0 0 12px"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 14px",fontSize:12.5,color:C.navy,marginBottom:16}}>
              <div>📅 마지막 학습 <b>{book.lastStudy||"-"}</b></div>
              <div>📄 마지막 페이지 <b>{book.lastPage||1}/{book.total||"-"}</b></div>
              <div>✏️ 필기 <b>{book.notes||0}개</b></div>
              <div>⚠️ 약점 개념 <b>{book.weak||0}개</b></div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn primary color={book.color||C.accent} onClick={()=>{setBook(book.fn);setBookId(book.id||null);setPdfUrl(book.dataUrl||"");setPage("study");}} style={{flex:1}}>이어서 학습하기 →</Btn>
              <Btn small onClick={()=>deleteBook(book.id||idx)} style={{color:C.red,borderColor:C.red,flexShrink:0}}>🗑️</Btn>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function UploadView({setPage,setBook,setBookId,setPdfUrl,refreshLibrary}){
  const [fn,setFn]=useState("");
  const [dataUrl,setDataUrl]=useState("");
  const [subject,setSubject]=useState("");
  const [title,setTitle]=useState("");
  const [readLevel,setReadLevel]=useState("1");
  const [goal,setGoal]=useState("");
  const [errors,setErrors]=useState({});
  const [savedBookId,setSavedBookId]=useState(null);
  const [saveMsg,setSaveMsg]=useState("");

  const handleFile=(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    setFn(file.name);
    setSavedBookId(null);
    setSaveMsg("");
    const reader=new FileReader();
    reader.onload=(ev)=>{setDataUrl(ev.target.result);};
    reader.readAsDataURL(file);
  };

  const markDirty=()=>{
    if(saveMsg)setSaveMsg("");
  };
  const validateUpload=()=>{
    const newErrors={};
    if(!fn) newErrors.file="PDF 파일을 업로드해주세요.";
    else if(!dataUrl) newErrors.file="PDF 파일을 아직 읽는 중입니다. 잠시 후 다시 눌러주세요.";
    if(!subject.trim()) newErrors.subject="과목명을 입력해주세요.";
    if(!title.trim()) newErrors.title="강의 제목을 입력해주세요.";
    if(Object.keys(newErrors).length>0){
      setErrors(newErrors);
      return null;
    }
    setErrors({});
    return newErrors;
  };
  const buildBook=(id)=>({
      id,
      fn:fn,
      sub:subject,
      title:title,
      lastStudy:new Date().toLocaleDateString("ko-KR"),
      lastPage:1,
      total:isJoinLecture(fn)?34:36,
      notes:0,
      weak:0,
      rl:Number(readLevel),
      pct:0,
      color:["#5BB44B","#F4874B","#3B8BF5","#F5C842"][Math.floor(Math.random()*4)],
      dataUrl:"",
      pdfStoreKey:String(id),
      goal:goal,
  });
  const saveBook=async({goStudy=false}={})=>{
    if(!validateUpload())return null;
    const id=savedBookId||Date.now();
    const newBook=buildBook(id);
    try{
      await savePdfData(id,dataUrl);
      const books=await readStoredLibrary();
      const withoutSame=books.filter(b=>b.id!==id);
      await writeStoredLibrary([newBook,...withoutSame]);
    }catch(e){
      setSaveMsg(`저장 실패: ${e?.message||"브라우저 저장소에 저장하지 못했습니다."}`);
      return null;
    }
    setSavedBookId(id);
    setSaveMsg(goStudy?"강의자료를 저장하고 학습을 시작합니다.":"강의자료가 서재에 저장되었습니다.");
    if(refreshLibrary) refreshLibrary();
    if(goStudy){
      setBook(fn);
      setBookId(id);
      setPdfUrl(dataUrl);
      setPage("study");
    }
    return newBook;
  };

  const handleStart=async()=>{
    await saveBook({goStudy:true});
  };
  const handleSave=async()=>{
    await saveBook({goStudy:false});
  };
  const saveFailed=saveMsg.startsWith("저장 실패");

  return (
    <main style={{flex:1,background:C.bg,padding:"28px 36px",overflowY:"auto"}}>
      <button onClick={()=>setPage("home")} style={{background:"none",border:"none",color:C.navy,cursor:"pointer",fontSize:14,fontWeight:700,marginBottom:10}}>← 뒤로가기</button>
      <div style={{textAlign:"center",marginBottom:28}}>
        <h1 style={{fontSize:30,fontWeight:900,color:C.navy,margin:"0 0 8px"}}>✦ 새 학습 시작하기</h1>
        <p style={{fontSize:14,color:C.muted,margin:0}}>새로운 PDF 강의자료를 업로드하고 학습을 시작하세요.</p>
      </div>
      <section style={{maxWidth:700,margin:"0 auto",background:C.white,border:`2px solid ${C.border}`,borderRadius:12,padding:28,boxShadow:"0 4px 12px rgba(27,37,96,0.07)"}}>
        <label style={{display:"block",cursor:"pointer",marginBottom:6}}>
          <input type="file" accept="application/pdf" onChange={handleFile} style={{display:"none"}}/>
          <div style={{border:`2px dashed ${errors.file?C.red:fn?C.accent:C.soft}`,borderRadius:10,background:fn?C.aL:C.bg,minHeight:160,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
            <div style={{fontSize:44}}>☁️</div>
            <div style={{fontWeight:700,fontSize:16,color:fn?C.accent:C.navy}}>{fn||"파일을 선택하거나 드래그하여 업로드하세요"}</div>
            <div style={{fontSize:13,color:C.muted}}>PDF, 최대 200MB까지 지원</div>
          </div>
        </label>
        {errors.file&&<div style={{color:C.red,fontSize:12.5,marginBottom:10,fontWeight:600}}>⚠️ {errors.file}</div>}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16,marginTop:16}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:6}}>과목명 <span style={{color:C.red}}>*</span></div>
            <input value={subject} onChange={e=>{setSubject(e.target.value);markDirty();}} placeholder="예) 데이터베이스" style={{width:"100%",height:44,borderRadius:8,border:`2px solid ${errors.subject?C.red:C.soft}`,padding:"0 12px",fontSize:13,boxSizing:"border-box"}}/>
            {errors.subject&&<div style={{color:C.red,fontSize:12,marginTop:4,fontWeight:600}}>⚠️ {errors.subject}</div>}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:6}}>강의 제목 <span style={{color:C.red}}>*</span></div>
            <input value={title} onChange={e=>{setTitle(e.target.value);markDirty();}} placeholder="예) 9강. SQL 기초" style={{width:"100%",height:44,borderRadius:8,border:`2px solid ${errors.title?C.red:C.soft}`,padding:"0 12px",fontSize:13,boxSizing:"border-box"}}/>
            {errors.title&&<div style={{color:C.red,fontSize:12,marginTop:4,fontWeight:600}}>⚠️ {errors.title}</div>}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:6}}>회독 단계</div>
            <select value={readLevel} onChange={e=>{setReadLevel(e.target.value);markDirty();}} style={{width:"100%",height:44,borderRadius:8,border:`2px solid ${C.soft}`,padding:"0 12px",fontSize:13,background:C.white}}>
              <option value="1">1회독 (기본)</option><option value="2">2회독</option><option value="3">3회독+</option>
            </select>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:6}}>학습 목표 (선택)</div>
            <input value={goal} onChange={e=>{setGoal(e.target.value);markDirty();}} placeholder="예) 핵심 개념 이해 및 기본 이론 정리" style={{width:"100%",height:44,borderRadius:8,border:`2px solid ${C.soft}`,padding:"0 12px",fontSize:13,boxSizing:"border-box"}}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"0.9fr 1.1fr",gap:10}}>
          <Btn full onClick={handleSave} style={{height:52,fontSize:15}}>
            💾 강의자료 저장
          </Btn>
          <Btn primary full color={C.accent} onClick={handleStart} style={{height:52,fontSize:15}}>
            ▶ 학습 시작
          </Btn>
        </div>
        {saveMsg&&(
          <div style={{marginTop:10,background:saveFailed?C.rL:C.gL,border:`1px solid ${saveFailed?C.red:C.green}`,borderRadius:8,padding:"9px 12px",fontSize:12.5,color:saveFailed?C.red:C.green,fontWeight:800,textAlign:"center"}}>
            {saveMsg}
          </div>
        )}
        <div style={{textAlign:"center",fontSize:12,color:C.muted,marginTop:10}}>🔒 업로드한 파일은 안전하게 보호되며, 학습 목적 외에는 사용되지 않습니다.</div>
      </section>
    </main>
  );
}

function PDFTab({rl,notes,setNotes,setSql,book,pdfUrl,pi,setPi}){
  const [zoom,setZoom]=useState(70);
  const [ni,setNi]=useState("");
  const [an,setAn]=useState("");
  const [loading,setLoading]=useState(false);
  const [lab,setLab]=useState(false);
  const [labMsg,setLabMsg]=useState("");
  const [ocrLoading,setOcrLoading]=useState(false);
  const [pdfDoc,setPdfDoc]=useState(null);
  const [pdfLoading,setPdfLoading]=useState(false);
  const [extractedSql,setExtractedSql]=useState("");
  const totalPages=pdfDoc?.numPages||PAGES.length;
  const cur=getPageMeta(book,pi,!!pdfUrl);
  const currentPage=pi+1;
  const key=`${book||"default"}:${currentPage}`;
  const saved=notes[key];
  const pageCode=extractedSql||cur.code||"";

  useEffect(()=>{setNi("");setAn("");setLab(false);setLabMsg("");setOcrLoading(false);},[pi]);
  useEffect(()=>{if(pdfDoc&&pi>=pdfDoc.numPages)setPi(Math.max(0,pdfDoc.numPages-1));},[pdfDoc,pi,setPi]);

  // PDF.js 로드 및 문서 파싱
  useEffect(()=>{
    if(!pdfUrl) return;
    setPdfLoading(true);
    const script=document.createElement("script");
    script.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload=()=>{
      const pdfjsLib=window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      pdfjsLib.getDocument({data:atob(pdfUrl.split(",")[1])}).promise.then(doc=>{
        setPdfDoc(doc);
        setPdfLoading(false);
      }).catch(()=>setPdfLoading(false));
    };
    script.onerror=()=>setPdfLoading(false);
    if(!window.pdfjsLib) document.head.appendChild(script);
    else{
      const pdfjsLib=window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      pdfjsLib.getDocument({data:atob(pdfUrl.split(",")[1])}).promise.then(doc=>{
        setPdfDoc(doc);
        setPdfLoading(false);
      }).catch(()=>setPdfLoading(false));
    }
  },[pdfUrl]);

  // 페이지 렌더링
  useEffect(()=>{
    if(!pdfDoc) return;
    const pageNum=currentPage;
    let cancelled=false;
    pdfDoc.getPage(pageNum).then(page=>{
      if(cancelled) return;
      const canvas=document.getElementById("pdf-canvas");
      if(!canvas) return;
      const scale=(zoom/100)*1.5;
      // PDF.js 좌표계는 bottom-up이라 flip 방지를 위해 transform 적용
      const viewport=page.getViewport({scale,rotation:0});
      const outputScale=window.devicePixelRatio||1;
      canvas.width=Math.floor(viewport.width*outputScale);
      canvas.height=Math.floor(viewport.height*outputScale);
      canvas.style.width=Math.floor(viewport.width)+"px";
      canvas.style.height=Math.floor(viewport.height)+"px";
      const ctx=canvas.getContext("2d");
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const transform=outputScale!==1?[outputScale,0,0,outputScale,0,0]:null;
      page.render({canvasContext:ctx,viewport,transform}).promise.catch(()=>{});
      // 텍스트 추출 → SQL 감지
      page.getTextContent().then(tc=>{
        if(cancelled) return;
        const rawText=textItemsToLines(tc.items);
        const blocks=extractSQLBlocks(rawText);
        setExtractedSql(blocks.join("\n\n"));
      }).catch(()=>{});
    }).catch(()=>{});
    return()=>{cancelled=true;};
  },[pdfDoc,currentPage,zoom]);
  const hint={1:"1회독: 기본 개념 퀴즈가 출제됩니다.",2:"2회독: 적용형 퀴즈가 함께 출제됩니다.",3:"3회독+: 심화 퀴즈로 오개념을 점검합니다."};
  const desc={1:`「${cur.title}」— 핵심 개념 위주로 천천히 읽어보세요.`,2:`「${cur.title}」의 핵심을 직접 적용해보는 단계예요.`,3:`「${cur.title}」— 핵심만 빠르게 점검하세요.`};
  const doAI=async()=>{
    if(!ni.trim())return;
    setLoading(true);
    const text=summarizeNoteLocally(ni,cur.title);
    setAn(text);
    const updated={...notes,[key]:{raw:ni,ai:text,page:currentPage,title:cur.title,date:new Date().toLocaleDateString("ko-KR"),book:book||"default"}};
    setNotes(updated);
    try{await window.storage.set("notes",JSON.stringify(updated));}catch(e){}
    setLoading(false);
  };
  return (
    <div style={{flex:1,display:"flex",gap:8,overflow:"hidden",padding:8}}>
      {/* 뷰어 */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:C.white,border:`2px solid ${C.border}`,borderRadius:10,boxShadow:"0 4px 12px rgba(27,37,96,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:`1px solid ${C.soft}`,flexShrink:0}}>
          <span style={{color:C.red}}>📄</span>
          <span style={{fontSize:13,fontWeight:800,color:C.navy}}>{book||"L9_sql1.pdf"}</span>
          <div style={{width:1,height:14,background:C.soft,margin:"0 4px"}}/>
          <button onClick={()=>setPi(i=>Math.max(0,i-1))} disabled={pi===0} style={{border:`1px solid ${C.soft}`,background:C.bg,borderRadius:5,width:24,height:24,cursor:pi===0?"default":"pointer",color:pi===0?C.muted:C.navy}}>‹</button>
          <span style={{fontSize:12,minWidth:60,textAlign:"center",fontFamily:"monospace",fontWeight:700,color:C.navy}}>p.{currentPage}/{totalPages}</span>
          <button onClick={()=>setPi(i=>Math.min(totalPages-1,i+1))} disabled={pi>=totalPages-1} style={{border:`1px solid ${C.soft}`,background:C.bg,borderRadius:5,width:24,height:24,cursor:pi>=totalPages-1?"default":"pointer",color:pi>=totalPages-1?C.muted:C.navy}}>›</button>
          <div style={{width:1,height:14,background:C.soft,margin:"0 4px"}}/>
          <button onClick={()=>setZoom(z=>Math.max(70,z-10))} style={{border:`1px solid ${C.soft}`,background:C.bg,borderRadius:5,width:24,height:24,cursor:"pointer"}}>−</button>
          <span style={{fontSize:12,minWidth:34,textAlign:"center",fontFamily:"monospace"}}>{zoom}%</span>
          <button onClick={()=>setZoom(z=>Math.min(150,z+10))} style={{border:`1px solid ${C.soft}`,background:C.bg,borderRadius:5,width:24,height:24,cursor:"pointer"}}>+</button>
          <button onClick={async()=>{
            const sqlToSend=pageCode;
            if(sqlToSend){
              setSql(sqlToSend);setLabMsg(`p.${currentPage} 코드가 SQL·ERD 실습 탭으로 전송되었습니다.`);setLab(true);
            } else if(pdfDoc){
              setOcrLoading(true);
              try{
                const blocks=await recognizeSqlFromPdfPage(pdfDoc,currentPage);
                if(blocks.length){
                  const found=blocks.join("\n\n");
                  setExtractedSql(found);
                  setSql(found);
                  setLabMsg(`p.${currentPage} 이미지에서 SQL을 자동 인식해 실습 탭으로 전송했습니다.`);
                }else{
                  setSql("-- 페이지 이미지에서 실행 가능한 SQL 문장을 찾지 못했어요.\n-- 확대 비율을 100%로 맞추거나 SQL 코드가 보이는 페이지에서 다시 눌러주세요.");
                  setLabMsg(`p.${currentPage} 이미지에서 SQL을 찾지 못했습니다.`);
                }
              }catch(e){
                setSql("-- OCR 실행 중 오류가 발생했어요.\n-- 브라우저 새로고침 후 다시 시도하거나 SQL을 직접 입력해 주세요.");
                setLabMsg("이미지 SQL 인식 중 오류가 발생했습니다.");
              }
              setOcrLoading(false);
              setLab(true);
            } else {
              setSql("-- PDF를 업로드한 뒤 SQL 예제 페이지에서 다시 눌러주세요.");
              setLabMsg("PDF를 먼저 업로드해 주세요.");
              setLab(true);
            }
          }} disabled={ocrLoading} style={{marginLeft:"auto",background:pageCode?C.accent:C.aL,color:pageCode?"#fff":C.accent,border:`1px solid ${C.accent}`,borderRadius:6,padding:"4px 10px",fontSize:11.5,cursor:ocrLoading?"wait":"pointer",fontWeight:700,opacity:ocrLoading?0.75:1}}>
            {ocrLoading?"🔎 SQL 인식 중...":pageCode?"🔬 SQL 전송하기 →":"🔎 페이지 SQL 자동 인식"}
          </button>
        </div>
        <div style={{flex:1,background:"#ECEEF7",overflow:"auto",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",padding:16}}>
          {pdfUrl?(
            <div style={{position:"relative",display:"inline-block",lineHeight:0}}>
              {pdfLoading&&<div style={{position:"absolute",color:C.navy,fontWeight:700,fontSize:13}}>PDF 불러오는 중...</div>}
              <canvas id="pdf-canvas" style={{maxWidth:"100%",maxHeight:"100%",boxShadow:"0 2px 12px rgba(0,0,0,0.15)"}}/>
            </div>
          ):(
            <div style={{background:C.white,border:`2px solid ${C.border}`,borderRadius:10,padding:"24px 28px",textAlign:"center",maxWidth:360}}>
              <div style={{fontSize:36,marginBottom:10}}>📄</div>
              <div style={{fontWeight:800,fontSize:15,color:C.navy,marginBottom:8}}>PDF를 업로드하면 원본 화면이 표시됩니다.</div>
              <div style={{fontSize:12.5,color:C.muted,lineHeight:1.7,marginBottom:14}}>업로드 화면에서 PDF를 선택한 뒤 학습을 시작하면 실제 강의자료 그대로 볼 수 있어요.</div>
              <div style={{background:C.aL,borderRadius:8,padding:"10px 14px",fontSize:12.5,color:C.accent,lineHeight:1.7}}><b>지금은 데모 모드</b>입니다.<br/>AI 설명과 필기 기능은 정상 작동합니다.</div>
            </div>
          )}
        </div>
        {lab&&(
          <div style={{padding:"8px 14px",background:C.aL,borderTop:`2px solid ${C.accent}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:12.5,color:C.accent,fontWeight:700}}>🔬 {labMsg||`p.${currentPage} 코드가 SQL·ERD 실습 탭으로 전송되었습니다.`}</span>
            <button onClick={()=>setLab(false)} style={{border:"none",background:"none",cursor:"pointer",color:C.muted,fontSize:15}}>✕</button>
          </div>
        )}
      </div>
      {/* 오른쪽 패널 */}
      <div style={{width:310,background:C.white,border:`2px solid ${C.border}`,borderRadius:10,display:"flex",flexDirection:"column",overflowY:"auto",flexShrink:0,boxShadow:"0 4px 12px rgba(27,37,96,0.07)"}}>
        <div style={{padding:"18px 18px 14px",borderBottom:`1px solid ${C.soft}`,background:"linear-gradient(135deg,#EEF2FF,#FFFFFF)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:18}}>✨</span>
            <span style={{fontWeight:900,fontSize:16,color:C.navy}}>AI 설명</span>
          </div>
          <p style={{fontSize:13,lineHeight:1.8,color:C.text,margin:"0 0 10px"}}>{desc[rl]}</p>
          <div style={{background:C.aL,borderRadius:7,padding:"8px 11px",fontSize:12,color:C.navy,border:`1px solid ${C.soft}`}}>ℹ️ {hint[rl]}</div>
          {(()=>{
            const examKey=`exam:${key}`;
            const isMarked=!!notes[examKey];
            return(
              <button onClick={()=>{
                setNotes(prev=>{
                  const n={...prev};
                  if(n[examKey]){
                    delete n[examKey]; // 이미 눌렸으면 해제
                  } else {
                    n[examKey]={type:"exam",page:currentPage,title:cur.title,date:new Date().toLocaleDateString("ko-KR"),book:book||"unknown"};
                  }
                  try{window.storage.set("notes",JSON.stringify(n));}catch(e){}
                  return n;
                });
              }} style={{marginTop:8,background:isMarked?C.yellow:C.yL,border:`2px solid ${C.yellow}`,borderRadius:6,padding:"6px 14px",fontSize:12,cursor:"pointer",color:isMarked?"#fff":C.navy,fontWeight:700,transition:"all 0.2s"}}>
                {isMarked?"⭐ 시험 출제 가능성 표시됨":"☆ 시험 출제 가능성"}
              </button>
            );
          })()}
        </div>
        <div style={{padding:"14px 18px",flex:1}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontWeight:800,fontSize:13.5,color:C.navy}}>📌 p.{currentPage} 필기</span>
            {saved&&<span style={{fontSize:11,color:C.green,fontWeight:700}}>저장됨 ✓</span>}
          </div>
          {saved?(
            <>
              <div style={{background:"#FFFBEB",border:`1px solid ${C.yellow}`,borderRadius:8,padding:"10px 12px",marginBottom:8,fontSize:12.5,lineHeight:1.6}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11,color:C.muted,fontWeight:700}}><span>✏️ 내 필기</span><span>{saved.date}</span></div>
                <div style={{whiteSpace:"pre-wrap",color:C.text}}>{saved.raw}</div>
              </div>
              {saved.ai&&(
                <div style={{background:C.aL,border:`1px solid ${C.soft}`,borderRadius:8,padding:"10px 12px",fontSize:12.5,lineHeight:1.6,whiteSpace:"pre-wrap",color:C.navy}}>
                  <div style={{fontWeight:700,fontSize:11,marginBottom:4,color:C.accent}}>🤖 AI 정리본</div>{saved.ai}
                </div>
              )}
              <Btn small style={{marginTop:8,width:"100%"}} onClick={()=>{setNotes(prev=>{const n={...prev};delete n[key];try{window.storage.set("notes",JSON.stringify(n));}catch(e){}return n});}}>✏️ 필기 다시 쓰기</Btn>
            </>
          ):(
            <>
              <textarea value={ni} onChange={e=>setNi(e.target.value)} placeholder={`p.${currentPage} 즉흥 필기를 입력하세요...\n예) JOIN = 두 테이블 연결 / ON = 조인 조건`} rows={5} style={{width:"100%",borderRadius:8,border:`1px solid ${C.soft}`,padding:"10px 12px",fontSize:12.5,lineHeight:1.7,resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
              <Btn primary full small onClick={doAI} style={{marginTop:8}}>{loading?"AI 정리 중...":"✨ AI로 정리하기"}</Btn>
              {an&&(
                <div style={{marginTop:8,background:C.aL,borderRadius:8,padding:"10px 12px",fontSize:12.5,whiteSpace:"pre-wrap",color:C.navy,lineHeight:1.6}}>
                  <div style={{fontWeight:700,marginBottom:4,color:C.accent}}>🤖 AI 정리본</div>{an}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SQLTab({injected}){
  const placeholder=`-- 여기에 SQL을 입력하거나 PDF에서 코드를 전송하세요
-- 예시:
CREATE TABLE Student (
  student_id  INT          PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL,
  major       VARCHAR(50),
  enroll_date DATE         NOT NULL
);
INSERT INTO Student (student_id, name, major, enroll_date)
VALUES (1001, '이민호', '컴퓨터공학', '2024-03-01');`;
  const [sql,setSql]=useState("");
  const [schema,setSchema]=useState(null);
  const [rows,setRows]=useState([]);
  const [resultCols,setResultCols]=useState(null);
  const [resultTitle,setResultTitle]=useState("");
  const [log,setLog]=useState([]);
  const [rt,setRt]=useState("table");
  const [dbTable,setDbTable]=useState("instructor");
  const [ai,setAi]=useState("");
  const [loading,setLoading]=useState(false);
  const [banner,setBanner]=useState("");
  const repairedSql=useMemo(()=>repairSQLCandidate(sql),[sql]);
  const sqlValidation=useMemo(()=>validateSQLCandidate(sql),[sql]);
  const repairedValidation=useMemo(()=>validateSQLCandidate(repairedSql),[repairedSql]);
  const dbTables=useMemo(()=>SAMPLE_DB_ORDER.map(k=>SAMPLE_DB[k]).filter(Boolean),[]);
  const activeDbTable=dbTables.find(t=>t.name===dbTable)||dbTables[0];
  const canAutoRepair=sql.trim()&&repairedSql.trim()&&repairedSql.trim()!==sql.trim();
  const reset=()=>{setSql("");setSchema(null);setRows([]);setResultCols(null);setResultTitle("");setLog([]);setAi("");};
  useEffect(()=>{
    if(injected&&injected.trim()){
      // 마크다운 코드펜스 제거 후 삽입
      const clean=injected.trim().replace(/```[\w]*\n?/g,"").replace(/```/g,"").trim();
      setSql(clean);
      setSchema(null);setRows([]);setResultCols(null);setResultTitle("");setLog([]);setAi("");
      setBanner("📄 PDF에서 SQL 코드가 전송되었습니다. ▶ 전체 실행을 눌러보세요.");
      setTimeout(()=>setBanner(""),5000);
    }
  },[injected]);
  const run=async()=>{
    const normalized=repairSQLCandidate(sql);
    const validation=validateSQLCandidate(normalized);
    if(normalized.trim()!==sql.trim())setSql(normalized);
    if(!validation.ok){
      setRows([]);setResultCols(null);setResultTitle("");
      setLog(validation.errors.map(e=>`⚠️ ${e}`));
      setBanner("SQL 문법 검증에 실패했습니다. 자동 정리 후 남은 오류를 확인해 주세요.");
      setTimeout(()=>setBanner(""),6500);
      setLoading(false);
      return;
    }
    const stmts=splitSQLStatements(normalized);
    const ddl=stmts.find(s=>/CREATE TABLE/i.test(s));
    const dml=stmts.filter(s=>/^(INSERT|DELETE|UPDATE)\b/i.test(s));
    const selects=stmts.filter(s=>/^SELECT\b/i.test(s));
    let parsed=null;
    let runtimeDb=SAMPLE_DB;
    let nextRows=[];
    let nextLog=[];
    setResultCols(null);setResultTitle("");
    if(ddl){parsed=parseSQL(ddl+";");if(!parsed.error)setSchema(parsed);}
    if(dml.length){
      const r=execDML(dml,[]);
      nextRows=r.rows;
      nextLog=[...nextLog,...r.log];
      if(parsed&&!parsed.error){
        runtimeDb={...SAMPLE_DB,[parsed.tableName]:{name:parsed.tableName,cols:parsed.cols.map(c=>c.name),rows:r.rows.filter(row=>row._s!=="del").map(({_s,...rest})=>rest)}};
      }
    }
    if(selects.length){
      const r=executeSelect(selects[selects.length-1]+";",runtimeDb);
      if(r.error){
        nextLog=[...nextLog,`⚠️ ${r.error}`];
      }else{
        nextRows=r.rows;
        setResultCols(r.cols);
        setResultTitle(r.title);
        nextLog=[...nextLog,...r.log];
      }
    }
    setRows(nextRows);
    setLog(nextLog);
    setLoading(true);
    setAi(explainSqlLocally(normalized,selects));
    setLoading(false);
  };
  const cols=resultCols||(schema?schema.cols.map(c=>c.name):(rows.length?Object.keys(rows[0]).filter(k=>!k.startsWith("_")):[]));
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {banner&&<div style={{background:C.aL,borderBottom:`1px solid ${C.accent}`,padding:"8px 16px",fontSize:13,color:C.accent,fontWeight:700}}>{banner}</div>}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{width:"44%",display:"flex",flexDirection:"column",borderRight:`1px solid ${C.soft}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,padding:"10px 14px",background:C.white,borderBottom:`1px solid ${C.soft}`}}>
            <span style={{fontWeight:800,fontSize:14,color:C.navy}}>SQL 입력</span>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              {sql.trim()&&(
                <span style={{fontSize:11.5,fontWeight:800,color:sqlValidation.ok?C.green:repairedValidation.ok?C.orange:C.red,background:sqlValidation.ok?C.gL:repairedValidation.ok?C.oL:C.rL,border:`1px solid ${sqlValidation.ok?C.green:repairedValidation.ok?C.orange:C.red}`,borderRadius:12,padding:"3px 8px"}}>
                  {sqlValidation.ok?"검증 통과":repairedValidation.ok?"자동 정리 가능":"수정 필요"}
                </span>
              )}
              {canAutoRepair&&(
                <button onClick={()=>setSql(repairedSql)} style={{border:`1px solid ${C.accent}`,background:C.aL,color:C.accent,borderRadius:6,padding:"4px 8px",fontSize:11.5,fontWeight:800,cursor:"pointer"}}>SQL 자동 정리</button>
              )}
            </div>
          </div>
          {!sqlValidation.ok&&sql.trim()&&(
            <div style={{background:repairedValidation.ok?C.oL:C.rL,borderBottom:`1px solid ${repairedValidation.ok?C.orange:C.red}`,padding:"7px 14px",fontSize:12,color:repairedValidation.ok?C.orange:C.red,lineHeight:1.5,fontWeight:700}}>
              {(repairedValidation.ok?["자동 정리 후 실행할 수 있습니다."]:sqlValidation.errors).slice(0,2).join(" · ")}
            </div>
          )}
          <textarea value={sql} onChange={e=>setSql(e.target.value)} placeholder={placeholder} style={{flex:1,fontFamily:"ui-monospace,Menlo,monospace",fontSize:12.5,padding:14,border:"none",outline:"none",resize:"none",lineHeight:1.8,color:"#E2E8F0",background:"#1B2560"}} spellCheck={false}/>
          <div style={{display:"flex",gap:8,padding:"10px 14px",background:C.white,borderTop:`1px solid ${C.soft}`}}>
            <Btn primary onClick={run} style={{flex:1}}>▶ 전체 실행</Btn>
            <Btn small onClick={reset}>🗑️ 전체 초기화</Btn>
          </div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{display:"flex",borderBottom:`1px solid ${C.soft}`,background:C.white,padding:"0 14px"}}>
            {[{k:"table",l:"테이블 보기"},{k:"db",l:"DB 데이터"},{k:"erd",l:"ERD 보기"},{k:"log",l:"실행 로그"}].map(t=>(
              <button key={t.k} onClick={()=>setRt(t.k)} style={{padding:"11px 14px",fontSize:13,fontWeight:rt===t.k?800:500,color:rt===t.k?C.accent:C.muted,border:"none",borderBottom:rt===t.k?`3px solid ${C.accent}`:"3px solid transparent",background:"transparent",cursor:"pointer"}}>{t.l}</button>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:14,background:C.bg}}>
            {rt==="table"&&(
              <>
                {schema&&(
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:12,color:C.muted,marginBottom:6,fontWeight:600}}>테이블 구조</div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5,background:C.white,border:`1px solid ${C.soft}`,borderRadius:8,overflow:"hidden"}}>
                      <thead><tr style={{background:C.navy}}>{["컬럼명","자료형","제약조건"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:11,color:"#fff",fontWeight:700}}>{h}</th>)}</tr></thead>
                      <tbody>{schema.cols.map(c=>(
                        <tr key={c.name}>
                          <td style={{padding:"7px 10px",fontFamily:"monospace",borderBottom:`1px solid ${C.soft}`}}>{c.name}</td>
                          <td style={{padding:"7px 10px",color:C.muted,borderBottom:`1px solid ${C.soft}`}}>{c.type}</td>
                          <td style={{padding:"7px 10px",borderBottom:`1px solid ${C.soft}`}}>
                            {c.pk&&<span style={{background:C.aL,color:C.accent,fontSize:10,padding:"2px 7px",borderRadius:4,fontWeight:700,marginRight:3}}>PK</span>}
                            {c.nn&&<span style={{background:C.yL,color:C.yellow,fontSize:10,padding:"2px 7px",borderRadius:4,fontWeight:700}}>NOT NULL</span>}
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                {rows.length>0&&(
                  <div>
                    <div style={{fontSize:12,color:C.muted,marginBottom:6,fontWeight:600}}>{resultTitle||schema?.tableName||"결과"} ({rows.filter(r=>r._s!=="del").length}행)</div>
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5,background:C.white,border:`1px solid ${C.soft}`,borderRadius:8,overflow:"hidden"}}>
                        <thead><tr style={{background:C.navy}}>{cols.map(c=><th key={c} style={{padding:"8px 10px",textAlign:"left",fontSize:11,color:"#fff",fontWeight:700}}>{c}</th>)}<th style={{width:60}}></th></tr></thead>
                        <tbody>{rows.filter(r=>r._s!=="del").map((row,i)=>(
                          <tr key={i} style={{background:row._s==="new"?"#F0FDF4":row._s==="upd"?"#FEFCE8":"transparent"}}>
                            {cols.map(c=><td key={c} style={{padding:"7px 10px",borderBottom:`1px solid ${C.soft}`}}>{row[c]}</td>)}
                            <td style={{padding:"7px 10px",borderBottom:`1px solid ${C.soft}`}}>
                              {row._s==="new"&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:C.gL,color:C.green,fontWeight:700}}>삽입됨</span>}
                              {row._s==="upd"&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:C.yL,color:C.yellow,fontWeight:700}}>수정됨</span>}
                            </td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                )}
                {!schema&&!rows.length&&<div style={{color:C.muted,fontSize:13,padding:8}}>SQL을 실행하면 결과가 여기 나타납니다.</div>}
              </>
            )}
            {rt==="db"&&activeDbTable&&(
              <div style={{display:"flex",gap:12,minHeight:"100%"}}>
                <div style={{width:150,flexShrink:0,display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{fontSize:12,color:C.muted,fontWeight:800,marginBottom:2}}>샘플 테이블</div>
                  {dbTables.map(t=>(
                    <button key={t.name} onClick={()=>setDbTable(t.name)} style={{textAlign:"left",border:`1px solid ${dbTable===t.name?C.accent:C.soft}`,background:dbTable===t.name?C.aL:C.white,color:dbTable===t.name?C.accent:C.navy,borderRadius:7,padding:"8px 9px",cursor:"pointer",fontSize:12.5,fontWeight:800}}>
                      <div>{t.name}</div>
                      <div style={{fontSize:10.5,color:C.muted,fontWeight:600,marginTop:2}}>{t.rows.length}행 · {t.cols.length}컬럼</div>
                    </button>
                  ))}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:8}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:900,color:C.navy}}>{activeDbTable.name}</div>
                      <div style={{fontSize:11.5,color:C.muted,marginTop:2}}>현재 SQL 실습 엔진이 사용하는 원본 샘플 데이터</div>
                    </div>
                    <button onClick={()=>setSql(`SELECT *\nFROM ${activeDbTable.name};`)} style={{border:`1px solid ${C.accent}`,background:C.aL,color:C.accent,borderRadius:7,padding:"7px 10px",fontSize:12,fontWeight:800,cursor:"pointer",flexShrink:0}}>
                      이 테이블 조회
                    </button>
                  </div>
                  <div style={{overflow:"auto",border:`1px solid ${C.soft}`,borderRadius:8,background:C.white,maxHeight:380}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
                      <thead>
                        <tr style={{background:C.navy}}>
                          {activeDbTable.cols.map(c=>(
                            <th key={c} style={{position:"sticky",top:0,background:C.navy,color:"#fff",padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:800,whiteSpace:"nowrap"}}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeDbTable.rows.map((row,i)=>(
                          <tr key={i} style={{background:i%2?"#FAFBFF":C.white}}>
                            {activeDbTable.cols.map(c=>{
                              const empty=row[c]===null||row[c]===undefined;
                              return <td key={c} style={{padding:"7px 10px",borderBottom:`1px solid ${C.soft}`,fontFamily:typeof row[c]==="number"?"ui-monospace,Menlo,monospace":"inherit",color:empty?C.muted:C.text,whiteSpace:"nowrap"}}>{formatDbCell(row[c])}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {rt==="erd"&&(
              <div>
                <div style={{fontSize:12,color:C.muted,marginBottom:10,fontWeight:600}}>ERD 미리보기</div>
                {schema?(
                  <div style={{display:"inline-block",border:`2px solid ${C.green}`,borderRadius:10,overflow:"hidden",minWidth:200}}>
                    <div style={{background:C.green,color:"#fff",padding:"7px 14px",fontSize:13,fontWeight:800}}>{schema.tableName}</div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5,background:C.white}}>
                      <tbody>{schema.cols.map(c=>(
                        <tr key={c.name}>
                          <td style={{padding:"6px 12px",borderBottom:`1px solid ${C.soft}`,fontFamily:"monospace"}}>{c.pk?"🔑 ":c.nn?"○ ":"   "}{c.name}</td>
                          <td style={{padding:"6px 12px",borderBottom:`1px solid ${C.soft}`,color:C.muted}}>{c.type}</td>
                          <td style={{padding:"6px 12px",borderBottom:`1px solid ${C.soft}`,fontSize:10}}>{c.pk?<span style={{color:C.accent,fontWeight:700}}>PK</span>:c.nn?<span style={{color:C.yellow,fontWeight:700}}>NN</span>:""}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ):<div style={{color:C.muted,fontSize:13}}>CREATE TABLE 실행 후 ERD가 표시됩니다.</div>}
              </div>
            )}
            {rt==="log"&&(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {log.length===0?<div style={{color:C.muted,fontSize:13}}>실행 로그가 없어요.</div>:log.map((l,i)=><div key={i} style={{fontSize:12.5,padding:"6px 10px",background:C.white,borderRadius:6,fontFamily:"monospace",border:`1px solid ${C.soft}`}}>{l}</div>)}
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{borderTop:`1px solid ${C.soft}`,background:C.white,padding:"11px 16px"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:18}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span>✨</span><span style={{fontWeight:800,fontSize:13.5,color:C.navy}}>AI 설명</span></div>
            <p style={{fontSize:13,color:C.text,lineHeight:1.7,margin:0,whiteSpace:"pre-wrap"}}>{loading?"AI가 분석 중...":ai||"SQL을 실행하면 AI가 핵심 내용을 설명해드려요."}</p>
          </div>
          {!loading&&!ai&&(
            <div style={{fontSize:11.5,color:C.muted,minWidth:165,flexShrink:0}}>
              <div style={{fontWeight:700,marginBottom:4}}>💡 핵심 포인트</div>
              <div>1. CREATE TABLE로 테이블 구조 정의</div>
              <div>2. INSERT INTO로 데이터 삽입</div>
              <div>3. PRIMARY KEY는 항상 유니크</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniSpinner({size=14,color=C.accent}){
  return <span style={{width:size,height:size,borderRadius:"50%",border:`2px solid ${C.soft}`,borderTopColor:color,display:"inline-block",animation:"querynote-spin .75s linear infinite",flexShrink:0}}/>;
}

function QuizTab({rl,setWeak,book,pdfUrl}){
  const localQuizSet=useMemo(()=>getQuiz(book,rl),[book,rl]);
  const [aiQuiz,setAiQuiz]=useState(null);
  const [genState,setGenState]=useState({loading:false,provider:"local",message:"로컬 문제은행 사용 중"});
  const quizSet=useMemo(()=>{
    if(aiQuiz?.questions?.length)return{...localQuizSet,questions:aiQuiz.questions,provider:aiQuiz.provider||"ai"};
    return{...localQuizSet,provider:"local"};
  },[aiQuiz,localQuizSet]);
  const qs=quizSet.questions;
  const level=quizSet.level;
  const [qi,setQi]=useState(0);
  const [sel,setSel]=useState(null);
  const [fb,setFb]=useState(null);
  const [loading,setLoading]=useState(false);
  const requestGeneratedQuiz=async()=>{
    if(genState.loading)return;
    setGenState({loading:true,provider:"ai",message:"AI가 PDF 기반 퀴즈를 생성 중입니다."});
    try{
      const data=await generateQuizWithServer({book,readLevel:rl,pdfUrl});
      if(data?.questions?.length&&!data.fallback){
        setAiQuiz({questions:data.questions,provider:data.provider});
        setQi(0);setSel(null);setFb(null);
        const quality=data.quality?.accepted?` · 검증 ${data.quality.accepted}문제 통과`:"";
        setGenState({loading:false,provider:data.provider||"ai",message:`${data.provider||"AI"} 생성 문제 사용 중${quality}`});
      }else{
        setAiQuiz(null);
        const reason=data?.errors?.[0]||"API 키가 없거나 생성 실패";
        setGenState({loading:false,provider:"local",message:`${reason} · 로컬 문제은행 사용 중`});
      }
    }catch(e){
      setAiQuiz(null);
      setGenState({loading:false,provider:"local",message:`${e?.message||"AI 생성 실패"} · 로컬 문제은행 사용 중`});
    }
  };
  useEffect(()=>{
    setQi(0);setSel(null);setFb(null);setAiQuiz(null);
    requestGeneratedQuiz();
  },[rl,book,pdfUrl]);
  const q=qs[Math.min(qi,qs.length-1)];
  const difficultyLabel=q?.difficulty==="hard"?"심화":q?.difficulty==="apply"?"적용":"기본";
  const difficultyColor=q?.difficulty==="hard"?C.red:q?.difficulty==="apply"?C.orange:C.accent;
  const isGenerating=genState.loading;
  const pick=async(i)=>{
    if(sel!==null||isGenerating)return;
    setSel(i);const ok=i===q.ans;
    setLoading(true);
    const txt=quizFeedbackLocally(q,i,ok);
    setFb({ok,txt});setLoading(false);
    if(!ok)setWeak(prev=>{const weakKey=`${book}:${q.concept}`;const u={...prev,[weakKey]:{concept:q.concept,count:(prev[weakKey]?.count||0)+1,date:new Date().toLocaleDateString("ko-KR"),page:q.pg,book}};try{window.storage.set("weak",JSON.stringify(u));}catch(e){}return u;});
  };
  if(!qs||qs.length===0)return(
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}>
      <div style={{textAlign:"center",color:C.muted}}>
        <div style={{fontSize:38,marginBottom:12}}>📝</div>
        <div style={{fontSize:15,fontWeight:700,color:C.navy}}>이 강의자료의 퀴즈를 준비 중이에요.</div>
        <div style={{fontSize:13,marginTop:4}}>현재 지원되는 강의: E-R Model, SQL (1), SQL JOIN, Normalization</div>
      </div>
    </div>
  );
  return(
    <div style={{flex:1,display:"flex",overflow:"hidden",background:C.bg}}>
      <div style={{flex:1,padding:22,overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,background:C.white,border:`2px solid ${C.border}`,borderRadius:10,padding:"12px 16px",marginBottom:14,boxShadow:"0 2px 8px rgba(27,37,96,0.05)"}}>
          <div>
            <div style={{fontSize:12,color:C.muted,fontWeight:800,marginBottom:4}}>회독 단계 기반 퀴즈</div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:16,fontWeight:900,color:C.navy}}>{level.badge}</span>
              <span style={{fontSize:11.5,fontWeight:800,color:level.tone==="hard"?C.red:level.tone==="apply"?C.orange:C.accent,background:level.tone==="hard"?C.rL:level.tone==="apply"?C.oL:C.aL,borderRadius:12,padding:"3px 8px"}}>{level.mix}</span>
              <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11.5,fontWeight:800,color:isGenerating?C.accent:genState.provider==="local"?C.muted:C.green,background:isGenerating?C.aL:genState.provider==="local"?C.bg:C.gL,border:`1px solid ${isGenerating?C.accent:genState.provider==="local"?C.soft:C.green}`,borderRadius:12,padding:"3px 8px"}}>
                {isGenerating&&<MiniSpinner size={10}/>}
                {isGenerating?"AI 생성 중":genState.provider==="local"?"로컬":"AI 생성"}
              </span>
            </div>
            <div style={{fontSize:12.5,color:C.muted,marginTop:4}}>{level.desc} · {genState.message}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:22,fontWeight:900,color:C.accent}}>{qs.length}</div>
            <div style={{fontSize:11.5,color:C.muted,fontWeight:700}}>문제 출제</div>
            <button onClick={requestGeneratedQuiz} disabled={isGenerating} style={{marginTop:6,minWidth:98,height:30,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,border:`1px solid ${isGenerating?C.accent:C.soft}`,background:isGenerating?C.aL:C.white,color:isGenerating?C.accent:C.navy,borderRadius:6,padding:"4px 10px",fontSize:11.5,fontWeight:800,cursor:isGenerating?"wait":"pointer",opacity:isGenerating?0.95:1}}>
              {isGenerating&&<MiniSpinner size={12}/>}
              {isGenerating?"AI 생성 중":"다시 생성"}
            </button>
          </div>
        </div>
        {isGenerating&&(
          <div style={{display:"flex",alignItems:"center",gap:12,background:C.aL,border:`2px solid ${C.accent}`,borderRadius:10,padding:"12px 14px",marginBottom:14,color:C.navy,boxShadow:"0 3px 10px rgba(75,110,245,0.12)"}}>
            <MiniSpinner size={20}/>
            <div style={{minWidth:0}}>
              <div style={{fontSize:14,fontWeight:900}}>AI가 새 퀴즈를 생성하고 있습니다.</div>
              <div style={{fontSize:12.5,color:C.muted,marginTop:2}}>PDF 텍스트 분석, 문제 생성, 품질 검증을 처리 중입니다.</div>
            </div>
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <span style={{fontSize:12,color:C.muted,fontWeight:600}}>퀴즈 진행률</span>
          <div style={{flex:1,position:"relative",height:4,background:C.soft,borderRadius:2}}>
            <div style={{position:"absolute",left:0,top:0,height:"100%",background:C.green,borderRadius:2,width:qs.length>1?`${(qi/(qs.length-1))*100}%`:"0%",transition:"width .3s"}}/>
          </div>
          <div style={{display:"flex",gap:5}}>
            {qs.map((_,i)=>(
              <div key={i} onClick={()=>{setQi(i);setSel(null);setFb(null);}} style={{width:28,height:28,borderRadius:"50%",background:i===qi?C.accent:i<qi?C.green:C.white,border:`2px solid ${i===qi?C.accent:i<qi?C.green:C.soft}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:i<=qi?"#fff":C.muted,cursor:"pointer"}}>{i+1}</div>
            ))}
          </div>
          <span style={{fontSize:12,color:C.accent,fontWeight:800}}>{qi+1}/{qs.length}</span>
        </div>
        <div aria-busy={isGenerating} style={{position:"relative",background:C.white,border:`2px solid ${isGenerating?C.accent:C.border}`,borderRadius:12,padding:"20px 24px",marginBottom:14,boxShadow:"0 4px 12px rgba(27,37,96,0.07)",overflow:"hidden"}}>
          {isGenerating&&(
            <div style={{position:"absolute",inset:0,zIndex:2,background:"rgba(255,255,255,0.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
              <div style={{display:"flex",alignItems:"center",gap:12,background:C.white,border:`1px solid ${C.soft}`,borderRadius:10,padding:"14px 16px",boxShadow:"0 8px 24px rgba(27,37,96,0.14)"}}>
                <MiniSpinner size={24}/>
                <div>
                  <div style={{fontSize:14,fontWeight:900,color:C.navy}}>AI 생성 중</div>
                  <div style={{fontSize:12.5,color:C.muted,marginTop:2}}>완료되면 새 문제로 자동 교체됩니다.</div>
                </div>
              </div>
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:11,color:C.muted,fontWeight:700}}>문제 {qi+1}</span>
            <span style={{fontSize:11,background:q.difficulty==="hard"?C.rL:q.difficulty==="apply"?C.oL:C.aL,color:difficultyColor,padding:"2px 9px",borderRadius:10,fontWeight:700}}>{difficultyLabel} · {q.concept}</span>
          </div>
          <div style={{fontSize:15.5,fontWeight:800,marginBottom:18,lineHeight:1.5,color:C.navy}}>{q.q}</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {q.opts.map((opt,i)=>{
              let bg=C.white,border=C.soft,clr=C.text;
              if(sel!==null){if(i===q.ans){bg=C.gL;border=C.green;clr="#166534";}else if(i===sel&&!fb?.ok){bg=C.rL;border=C.red;clr="#991B1B";}}
              return(
                <button key={i} onClick={()=>pick(i)} disabled={isGenerating} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:8,border:`2px solid ${border}`,background:bg,color:clr,cursor:isGenerating?"wait":sel!==null?"default":"pointer",textAlign:"left",fontSize:13.5,fontWeight:500,opacity:isGenerating?0.55:1}}>
                  <span style={{width:28,height:28,borderRadius:"50%",background:sel!==null?"transparent":C.bg,border:`2px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,flexShrink:0}}>{String.fromCharCode(65+i)}</span>{opt}
                </button>
              );
            })}
          </div>
        </div>
        {fb&&(
          <div style={{background:fb.ok?C.gL:C.rL,border:`2px solid ${fb.ok?C.green:C.red}`,borderRadius:10,padding:"13px 17px",marginBottom:14}}>
            <div style={{fontWeight:800,fontSize:14,color:fb.ok?"#166534":"#991B1B",marginBottom:6}}>{fb.ok?"✅ 정답입니다!":"❌ 오답입니다."}</div>
            <p style={{fontSize:13,lineHeight:1.7,margin:"0 0 6px",color:C.text}}>{loading?"AI 해설 불러오는 중...":fb.txt}</p>
            {!fb.ok&&<div style={{fontSize:12.5,color:C.red,fontWeight:700}}>📌 오개념 기록됨 — 약점 노트에 자동 저장되었습니다.</div>}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
          <Btn onClick={()=>{setQi(i=>Math.max(0,i-1));setSel(null);setFb(null);}}>← 이전 문제</Btn>
          <Btn small style={{color:C.muted}}>📌 문제 표시</Btn>
          <Btn primary onClick={()=>{setQi(i=>Math.min(qs.length-1,i+1));setSel(null);setFb(null);}}>다음 문제 →</Btn>
        </div>
      </div>
      <div style={{width:255,background:C.white,borderLeft:`2px solid ${C.border}`,padding:16,overflowY:"auto",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><span style={{fontSize:17}}>✨</span><span style={{fontWeight:800,fontSize:15,color:C.navy}}>AI 해설</span></div>
        {fb?(
          <>
            <p style={{fontSize:13,lineHeight:1.7,color:C.text,marginBottom:14}}>{loading?"AI 해설 불러오는 중...":fb.txt}</p>
            <div style={{fontSize:12.5,fontWeight:700,color:C.muted,marginBottom:8}}>관련 자료</div>
            {[`📄 관련 PDF p.${q.pg}`,`🔬 관련 실습 보기`].map(t=>(
              <div key={t} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",border:`1px solid ${C.soft}`,borderRadius:8,fontSize:13,marginBottom:6,cursor:"pointer",background:C.bg}}>
                <span style={{fontWeight:600}}>{t}</span><span style={{color:C.muted}}>→</span>
              </div>
            ))}
            {!fb.ok&&(
              <div style={{marginTop:10,background:C.gL,border:`1px solid ${C.green}`,borderRadius:8,padding:"10px 12px",display:"flex",gap:8}}>
                <span style={{color:C.green,fontSize:17}}>✓</span>
                <div style={{fontSize:12.5,color:"#166534"}}><b>오개념 기록됨</b><br/>약점 노트에 저장되어 복습할 수 있어요.</div>
              </div>
            )}
          </>
        ):<p style={{fontSize:13,color:C.muted}}>답을 선택하면 AI 해설이 표시됩니다.</p>}
      </div>
    </div>
  );
}

function WeakTab({weak,notes,setNotes,book,onGoToPdf,onGoToSql,onGoToQuiz}){
  const bookKey=book||"default";
  // 오답: book 기준 필터링 (저장 시 book 필드 포함)
  const wl=Object.values(weak).filter(w=>w&&w.book===bookKey);
  // 필기: "book:page" 키 형식 기준 필터링
  const bookPrefix=`${bookKey}:`;
  const nl=Object.values(notes).filter(n=>n&&n.page&&!n.type&&n.book===bookKey);
  // 시험 출제 가능성: book 기준 필터링
  const el=Object.values(notes).filter(n=>n&&n.type==="exam"&&n.book===bookKey);
  const [sel,setSel]=useState(null);
  const [filter,setFilter]=useState("all"); // all | weak | exam | note
  const [editMode,setEditMode]=useState(false);
  const [editText,setEditText]=useState("");
  useEffect(()=>{
    if(wl.length&&!sel)setSel(wl[0]);
    else if(nl.length&&!sel)setSel({...nl[0],_isNote:true});
  },[wl.length,nl.length]);
  const deleteNote=async(page)=>{
    if(!window.confirm("이 필기를 삭제할까요?")) return;
    const noteKey=`${book||"default"}:${page}`;
    setNotes(prev=>{
      const n={...prev};
      delete n[noteKey];
      try{window.storage.set("notes",JSON.stringify(n));}catch(e){}
      return n;
    });
    setSel(null);
  };
  const saveEdit=async()=>{
    if(!sel?._isNote) return;
    const noteKey=`${book||"default"}:${sel.page}`;
    setNotes(prev=>{
      const n={...prev,[noteKey]:{...sel,raw:editText}};
      try{window.storage.set("notes",JSON.stringify(n));}catch(e){}
      return n;
    });
    setSel(prev=>({...prev,raw:editText}));
    setEditMode(false);
  };
  const filteredWeak=filter==="note"||filter==="exam"?[]:wl;
  const filteredExam=filter==="weak"||filter==="note"?[]:el;
  const filteredNotes=filter==="weak"||filter==="exam"?[]:nl;
  return(
    <div style={{flex:1,display:"flex",overflow:"hidden",background:C.bg}}>
      <div style={{width:295,background:C.white,borderRight:`2px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
        <div style={{padding:"15px 17px",borderBottom:`2px solid ${C.border}`}}>
          <div style={{fontSize:16,fontWeight:900,color:C.navy,marginBottom:4}}>📋 약점 노트</div>
          <div style={{fontSize:12,color:C.muted}}>오답, 시험 출제 가능성 표시, 필기를 기반으로 약한 개념을 관리하세요.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderBottom:`1px solid ${C.soft}`}}>
          {[{l:"오답 개념",v:wl.length,c:C.red},{l:"시험 출제",v:el.length,c:C.yellow},{l:"필기 페이지",v:nl.length,c:C.green}].map(s=>(
            <div key={s.l} style={{padding:"11px 8px",textAlign:"center",borderRight:`1px solid ${C.soft}`}}>
              <div style={{fontSize:20,fontWeight:900,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10.5,color:C.muted,marginTop:2,fontWeight:600}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",borderBottom:`1px solid ${C.soft}`}}>
          {[{k:"all",l:"전체"},{k:"weak",l:`오답(${wl.length})`},{k:"exam",l:`시험(${el.length})`},{k:"note",l:`필기(${nl.length})`}].map(t=>(
            <button key={t.k} onClick={()=>setFilter(t.k)} style={{flex:1,padding:"9px 0",fontSize:11.5,fontWeight:filter===t.k?800:500,color:filter===t.k?C.accent:C.muted,border:"none",borderBottom:filter===t.k?`2px solid ${C.accent}`:"2px solid transparent",background:"transparent",cursor:"pointer"}}>{t.l}</button>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {filteredWeak.length===0&&filteredExam.length===0&&filteredNotes.length===0?(
            <div style={{padding:22,textAlign:"center",color:C.muted,fontSize:13}}>아직 약점이 없어요.<br/>퀴즈를 풀거나 필기를 저장해보세요!</div>
          ):(
            <>
              {filteredWeak.map(w=>(
                <div key={w.concept} onClick={()=>setSel(w)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${C.soft}`,cursor:"pointer",background:sel?.concept===w.concept&&!sel?._isNote?C.aL:C.white}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:34,height:34,borderRadius:8,background:C.rL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>❌</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:13.5,color:C.navy}}>{w.concept}</div>
                      <div style={{fontSize:11,color:C.muted}}>오답 {w.count}회 · 관련 PDF p.{w.page}</div>
                    </div>
                  </div>
                  <span style={{color:C.muted}}>›</span>
                </div>
              ))}
              {filteredExam.map(e=>(
                <div key={`e-${e.page}`} onClick={()=>setSel({...e,_isExam:true})} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${C.soft}`,cursor:"pointer",background:sel?._isExam&&sel?.page===e.page?C.yL:C.white}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:34,height:34,borderRadius:8,background:C.yL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⭐</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:13.5,color:C.navy}}>{e.title}</div>
                      <div style={{fontSize:11,color:C.muted}}>시험 출제 가능 · p.{e.page} · {e.date}</div>
                    </div>
                  </div>
                  <span style={{color:C.muted}}>›</span>
                </div>
              ))}
              {filteredNotes.map(n=>(
                <div key={`n-${n.page}`} onClick={()=>setSel({...n,_isNote:true})} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${C.soft}`,cursor:"pointer",background:sel?._isNote&&sel?.page===n.page?C.aL:C.white}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:34,height:34,borderRadius:8,background:"#FFFBEB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>✏️</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:13.5,color:C.navy}}>p.{n.page} 필기</div>
                      <div style={{fontSize:11,color:C.muted}}>{n.title} · {n.date}</div>
                    </div>
                  </div>
                  <span style={{color:C.muted}}>›</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <div style={{flex:1,padding:22,overflowY:"auto"}}>
        {sel?(
          sel._isNote?(
            <>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <div style={{width:46,height:46,borderRadius:10,background:"#FFFBEB",border:`1px solid ${C.yellow}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>✏️</div>
                <div><div style={{fontSize:17,fontWeight:900,color:C.navy}}>p.{sel.page} 필기</div><div style={{fontSize:12.5,color:C.muted}}>{sel.title} · {sel.date}</div></div>
              </div>
              <div style={{background:C.white,border:`2px solid ${C.border}`,borderRadius:10,padding:"15px 17px",marginBottom:12,boxShadow:"0 2px 8px rgba(27,37,96,0.05)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontWeight:700,fontSize:12,color:C.muted}}>✏️ 내 필기 원문</div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>{setEditMode(true);setEditText(sel.raw);}} style={{fontSize:11.5,border:`1px solid ${C.soft}`,borderRadius:5,padding:"3px 8px",cursor:"pointer",background:C.bg,color:C.navy,fontWeight:600}}>✏️ 수정</button>
                    <button onClick={()=>deleteNote(sel.page)} style={{fontSize:11.5,border:`1px solid ${C.red}`,borderRadius:5,padding:"3px 8px",cursor:"pointer",background:C.rL,color:C.red,fontWeight:600}}>🗑️ 삭제</button>
                  </div>
                </div>
                {editMode?(
                  <>
                    <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={5} style={{width:"100%",borderRadius:7,border:`1px solid ${C.soft}`,padding:"10px 12px",fontSize:13,lineHeight:1.7,resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <Btn primary small onClick={saveEdit} style={{flex:1}}>저장</Btn>
                      <Btn small onClick={()=>setEditMode(false)} style={{flex:1}}>취소</Btn>
                    </div>
                  </>
                ):(
                  <div style={{fontSize:13.5,lineHeight:1.8,whiteSpace:"pre-wrap",color:C.text}}>{sel.raw}</div>
                )}
              </div>
              {sel.ai&&(
                <div style={{background:C.aL,border:`2px solid ${C.soft}`,borderRadius:10,padding:"15px 17px"}}>
                  <div style={{fontWeight:700,fontSize:12,marginBottom:8,color:C.accent}}>🤖 AI 정리본</div>
                  <div style={{fontSize:13.5,lineHeight:1.8,whiteSpace:"pre-wrap",color:C.navy}}>{sel.ai}</div>
                </div>
              )}
            </>
          ):sel._isExam?(
            <>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <div style={{width:46,height:46,borderRadius:10,background:C.yL,border:`1px solid ${C.yellow}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>⭐</div>
                <div><div style={{fontSize:17,fontWeight:900,color:C.navy}}>{sel.title}</div><div style={{fontSize:12.5,color:C.muted}}>p.{sel.page} · 시험 출제 가능성 표시 · {sel.date}</div></div>
              </div>
              <div style={{background:C.yL,border:`2px solid ${C.yellow}`,borderRadius:10,padding:"14px 17px",marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:13,color:C.navy,marginBottom:6}}>⭐ 시험 출제 가능성 높은 페이지</div>
                <div style={{fontSize:13,color:C.text,lineHeight:1.7}}>이 페이지를 시험 출제 가능성이 높다고 표시했어요.<br/>PDF로 이동해서 핵심 내용을 다시 확인해보세요.</div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <Btn primary style={{flex:1}} onClick={()=>onGoToPdf&&onGoToPdf(sel.page)}>📄 PDF로 이동</Btn>
                <Btn style={{flex:1}} onClick={()=>onGoToQuiz&&onGoToQuiz()}>↺ 퀴즈 풀기</Btn>
              </div>
            </>
          ):(
            <>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <div style={{width:46,height:46,borderRadius:10,background:C.rL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>❌</div>
                <div><div style={{fontSize:17,fontWeight:900,color:C.navy}}>{sel.concept}</div><div style={{fontSize:12.5,color:C.muted}}>관련 PDF p.{sel.page}</div></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                {[{l:"오답 횟수",v:`${sel.count}회`,c:C.red},{l:"마지막 오답",v:sel.date,c:C.muted}].map(s=>(
                  <div key={s.l} style={{background:C.white,border:`2px solid ${C.border}`,borderRadius:8,padding:"11px 14px",boxShadow:"0 2px 6px rgba(27,37,96,0.05)"}}>
                    <div style={{fontSize:11.5,color:C.muted,marginBottom:3,fontWeight:600}}>{s.l}</div>
                    <div style={{fontWeight:900,fontSize:17,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:10}}>
                <Btn primary style={{flex:1}} onClick={()=>onGoToQuiz&&onGoToQuiz()}>↺ 퀴즈 풀기</Btn>
              </div>
            </>
          )
        ):<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:C.muted,fontSize:14}}>왼쪽에서 항목을 선택하세요.</div>}
      </div>
    </div>
  );
}

function StudyView({bookId,book,setPage,pdfUrl}){
  const [tab,setTab]=useState("pdf");
  const [rl,setRl]=useState(1);
  const [notes,setNotes]=useState({});
  const [weak,setWeak]=useState({});
  const [sqlCode,setSqlCode]=useState("");
  const [pdfPageIndex,setPdfPageIndex]=useState(0); // lift up: PDF page state survives tab switches
  const [libraryMetaReady,setLibraryMetaReady]=useState(false);
  const noteCount=useMemo(()=>Object.entries(notes||{}).filter(([k,v])=>k.startsWith(`${book}:`)&&v?.raw).length,[notes,book]);
  const weakCount=useMemo(()=>Object.values(weak||{}).filter(v=>!v?.book||v.book===book).length,[weak,book]);
  useEffect(()=>{
    (async()=>{
      try{
        const n=await window.storage.get("notes").catch(()=>null);
        const w=await window.storage.get("weak").catch(()=>null);
        if(n)setNotes(JSON.parse(n.value));
        if(w)setWeak(JSON.parse(w.value));
      }catch(e){}
    })();
  },[]);
  useEffect(()=>{
    let cancelled=false;
    setLibraryMetaReady(false);
    (async()=>{
      const books=await readStoredLibrary();
      const stored=findStoredBook(books,{bookId,fn:book});
      if(cancelled)return;
      if(stored){
        setRl(Number(stored.rl||1));
        setPdfPageIndex(Math.max(0,Number(stored.lastPage||1)-1));
      }
      setLibraryMetaReady(true);
    })();
    return()=>{cancelled=true;};
  },[bookId,book]);
  useEffect(()=>{
    if(!book||!libraryMetaReady)return;
    const total=isJoinLecture(book)?34:36;
    const lastPage=pdfPageIndex+1;
    const pct=Math.max(0,Math.min(100,Math.round((lastPage/total)*100)));
    updateStoredBookMeta({bookId,fn:book},{
      lastPage,
      total,
      pct,
      rl:Number(rl),
      notes:noteCount,
      weak:weakCount,
      lastStudy:new Date().toLocaleDateString("ko-KR"),
    }).catch(()=>{});
  },[bookId,book,libraryMetaReady,pdfPageIndex,rl,noteCount,weakCount]);
  const tabs=[{k:"pdf",icon:"📄",l:"PDF 학습"},{k:"sql",icon:"🔬",l:"SQL · ERD 실습"},{k:"quiz",icon:"❓",l:"퀴즈"},{k:"weak",icon:"📋",l:"약점 노트"}];
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{height:58,background:C.white,borderBottom:`2px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 22px",gap:14,flexShrink:0}}>
        <button onClick={()=>setPage("library")} style={{background:"none",border:"none",color:C.navy,cursor:"pointer",fontSize:13.5,fontWeight:700}}>← 서재</button>
        <span style={{fontWeight:900,fontSize:17,color:C.navy}}>QueryNote AI</span>
        <span style={{fontSize:12,color:C.navy,background:C.aL,padding:"4px 11px",borderRadius:14,fontWeight:700,border:`1px solid ${C.soft}`}}>{book}</span>
        <div style={{flex:1}}/>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:C.muted,fontWeight:600}}>회독</span>
          <select value={rl} onChange={e=>setRl(Number(e.target.value))} style={{height:30,fontSize:12,borderRadius:7,border:`2px solid ${C.soft}`,padding:"0 10px",background:C.white,color:C.navy,fontWeight:700}}>
            <option value={1}>1회독 · 개념 잡기</option>
            <option value={2}>2회독 · 적용하기</option>
            <option value={3}>3회독+ · 심화 점검</option>
          </select>
        </div>
        <Btn primary color={C.red} small>로그아웃</Btn>
      </div>
      <div style={{display:"flex",gap:4,borderBottom:`2px solid ${C.soft}`,background:C.white,padding:"10px 22px 0"}}>
        {tabs.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{minWidth:135,padding:"10px 16px",fontSize:13.5,fontWeight:800,color:C.navy,border:`2px solid ${tab===t.k?C.accent:C.soft}`,borderBottom:tab===t.k?`2px solid ${C.white}`:`2px solid ${C.soft}`,borderRadius:"8px 8px 0 0",background:tab===t.k?C.aL:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:-2}}>
            {t.icon} {t.l}
          </button>
        ))}
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {tab==="pdf"&&<PDFTab rl={rl} notes={notes} setNotes={setNotes} setSql={(c)=>{setSqlCode(`${c}\n-- ${Date.now()}`);setTab("sql");}} book={book} pdfUrl={pdfUrl} pi={pdfPageIndex} setPi={setPdfPageIndex}/>}
        {tab==="sql"&&<SQLTab injected={sqlCode}/>}
        {tab==="quiz"&&<QuizTab rl={rl} setWeak={setWeak} book={book} pdfUrl={pdfUrl}/>}
        {tab==="weak"&&<WeakTab weak={weak} notes={notes} setNotes={setNotes} book={book}
  onGoToPdf={(page)=>{
    const idx=Number(page)>0?Number(page)-1:PAGES.findIndex(p=>p.page===page);
    if(idx>=0)setPdfPageIndex(idx);
    setTab("pdf");
  }}
  onGoToSql={()=>setTab("sql")}
  onGoToQuiz={()=>setTab("quiz")}
/>}
      </div>
    </div>
  );
}

export default function App(){
  const [page,setPage]=useState("home");
  const [book,setBook]=useState("L9_sql1.pdf");
  const [bookId,setBookId]=useState(null);
  const [pdfUrl,setPdfUrl]=useState("");
  const isStudy=page==="study";
  return(
    <div style={{display:"flex",height:"100vh",fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',color:C.text,overflow:"hidden",background:C.bg}}>
      <Sidebar page={page} setPage={setPage}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {!isStudy&&<TopBar sub={null}/>}
        {page==="home"&&<HomeView setPage={setPage}/>}
        {page==="library"&&<LibraryView setPage={setPage} setBook={setBook} setBookId={setBookId} setPdfUrl={setPdfUrl}/>}
        {page==="upload"&&<UploadView setPage={setPage} setBook={setBook} setBookId={setBookId} setPdfUrl={setPdfUrl} refreshLibrary={()=>{}}/>}
        {page==="study"&&<StudyView bookId={bookId} book={book} setPage={setPage} pdfUrl={pdfUrl}/>}
      </div>
    </div>
  );
}
