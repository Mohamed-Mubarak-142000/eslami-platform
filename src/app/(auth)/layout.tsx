import Image from "next/image";
import type { ReactNode } from "react";
import { Logo } from "@/components/site/Logo";
import terrace from "@/assets/scenes/quran-terrace.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <main id="main" className="flex flex-col px-4 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </main>
      <aside className="relative hidden overflow-hidden lg:block" aria-hidden>
        <Image src={terrace} alt="" fill sizes="50vw" quality={80} placeholder="blur" className="object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-emerald-night via-emerald-night/40 to-transparent" />
        <div className="absolute inset-x-10 bottom-12 text-white">
          <p className="font-display text-3xl font-bold leading-relaxed">احفظ تقدّمك في الحفظ والتلاوة،</p>
          <p className="font-display text-3xl font-bold leading-relaxed text-gold-soft">وتابعه من أي جهاز.</p>
          <p className="mt-4 max-w-md text-white/75">حساب واحد لك ولأطفالك: الحفظ، والتسميع، واختبارات الأجزاء، والشهادات.</p>
        </div>
      </aside>
    </div>
  );
}
