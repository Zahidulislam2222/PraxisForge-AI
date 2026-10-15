import type { DemoTask, TaskStatus } from "./content";

export function visibleTasks(
  tasks: DemoTask[],
  query: string,
  status: TaskStatus | "all",
) {
  const term = query.trim().toLocaleLowerCase();
  return tasks.filter(
    (task) =>
      (status === "all" || task.status === status) &&
      `${task.title} ${task.client} ${task.id}`
        .toLocaleLowerCase()
        .includes(term),
  );
}

export function decideProposal(
  tasks: DemoTask[],
  id: string,
  decision: "approve" | "reject",
): DemoTask[] {
  return tasks.map((task) =>
    task.id === id && task.status === "approval"
      ? { ...task, status: decision === "approve" ? "completed" : "rejected" }
      : task,
  );
}

export function summarizeTasks(tasks: DemoTask[]) {
  return [
    tasks.length,
    tasks.filter((t) => t.status === "approval").length,
    tasks.filter((t) => t.status === "completed").length,
    tasks.filter((t) => t.status === "blocked" || t.status === "unknown")
      .length,
  ];
}
