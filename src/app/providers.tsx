"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { AudioProvider } from "@/features/audio/AudioProvider";
import { MiniPlayer } from "@/features/audio/MiniPlayer";
import { AdhkarToaster } from "@/features/adhkar/AdhkarToaster";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AudioProvider>
        {children}
        <MiniPlayer />
        <AdhkarToaster />
      </AudioProvider>
    </MotionConfig>
  );
}
