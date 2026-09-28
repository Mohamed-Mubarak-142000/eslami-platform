"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { AudioProvider } from "@/features/audio/AudioProvider";
import { MiniPlayer } from "@/features/audio/MiniPlayer";
import { AdhkarToaster } from "@/features/adhkar/AdhkarToaster";
import { AccountProvider } from "@/features/account/AccountProvider";
import { KidsProgressProvider } from "@/features/kids/progress/KidsProgressProvider";
import { LastReadSync } from "@/features/quran/LastReadSync";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AccountProvider>
        <KidsProgressProvider>
          <AudioProvider>
            {children}
            <MiniPlayer />
            <AdhkarToaster />
          </AudioProvider>
          <LastReadSync />
        </KidsProgressProvider>
      </AccountProvider>
    </MotionConfig>
  );
}
