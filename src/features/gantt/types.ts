export type TemplateTask = {
  id: string;
  program: string;
  mount: string;
  cost: number;
  name: string;
  workstream: string;
  phase: string;
  type: string;
  party: string;
  days: number;
  preds: string[];
};

export type TaskLink = { label: string; url: string };

export type GanttTask = TemplateTask & {
  /** Days after project start the user pinned this task to; the scheduler never starts it earlier than its predecessors. */
  manualStart?: number | null;
  links: TaskLink[];
  status?: "To Do" | "In Progress" | "Blocked" | "Done";
};

export type ScheduledTask = GanttTask & { row: number; start: number; end: number; earliest: number };

export type GanttComment = {
  id: string;
  schedule_id: string;
  task_id: string;
  parent_id: string | null;
  author_id: string;
  author_name: string;
  body: string;
  resolved: boolean;
  created_at: string;
  edited_at: string | null;
};
