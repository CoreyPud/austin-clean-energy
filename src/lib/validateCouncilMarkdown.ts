/**
 * Validator for the council-members.md knowledge file.
 *
 * Mirrors the parser in supabase/functions/_shared/councilLookup.ts so the
 * admin UI can warn about formatting problems BEFORE saving content that
 * the unified-assessment edge function won't be able to parse.
 */

export interface CouncilMarkdownIssue {
  severity: "error" | "warning";
  message: string;
  section?: string;
  line?: number;
}

export interface CouncilMarkdownValidationResult {
  valid: boolean;
  issues: CouncilMarkdownIssue[];
  sectionsFound: string[];
}

const REQUIRED_SECTIONS = [
  "Mayor",
  ...Array.from({ length: 10 }, (_, i) => `District ${i + 1}`),
];

const REQUIRED_FIELDS = [
  "Name",
  "Email",
  "Phone",
  "Office Page",
  "Current Priorities",
];

export function validateCouncilMarkdown(
  markdown: string,
): CouncilMarkdownValidationResult {
  const issues: CouncilMarkdownIssue[] = [];
  const lines = markdown.split("\n");

  const sections = new Map<string, { fields: Record<string, string>; line: number }>();
  let current: string | null = null;
  let currentLine = 0;
  let fields: Record<string, string> = {};

  const flush = () => {
    if (current) sections.set(current, { fields, line: currentLine });
  };

  lines.forEach((raw, idx) => {
    const lineNum = idx + 1;
    const line = raw.trim();

    // Detect headings — accept ## Mayor or ## District N
    const goodHeading = line.match(/^##\s+(Mayor|District\s+\d{1,2})\s*$/i);
    if (goodHeading) {
      flush();
      current = goodHeading[1].replace(/\s+/g, " ");
      if (/^mayor$/i.test(current)) current = "Mayor";
      else current = current.replace(/^district/i, "District");
      currentLine = lineNum;
      fields = {};
      return;
    }

    // Detect malformed headings that look like they were meant to be sections
    const badHeading = line.match(/^#{1,6}\s+(.*)$/);
    if (badHeading) {
      const heading = badHeading[1].trim();
      const isCouncilHeading = /mayor|district/i.test(heading);
      const isMetaHeading = /^(notes|austin city council|how this file)/i.test(heading);
      if (isCouncilHeading && !goodHeading) {
        issues.push({
          severity: "error",
          message: `Heading "${line}" is malformed. Use exactly "## Mayor" or "## District N" (N = 1–10).`,
          line: lineNum,
        });
      }
      if (!isCouncilHeading && !isMetaHeading && line.startsWith("## ")) {
        issues.push({
          severity: "warning",
          message: `Unrecognized "## " heading "${heading}" — only "Mayor" or "District N" sections are parsed.`,
          line: lineNum,
        });
      }
      // Headings outside known sections shouldn't carry fields
      if (!goodHeading) return;
    }

    if (!current) return;

    // Match well-formed field lines
    const fieldMatch = line.match(
      /^\*\*(Name|Email|Phone|Office Page|Current Priorities):\*\*\s*(.*)$/,
    );
    if (fieldMatch) {
      const key = fieldMatch[1];
      const val = fieldMatch[2].trim();
      if (fields[key] !== undefined) {
        issues.push({
          severity: "warning",
          message: `Duplicate field "${key}" in section "${current}". The last value will be used.`,
          section: current,
          line: lineNum,
        });
      }
      fields[key] = val;
      return;
    }

    // Detect malformed field lines (looks like a field but doesn't match the strict pattern)
    const looksLikeField = line.match(/^\*{0,2}\s*(Name|Email|Phone|Office Page|Current Priorities)\b/i);
    if (looksLikeField && !fieldMatch && line.length > 0) {
      issues.push({
        severity: "error",
        message: `Field "${looksLikeField[1]}" in "${current}" is malformed. Use exactly: \`**${looksLikeField[1]}:** value\` (bold label, colon, space, value).`,
        section: current,
        line: lineNum,
      });
    }
  });
  flush();

  // Check required sections + fields
  REQUIRED_SECTIONS.forEach((sectionName) => {
    const section = sections.get(sectionName);
    if (!section) {
      issues.push({
        severity: "error",
        message: `Missing required section: "## ${sectionName}".`,
      });
      return;
    }
    REQUIRED_FIELDS.forEach((field) => {
      if (!(field in section.fields)) {
        issues.push({
          severity: "error",
          message: `Section "${sectionName}" is missing the "${field}" line. Add \`**${field}:**\` even if the value is blank.`,
          section: sectionName,
          line: section.line,
        });
      }
    });

    // Light value sanity checks (warnings only — blanks allowed)
    const email = section.fields["Email"];
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      issues.push({
        severity: "warning",
        message: `"${sectionName}" Email "${email}" doesn't look like a valid email address.`,
        section: sectionName,
      });
    }
    const officePage = section.fields["Office Page"];
    if (officePage && !/^https?:\/\//i.test(officePage)) {
      issues.push({
        severity: "warning",
        message: `"${sectionName}" Office Page should be a full URL starting with http(s)://.`,
        section: sectionName,
      });
    }
  });

  const errors = issues.filter((i) => i.severity === "error");
  return {
    valid: errors.length === 0,
    issues,
    sectionsFound: Array.from(sections.keys()),
  };
}
