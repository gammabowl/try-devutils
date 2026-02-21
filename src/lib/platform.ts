/**
 * Platform detection utilities for Tauri desktop vs web browser.
 */

/**
 * Returns true if the app is running inside a Tauri desktop shell.
 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Returns true if the app is running as a browser extension (Chrome/Chromium/Firefox).
 */
export function isExtension(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.protocol === "chrome-extension:" ||
    window.location.protocol === "moz-extension:"
  );
}

/**
 * Returns the current platform: 'macos' | 'windows' | 'linux' | 'web'
 */
export function getPlatformSync(): "macos" | "windows" | "linux" | "web" {
  if (!isTauri()) return "web";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "macos";
  if (ua.includes("win")) return "windows";
  return "linux";
}

/**
 * Returns the modifier key label based on the current platform.
 * macOS → ⌘  |  Windows/Linux → Ctrl
 */
export function getModifierKey(): string {
  return getPlatformSync() === "macos" ? "⌘" : "Ctrl";
}
