/**
 * Repository contracts kept independent of the storage mechanism so a real backend can replace
 * the localStorage implementation in `twister-backend-v1` without touching call sites
 * (admin-requirements.md's local-sandbox decision for this milestone).
 */

export interface CrudRepository<T extends { id: string }> {
  list(): T[];
  get(id: string): T | undefined;
  create(item: T): T;
  update(id: string, patch: Partial<Omit<T, "id">>): T | undefined;
  remove(id: string): void;
  /** Restores the code-shipped seed, discarding local edits (admin-requirements.md "تصفير"). */
  reset(): void;
}

export interface SingletonRepository<T> {
  get(): T;
  update(patch: Partial<T>): T;
  reset(): T;
}

export interface LogRepository<T> {
  list(): readonly T[];
  append(item: T): void;
  clear(): void;
}
