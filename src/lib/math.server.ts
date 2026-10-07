// Exact rational comparator for 정수·유리수 / 일차방정식 해 (상세서 §11.4). No eval.
type Q = { n: bigint; d: bigint };
const LIMIT = 10n ** 12n;

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}
function norm(q: Q): Q {
  if (q.d === 0n) throw new Error("DIV0");
  if (q.d < 0n) q = { n: -q.n, d: -q.d };
  const g = gcd(q.n, q.d) || 1n;
  const r = { n: q.n / g, d: q.d / g };
  if ((r.n < 0n ? -r.n : r.n) > LIMIT || r.d > 1000000n) throw new Error("LIMIT");
  return r;
}
const add = (a: Q, b: Q) => norm({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
const sub = (a: Q, b: Q) => norm({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });
const mul = (a: Q, b: Q) => norm({ n: a.n * b.n, d: a.d * b.d });
const div = (a: Q, b: Q) => norm({ n: a.n * b.d, d: a.d * b.n });

export function canonicalize(s: string): string {
  return s
    .replace(/[−–—]/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, "")
    .replace(/^(답|정답|해)[:：]?/, "");
}

function parseNumberExpr(src: string): Q {
  let i = 0;
  let nodes = 0;
  const peek = () => src[i];
  const expr = (): Q => {
    let v = term();
    while (peek() === "+" || peek() === "-") {
      const op = src[i++];
      v = op === "+" ? add(v, term()) : sub(v, term());
    }
    return v;
  };
  const term = (): Q => {
    let v = factor();
    while (peek() === "*" || peek() === "/") {
      const op = src[i++];
      v = op === "*" ? mul(v, factor()) : div(v, factor());
    }
    return v;
  };
  const factor = (): Q => {
    if (++nodes > 200) throw new Error("LIMIT");
    if (peek() === "-") {
      i++;
      const f = factor();
      return { n: -f.n, d: f.d };
    }
    if (peek() === "+") {
      i++;
      return factor();
    }
    if (peek() === "(") {
      i++;
      const v = expr();
      if (src[i++] !== ")") throw new Error("PARSE");
      return v;
    }
    const m = /^\d+(\.\d+)?/.exec(src.slice(i));
    if (!m) throw new Error("PARSE");
    i += m[0].length;
    const [a, b = ""] = m[0].split(".");
    return norm({ n: BigInt(a + b), d: 10n ** BigInt(b.length) });
  };
  const v = expr();
  if (i !== src.length) throw new Error("PARSE");
  return v;
}

/** Parse "x=4", "4", "-3/2", "x=(1/2)" → rational value, or null if unsupported. */
export function parseAnswer(raw: string | null | undefined): Q | null {
  if (!raw) return null;
  let s = canonicalize(raw);
  if (s.includes("=")) {
    const parts = s.split("=");
    if (parts.length !== 2) return null;
    const l = parts[0] ?? "",
      r = parts[1] ?? "";
    if (/^[a-z]$/i.test(l)) s = r;
    else if (/^[a-z]$/i.test(r)) s = l;
    else return null;
  }
  try {
    return parseNumberExpr(s);
  } catch {
    return null;
  }
}

export type Equivalence = "EQUIVALENT" | "DIFFERENT" | "UNKNOWN";
export function compareAnswers(a: string | null, b: string | null): Equivalence {
  const qa = parseAnswer(a);
  const qb = parseAnswer(b);
  if (!qa || !qb) return "UNKNOWN";
  return qa.n === qb.n && qa.d === qb.d ? "EQUIVALENT" : "DIFFERENT";
}

/** Representations of the answer that must never appear in a hint. */
export function answerForms(raw: string | null): string[] {
  const q = parseAnswer(raw);
  if (!q) return [];
  const forms = new Set<string>();
  if (q.d === 1n) forms.add(q.n.toString());
  else {
    forms.add(`${q.n}/${q.d}`);
    const dec = Number(q.n) / Number(q.d);
    if (Number.isFinite(dec)) forms.add(String(dec));
  }
  return [...forms];
}

export function hintLeaks(hint: string, answer: string | null): boolean {
  const h = canonicalize(hint);
  if (/[a-z]=-?\d/i.test(h)) return true;
  for (const f of answerForms(answer)) {
    const esc = f.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
    if (new RegExp(`(^|[^\\d./])${esc}($|[^\\d./])`).test(h)) return true;
  }
  return false;
}
