import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_EVAL = 4;
const BUCKET = "submissions";
const dataUrl = z
  .string()
  .max(12 * 1024 * 1024)
  .regex(/^data:image\/(jpeg|png|webp);base64,/);

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

function decodeDataUrl(u: string) {
  const [head = "", b64 = ""] = u.split(",");
  const mime = head.slice(5, head.indexOf(";"));
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { mime, bytes };
}

function toDataUrl(bytes: Uint8Array, mime: string) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${mime};base64,${btoa(s)}`;
}

function notFound(): never {
  throw new Error("NOT_FOUND: 찾을 수 없거나 접근할 수 없는 기록이에요");
}

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (data) return data;
    const sb = await admin();
    const { data: u } = await sb.auth.admin.getUserById(context.userId);
    const meta = (u.user?.user_metadata ?? {}) as Record<string, string>;
    const row = {
      id: context.userId,
      login_id: meta["login_id"] ?? (u.user?.email ?? "").split("@")[0] ?? "",
      display_name: meta["display_name"] ?? "학생",
    };
    const { data: created, error } = await sb.from("profiles").upsert(row).select("*").single();
    if (error) throw new Error("프로필을 준비하지 못했어요");
    return created;
  });

export const listMyCases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: cases, error } = await context.supabase
      .from("cases")
      .select(
        "id,textbook,page,problem_no,unit,case_status,evaluated_count,help_requested,created_at,updated_at",
      )
      .eq("student_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error("기록을 불러오지 못했어요");
    const ids = (cases ?? []).map((c) => c.id);
    const { data: atts } = ids.length
      ? await context.supabase
          .from("attempts")
          .select("case_id,attempt_index,job_status,verdict,revealed_level")
          .in("case_id", ids)
      : { data: [] };
    return (cases ?? []).map((c) => {
      const mine = (atts ?? []).filter((a) => a.case_id === c.id);
      const latest = mine.sort((x, y) => y.attempt_index - x.attempt_index)[0];
      return {
        ...c,
        attemptCount: mine.length,
        maxHint: Math.max(0, ...mine.map((a) => a.revealed_level)),
        latestJob: latest?.job_status ?? null,
        latestVerdict: latest?.verdict ?? null,
      };
    });
  });

const submitSchema = z.object({
  textbook: z.string().trim().min(1).max(60),
  page: z.number().int().min(1).max(2000),
  problemNo: z.string().trim().min(1).max(20),
  unit: z.string().max(40).nullable(),
  problemImage: dataUrl,
  workImages: z.array(dataUrl).min(1).max(3),
});

export const createSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => submitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = await admin();
    const { count } = await sb
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("student_id", context.userId)
      .eq("case_status", "PROCESSING");
    if ((count ?? 0) > 0) throw new Error("진행 중인 분석을 확인해 주세요");

    const caseId = crypto.randomUUID();
    const attemptId = crypto.randomUUID();
    const root = `${context.userId}/${caseId}`;
    const p = decodeDataUrl(data.problemImage);
    const problemPath = `${root}/problem.jpg`;
    const up = await sb.storage.from(BUCKET).upload(problemPath, p.bytes, { contentType: p.mime });
    if (up.error) throw new Error("사진을 올리지 못했어요. 다시 시도해 주세요");
    const workPaths: string[] = [];
    for (const [i, w] of data.workImages.entries()) {
      const d = decodeDataUrl(w);
      const path = `${root}/${attemptId}/work-${i + 1}.jpg`;
      const r = await sb.storage.from(BUCKET).upload(path, d.bytes, { contentType: d.mime });
      if (r.error) throw new Error("사진을 올리지 못했어요. 다시 시도해 주세요");
      workPaths.push(path);
    }
    const { error: ce } = await sb.from("cases").insert({
      id: caseId,
      student_id: context.userId,
      textbook: data.textbook,
      page: data.page,
      problem_no: data.problemNo,
      unit: data.unit,
      problem_image_path: problemPath,
    });
    if (ce) throw new Error("제출을 저장하지 못했어요");
    await sb.from("attempts").insert({
      id: attemptId,
      case_id: caseId,
      student_id: context.userId,
      attempt_index: 1,
      work_image_paths: workPaths,
    });
    return { caseId, attemptId };
  });

export const createRetry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ caseId: z.string().uuid(), workImages: z.array(dataUrl).min(1).max(3) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: c } = await context.supabase
      .from("cases")
      .select("*")
      .eq("id", data.caseId)
      .maybeSingle();
    if (!c) notFound();
    if (c.case_status !== "RETRY_REQUIRED") throw new Error("지금은 다시 제출할 수 없어요");
    if (c.evaluated_count >= MAX_EVAL)
      throw new Error("여기까지 잘 시도했어요. 선생님과 함께 확인해요");
    const sb = await admin();
    const { data: last } = await sb
      .from("attempts")
      .select("attempt_index")
      .eq("case_id", c.id)
      .order("attempt_index", { ascending: false })
      .limit(1)
      .single();
    const attemptId = crypto.randomUUID();
    const workPaths: string[] = [];
    for (const [i, w] of data.workImages.entries()) {
      const d = decodeDataUrl(w);
      const path = `${context.userId}/${c.id}/${attemptId}/work-${i + 1}.jpg`;
      const r = await sb.storage.from(BUCKET).upload(path, d.bytes, { contentType: d.mime });
      if (r.error) throw new Error("사진을 올리지 못했어요. 다시 시도해 주세요");
      workPaths.push(path);
    }
    await sb.from("attempts").insert({
      id: attemptId,
      case_id: c.id,
      student_id: context.userId,
      attempt_index: (last?.attempt_index ?? 0) + 1,
      work_image_paths: workPaths,
    });
    await sb
      .from("cases")
      .update({ case_status: "PROCESSING", updated_at: new Date().toISOString() })
      .eq("id", c.id);
    return { caseId: c.id, attemptId };
  });

export const runAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ attemptId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: att } = await context.supabase
      .from("attempts")
      .select("*")
      .eq("id", data.attemptId)
      .maybeSingle();
    if (!att) notFound();
    const sb = await admin();
    const { data: claimed } = await sb
      .from("attempts")
      .update({ job_status: "ANALYZING", updated_at: new Date().toISOString() })
      .eq("id", att.id)
      .eq("job_status", "QUEUED")
      .select("id");
    if (!claimed?.length) return { started: false };

    const { data: c } = await sb.from("cases").select("*").eq("id", att.case_id).single();
    const fail = async (code: string) => {
      await sb
        .from("attempts")
        .update({
          job_status: "FAILED",
          reason_codes: [code],
          updated_at: new Date().toISOString(),
        })
        .eq("id", att.id);
      await sb
        .from("cases")
        .update({ case_status: "WAITING_TEACHER", updated_at: new Date().toISOString() })
        .eq("id", att.case_id);
    };
    try {
      const load = async (path: string) => {
        const { data: blob, error } = await sb.storage.from(BUCKET).download(path);
        if (error || !blob) throw new Error("download");
        return toDataUrl(new Uint8Array(await blob.arrayBuffer()), blob.type || "image/jpeg");
      };
      const problemImg = await load(c!.problem_image_path);
      const work = await Promise.all(att.work_image_paths.map(load));
      const { analyze } = await import("./analysis.server");
      const d = await analyze(problemImg, work);

      const counted = d.verdict === "CORRECT" || d.verdict === "INCORRECT";
      const evaluated = c!.evaluated_count + (counted ? 1 : 0);
      let caseStatus = "WAITING_TEACHER";
      let message = d.studentMessage;
      if (d.released && d.verdict === "CORRECT") caseStatus = "RESOLVED";
      else if (d.released && d.verdict === "INCORRECT") {
        if (evaluated < MAX_EVAL) caseStatus = "RETRY_REQUIRED";
        else message = "여기까지 잘 시도했어요. 선생님과 함께 확인해요";
      }
      const now = new Date().toISOString();
      await sb.from("attempt_private").upsert({
        attempt_id: att.id,
        diag_a: d.diagA ?? null,
        solve_b: d.solveB ?? null,
        check_c: d.checkC ?? null,
        hints: d.released ? d.hints : [],
        decision: { verdict: d.verdict, reasonCodes: d.reasonCodes, released: d.released },
      });
      await sb
        .from("attempts")
        .update({
          job_status: "SUCCEEDED",
          verdict: d.verdict,
          reason_codes: d.reasonCodes,
          recognized_lines: d.lines,
          first_error_line_id: d.released ? d.firstErrorLineId : null,
          error_label: d.released ? d.errorLabel : null,
          student_message: message,
          hint_count: d.released ? d.hints.length : 0,
          updated_at: now,
        })
        .eq("id", att.id);
      await sb
        .from("cases")
        .update({ case_status: caseStatus, evaluated_count: evaluated, updated_at: now })
        .eq("id", c!.id);
      return { started: true };
    } catch (e) {
      console.error("analysis failed", e);
      const msg = e instanceof Error ? e.message : "";
      await fail(msg === "MODEL_REFUSAL" || msg === "SCHEMA_INVALID" ? msg : "ANALYSIS_FAILED");
      return { started: true };
    }
  });

export const getCaseView = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ caseId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: c } = await context.supabase
      .from("cases")
      .select("*")
      .eq("id", data.caseId)
      .maybeSingle();
    if (!c) notFound();
    const { data: atts } = await context.supabase
      .from("attempts")
      .select("*")
      .eq("case_id", c.id)
      .order("attempt_index", { ascending: true });
    const sb = await admin();
    // Stale job guard: >10 min → FAILED
    for (const a of atts ?? []) {
      if (
        (a.job_status === "ANALYZING" || a.job_status === "QUEUED") &&
        Date.now() - Date.parse(a.updated_at) > 10 * 60_000
      ) {
        await sb
          .from("attempts")
          .update({ job_status: "FAILED", reason_codes: ["TIMEOUT"] })
          .eq("id", a.id);
        await sb.from("cases").update({ case_status: "WAITING_TEACHER" }).eq("id", c.id);
        a.job_status = "FAILED";
        c.case_status = "WAITING_TEACHER";
      }
    }
    const ids = (atts ?? []).map((a) => a.id);
    const { data: priv } = ids.length
      ? await sb.from("attempt_private").select("attempt_id,hints").in("attempt_id", ids)
      : { data: [] };
    const sign = async (p: string) =>
      (await sb.storage.from(BUCKET).createSignedUrl(p, 600)).data?.signedUrl ?? null;
    const latestIdx = Math.max(0, ...(atts ?? []).map((a) => a.attempt_index));
    const attempts = await Promise.all(
      (atts ?? []).map(async (a) => {
        const hints =
          ((priv ?? []).find((p) => p.attempt_id === a.id)?.hints as string[] | undefined) ?? [];
        const isLatest = a.attempt_index === latestIdx;
        // Explicit allowlist DTO — never return private fields.
        return {
          attemptId: a.id,
          attemptIndex: a.attempt_index,
          jobStatus: a.job_status,
          verdict: a.verdict,
          reasonCodes: a.reason_codes,
          message: a.student_message,
          lines: a.recognized_lines as { lineId: string; text: string }[],
          errorLineId: a.first_error_line_id,
          errorLabel: a.error_label,
          revealedHints: hints
            .slice(0, a.revealed_level)
            .map((text, i) => ({ level: i + 1, text })),
          revealedLevel: a.revealed_level,
          canRevealNextHint:
            isLatest &&
            a.verdict === "INCORRECT" &&
            a.revealed_level < a.hint_count &&
            !c.help_requested,
          workImages: await Promise.all(a.work_image_paths.map(sign)),
          createdAt: a.created_at,
        };
      }),
    );
    return {
      caseId: c.id,
      textbook: c.textbook,
      page: c.page,
      problemNo: c.problem_no,
      unit: c.unit,
      caseStatus: c.case_status,
      evaluatedCount: c.evaluated_count,
      maxEval: MAX_EVAL,
      helpRequested: c.help_requested,
      problemImage: await sign(c.problem_image_path),
      canResubmit:
        c.case_status === "RETRY_REQUIRED" && c.evaluated_count < MAX_EVAL && !c.help_requested,
      canAskTeacher:
        !c.help_requested && c.case_status !== "RESOLVED" && c.case_status !== "TEACHER_CLOSED",
      attempts,
    };
  });

export const revealHint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ attemptId: z.string().uuid(), level: z.number().int().min(1).max(3) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: a } = await context.supabase
      .from("attempts")
      .select("*")
      .eq("id", data.attemptId)
      .maybeSingle();
    if (!a) notFound();
    if (data.level <= a.revealed_level) return { ok: true };
    if (
      data.level !== a.revealed_level + 1 ||
      data.level > a.hint_count ||
      a.verdict !== "INCORRECT"
    )
      throw new Error("힌트는 순서대로 열 수 있어요");
    const sb = await admin();
    await sb
      .from("attempts")
      .update({ revealed_level: data.level })
      .eq("id", a.id)
      .eq("revealed_level", a.revealed_level);
    return { ok: true };
  });

export const askTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ caseId: z.string().uuid(), message: z.string().trim().max(300) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: c } = await context.supabase
      .from("cases")
      .select("id")
      .eq("id", data.caseId)
      .maybeSingle();
    if (!c) notFound();
    const sb = await admin();
    await sb
      .from("cases")
      .update({
        help_requested: true,
        help_message: data.message || null,
        case_status: "WAITING_TEACHER",
        updated_at: new Date().toISOString(),
      })
      .eq("id", c.id);
    return { ok: true };
  });
