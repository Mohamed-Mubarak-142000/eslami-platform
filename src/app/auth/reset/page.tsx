import type { Metadata } from "next";
export const metadata: Metadata = { title: "استعادة كلمة المرور", robots: { index: false, follow: false } };
export default function Page() { return <form><h1>استعادة كلمة المرور</h1><label htmlFor="email">البريد الإلكتروني</label><input id="email" type="email" required /><button>إرسال رابط الاستعادة</button><p>ستظهر رسالة عامة لحماية خصوصية الحسابات.</p></form>; }
