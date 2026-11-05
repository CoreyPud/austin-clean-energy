import { supabase } from "@/integrations/supabase/client";
import type { GanttComment, GanttTask } from "./types";

export type ScheduleRow = { id: string; name: string; start_date: string; saved_assessment_id: string | null; tasks: GanttTask[]; updated_at: string; created_by: string };

// The generated types lag new tables in some editors; keep the casts in one place.
const db = supabase as unknown as { from: (t: string) => any };

export async function listSchedules(): Promise<Pick<ScheduleRow, "id" | "name" | "saved_assessment_id" | "updated_at">[]> {
  const { data, error } = await db.from("gantt_schedules").select("id,name,saved_assessment_id,updated_at").order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSchedule(id: string): Promise<ScheduleRow | null> {
  const { data, error } = await db.from("gantt_schedules").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createSchedule(row: { name: string; start_date: string; saved_assessment_id: string | null; tasks: GanttTask[] }): Promise<ScheduleRow> {
  const { data, error } = await db.from("gantt_schedules").insert(row).select("*").single();
  if (error) throw error;
  return data;
}

export async function saveSchedule(id: string, patch: Partial<Pick<ScheduleRow, "name" | "start_date" | "tasks" | "saved_assessment_id">>) {
  const { error } = await db.from("gantt_schedules").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteSchedule(id: string) {
  const { error } = await db.from("gantt_schedules").delete().eq("id", id);
  if (error) throw error;
}

export async function listComments(scheduleId: string): Promise<GanttComment[]> {
  const { data, error } = await db.from("gantt_task_comments").select("*").eq("schedule_id", scheduleId).order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function addComment(c: { schedule_id: string; task_id: string; parent_id: string | null; author_name: string; body: string }) {
  const { error } = await db.from("gantt_task_comments").insert(c);
  if (error) throw error;
}

export async function updateComment(id: string, patch: { body?: string; resolved?: boolean }) {
  const { error } = await db.from("gantt_task_comments").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteComment(id: string) {
  const { error } = await db.from("gantt_task_comments").delete().eq("id", id);
  if (error) throw error;
}
