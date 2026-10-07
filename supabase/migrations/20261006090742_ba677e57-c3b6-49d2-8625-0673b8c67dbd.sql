CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  login_id text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT '학생',
  grade text NOT NULL DEFAULT '중1',
  current_unit text NOT NULL DEFAULT '일차방정식',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  textbook text NOT NULL,
  page int NOT NULL,
  problem_no text NOT NULL,
  unit text,
  case_status text NOT NULL DEFAULT 'PROCESSING',
  evaluated_count int NOT NULL DEFAULT 0,
  help_requested boolean NOT NULL DEFAULT false,
  help_message text,
  problem_image_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cases_student_idx ON public.cases(student_id, updated_at DESC);
GRANT SELECT ON public.cases TO authenticated;
GRANT ALL ON public.cases TO service_role;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cases" ON public.cases FOR SELECT TO authenticated USING (auth.uid() = student_id);

CREATE TABLE public.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  attempt_index int NOT NULL,
  job_status text NOT NULL DEFAULT 'QUEUED',
  verdict text,
  reason_codes text[] NOT NULL DEFAULT '{}',
  work_image_paths text[] NOT NULL DEFAULT '{}',
  recognized_lines jsonb NOT NULL DEFAULT '[]',
  first_error_line_id text,
  error_label text,
  student_message text,
  revealed_level int NOT NULL DEFAULT 0,
  hint_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX attempts_case_idx ON public.attempts(case_id, attempt_index);
GRANT SELECT ON public.attempts TO authenticated;
GRANT ALL ON public.attempts TO service_role;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts" ON public.attempts FOR SELECT TO authenticated USING (auth.uid() = student_id);

-- Private AI outputs (answers, hints). Never readable by students.
CREATE TABLE public.attempt_private (
  attempt_id uuid PRIMARY KEY REFERENCES public.attempts(id) ON DELETE CASCADE,
  diag_a jsonb,
  solve_b jsonb,
  check_c jsonb,
  hints jsonb NOT NULL DEFAULT '[]',
  decision jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.attempt_private TO service_role;
ALTER TABLE public.attempt_private ENABLE ROW LEVEL SECURITY;