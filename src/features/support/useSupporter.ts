"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAccount } from "@/features/account/AccountProvider";
import { loadMyDonation } from "./donationApi";

/**
 * Whether this account has an approved donation, for the cosmetic supporter perks (extra mushaf
 * colours). Kept on the device so the perks don't flicker; checked once per visit per account.
 */
const KEY = "al-manara:supporter:v1";
let supporter: boolean | undefined;
let checkedFor: string | null = null;
const listeners = new Set<() => void>();

function read(): boolean {
  if (supporter !== undefined) return supporter;
  try {
    supporter = window.localStorage.getItem(KEY) === "1";
  } catch {
    supporter = false;
  }
  return supporter;
}

function set(value: boolean) {
  if (read() === value) return;
  supporter = value;
  try {
    window.localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    // Checked again from the account next visit.
  }
  listeners.forEach((notify) => notify());
}

export function useSupporter(): boolean {
  const account = useAccount();
  const userId = account.status === "signed-in" ? account.account.id : null;
  const signedOut = account.status === "signed-out";

  useEffect(() => {
    if (signedOut) set(false);
    if (!userId || checkedFor === userId) return;
    checkedFor = userId;
    loadMyDonation()
      .then((result) => set(result.supporter))
      .catch(() => {
        checkedFor = null;
      });
  }, [userId, signedOut]);

  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read,
    () => false,
  );
}
