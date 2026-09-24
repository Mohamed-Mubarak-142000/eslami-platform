import { localJsonStorage, type JsonStorage } from "@/lib/storage";
import type { LogRepository } from "./types";

/** Append-only local log — used for the admin's browser-scoped order history (admin-requirements.md). */
export function createLocalLogRepository<T>(storageKey: string, storage: JsonStorage = localJsonStorage): LogRepository<T> {
  return {
    list: () => storage.readJson<T[]>(storageKey, []),
    append: (item) => storage.writeJson(storageKey, [...storage.readJson<T[]>(storageKey, []), item]),
    clear: () => storage.writeJson(storageKey, []),
  };
}
