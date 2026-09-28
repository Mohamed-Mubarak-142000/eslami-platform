const MESSAGES: Record<string, string> = {
  invalid_credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  email_not_confirmed: "لم يتم تأكيد بريدك بعد — أدخل الكود الذي أرسلناه لك.",
  user_already_exists: "هذا البريد مسجّل بالفعل، سجّل الدخول أو استعد كلمة المرور.",
  email_exists: "هذا البريد مسجّل بالفعل، سجّل الدخول أو استعد كلمة المرور.",
  weak_password: "كلمة المرور ضعيفة — استخدم ٨ أحرف على الأقل مع أرقام وحروف.",
  same_password: "كلمة المرور الجديدة يجب أن تختلف عن القديمة.",
  otp_expired: "انتهت صلاحية الكود أو أنه غير صحيح، اطلب كودًا جديدًا.",
  over_email_send_rate_limit: "أرسلنا رسائل كثيرة لهذا البريد، انتظر قليلًا ثم حاول مجددًا.",
  over_request_rate_limit: "محاولات كثيرة، انتظر قليلًا ثم حاول مجددًا.",
  user_not_found: "لا يوجد حساب بهذا البريد.",
  signup_disabled: "التسجيل مغلق حاليًا.",
  user_banned: "هذا الحساب موقوف.",
};

export function authErrorMessage(error: { code?: string | undefined; message?: string } | null | undefined): string {
  if (!error) return "حدث خطأ غير متوقع، حاول مرة أخرى.";
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]!;
  if (/token has expired|invalid/i.test(error.message ?? "") && /otp|token/i.test(error.message ?? "")) return MESSAGES.otp_expired!;
  return "حدث خطأ، حاول مرة أخرى بعد قليل.";
}

export const NOT_CONFIGURED = "الحسابات غير مفعّلة على هذا الخادم بعد.";
