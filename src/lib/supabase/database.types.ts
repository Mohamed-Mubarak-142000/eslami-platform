// Mirrors supabase/migrations/*.sql. Regenerate with `npx supabase gen types typescript --linked`
// once the Supabase CLI is linked to the project, and keep this file in sync with migrations.

type Timestamp = string;

type TableDef<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type AppRole = "user" | "admin";
export type LearnerKind = "self" | "child";
export type GameKind = "letters" | "tajweed" | "arrange" | "quiz";
export type ExamStatus = "in_progress" | "passed" | "failed" | "expired";

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string;
  certificate_name: string;
  role: AppRole;
  disabled: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};
export type LearnerRow = {
  id: string;
  owner_id: string;
  kind: LearnerKind;
  display_name: string;
  birth_year: number | null;
  created_at: Timestamp;
};
export type MemorizedAyahRow = {
  learner_id: string;
  surah: number;
  ayah: number;
  memorized_at: Timestamp;
};
export type ReviewScheduleRow = {
  learner_id: string;
  surah: number;
  interval_index: number;
  last_reviewed_at: Timestamp;
  due_at: Timestamp;
};
export type ReadingPositionRow = {
  learner_id: string;
  surah: number;
  surah_name: string;
  page: number;
  updated_at: Timestamp;
};
export type ActivityDayRow = {
  learner_id: string;
  day: string;
};
export type GameSessionRow = {
  id: number;
  learner_id: string;
  game: GameKind;
  surah: number | null;
  score: number;
  total: number;
  stars: number | null;
  moves: number | null;
  created_at: Timestamp;
};
export type ListenCompletionRow = {
  learner_id: string;
  surah: number;
  completed_at: Timestamp;
};
export type LearnerBadgeRow = {
  learner_id: string;
  badge_id: string;
  unlocked_at: Timestamp;
};
export type TasmeeSessionRow = {
  id: number;
  learner_id: string;
  surah: number;
  ayah_from: number;
  ayah_to: number;
  correct: number;
  mistakes: number;
  created_at: Timestamp;
};
export type AppSettingsRow = {
  id: boolean;
  exam_question_count: number;
  exam_pass_percent: number;
  exam_minutes: number;
  retry_cooldown_hours: number;
  updated_at: Timestamp;
};
export type ExamAttemptRow = {
  id: string;
  learner_id: string;
  juz: number;
  questions: unknown;
  answers: unknown;
  score: number | null;
  total: number;
  status: ExamStatus;
  started_at: Timestamp;
  expires_at: Timestamp;
  submitted_at: Timestamp | null;
};
export type OtpPurpose = "signup" | "recovery" | "email";
export type EmailOtpRow = {
  email: string;
  purpose: OtpPurpose;
  code_hash: string;
  attempts: number;
  created_at: Timestamp;
  expires_at: Timestamp;
};
export type KidsStoryRow = {
  id: string;
  title: string;
  prophet: string | null;
  youtube_id: string;
  summary: string;
  lesson: string;
  sort_order: number;
  published: boolean;
  created_at: Timestamp;
};
export type StoryViewRow = {
  learner_id: string;
  story_id: string;
  watched_at: Timestamp;
};
export type ExamAnswerKeyRow = {
  attempt_id: string;
  key: unknown;
};
export type CertificateRow = {
  id: string;
  learner_id: string;
  juz: number;
  holder_name: string;
  score: number;
  total: number;
  exam_attempt_id: string | null;
  verification_code: string;
  issued_at: Timestamp;
  revoked_at: Timestamp | null;
};

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      profiles: TableDef<
        ProfileRow,
        Optional<ProfileRow, "email" | "full_name" | "certificate_name" | "role" | "disabled" | "created_at" | "updated_at">
      >;
      learners: TableDef<LearnerRow, Optional<LearnerRow, "id" | "birth_year" | "created_at">>;
      memorized_ayahs: TableDef<MemorizedAyahRow, Optional<MemorizedAyahRow, "memorized_at">>;
      review_schedule: TableDef<ReviewScheduleRow, Optional<ReviewScheduleRow, "interval_index" | "last_reviewed_at">>;
      reading_position: TableDef<ReadingPositionRow, Optional<ReadingPositionRow, "surah_name" | "updated_at">>;
      activity_days: TableDef<ActivityDayRow, ActivityDayRow>;
      game_sessions: TableDef<
        GameSessionRow,
        Optional<GameSessionRow, "id" | "surah" | "score" | "total" | "stars" | "moves" | "created_at">
      >;
      listen_completions: TableDef<ListenCompletionRow, Optional<ListenCompletionRow, "completed_at">>;
      learner_badges: TableDef<LearnerBadgeRow, Optional<LearnerBadgeRow, "unlocked_at">>;
      tasmee_sessions: TableDef<TasmeeSessionRow, Optional<TasmeeSessionRow, "id" | "correct" | "mistakes" | "created_at">>;
      app_settings: TableDef<AppSettingsRow, Partial<AppSettingsRow>>;
      exam_attempts: TableDef<
        ExamAttemptRow,
        Optional<ExamAttemptRow, "id" | "answers" | "score" | "status" | "started_at" | "submitted_at">
      >;
      exam_answer_keys: TableDef<ExamAnswerKeyRow, ExamAnswerKeyRow>;
      kids_stories: TableDef<
        KidsStoryRow,
        Optional<KidsStoryRow, "id" | "prophet" | "summary" | "lesson" | "sort_order" | "published" | "created_at">
      >;
      story_views: TableDef<StoryViewRow, Optional<StoryViewRow, "watched_at">>;
      email_otps: TableDef<EmailOtpRow, Optional<EmailOtpRow, "attempts" | "created_at">>;
      certificates: TableDef<CertificateRow, Optional<CertificateRow, "id" | "exam_attempt_id" | "issued_at" | "revoked_at">>;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      owns_learner: { Args: { target: string }; Returns: boolean };
      verify_certificate: {
        Args: { code: string };
        Returns: { holder_name: string; juz: number; score: number; total: number; issued_at: Timestamp; revoked: boolean }[];
      };
    };
    Enums: { app_role: AppRole };
    CompositeTypes: { [_ in never]: never };
  };
};
