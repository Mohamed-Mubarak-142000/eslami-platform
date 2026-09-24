import { localJsonStorage, type JsonStorage } from "@/lib/storage";
import type { CrudRepository } from "./types";

/** A localStorage-backed CRUD repository seeded from `src/mocks/twister`, behind `CrudRepository`. */
export function createLocalCrudRepository<T extends { id: string }>(
  storageKey: string,
  seed: readonly T[],
  storage: JsonStorage = localJsonStorage,
): CrudRepository<T> {
  const readAll = (): T[] => storage.readJson<T[]>(storageKey, [...seed]);
  const writeAll = (items: readonly T[]): void => storage.writeJson(storageKey, items);

  return {
    list: () => readAll(),
    get: (id) => readAll().find((item) => item.id === id),
    create: (item) => {
      writeAll([...readAll(), item]);
      return item;
    },
    update: (id, patch) => {
      let updated: T | undefined;
      const next = readAll().map((item) => {
        if (item.id !== id) return item;
        updated = { ...item, ...patch };
        return updated;
      });
      if (updated) writeAll(next);
      return updated;
    },
    remove: (id) => writeAll(readAll().filter((item) => item.id !== id)),
    reset: () => writeAll([...seed]),
  };
}
