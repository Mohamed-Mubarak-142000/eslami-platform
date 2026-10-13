"use client";

/**
 * A short haptic tap. Uses the Vibration API where it exists (Android); iOS Safari has none, but since
 * iOS 18 toggling an `<input type="checkbox" switch>` plays the system haptic, so we click a hidden one.
 */
export function haptic(pattern: "tap" | "done") {
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern === "done" ? [80, 60, 160] : 18);
    return;
  }
  switchTick();
  if (pattern === "done") window.setTimeout(switchTick, 140);
}

let label: HTMLLabelElement | null = null;

function switchTick() {
  try {
    if (!label) {
      label = document.createElement("label");
      label.ariaHidden = "true";
      label.style.display = "none";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("switch", "");
      label.appendChild(input);
      document.body.appendChild(label);
    }
    label.click();
  } catch {
    // No haptics on this device: counting works without them.
  }
}

/** Whether this device can buzz at all: the Vibration API, or a touch device (iOS's switch haptic). */
export function canHaptic(): boolean {
  return typeof navigator.vibrate === "function" || window.matchMedia("(pointer: coarse)").matches;
}
