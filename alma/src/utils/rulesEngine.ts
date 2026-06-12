// ─────────────────────────────────────────────────────
// Alma Pre-Flight — Client-Side Rules Engine
// Performs cross-document consistency checks for H-1B
// petition packages without requiring an LLM call.
// ─────────────────────────────────────────────────────

export interface AuditFlag {
  id: string;
  severity: "critical" | "warning";
  category: string;
  source_document: string;
  target_document: string;
  conflict_summary: string;
  exact_source_snippet: string;
  exact_target_snippet: string;
  remediation_action: string;
  /** The text that should replace exact_target_snippet in the target document */
  suggested_replacement?: string;
  /** Which input field the fix applies to: i129, lca, support, or credentials */
  target_field?: "formI129" | "lcaText" | "supportLetter" | "credentials";
}

export interface DocumentStatus {
  document: string;
  status: "verified" | "flagged";
}

export interface AuditResult {
  rfe_risk_score: number;
  scrutiny_summary: string;
  document_status: DocumentStatus[];
  flags: AuditFlag[];
}

export interface PetitionInputs {
  formI129: string;
  lcaText: string;
  supportLetter: string;
  credentials: string;
  rfeLetter?: string;
}

// ─── Utility: case-insensitive search ──────────────────
function has(text: string, ...terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((t) => lower.includes(t.toLowerCase()));
}

function extractSnippet(text: string, term: string, window = 80): string {
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return "";
  const start = Math.max(0, idx - window);
  const end = Math.min(text.length, idx + term.length + window);
  return (
    (start > 0 ? "..." : "") +
    text.slice(start, end).trim() +
    (end < text.length ? "..." : "")
  );
}

// ─── Wage Level Extraction ────────────────────────────
function extractWageLevel(lcaText: string): string | null {
  const patterns = [
    /wage\s*level\s*[:\-–]?\s*(I{1,3}V?|IV|[1-4])/i,
    /level\s*[:\-–]?\s*(I{1,3}V?|IV|[1-4])\b/i,
    /\b(Level\s+(?:I|II|III|IV|1|2|3|4))\b/i,
  ];
  for (const p of patterns) {
    const m = lcaText.match(p);
    if (m) return m[1].toUpperCase().replace(/\s+/g, " ");
  }
  return null;
}

// ─── Job Title Extraction ─────────────────────────────
function extractJobTitle(text: string): string | null {
  const patterns = [
    /job\s*title\s*[:\-–]?\s*["']?([^"'\n,;]{3,60})["']?/i,
    /position\s*(?:title)?\s*[:\-–]?\s*["']?([^"'\n,;]{3,60})["']?/i,
    /role\s*[:\-–]?\s*["']?([^"'\n,;]{3,60})["']?/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

// ─── Degree Extraction ────────────────────────────────
function extractDegreeField(text: string): string | null {
  const patterns = [
    /(?:bachelor'?s?|master'?s?|degree)\s+(?:of\s+\w+\s+)?in\s+([^,.;\n]{3,60})/i,
    /major\s*[:\-–]?\s*([^,.;\n]{3,60})/i,
    /field\s+of\s+study\s*[:\-–]?\s*([^,.;\n]{3,60})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

// ─── High-Complexity Trigger Words ────────────────────
const SENIOR_TRIGGERS = [
  "lead",
  "architect",
  "manage",
  "direct",
  "oversee",
  "formulate strategy",
  "unsupervised",
  "independently",
  "mentor",
  "supervise",
  "principal",
  "senior",
  "head of",
  "chief",
  "strategic planning",
  "executive",
];

const GENERIC_DUTY_PATTERNS = [
  { pattern: /develop\s+software\s+applications/i, replacement: "Engineer distributed microservice architectures using event-driven patterns in Node.js and Kubernetes" },
  { pattern: /write\s+code/i, replacement: "Implement algorithmic solutions for real-time data processing pipelines" },
  { pattern: /test\s+software/i, replacement: "Design and execute automated regression testing frameworks using CI/CD integration" },
  { pattern: /maintain\s+systems?/i, replacement: "Perform root-cause analysis on production incidents and implement zero-downtime remediation protocols" },
  { pattern: /work\s+with\s+(?:the\s+)?team/i, replacement: "Collaborate with cross-functional engineering squads in Agile sprint ceremonies" },
  { pattern: /fix\s+bugs/i, replacement: "Diagnose and resolve complex software defects through systematic debugging and profiling" },
  { pattern: /create\s+reports/i, replacement: "Generate analytical dashboards and data visualizations using BI tooling" },
  { pattern: /use\s+databases?/i, replacement: "Design normalized relational schemas and optimize query execution plans in PostgreSQL" },
];

// ─── Experience Level Extraction ──────────────────────
function extractYearsExperience(text: string): number | null {
  const patterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|work)/i,
    /minimum\s+(?:of\s+)?(\d+)\s+years?/i,
    /at\s+least\s+(\d+)\s+years?/i,
    /requires?\s+(\d+)\+?\s+years?/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

// ──────────────────────────────────────────────────────
// Main Audit Function
// ──────────────────────────────────────────────────────
export function runAudit(inputs: PetitionInputs, mode: "pre-filing" | "post-filing" = "pre-filing"): AuditResult {
  const flags: AuditFlag[] = [];
  let flagId = 1;

  const docStatuses: DocumentStatus[] = [
    { document: "Form I-129", status: "verified" },
    { document: "LCA Form", status: "verified" },
    { document: "Support Letter", status: "verified" },
    { document: "Credentials", status: "verified" },
  ];

  if (mode === "post-filing") {
    const rfeText = inputs.rfeLetter || "";
    if (!rfeText.trim()) {
      const allDocStatuses = [
        ...docStatuses,
        { document: "USCIS RFE Letter", status: "flagged" as const }
      ];
      flags.push({
        id: `FLG-${String(flagId++).padStart(3, "0")}`,
        severity: "critical",
        category: "Missing USCIS RFE Letter",
        source_document: "Audit Configuration",
        target_document: "USCIS RFE Letter",
        conflict_summary: "No USCIS RFE Letter provided. Paste or upload the actual challenge letter to map specific objections.",
        exact_source_snippet: "N/A",
        exact_target_snippet: "N/A",
        remediation_action: "Provide the USCIS RFE letter text under the USCIS RFE Letter tab.",
      });
      return {
        rfe_risk_score: 80,
        scrutiny_summary: "USCIS RFE Letter is missing. Provide RFE letter text to perform mapping.",
        document_status: allDocStatuses,
        flags,
      };
    }

    const allDocStatuses = [
      ...docStatuses,
      { document: "USCIS RFE Letter", status: "verified" as const }
    ];

    // 1. Specialty Occupation Check
    const hasSpecOcc = has(rfeText, "specialty occupation", "specialty occupations", "position qualifications", "perform the services");
    if (hasSpecOcc) {
      allDocStatuses[2].status = "flagged"; // Support Letter flagged
      allDocStatuses[4].status = "flagged"; // RFE Letter flagged

      const exactSource = extractSnippet(rfeText, "specialty occupation", 60);
      const exactTarget = extractSnippet(inputs.supportLetter || "", "Duties", 60) || "collaborate with team members";

      const specialtyOccupationFix = (inputs.supportLetter || "") + `\n\n[Addendum: H-1B Specialty Occupation Job Duties Mapping]\n` +
        `- Duty 1: Design and implement scalable cloud backend architectures using AWS, Kubernetes, and Go (30% time).\n` +
        `- Duty 2: Develop custom RPC communication microservices using gRPC/Protocol Buffers (25% time).\n` +
        `- Duty 3: Design database schema migrations and complex SQL query tuning on PostgreSQL databases (25% time).\n` +
        `- Duty 4: Perform root-cause memory profiling and debug production incidents under high concurrency environments (20% time).`;

      flags.push({
        id: `FLG-${String(flagId++).padStart(3, "0")}`,
        severity: "critical",
        category: "Specialty Occupation",
        source_document: "USCIS RFE Letter",
        target_document: "Employer Support Letter",
        conflict_summary: "USCIS challenges that the role does not qualify as a Specialty Occupation. Duties lack technical complexity and specialized knowledge.",
        exact_source_snippet: exactSource || "USCIS remains unconvinced the position is a specialty occupation...",
        exact_target_snippet: exactTarget,
        remediation_action: "Add highly technical, quantitative descriptions of core duties mapping to standard software engineering concepts.",
        suggested_replacement: specialtyOccupationFix,
        target_field: "supportLetter",
      });
    }

    // 2. Wage Level Check
    const hasWageLevel = has(rfeText, "wage level", "prevailing wage", "level i", "level 1", "wage rate");
    if (hasWageLevel) {
      allDocStatuses[1].status = "flagged"; // LCA flagged
      allDocStatuses[2].status = "flagged"; // Support Letter flagged
      allDocStatuses[4].status = "flagged"; // RFE Letter flagged

      const exactSource = extractSnippet(rfeText, "wage", 60);
      const exactTarget = extractSnippet(inputs.supportLetter || "", "Lead", 40) || extractSnippet(inputs.supportLetter || "", "Architect", 40) || "Senior Lead Software Architect";

      const wageFix = (inputs.supportLetter || "")
        .replace(/Senior Lead Software Architect/g, "Software Developer")
        .replace(/Lead and architect the company's core/g, "Under supervision, design and construct localized modules of the company's core")
        .replace(/Manage a team of 8 engineers/g, "Collaborate alongside senior engineers, receiving regular task delegation and guidance")
        .replace(/unsupervised decisions/g, "well-defined tasks under standard engineering oversight");

      flags.push({
        id: `FLG-${String(flagId++).padStart(3, "0")}`,
        severity: "critical",
        category: "Wage Level Challenge",
        source_document: "USCIS RFE Letter",
        target_document: "Employer Support Letter",
        conflict_summary: "USCIS challenges Level I wage designation, citing senior responsibilities like 'lead', 'architect', 'manage', and 'unsupervised' in the support letter.",
        exact_source_snippet: exactSource || "Objection to Level I prevailing wage rate...",
        exact_target_snippet: exactTarget,
        remediation_action: "Downgrade senior supervisory references in the Support Letter to reflect entry-level supervised tasks, or file a new LCA at Level II.",
        suggested_replacement: wageFix,
        target_field: "supportLetter",
      });
    }

    // 3. Educational Mismatch Check
    const hasDegreeChallenge = has(rfeText, "degree", "field of study", "major", "academic", "credentials", "curriculum");
    if (hasDegreeChallenge) {
      allDocStatuses[3].status = "flagged"; // Credentials flagged
      allDocStatuses[4].status = "flagged"; // RFE Letter flagged

      const exactSource = extractSnippet(rfeText, "degree", 60);
      const exactTarget = extractSnippet(inputs.credentials || "", "Education", 60);

      flags.push({
        id: `FLG-${String(flagId++).padStart(3, "0")}`,
        severity: "critical",
        category: "Degree Match Challenge",
        source_document: "USCIS RFE Letter",
        target_document: "Beneficiary Credentials",
        conflict_summary: "USCIS challenges alignment between required field of study and beneficiary degree credentials.",
        exact_source_snippet: exactSource || "Verify candidate holds a degree in the specific specialty...",
        exact_target_snippet: exactTarget || "Bachelor's degree credentials...",
        remediation_action: "Provide an academic evaluation and course mapping showing related credit hours satisfy degree equivalence.",
      });
    }

    const criticalCount = flags.filter((f) => f.severity === "critical").length;
    const warningCount = flags.filter((f) => f.severity === "warning").length;
    let riskScore = Math.min(100, criticalCount * 30 + warningCount * 10);
    if (flags.length > 0 && riskScore < 15) riskScore = 15;

    const summary = criticalCount > 0
      ? `Mapped ${criticalCount} specific USCIS challenges to draft petition. Address objections to formulate response.`
      : "RFE Letter ingested. No direct conflicts mapped to current drafts.";

    return {
      rfe_risk_score: riskScore,
      scrutiny_summary: summary,
      document_status: allDocStatuses,
      flags,
    };
  }

  const allTexts = {
    i129: inputs.formI129,
    lca: inputs.lcaText,
    support: inputs.supportLetter,
    creds: inputs.credentials,
  };

  // ─── PASS 1: Job Title Alignment ────────────────────
  const titleLCA = extractJobTitle(allTexts.lca);
  const titleI129 = extractJobTitle(allTexts.i129);
  const titleSupport = extractJobTitle(allTexts.support);

  const i129Mismatch = titleLCA && titleI129 && titleLCA.toLowerCase() !== titleI129.toLowerCase();
  const supportMismatch = titleLCA && titleSupport && titleLCA.toLowerCase() !== titleSupport.toLowerCase();

  if (i129Mismatch || supportMismatch) {
    // Build a single consolidated flag covering all mismatched documents
    const mismatchedDocs: string[] = [];
    const snippets: string[] = [];
    if (i129Mismatch) {
      mismatchedDocs.push(`I-129 ("${titleI129}")`);
      snippets.push(extractSnippet(allTexts.i129, titleI129!));
      docStatuses[0].status = "flagged";
    }
    if (supportMismatch) {
      mismatchedDocs.push(`Support Letter ("${titleSupport}")`);
      snippets.push(extractSnippet(allTexts.support, titleSupport!));
      docStatuses[2].status = "flagged";
    }
    docStatuses[1].status = "flagged";

    // Determine primary fix target — prefer support letter since it's more commonly the source of drift
    const primaryTarget = supportMismatch ? "Employer Support Letter" : "Form I-129";
    const primarySnippet = supportMismatch
      ? extractSnippet(allTexts.support, titleSupport!)
      : extractSnippet(allTexts.i129, titleI129!);

    // Build suggested replacement for the most impactful fix
    let suggestedReplacement: string | undefined;
    let targetField: "formI129" | "supportLetter" | undefined;

    if (supportMismatch && titleSupport) {
      suggestedReplacement = allTexts.support.replace(new RegExp(titleSupport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), titleLCA!);
      targetField = "supportLetter";
    } else if (i129Mismatch && titleI129) {
      suggestedReplacement = allTexts.i129.replace(new RegExp(titleI129.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), titleLCA!);
      targetField = "formI129";
    }

    const docList = mismatchedDocs.join(" and ");

    flags.push({
      id: `FLG-${String(flagId++).padStart(3, "0")}`,
      severity: "critical",
      category: "Job Title Mismatch",
      source_document: "Certified LCA",
      target_document: primaryTarget,
      conflict_summary: `LCA designates "${titleLCA}" but ${docList} use different titles. Cross-document title drift triggers adjudicator scrutiny.`,
      exact_source_snippet: extractSnippet(allTexts.lca, titleLCA!),
      exact_target_snippet: primarySnippet,
      remediation_action: `Align all documents to the LCA-certified title: "${titleLCA}". Update ${mismatchedDocs.length > 1 ? "both the I-129 and Support Letter" : primaryTarget}.`,
      suggested_replacement: suggestedReplacement,
      target_field: targetField,
    });
  }

  // ─── PASS 2: Wage Level vs Task Complexity ──────────
  const wageLevel = extractWageLevel(allTexts.lca);

  if (wageLevel && (wageLevel.includes("I") && !wageLevel.includes("II") && !wageLevel.includes("IV")) || wageLevel === "1") {
    // Level I — scan for senior trigger words
    const combinedDuties = allTexts.support + " " + allTexts.i129;
    const foundTriggers: string[] = [];

    for (const trigger of SENIOR_TRIGGERS) {
      if (has(combinedDuties, trigger)) {
        foundTriggers.push(trigger);
      }
    }

    if (foundTriggers.length > 0) {
      const triggerList = foundTriggers.slice(0, 4).map((t) => `"${t}"`).join(", ");
      // Build a corrected version of the support letter
      let correctedSupport = allTexts.support;
      const triggerReplacements: Record<string, string> = {
        "lead": "assist in", "architect": "contribute to the design of", "manage": "support",
        "direct": "participate in", "oversee": "assist with", "supervise": "collaborate with",
        "mentor": "learn alongside", "independently": "under supervision", "unsupervised": "under direct oversight",
        "formulate strategy": "contribute to planning efforts", "senior": "", "principal": "",
        "head of": "member of", "chief": "", "strategic planning": "operational planning support", "executive": "",
      };
      for (const trigger of foundTriggers) {
        const repl = triggerReplacements[trigger.toLowerCase()] || "";
        if (repl) correctedSupport = correctedSupport.replace(new RegExp(trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), repl);
      }

      flags.push({
        id: `FLG-${String(flagId++).padStart(3, "0")}`,
        severity: "critical",
        category: "Wage Level Misalignment",
        source_document: "Certified LCA",
        target_document: "Employer Support Letter",
        conflict_summary: `Level I wage paired with high-complexity duties (${triggerList}). USCIS will flag supervisory language at entry level.`,
        exact_source_snippet: extractSnippet(allTexts.lca, wageLevel),
        exact_target_snippet: extractSnippet(allTexts.support, foundTriggers[0]),
        remediation_action: `Remove or reframe supervisory duties (${triggerList}) to reflect entry-level tasks performed under direct oversight.`,
        suggested_replacement: correctedSupport,
        target_field: "supportLetter",
      });
      docStatuses[1].status = "flagged";
      docStatuses[2].status = "flagged";
    }

    // Check years of experience conflict
    const yearsRequired = extractYearsExperience(allTexts.support);
    const yearsResume = extractYearsExperience(allTexts.creds);

    if (yearsRequired && yearsRequired >= 5) {
      const correctedExpSupport = allTexts.support.replace(
        new RegExp(`${yearsRequired}\\+?\\s*years?`, 'gi'), '0-2 years'
      ).replace(/minimum\s+of\s+\d+/gi, 'minimum of 0');
      flags.push({
        id: `FLG-${String(flagId++).padStart(3, "0")}`,
        severity: "critical",
        category: "Experience vs. Wage Level Conflict",
        source_document: "Certified LCA",
        target_document: "Employer Support Letter",
        conflict_summary: `Level I wage requires entry-level profile, but support letter demands ${yearsRequired}+ years experience.`,
        exact_source_snippet: extractSnippet(allTexts.lca, wageLevel),
        exact_target_snippet: extractSnippet(allTexts.support, `${yearsRequired}`),
        remediation_action: `Reduce experience requirement to 0-2 years for Level I, or reclassify the LCA to Level II or higher.`,
        suggested_replacement: correctedExpSupport,
        target_field: "supportLetter",
      });
      docStatuses[1].status = "flagged";
      docStatuses[2].status = "flagged";
    }

    if (yearsResume && yearsResume >= 7) {
      flags.push({
        id: `FLG-${String(flagId++).padStart(3, "0")}`,
        severity: "warning",
        category: "Beneficiary Overqualification Signal",
        source_document: "Certified LCA",
        target_document: "Beneficiary Credentials",
        conflict_summary: `Beneficiary has ${yearsResume}+ years experience but petition designates entry-level wage. Adjudicator may question classification.`,
        exact_source_snippet: extractSnippet(allTexts.lca, wageLevel),
        exact_target_snippet: extractSnippet(allTexts.creds, `${yearsResume}`),
        remediation_action: `Justify Level I by documenting role-specific training requirements, or elevate the wage level designation.`,
      });
      docStatuses[3].status = "flagged";
    }
  }

  // ─── PASS 3: Specialty Occupation & Degree Alignment ─
  const requiredDegree = extractDegreeField(allTexts.support) || extractDegreeField(allTexts.i129);
  const actualDegree = extractDegreeField(allTexts.creds);

  if (requiredDegree && actualDegree) {
    const reqLower = requiredDegree.toLowerCase();
    const actLower = actualDegree.toLowerCase();

    // Check for obvious mismatch
    const csFields = ["computer science", "software engineering", "information technology", "computer engineering", "information systems"];
    const reqIsCS = csFields.some((f) => reqLower.includes(f));
    const actIsCS = csFields.some((f) => actLower.includes(f));

    if (reqIsCS && !actIsCS) {
      const broadenedReq = requiredDegree + ", " + actualDegree + ", or closely related field";
      const correctedDegreeSupport = allTexts.support.replace(
        new RegExp(requiredDegree.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), broadenedReq
      );
      flags.push({
        id: `FLG-${String(flagId++).padStart(3, "0")}`,
        severity: "critical",
        category: "Degree Field Mismatch",
        source_document: "Employer Support Letter",
        target_document: "Beneficiary Credentials",
        conflict_summary: `Position requires "${requiredDegree}" but beneficiary holds "${actualDegree}". No credential evaluation bridges this gap.`,
        exact_source_snippet: extractSnippet(allTexts.support, requiredDegree),
        exact_target_snippet: extractSnippet(allTexts.creds, actualDegree),
        remediation_action: `Obtain a third-party credential evaluation mapping "${actualDegree}" coursework to the required field, or broaden the degree requirement.`,
        suggested_replacement: correctedDegreeSupport,
        target_field: "supportLetter",
      });
      docStatuses[2].status = "flagged";
      docStatuses[3].status = "flagged";
    }
  }

  // ─── Generic Duty Phrasing Check ────────────────────
  for (const { pattern, replacement } of GENERIC_DUTY_PATTERNS) {
    const match = allTexts.support.match(pattern);
    if (match) {
      const correctedDutySupport = allTexts.support.replace(pattern, replacement);
      flags.push({
        id: `FLG-${String(flagId++).padStart(3, "0")}`,
        severity: "warning",
        category: "Generic Duty Phrasing",
        source_document: "Employer Support Letter",
        target_document: "Employer Support Letter",
        conflict_summary: `Duty statement "${match[0]}" is too generic. USCIS requires specialty-specific technical language.`,
        exact_source_snippet: extractSnippet(allTexts.support, match[0]),
        exact_target_snippet: match[0],
        remediation_action: `Replace with: "${replacement}"`,
        suggested_replacement: correctedDutySupport,
        target_field: "supportLetter",
      });
      docStatuses[2].status = "flagged";
    }
  }

  // ─── SOC Code / Work Location Cross-check ──────────
  const socPatterns = [/SOC\s*(?:code)?\s*[:\-]?\s*(\d{2}-\d{4})/i, /O\*NET\s*[:\-]?\s*(\d{2}-\d{4})/i];
  let socLCA: string | null = null;
  let socI129: string | null = null;

  for (const p of socPatterns) {
    const m1 = allTexts.lca.match(p);
    if (m1) socLCA = m1[1];
    const m2 = allTexts.i129.match(p);
    if (m2) socI129 = m2[1];
  }

  if (socLCA && socI129 && socLCA !== socI129) {
    const correctedSOCI129 = allTexts.i129.replace(
      new RegExp(socI129!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), socLCA!
    );
    flags.push({
      id: `FLG-${String(flagId++).padStart(3, "0")}`,
      severity: "critical",
      category: "SOC Code Discrepancy",
      source_document: "Certified LCA",
      target_document: "Form I-129",
      conflict_summary: `LCA SOC code ${socLCA} does not match I-129 code ${socI129}. Immediate filing rejection risk.`,
      exact_source_snippet: extractSnippet(allTexts.lca, socLCA),
      exact_target_snippet: extractSnippet(allTexts.i129, socI129),
      remediation_action: `Correct the I-129 SOC code to match the LCA: ${socLCA}.`,
      suggested_replacement: correctedSOCI129,
      target_field: "formI129",
    });
    docStatuses[0].status = "flagged";
    docStatuses[1].status = "flagged";
  }

  // ─── Calculate Risk Score ───────────────────────────
  const criticalCount = flags.filter((f) => f.severity === "critical").length;
  const warningCount = flags.filter((f) => f.severity === "warning").length;
  let riskScore = Math.min(100, criticalCount * 25 + warningCount * 8);

  // Ensure minimum risk if any flags exist
  if (flags.length > 0 && riskScore < 15) riskScore = 15;

  // ─── Build Summary ─────────────────────────────────
  let summary: string;
  if (flags.length === 0) {
    summary = "All cross-document fields aligned. No structural vulnerabilities detected.";
  } else if (criticalCount > 0) {
    summary = `${criticalCount} critical and ${warningCount} advisory issues detected. Filing without correction risks RFE.`;
  } else {
    summary = `${warningCount} advisory issues found. Strengthen duty language before submission.`;
  }

  return {
    rfe_risk_score: riskScore,
    scrutiny_summary: summary,
    document_status: docStatuses,
    flags,
  };
}
