import { localJsonStorage, type JsonStorage } from "@/lib/storage";
import type { SingletonRepository } from "./types";

/** For single-document resources like `BusinessInfo` — no list/id, just get/update/reset. */
export function createLocalSingletonRepository<T>(
  storageKey: string,
  seed: T,
  storage: JsonStorage = localJsonStorage,
): SingletonRepository<T> {
  return {
    get: () => storage.readJson<T>(storageKey, seed),
    update: (patch) => {
      const next = { ...storage.readJson<T>(storageKey, seed), ...patch };
      storage.writeJson(storageKey, next);
      return next;
    },
    reset: () => {
      storage.writeJson(storageKey, seed);
      return seed;
    },
  };
}
