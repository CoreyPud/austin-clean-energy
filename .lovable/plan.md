# Interactive Gantt schedule in Solar Suite

Replace the sample schedule on the Solar Suite **Schedule** page (/solar-flow) with a working Gantt chart modeled on the "Updated Gantt only" tab of your spreadsheet.

## What you will see

**Left side — task table (same columns as the spreadsheet)**
Program, Mount, Estimated Cost, ID, Task Name, Workstream, Phase, Type, Responsible Party, Estimated Days, Start, End, Predecessor(s). A "Project Start Date" box at the top, like cell F2, and a total cost line.

**Right side — timeline**
- Weekly columns starting on the Monday of the project start week (zoom to days/months too).
- Colored bars per workstream (1. EPC Pre-Application, 2. SSO Weekly Schedule, 3. Commercial Permit Process, 4. Post-install paperwork, 5. O&M), collapsible workstream groups.
- 0-day tasks/decisions show as a diamond, matching the sheet's ◆. Rework/Exception rows are styled differently and do not push the schedule.
- Arrows drawn from each predecessor to its dependent task; a "today" line.

**Editing**
- Type a new Estimated Days, or drag a bar's right edge to change its length.
- Drag a whole bar to new dates. If the new start is earlier than its predecessors allow, it snaps back and shows why; later starts are kept as a manual delay.
- Changing any task automatically moves every task that depends on it (same logic as the spreadsheet formulas). Circular links are blocked.
- Add a task above/below any row ("Insert task here"); IDs renumber and existing links follow the renumbering. Delete and reorder rows.
- Pick predecessors from a list (multiple allowed).

**Reference links**
Each task can hold any number of labeled links (e.g. Austin Energy CAF, DSD permit page). Shown as a link icon on the row and listed in the task panel.

**Comments (like Google Sheets)**
Clicking a task opens a side panel with details, links and a comment thread. Each comment shows author name, date/time, and can be replied to, edited or deleted by its author, or marked resolved. A small badge on the row shows the open comment count.

**Saving and sharing**
- Schedules are saved to the backend; teammates see the same schedule. Multiple schedules allowed (e.g. one per project), and a schedule can be tied to the linked saved property already shown in the Solar Suite header.
- "New schedule from template" creates one pre-filled with the 108 tasks, durations, workstreams and predecessors from your spreadsheet.
- Sign-in is required to edit or comment so each comment has a real author; others can view.
- Export back to CSV/Excel for sharing.

## Questions this plan assumes (tell me if wrong)
- Anyone signed in can edit any schedule. (Alternative: only the creator plus invited people.)
- Durations are calendar days, as in the spreadsheet (no weekend skipping). Half-day values (0.5) are kept.

## Technical details
- New tables: `gantt_schedules` (name, start_date, saved_assessment_id, owner), `gantt_tasks` (schedule_id, sort_order, code, fields from sheet, duration_days numeric, manual_start, links jsonb), `gantt_task_dependencies` (task_id, predecessor_id), `gantt_task_comments` (task_id, author_id, author_name, body, parent_id, resolved, created_at, edited_at). Grants + RLS: read for authenticated/anon per assumption, write for authenticated; comment edit/delete only by author.
- Template seed: spreadsheet rows parsed once into `src/features/gantt/template.ts` (predecessors resolved from the sheet's start-date formulas, e.g. `=M12` → task 8).
- Scheduling engine `src/features/gantt/schedule.ts`: topological sort, start = max(predecessor ends, manual start, project start), cycle detection; unit tests for chaining, inserted-row renumbering, drag-earlier snap, cycles, milestones.
- Custom SVG/DOM timeline with pointer-event dragging (no new heavy library); optimistic saves debounced to the backend.
- Replaces the sample data in `solar-flow-pm.tsx`; board/milestone views read the same tasks.
- Record the module decision in AGENTS.md.
