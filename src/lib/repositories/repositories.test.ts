import { afterEach, describe, expect, it } from "vitest";
import { createLocalCrudRepository } from "./local-crud-repository";
import { createLocalLogRepository } from "./local-log-repository";
import { createLocalSingletonRepository } from "./local-singleton-repository";

afterEach(() => localStorage.clear());

interface Widget {
  id: string;
  label: string;
}

describe("createLocalCrudRepository", () => {
  const seed: Widget[] = [{ id: "w1", label: "one" }];

  it("lists the seed before any write", () => {
    const repo = createLocalCrudRepository("test:widgets", seed);
    expect(repo.list()).toEqual(seed);
  });

  it("creates, updates, and removes without mutating the seed array", () => {
    const repo = createLocalCrudRepository("test:widgets-2", seed);
    repo.create({ id: "w2", label: "two" });
    expect(repo.list()).toHaveLength(2);
    repo.update("w2", { label: "two-updated" });
    expect(repo.get("w2")?.label).toBe("two-updated");
    repo.remove("w1");
    expect(repo.list().map((item) => item.id)).toEqual(["w2"]);
    expect(seed).toEqual([{ id: "w1", label: "one" }]);
  });

  it("reset restores the original seed", () => {
    const repo = createLocalCrudRepository("test:widgets-3", seed);
    repo.create({ id: "w2", label: "two" });
    repo.reset();
    expect(repo.list()).toEqual(seed);
  });
});

describe("createLocalSingletonRepository", () => {
  it("merges patches into the persisted document", () => {
    const repo = createLocalSingletonRepository("test:doc", { a: 1, b: 2 });
    expect(repo.get()).toEqual({ a: 1, b: 2 });
    repo.update({ b: 5 });
    expect(repo.get()).toEqual({ a: 1, b: 5 });
    expect(repo.reset()).toEqual({ a: 1, b: 2 });
  });
});

describe("createLocalLogRepository", () => {
  it("appends in order and clears", () => {
    const repo = createLocalLogRepository<string>("test:log");
    repo.append("first");
    repo.append("second");
    expect(repo.list()).toEqual(["first", "second"]);
    repo.clear();
    expect(repo.list()).toEqual([]);
  });
});
