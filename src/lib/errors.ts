export type ErrorKind = "unauthenticated" | "forbidden" | "not_found" | "conflict" | "validation" | "rate_limited" | "server" | "network";
export interface AppError { kind: ErrorKind; code: string; message: string; retryable: boolean }
const messages: Record<ErrorKind, string> = { unauthenticated: "يلزم تسجيل الدخول.", forbidden: "لا تملك صلاحية تنفيذ هذا الإجراء.", not_found: "تعذر العثور على المورد أو الوصول إليه.", conflict: "تغيرت الحالة. حدّث الصفحة قبل المتابعة.", validation: "راجع البيانات المدخلة.", rate_limited: "محاولات كثيرة. حاول لاحقًا.", server: "حدث خطأ غير متوقع.", network: "تعذر الاتصال. تحقق من الشبكة." };
export function mapHttpError(status: number): AppError {
  const kind: ErrorKind = status === 401 ? "unauthenticated" : status === 403 ? "forbidden" : status === 404 ? "not_found" : status === 409 ? "conflict" : status === 422 ? "validation" : status === 429 ? "rate_limited" : "server";
  return { kind, code: `HTTP_${status}`, message: messages[kind], retryable: status >= 500 || status === 429 };
}
export function networkError(): AppError { return { kind: "network", code: "NETWORK", message: messages.network, retryable: true }; }
