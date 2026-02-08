/**
 * Hooks for interacting with Tauri native APIs.
 * These hooks gracefully degrade when running in a web browser.
 */
import { useCallback } from "react";
import { isTauri } from "@/lib/platform";

/**
 * Hook for native clipboard operations.
 * Falls back to the browser Clipboard API when not in Tauri.
 */
export function useNativeClipboard() {
  const writeText = useCallback(async (text: string) => {
    if (isTauri()) {
      const { writeText: tauriWrite } = await import(
        "@tauri-apps/plugin-clipboard-manager"
      );
      await tauriWrite(text);
    } else {
      await navigator.clipboard.writeText(text);
    }
  }, []);

  const readText = useCallback(async (): Promise<string> => {
    if (isTauri()) {
      const { readText: tauriRead } = await import(
        "@tauri-apps/plugin-clipboard-manager"
      );
      return (await tauriRead()) ?? "";
    }
    return navigator.clipboard.readText();
  }, []);

  return { writeText, readText };
}

/**
 * Hook for native file dialog operations.
 * Only functional inside Tauri; returns null in browser.
 */
export function useNativeDialog() {
  const openFile = useCallback(
    async (options?: {
      title?: string;
      filters?: { name: string; extensions: string[] }[];
      multiple?: boolean;
    }) => {
      if (!isTauri()) return null;
      const { open } = await import("@tauri-apps/plugin-dialog");
      return open({
        title: options?.title ?? "Open File",
        multiple: options?.multiple ?? false,
        filters: options?.filters,
      });
    },
    []
  );

  const saveFile = useCallback(
    async (options?: {
      title?: string;
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
    }) => {
      if (!isTauri()) return null;
      const { save } = await import("@tauri-apps/plugin-dialog");
      return save({
        title: options?.title ?? "Save File",
        defaultPath: options?.defaultPath,
        filters: options?.filters,
      });
    },
    []
  );

  return { openFile, saveFile };
}

/**
 * Hook for reading/writing files through Tauri FS plugin.
 * Only functional inside Tauri.
 */
export function useNativeFs() {
  const readTextFile = useCallback(async (path: string): Promise<string | null> => {
    if (!isTauri()) return null;
    const { readTextFile: tauriRead } = await import("@tauri-apps/plugin-fs");
    return tauriRead(path);
  }, []);

  const writeTextFile = useCallback(
    async (path: string, contents: string): Promise<boolean> => {
      if (!isTauri()) return false;
      const { writeTextFile: tauriWrite } = await import(
        "@tauri-apps/plugin-fs"
      );
      await tauriWrite(path, contents);
      return true;
    },
    []
  );

  return { readTextFile, writeTextFile };
}

/**
 * Hook to open external URLs using the system default browser.
 */
export function useExternalOpen() {
  const openExternal = useCallback(async (url: string) => {
    if (isTauri()) {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  return { openExternal };
}
