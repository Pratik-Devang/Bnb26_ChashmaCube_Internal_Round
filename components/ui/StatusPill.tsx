import type { ModuleStatus } from "@/types/learning";

const labels: Record<ModuleStatus, string> = {
  completed: "Mastered ✓",
  active: "In progress",
  upcoming: "Up next",
  locked: "Locked",
};

export function StatusPill({ status }: { status: ModuleStatus }) {
  return <span className={`status-pill status-${status}`}>{labels[status]}</span>;
}
