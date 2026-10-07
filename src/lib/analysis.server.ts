// AI analysis pipeline: A(진단) ∥ B(독립 풀이) → C(오류 확인) → 서버 공개 결정 (상세서 §11).
import { callJson, AiError } from "./ai.server";
import { compareAnswers, hintLeaks } from "./math.server";

type Line = { lineId: string; text: string };
type DiagA = {
  problem_text: string;
  critical_ambiguity: boolean;
  multiple_problems: boolean;
  insufficient_work: boolean;
  lines: Line[];
  verdict: "CORRECT" | "INCORRECT" | "UNDETERMINED";
  first_error_line_id: string | null;
  error_type: string | null;
  error_label: string | null;
  concept: string | null;
  candidate_answer: string | null;
  student_final_answer: string | null;
  concise_evidence: string;
  hints: string[];
};
type SolveB = {
  problem_text: string;
  problem_readable: boolean;
  supported_type: boolean;
  answer: string | null;
  verification: string;
};
type CheckC = {
  result: "NO_ERROR" | "FIRST_ERROR" | "UNKNOWN";
  first_error_line_id: string | null;
  error_type: string | null;
  target_completed: boolean;
};

const nullableStr = { type: ["string", "null"] };

const schemaA = {
  type: "object",
  additionalProperties: false,
  required: [
    "problem_text",
    "critical_ambiguity",
    "multiple_problems",
    "insufficient_work",
    "lines",
    "verdict",
    "first_error_line_id",
    "error_type",
    "error_label",
    "concept",
    "candidate_answer",
    "student_final_answer",
    "concise_evidence",
    "hints",
  ],
  properties: {
    problem_text: { type: "string" },
    critical_ambiguity: { type: "boolean" },
    multiple_problems: { type: "boolean" },
    insufficient_work: { type: "boolean" },
    lines: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["lineId", "text"],
        properties: { lineId: { type: "string" }, text: { type: "string" } },
      },
    },
    verdict: { type: "string", enum: ["CORRECT", "INCORRECT", "UNDETERMINED"] },
    first_error_line_id: nullableStr,
    error_type: nullableStr,
    error_label: nullableStr,
    concept: nullableStr,
    candidate_answer: nullableStr,
    student_final_answer: nullableStr,
    concise_evidence: { type: "string" },
    hints: { type: "array", items: { type: "string" } },
  },
};

const schemaB = {
  type: "object",
  additionalProperties: false,
  required: ["problem_text", "problem_readable", "supported_type", "answer", "verification"],
  properties: {
    problem_text: { type: "string" },
    problem_readable: { type: "boolean" },
    supported_type: { type: "boolean" },
    answer: nullableStr,
    verification: { type: "string" },
  },
};

const schemaC = {
  type: "object",
  additionalProperties: false,
  required: ["result", "first_error_line_id", "error_type", "target_completed"],
  properties: {
    result: { type: "string", enum: ["NO_ERROR", "FIRST_ERROR", "UNKNOWN"] },
    first_error_line_id: nullableStr,
    error_type: nullableStr,
    target_completed: { type: "boolean" },
  },
};

const PROMPT_A = `너는 중학생 수학 손글씨 풀이 진단기다(P-DIAG-1).
첫 이미지는 문제, 나머지는 학생 풀이다.
- 학생 풀이를 위에서 아래로 줄 단위로 읽어 lines에 L01, L02 … 순서로 기록한다. 학생이 쓰지 않은 중간식은 추가하지 않는다. 읽을 수 없는 글자는 [읽기 어려움]으로 쓴다.
- 부호·지수·분모·등호 등 핵심 기호가 모호하면 critical_ambiguity=true.
- 한 사진에 여러 문제가 있으면 multiple_problems=true. 최종 답만 있고 풀이가 없으면 insufficient_work=true.
- verdict: 모든 줄이 수학적으로 유효하고 목표를 완료했을 때만 CORRECT. 최종 답이 맞아도 풀이 중 오류가 있으면 INCORRECT. 확신이 없으면 UNDETERMINED.
- first_error_line_id: 처음 오류가 생긴 줄. 이후 연쇄 오류는 포함하지 않는다.
- error_label: 학생에게 보여 줄 짧은 오류 위치 설명(정답·계산 결과 포함 금지, 30자 이내). 예: "이항할 때 부호".
- candidate_answer: 문제의 정답을 'x=4' 또는 '-3/2' 형식으로. student_final_answer: 학생이 쓴 최종 답 같은 형식, 없으면 null.
- hints: INCORRECT일 때만 3개. H1(100자 이내): 오류 줄 위치와 질문. H2(140자 이내): 필요한 일반 원리. H3(180자 이내): 학생이 할 다음 행동 한 단계. 어떤 힌트에도 정답·정답의 숫자·계산 결과·완성 풀이를 쓰지 않는다. 존댓말 '~해요' 체. 오답이 아니면 빈 배열.
- concise_evidence: 교사용 근거 300자 이내.`;

const PROMPT_B = `너는 독립 풀이기다(P-SOLVE-1). 이미지는 문제 영역만이다. 학생 풀이는 없다.
문제를 스스로 읽고 풀어라. supported_type은 '정수·유리수 계수 일차방정식(미지수 1개)' 또는 단순 유리수 계산일 때만 true.
answer는 'x=4' 또는 '-3/2' 형식(소수 대신 기약분수). 문제를 읽을 수 없으면 problem_readable=false, answer=null. verification은 검산 한 줄.`;

const PROMPT_C = `너는 풀이 오류 확인기다(P-ERRORCHECK-1). 문제·기준 답·학생 풀이 줄이 주어진다.
학생 줄을 순서대로 검사해 등식이 유지되지 않는 첫 줄을 찾는다. 오류가 없고 목표(해 구하기)를 완료했으면 NO_ERROR. 판단할 수 없으면 UNKNOWN.
target_completed는 학생이 최종 답까지 도달했는지.`;

export type Decision = {
  jobStatus: "SUCCEEDED" | "FAILED";
  verdict: "CORRECT" | "INCORRECT" | "UNREADABLE" | "UNDETERMINED";
  reasonCodes: string[];
  released: boolean;
  lines: Line[];
  firstErrorLineId: string | null;
  errorLabel: string | null;
  studentMessage: string;
  hints: string[];
  diagA?: DiagA | undefined;
  solveB?: SolveB | undefined;
  checkC?: CheckC | undefined;
};

const HINT_MAX = [100, 140, 180];

export async function analyze(problemImg: string, workImgs: string[]): Promise<Decision> {
  const [a, b] = await Promise.all([
    callJson<DiagA>({
      name: "diagnosis",
      instructions: PROMPT_A,
      schema: schemaA,
      content: [
        { type: "input_text", text: "문제 이미지:" },
        { type: "input_image", image_url: problemImg },
        { type: "input_text", text: "학생 풀이 이미지:" },
        ...workImgs.map((u) => ({ type: "input_image" as const, image_url: u })),
      ],
    }),
    callJson<SolveB>({
      name: "solve",
      instructions: PROMPT_B,
      schema: schemaB,
      content: [{ type: "input_image", image_url: problemImg }],
    }),
  ]);

  const lines = (a.lines ?? []).slice(0, 40).map((l) => ({
    lineId: String(l.lineId).slice(0, 4),
    text: String(l.text).slice(0, 300),
  }));
  const base = {
    lines,
    diagA: a,
    solveB: b,
    hints: [] as string[],
    firstErrorLineId: null,
    errorLabel: null,
  };

  const hold = (verdict: Decision["verdict"], code: string, msg: string, c?: CheckC): Decision => ({
    ...base,
    checkC: c,
    jobStatus: "SUCCEEDED",
    verdict,
    reasonCodes: [code],
    released: false,
    studentMessage: msg,
  });

  if (a.critical_ambiguity || !b.problem_readable)
    return hold("UNREADABLE", "OCR_AMBIGUOUS", "글씨를 더 잘 보이게 찍어 주세요");
  if (a.multiple_problems)
    return hold("UNDETERMINED", "PROBLEM_INCOMPLETE", "선생님이 확인하고 있어요");
  if (a.insufficient_work || lines.length === 0)
    return hold("UNDETERMINED", "INSUFFICIENT_WORK", "어떻게 풀었는지 풀이도 올려 주세요");
  if (!b.supported_type)
    return hold("UNDETERMINED", "UNSUPPORTED_TYPE", "선생님이 확인하고 있어요");

  const ab = compareAnswers(a.candidate_answer, b.answer);
  if (ab !== "EQUIVALENT")
    return hold(
      "UNDETERMINED",
      ab === "DIFFERENT" ? "ANSWER_MISMATCH" : "EQUIVALENCE_UNKNOWN",
      "선생님이 확인하고 있어요",
    );

  const c = await callJson<CheckC>({
    name: "errorcheck",
    instructions: PROMPT_C,
    schema: schemaC,
    content: [
      {
        type: "input_text",
        text: `문제: ${b.problem_text}\n기준 답: ${b.answer}\n학생 풀이 줄:\n${lines
          .map((l) => `${l.lineId}: ${l.text}`)
          .join("\n")}`,
      },
    ],
  });

  const studentEq = compareAnswers(a.student_final_answer, b.answer);

  if (
    a.verdict === "CORRECT" &&
    c.result === "NO_ERROR" &&
    c.target_completed &&
    studentEq === "EQUIVALENT"
  ) {
    return {
      ...base,
      checkC: c,
      jobStatus: "SUCCEEDED",
      verdict: "CORRECT",
      reasonCodes: [],
      released: true,
      studentMessage: "풀이가 맞아요",
    };
  }

  if (
    a.verdict === "INCORRECT" &&
    c.result === "FIRST_ERROR" &&
    a.first_error_line_id &&
    a.first_error_line_id === c.first_error_line_id &&
    lines.some((l) => l.lineId === a.first_error_line_id)
  ) {
    const hints = (a.hints ?? []).slice(0, 3).map((h) => h.trim());
    const safe =
      hints.length === 3 &&
      hints.every(
        (h, i) => h.length > 0 && h.length <= (HINT_MAX[i] ?? 180) && !hintLeaks(h, b.answer),
      ) &&
      !hintLeaks(a.error_label ?? "", b.answer);
    if (!safe) return hold("UNDETERMINED", "HINT_LEAK_RISK", "선생님이 확인하고 있어요", c);
    const n = Number((a.first_error_line_id ?? "").replace(/\D/g, "")) || null;
    return {
      ...base,
      checkC: c,
      jobStatus: "SUCCEEDED",
      verdict: "INCORRECT",
      reasonCodes: studentEq === "EQUIVALENT" ? ["ANSWER_CORRECT_WORK_INVALID"] : [],
      released: true,
      hints,
      firstErrorLineId: a.first_error_line_id,
      errorLabel: `${n ? `${n}번째 줄` : "풀이"}${a.error_label ? ` · ${a.error_label}` : ""}`,
      studentMessage:
        studentEq === "EQUIVALENT"
          ? "답에 이르기 전 풀이를 다시 살펴봐요"
          : "이 부분을 다시 살펴봐요",
    };
  }

  return hold("UNDETERMINED", "ERROR_LOCATION_MISMATCH", "선생님이 확인하고 있어요", c);
}

export { AiError };
