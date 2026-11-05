// Generated from the uploaded "Austin Solar Permit Inspection Combined Task List Gantt V5" spreadsheet, tab "Updated Gantt only".
import type { TemplateTask } from "./types";

export const PERMIT_TEMPLATE: TemplateTask[] = [
 {
  "id": "t1",
  "program": "",
  "mount": "",
  "cost": 20.0,
  "name": "Which Utility is the property interconnected to today?",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 0.5,
  "preds": []
 },
 {
  "id": "t2",
  "program": "",
  "mount": "",
  "cost": 20.0,
  "name": "Who at the customer site has authority to make decisions about the property or Utility bill",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 0.5,
  "preds": [
   "t1"
  ]
 },
 {
  "id": "t3",
  "program": "",
  "mount": "",
  "cost": 20.0,
  "name": "Who at the customer site has authority to sign documents",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 0.5,
  "preds": [
   "t2"
  ]
 },
 {
  "id": "t4",
  "program": "",
  "mount": "",
  "cost": 20.0,
  "name": "How does the TCAD and AE bill address or name align?",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 1.0,
  "preds": [
   "t3"
  ]
 },
 {
  "id": "t5",
  "program": "",
  "mount": "",
  "cost": 20.0,
  "name": "What entity is on the DEED?",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 1.0,
  "preds": [
   "t4"
  ]
 },
 {
  "id": "t6",
  "program": "",
  "mount": "",
  "cost": 20.0,
  "name": "Is it in City Limits or ETJ",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 0.5,
  "preds": [
   "t4"
  ]
 },
 {
  "id": "t7",
  "program": "",
  "mount": "",
  "cost": 20.0,
  "name": "Which AE program does the site fit into?",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 0.5,
  "preds": [
   "t6"
  ]
 },
 {
  "id": "t8",
  "program": "",
  "mount": "",
  "cost": 20.0,
  "name": "What is the current registered USE of the site with the City of Austin?",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 0.5,
  "preds": [
   "t7"
  ]
 },
 {
  "id": "t9",
  "program": "",
  "mount": "",
  "cost": 20.0,
  "name": "Preliminary layout",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 1.0,
  "preds": [
   "t7"
  ]
 },
 {
  "id": "t10",
  "program": "",
  "mount": "",
  "cost": 20.0,
  "name": "Utility bill review, audit",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 0.5,
  "preds": [
   "t17"
  ]
 },
 {
  "id": "t11",
  "program": "",
  "mount": "",
  "cost": 20.0,
  "name": "Calculate return on investment for the customer if behind the meter (not needed for Std. Offer)",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 0.5,
  "preds": [
   "t10"
  ]
 },
 {
  "id": "t12",
  "program": "",
  "mount": "",
  "cost": 20.0,
  "name": "Inspect the roof to determine remaining life, obstructions, etc",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 3.0,
  "preds": [
   "t11"
  ]
 },
 {
  "id": "t13",
  "program": "",
  "mount": "",
  "cost": 100.0,
  "name": "Site based shade analysis (not satellite or software)",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 2.0,
  "preds": [
   "t12"
  ]
 },
 {
  "id": "t14",
  "program": "",
  "mount": "",
  "cost": 50.0,
  "name": "Inspect existing interconnection hardware: electrical panel, meter, raceway's, line side hardware, to understand if any of this needs to be upgraded per current code",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 0.5,
  "preds": [
   "t13"
  ]
 },
 {
  "id": "t15",
  "program": "",
  "mount": "",
  "cost": 100.0,
  "name": "Building Structural check",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 3.0,
  "preds": [
   "t16"
  ]
 },
 {
  "id": "t16",
  "program": "",
  "mount": "",
  "cost": 50.0,
  "name": "Transformer check to know if the existing transformer can handle the new solar/battery hardware",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 3.0,
  "preds": [
   "t14"
  ]
 },
 {
  "id": "t17",
  "program": "",
  "mount": "",
  "cost": 100.0,
  "name": "Financing options review and prep to show to property owner",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 3.0,
  "preds": [
   "t9"
  ]
 },
 {
  "id": "t18",
  "program": "",
  "mount": "All",
  "cost": 200.0,
  "name": "Feasibility study (covers electrical topics, does not appear to cover building or site topics)",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 14.0,
  "preds": [
   "t23"
  ]
 },
 {
  "id": "t19",
  "program": "",
  "mount": "",
  "cost": 6000.0,
  "name": "Impact study if over 500kW",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 10.0,
  "preds": [
   "t25"
  ]
 },
 {
  "id": "t20",
  "program": "Std Offer",
  "mount": "Ground",
  "cost": 20.0,
  "name": "If Ground Mount - Zoning check, if not zoned for energy, then start rezone process",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 2.0,
  "preds": [
   "t24"
  ]
 },
 {
  "id": "t21",
  "program": "Std Offer",
  "mount": "Ground",
  "cost": 150.0,
  "name": "Apply for rezoning if needed",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 180.0,
  "preds": [
   "t20"
  ]
 },
 {
  "id": "t22",
  "program": "Std Offer",
  "mount": "Ground",
  "cost": 12000.0,
  "name": "If Ground Mount - Subsurface soil type check",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 5.0,
  "preds": [
   "t24"
  ]
 },
 {
  "id": "t23",
  "program": "Std Offer",
  "mount": "Ground",
  "cost": 1500.0,
  "name": "If Ground Mount - Subsurface existing underground wires water etc check",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 5.0,
  "preds": [
   "t22"
  ]
 },
 {
  "id": "t24",
  "program": "",
  "mount": "",
  "cost": 50.0,
  "name": "Proposal to property owner and await their response",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 10.0,
  "preds": [
   "t15"
  ]
 },
 {
  "id": "t25",
  "program": "",
  "mount": "",
  "cost": 20.0,
  "name": "Customer agreement form (CAF)",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 0.5,
  "preds": [
   "t18"
  ]
 },
 {
  "id": "t26",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Generate the customer contract (close the sale)",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 0.5,
  "preds": [
   "t24"
  ]
 },
 {
  "id": "t27",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Submit for encumbrance letter",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 0.5,
  "preds": [
   "t25"
  ]
 },
 {
  "id": "t28",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Receive encumbrance letter response",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Austin Energy",
  "days": 10.0,
  "preds": [
   "t26"
  ]
 },
 {
  "id": "t29",
  "program": "",
  "mount": "",
  "cost": 2000.0,
  "name": "Generate initial stamped plan set",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 5.0,
  "preds": [
   "t26"
  ]
 },
 {
  "id": "t30",
  "program": "All",
  "mount": "Ground",
  "cost": 20000.0,
  "name": "Develop site plan or get site plan exemption",
  "workstream": "1. EPC Pre-Application",
  "phase": "Pre-Application",
  "type": "Task",
  "party": "Contractor",
  "days": 30.0,
  "preds": [
   "t27"
  ]
 },
 {
  "id": "t31",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "1. Prepare & Submit EECP Application: \nProposed layout\nAustin Energy Bill, OR a picture of the existing electric meter, OR a simple Word document stating the project will be \u2018new construction\u2019\n\u2022 Customer Agreement Form (CAF)\n\u2022 System owner FEIN verification form (either SS4 or 147-C)\n\u2022 NABCEP and Engineer-Certified Layout\n\u2022 Feasibility Study (for systems \u2265500 kW-ac; valid for 60 days)",
  "workstream": "2. SSO Weekly Schedule",
  "phase": "1. Initial Application Submittal",
  "type": "Task",
  "party": "Contractor",
  "days": 2.0,
  "preds": [
   "t30"
  ]
 },
 {
  "id": "t32",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Submit for Letter of Authorization LOA",
  "workstream": "2. SSO Weekly Schedule",
  "phase": "1. Initial Application Submittal",
  "type": "Task",
  "party": "Contractor",
  "days": 0.5,
  "preds": [
   "t31"
  ]
 },
 {
  "id": "t33",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "2. Application Review & DG Address Creation",
  "workstream": "2. SSO Weekly Schedule",
  "phase": "1. Initial Application Submittal",
  "type": "Task",
  "party": "Austin Energy",
  "days": 5.0,
  "preds": [
   "t31"
  ]
 },
 {
  "id": "t34",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "3. 180 days to submit: \nDGPA\nInterconnection Agreement\nContract\nSystem Warranty",
  "workstream": "2. SSO Weekly Schedule",
  "phase": "2. Capacity Encumbrance & Engineering",
  "type": "Task",
  "party": "Contractor & AE",
  "days": 0.5,
  "preds": [
   "t33"
  ]
 },
 {
  "id": "t35",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Project kickoff",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Milestone",
  "party": "Contractor/Customer",
  "days": 0.5,
  "preds": [
   "t34"
  ]
 },
 {
  "id": "t36",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Does Service Need Meter Review?",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Decision",
  "party": "Contractor/Customer with input from AE. (which dept at AE?)",
  "days": 2.0,
  "preds": [
   "t35"
  ]
 },
 {
  "id": "t37",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "AEAS Permit (Austin Energy Additional Services) \u2013 submit in AB&C",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Rework/Branch",
  "party": "Contractor/Customer",
  "days": 3.0,
  "preds": [
   "t36"
  ]
 },
 {
  "id": "t38",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "City or ETJ?",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Decision",
  "party": "Contractor/Customer",
  "days": 0.5,
  "preds": [
   "t37"
  ]
 },
 {
  "id": "t39",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Submit Permit Application (Web Form)",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Task",
  "party": "Contractor/Customer",
  "days": 0.5,
  "preds": [
   "t38"
  ]
 },
 {
  "id": "t40",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "ASD City Plan Review PR Process (not Austin Energy Plan Review)",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Task",
  "party": "ADS",
  "days": 7.0,
  "preds": [
   "t39"
  ]
 },
 {
  "id": "t41",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Can a building dept rep do a site visit? to address water retention, setbacks, easements etc",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Task",
  "party": "ADS",
  "days": 5.0,
  "preds": [
   "t40"
  ]
 },
 {
  "id": "t42",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "4. Second AE Document Review & Letter of Approval (LoA)",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Task",
  "party": "Austin Energy",
  "days": 7.0,
  "preds": [
   "t41"
  ]
 },
 {
  "id": "t43",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "New service Electrical Permit EP with ESPA",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Task",
  "party": "Contractor",
  "days": 3.0,
  "preds": [
   "t42"
  ]
 },
 {
  "id": "t44",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Submit AUX Electric Permit (AB&C)",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Task",
  "party": "Contractor/Customer",
  "days": 0.5,
  "preds": [
   "t43"
  ]
 },
 {
  "id": "t45",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "ADS BTCS Web Acceptance \u2013 Standalone Permit",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Task",
  "party": "ADS",
  "days": 0.5,
  "preds": [
   "t44"
  ]
 },
 {
  "id": "t46",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "5. ADS Commercial Plan Review & Permit Issuance",
  "workstream": "2. SSO Weekly Schedule",
  "phase": "3. Permitting & Pre-Construction",
  "type": "Task",
  "party": "Contractor / DSD",
  "days": 14.0,
  "preds": [
   "t45"
  ]
 },
 {
  "id": "t47",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "\u2265500kW AC? (AE)",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Decision",
  "party": "Austin Energy",
  "days": 0.5,
  "preds": [
   "t46"
  ]
 },
 {
  "id": "t48",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Austin Energy DER >500kW AC Workflow",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Rework/Branch",
  "party": "Austin Energy (DER)",
  "days": 0.5,
  "preds": [
   "t47"
  ]
 },
 {
  "id": "t49",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "\u226525kW, Spinning Generator &/or Downtown Network?",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Decision",
  "party": "Austin Energy",
  "days": 0.5,
  "preds": [
   "t48"
  ]
 },
 {
  "id": "t50",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "AE Plan Review Fee Billed & Paid",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Task",
  "party": "Contractor/Customer",
  "days": 2.0,
  "preds": [
   "t49"
  ]
 },
 {
  "id": "t51",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Austin Energy DGPA Review (Transformer size review)",
  "workstream": "3. Commercial Permit Process",
  "phase": "2. Plan Review & Construction",
  "type": "Task",
  "party": "Austin Energy (CRS)",
  "days": 5.0,
  "preds": [
   "t50"
  ]
 },
 {
  "id": "t52",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "AE DGPA Review Pass or Fail?",
  "workstream": "3. Commercial Permit Process",
  "phase": "2. Plan Review & Construction",
  "type": "Decision",
  "party": "Austin Energy (CRS)",
  "days": 3.0,
  "preds": [
   "t51"
  ]
 },
 {
  "id": "t53",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Building/Remodel (if needed) BP",
  "workstream": "3. Commercial Permit Process",
  "phase": "1. Application Intake & Eligibility",
  "type": "Task",
  "party": "ADS",
  "days": 1.0,
  "preds": [
   "t52"
  ]
 },
 {
  "id": "t54",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "DGPA Revisions",
  "workstream": "3. Commercial Permit Process",
  "phase": "2. Plan Review & Construction",
  "type": "Rework/Exception",
  "party": "Contractor/Customer",
  "days": 5.0,
  "preds": [
   "t53"
  ]
 },
 {
  "id": "t55",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "AE Distributed Generation Plan Review",
  "workstream": "3. Commercial Permit Process",
  "phase": "2. Plan Review & Construction",
  "type": "Task",
  "party": "Austin Energy (CRS)",
  "days": 5.0,
  "preds": [
   "t54"
  ]
 },
 {
  "id": "t56",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "AE Plan Review Pass or Fail?",
  "workstream": "3. Commercial Permit Process",
  "phase": "2. Plan Review & Construction",
  "type": "Decision",
  "party": "Austin Energy (CRS)",
  "days": 5.0,
  "preds": [
   "t55"
  ]
 },
 {
  "id": "t57",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Design Revisions",
  "workstream": "3. Commercial Permit Process",
  "phase": "2. Plan Review & Construction",
  "type": "Rework/Exception",
  "party": "Contractor/Customer",
  "days": 3.0,
  "preds": [
   "t56"
  ]
 },
 {
  "id": "t58",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "AUX Remaining Permit Fees Billed",
  "workstream": "3. Commercial Permit Process",
  "phase": "2. Plan Review & Construction",
  "type": "Task",
  "party": "Austin Energy (CRS)",
  "days": 1.0,
  "preds": [
   "t57"
  ]
 },
 {
  "id": "t59",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "AUX Remaining Permit Fees Paid / Permit Becomes Active",
  "workstream": "3. Commercial Permit Process",
  "phase": "2. Plan Review & Construction",
  "type": "Task",
  "party": "Contractor/Customer",
  "days": 5.0,
  "preds": [
   "t58"
  ]
 },
 {
  "id": "t60",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Request Pre-Construction (Precon) Meeting \u2013 required",
  "workstream": "3. Commercial Permit Process",
  "phase": "2. Plan Review & Construction",
  "type": "Task",
  "party": "Contractor/Customer",
  "days": 7.0,
  "preds": [
   "t59"
  ]
 },
 {
  "id": "t61",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Precon 101 Meeting to review electrical requirements with AE solar inspector",
  "workstream": "3. Commercial Permit Process",
  "phase": "2. Plan Review & Construction",
  "type": "Task",
  "party": "Contractor/Customer & Austin Energy (CRS)",
  "days": 1.0,
  "preds": [
   "t60"
  ]
 },
 {
  "id": "t62",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Construction",
  "workstream": "3. Commercial Permit Process",
  "phase": "2. Plan Review & Construction",
  "type": "Task",
  "party": "Contractor/Customer",
  "days": 50.0,
  "preds": [
   "t61"
  ]
 },
 {
  "id": "t63",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "AE install the transformer",
  "workstream": "3. Commercial Permit Process",
  "phase": "2. Plan Review & Construction",
  "type": "Task",
  "party": "Contractor/Customer",
  "days": 30.0,
  "preds": [
   "t61"
  ]
 },
 {
  "id": "t64",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Request Inspections as Required (301 Rough / 302 Electrical Grounding-Trench / 304 Temp)",
  "workstream": "3. Commercial Permit Process",
  "phase": "2. Plan Review & Construction",
  "type": "Task",
  "party": "Contractor/Customer (in AB&C My Inspections)",
  "days": 7.0,
  "preds": [
   "t63"
  ]
 },
 {
  "id": "t65",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Rough Inspection Required?",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Decision",
  "party": "Austin Energy (CRS)",
  "days": 1.0,
  "preds": [
   "t64"
  ]
 },
 {
  "id": "t66",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "301 Rough Inspection Process",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Task",
  "party": "Austin Energy (CRS)",
  "days": 5.0,
  "preds": [
   "t65"
  ]
 },
 {
  "id": "t67",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Electrical Grounding (Trench) Inspection Required?",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Decision",
  "party": "Austin Energy (CRS)",
  "days": 5.0,
  "preds": [
   "t66"
  ]
 },
 {
  "id": "t68",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "302 Electrical Grounding (Trench) Inspection Process",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Task",
  "party": "Austin Energy (CRS)",
  "days": 5.0,
  "preds": [
   "t67"
  ]
 },
 {
  "id": "t69",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "CT Meter Required?",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Decision",
  "party": "Austin Energy (CRS)",
  "days": 2.0,
  "preds": [
   "t68"
  ]
 },
 {
  "id": "t70",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "304 Temp Inspection Process",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Task",
  "party": "Austin Energy (CRS)",
  "days": 0.5,
  "preds": [
   "t69"
  ]
 },
 {
  "id": "t71",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Temp 304 Inspection (distribution generation service inspection)",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Task",
  "party": "Contractor/Customer & Austin Energy (CRS)",
  "days": 5.0,
  "preds": [
   "t70"
  ]
 },
 {
  "id": "t72",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "304 Inspection Pass or Fail?",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Decision",
  "party": "Austin Energy (CRS)",
  "days": 0.5,
  "preds": [
   "t71"
  ]
 },
 {
  "id": "t73",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Installation Revisions",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Rework/Exception",
  "party": "Contractor/Customer",
  "days": 5.0,
  "preds": [
   "t72"
  ]
 },
 {
  "id": "t74",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Request CT Inspection",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Task",
  "party": "Contractor/Customer",
  "days": 0.5,
  "preds": [
   "t73"
  ]
 },
 {
  "id": "t75",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "CT Inspection",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Task",
  "party": "Austin Energy (Metering)",
  "days": 5.0,
  "preds": [
   "t74"
  ]
 },
 {
  "id": "t76",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "CT Metering Inspection Pass or Fail?",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Decision",
  "party": "Austin Energy (Metering)",
  "days": 0.5,
  "preds": [
   "t75"
  ]
 },
 {
  "id": "t77",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Deficiencies Corrected",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Rework/Exception",
  "party": "Contractor/Customer",
  "days": 3.0,
  "preds": [
   "t76"
  ]
 },
 {
  "id": "t78",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Order & Program CT Meter",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Task",
  "party": "Austin Energy (Meter Shop)",
  "days": 0.5,
  "preds": [
   "t77"
  ]
 },
 {
  "id": "t79",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Install CT Meter",
  "workstream": "3. Commercial Permit Process",
  "phase": "3. Inspections & CT Metering",
  "type": "Task",
  "party": "Austin Energy (Meter Shop)",
  "days": 5.0,
  "preds": [
   "t78"
  ]
 },
 {
  "id": "t80",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Final Solar Inspection (Customer Requested)",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Task",
  "party": "Austin Energy (CRS)",
  "days": 0.5,
  "preds": [
   "t79"
  ]
 },
 {
  "id": "t81",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Final Inspection Pass or Fail?",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Decision",
  "party": "Austin Energy (CRS)",
  "days": 5.0,
  "preds": [
   "t80"
  ]
 },
 {
  "id": "t82",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Deficiencies Corrected",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Rework/Exception",
  "party": "Contractor/Customer",
  "days": 4.0,
  "preds": [
   "t81"
  ]
 },
 {
  "id": "t83",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "PV Meter Required?",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Decision",
  "party": "Austin Energy (CRS)",
  "days": 0.5,
  "preds": [
   "t82"
  ]
 },
 {
  "id": "t84",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Install PV Meter (5\u201310 days)",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Task",
  "party": "Austin Energy (Metering)",
  "days": 7.0,
  "preds": [
   "t83"
  ]
 },
 {
  "id": "t85",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "AUX Permit Moved to Final Status",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Task (automated)",
  "party": "Automated in Amanda",
  "days": 3.0,
  "preds": [
   "t84"
  ]
 },
 {
  "id": "t86",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Request Outstanding BP, PR, or FIRR Inspections to Close BP, PR & FIRR Permits",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Task",
  "party": "Customer/Contractor",
  "days": 5.0,
  "preds": [
   "t85"
  ]
 },
 {
  "id": "t87",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "New AE DG account created for System Owner",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Task",
  "party": "Austin Energy",
  "days": 5.0,
  "preds": [
   "t86"
  ]
 },
 {
  "id": "t88",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "11. QA Review Account Creation & Payment Setup",
  "workstream": "2. SSO Weekly Schedule",
  "phase": "5. Post-Inspection & Commissioning",
  "type": "Task",
  "party": "Austin Energy",
  "days": 3.0,
  "preds": [
   "t87"
  ]
 },
 {
  "id": "t89",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Final documentation review: Are All Permits Passed & Closed?",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Decision",
  "party": "Austin Energy",
  "days": 5.0,
  "preds": [
   "t88"
  ]
 },
 {
  "id": "t90",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Address Outstanding Permit Requirements",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Rework/Exception",
  "party": "Contractor/Customer",
  "days": 5.0,
  "preds": [
   "t89"
  ]
 },
 {
  "id": "t91",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Finalize the permits and request a new mter be installed",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Rework/Exception",
  "party": "Contractor/Customer",
  "days": 5.0,
  "preds": [
   "t90"
  ]
 },
 {
  "id": "t92",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Pay re-inspection fee if needed",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Task",
  "party": "Contractor/Customer",
  "days": 5.0,
  "preds": [
   "t91"
  ]
 },
 {
  "id": "t93",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Permission to Operate Granted / All Related Permits in Final Status",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Task",
  "party": "Austin Energy",
  "days": 5.0,
  "preds": [
   "t92"
  ]
 },
 {
  "id": "t94",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Buffer time for delays",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Task",
  "party": "Austin Energy",
  "days": 15.0,
  "preds": [
   "t93"
  ]
 },
 {
  "id": "t95",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "System Energized & Producing",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Task",
  "party": "Austin Energy",
  "days": 5.0,
  "preds": [
   "t94"
  ]
 },
 {
  "id": "t96",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Confirm system is producing via documentation from AE or AE monitoring portal",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Task",
  "party": "Austin Energy",
  "days": 5.0,
  "preds": [
   "t95"
  ]
 },
 {
  "id": "t97",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Submit As-Built Layout (if original plans were modified)",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Task",
  "party": "Contractor",
  "days": 7.0,
  "preds": [
   "t96"
  ]
 },
 {
  "id": "t98",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Submit System Owner Insurance (can be submitted later by the System Owner, if needed)",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Task",
  "party": "Contractor",
  "days": 7.0,
  "preds": [
   "t97"
  ]
 },
 {
  "id": "t99",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Submit Final Invoice (with customer signature approving/notes on any change orders, if applicable), and move the enrollment forward in the rebate portal.",
  "workstream": "3. Commercial Permit Process",
  "phase": "4. Final Inspection & Energization",
  "type": "Task",
  "party": "Contractor",
  "days": 3.0,
  "preds": [
   "t98"
  ]
 },
 {
  "id": "t100",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Once the final invoice is uploaded, the application can be moved forward for final review and approval by Austin Energy.",
  "workstream": "3. Commercial Permit Process",
  "phase": "5. Rebate",
  "type": "Task",
  "party": "Austin Energy",
  "days": 15.0,
  "preds": [
   "t99"
  ]
 },
 {
  "id": "t101",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Start IRS Tax Credit paperwork",
  "workstream": "4. Post install paperwork",
  "phase": "6. Tax Credit",
  "type": "Task",
  "party": "System Owner",
  "days": 5.0,
  "preds": [
   "t100"
  ]
 },
 {
  "id": "t102",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Submit to IRS",
  "workstream": "4. Post install paperwork",
  "phase": "6. Tax Credit",
  "type": "Task",
  "party": "System Owner",
  "days": 5.0,
  "preds": [
   "t101"
  ]
 },
 {
  "id": "t103",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Get Rebate check from Austin Energy",
  "workstream": "4. Post install paperwork",
  "phase": "5. Rebate",
  "type": "Task",
  "party": "Austin Energy",
  "days": 5.0,
  "preds": [
   "t102"
  ]
 },
 {
  "id": "t104",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "AE process the payment verification and keep enrollment in Open status",
  "workstream": "4. Post install paperwork",
  "phase": "7. Payment",
  "type": "Task",
  "party": "Austin Energy",
  "days": 5.0,
  "preds": [
   "t103"
  ]
 },
 {
  "id": "t105",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Get Quarterly payments from Austin Energy",
  "workstream": "4. Post install paperwork",
  "phase": "7. Payment",
  "type": "Task",
  "party": "Austin Energy",
  "days": 5.0,
  "preds": [
   "t104"
  ]
 },
 {
  "id": "t106",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "System owner pays AE utility bill for electricity consumed by the system",
  "workstream": "4. Post install paperwork",
  "phase": "7. Payment",
  "type": "Task",
  "party": "System Owner",
  "days": 5.0,
  "preds": [
   "t105"
  ]
 },
 {
  "id": "t107",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Start O&M",
  "workstream": "5. O&M",
  "phase": "Maintainence",
  "type": "Task",
  "party": "Contractor",
  "days": 5.0,
  "preds": [
   "t106"
  ]
 },
 {
  "id": "t108",
  "program": "",
  "mount": "",
  "cost": 0,
  "name": "Get Check from IRS",
  "workstream": "4. Post install paperwork",
  "phase": "5. Rebate",
  "type": "Task",
  "party": "System Owner",
  "days": 5.0,
  "preds": [
   "t107"
  ]
 }
];
