"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { AudioProvider } from "@/features/audio/AudioProvider";
import { MiniPlayer } from "@/features/audio/MiniPlayer";
import { AdhkarToaster } from "@/features/adhkar/AdhkarToaster";
import { AccountProvider } from "@/features/account/AccountProvider";
import { KidsInviteDialog } from "@/features/kids/KidsInviteDialog";
import { KidsProgressProvider } from "@/features/kids/progress/KidsProgressProvider";
import { LastReadSync } from "@/features/quran/LastReadSync";
import { SupportSheet } from "@/features/support/SupportSheet";
import { UpdatePrompt } from "@/features/update/UpdatePrompt";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AccountProvider>
        <KidsProgressProvider>
          <AudioProvider>
            {children}
            <MiniPlayer />
            <AdhkarToaster />
            <KidsInviteDialog />
            <SupportSheet />
            <UpdatePrompt />
          </AudioProvider>
          <LastReadSync />
        </KidsProgressProvider>
      </AccountProvider>
    </MotionConfig>
  );
}
