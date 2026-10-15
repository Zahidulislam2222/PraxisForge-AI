import { describe, expect, it } from "vitest";
import { demoData } from "../../src/lib/content";
import {
  decideProposal,
  summarizeTasks,
  visibleTasks,
} from "../../src/lib/demo";

describe("synthetic approval contract", () => {
  it("only allows a pending proposal to complete and leaves the source fixture unchanged", () => {
    const next = decideProposal(demoData.tasks, "PF-1042", "approve");
    expect(next.find((t) => t.id === "PF-1042")?.status).toBe("completed");
    expect(demoData.tasks.find((t) => t.id === "PF-1042")?.status).toBe(
      "approval",
    );
    expect(next.filter((t) => t.id !== "PF-1042")).toEqual(
      demoData.tasks.filter((t) => t.id !== "PF-1042"),
    );
  });
  it("cannot approve a blocked or uncertain external outcome", () => {
    for (const id of ["PF-1040", "PF-1039"])
      expect(decideProposal(demoData.tasks, id, "approve")).toEqual(
        demoData.tasks,
      );
  });
  it("cannot replay an approval or reverse a rejection by approving it", () => {
    const approved = decideProposal(demoData.tasks, "PF-1042", "approve");
    expect(decideProposal(approved, "PF-1042", "approve")).toEqual(approved);
    const rejected = decideProposal(demoData.tasks, "PF-1042", "reject");
    expect(decideProposal(rejected, "PF-1042", "approve")).toEqual(rejected);
  });
  it("never changes unrelated tasks for an unknown identifier", () => {
    expect(decideProposal(demoData.tasks, "unknown-id", "approve")).toEqual(
      demoData.tasks,
    );
  });
});

describe("accountable task views", () => {
  it("searches identifiers and clients while applying a status filter", () => {
    expect(
      visibleTasks(demoData.tasks, "  NORTHSTAR ", "approval").map((t) => t.id),
    ).toEqual(["PF-1042"]);
    expect(
      visibleTasks(demoData.tasks, "PF-1039", "all").map((t) => t.status),
    ).toEqual(["unknown"]);
    expect(visibleTasks(demoData.tasks, "Northstar", "completed")).toEqual([]);
  });
  it("accounts for blocked and uncertain work separately from completed work", () => {
    expect(summarizeTasks(demoData.tasks)).toEqual([4, 1, 1, 2]);
    expect(
      summarizeTasks(decideProposal(demoData.tasks, "PF-1042", "approve")),
    ).toEqual([4, 0, 2, 2]);
  });
  it("uses reserved example domains and labels all connector capabilities as planned", () => {
    for (const task of demoData.tasks) {
      expect(task.account).toMatch(/\.example$/);
      expect(task.recipient).toMatch(/\.example$/);
    }
    expect(
      demoData.connections.every((c) => c.state === "Planned connector"),
    ).toBe(true);
  });
});
