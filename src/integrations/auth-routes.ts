export type ResetTokenState = "valid" | "expired" | "used" | "invalid";

const resetTokenStates = new Set<ResetTokenState>(["valid", "expired", "used", "invalid"]);

export function readResetTokenState(value: string | string[] | undefined): ResetTokenState {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && resetTokenStates.has(candidate as ResetTokenState)
    ? (candidate as ResetTokenState)
    : "valid";
}
