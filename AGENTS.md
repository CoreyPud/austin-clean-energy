- Public share links for saved assessments read through the security-definer RPC get_shared_assessment(token), never an anon table policy — keeps other users' saves unlistable.
- Solar Suite tools (/solar-bom, /solar-draft, /solar-flow) share project details through src/lib/shared-project.tsx; a ?saved=<id> link ties them to a saved_assessments row that is re-read on load and tab focus — so later edits to the saved property flow through.
- Innovation Gap keeps cited content separate from its presentation in its feature directory, with a public page wrapper for shared navigation and metadata; this preserves the uploaded content independently of site styling.

- Austin IRP Planning preserves supplied model data separately from its themed interface and uses a public wrapper for navigation, metadata, and model disclaimers — keeps source material independent of presentation.
- Austin Load Zone Outlook keeps supplied data separate from its themed interface and uses a public wrapper for navigation, metadata, and source limitations — preserves source material independently of presentation.
- Load Zone Outlook uses a sourced local Texas boundary and shared symbol details for hover and pinned views — keeps geographic context and displayed project facts consistent without an external map service.
- Load Zone Outlook preserves supplied capacity-gap and timeline data independently of presentation; explicitly distinguish contracted/nameplate capacity from peak-hour supply and do not present its arithmetic gap as a reliability forecast — prevents misleading adequacy claims.
