"use client";
import { useEffect } from "react";
import { services } from "@/integrations";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => services.errors.capture(error, { area: "app", ...(error.digest ? { code: error.digest } : {}) }), [error]); return <section role="alert"><h1>تعذر عرض الصفحة</h1><p>حاول مرة أخرى دون فقد بياناتك.</p><button onClick={reset}>إعادة المحاولة</button></section>; }
