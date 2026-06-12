// ─────────────────────────────────────────────────────
// Alma Pre-Flight — Evidence Checklist Map
// Maps RFE flag categories to recommended supporting
// evidence items for proactive justification.
// ─────────────────────────────────────────────────────

export interface EvidenceItem {
  id: string;
  label: string;
  description: string;
  priority: "required" | "recommended" | "optional";
}

export interface EvidenceCategory {
  category: string;
  rationale: string;
  items: EvidenceItem[];
}

export const EVIDENCE_MAP: Record<string, EvidenceCategory> = {
  "Job Title Mismatch": {
    category: "Job Title Mismatch",
    rationale: "Title inconsistencies across documents signal classification errors to USCIS adjudicators.",
    items: [
      {
        id: "jtm-1",
        label: "Amended LCA with corrected title",
        description: "File a new LCA reflecting the exact title used across all documents.",
        priority: "required",
      },
      {
        id: "jtm-2",
        label: "Organizational chart showing position hierarchy",
        description: "Demonstrate the title's place within the company structure.",
        priority: "recommended",
      },
      {
        id: "jtm-3",
        label: "Job posting or internal requisition",
        description: "Original job posting proving the title was consistently used during recruitment.",
        priority: "recommended",
      },
    ],
  },

  "Wage Level Misalignment": {
    category: "Wage Level Misalignment",
    rationale: "Level I designates an entry-level position. Supervisory or independent duties contradict this classification.",
    items: [
      {
        id: "wlm-1",
        label: "DOL wage calculation worksheet",
        description: "Document showing how the prevailing wage was determined for the specific SOC code and area.",
        priority: "required",
      },
      {
        id: "wlm-2",
        label: "Supervisory hierarchy diagram",
        description: "Show reporting structure confirming beneficiary works under direct supervision.",
        priority: "required",
      },
      {
        id: "wlm-3",
        label: "Revised duty descriptions",
        description: "Rewritten job duties removing supervisory or independent decision-making language.",
        priority: "required",
      },
      {
        id: "wlm-4",
        label: "Comparable industry wage data",
        description: "Third-party salary surveys (Glassdoor, BLS OES) validating the offered wage at the designated level.",
        priority: "recommended",
      },
    ],
  },

  "Experience vs. Wage Level Conflict": {
    category: "Experience vs. Wage Level Conflict",
    rationale: "High experience requirements paired with an entry-level wage signal misclassification.",
    items: [
      {
        id: "ewl-1",
        label: "Revised experience requirement",
        description: "Amend the support letter to require 0-2 years for Level I positions.",
        priority: "required",
      },
      {
        id: "ewl-2",
        label: "Training plan documentation",
        description: "Structured training plan justifying why experienced candidates still need employer-specific onboarding.",
        priority: "recommended",
      },
      {
        id: "ewl-3",
        label: "Upgraded LCA at higher wage level",
        description: "File a new LCA at Level II or higher to match the actual experience requirements.",
        priority: "recommended",
      },
    ],
  },

  "Beneficiary Overqualification Signal": {
    category: "Beneficiary Overqualification Signal",
    rationale: "An overqualified beneficiary at an entry-level wage raises adjudicator suspicion about position legitimacy.",
    items: [
      {
        id: "boq-1",
        label: "Role-specific training justification letter",
        description: "Explain proprietary technologies or domain-specific skills the beneficiary must acquire on-the-job.",
        priority: "required",
      },
      {
        id: "boq-2",
        label: "Career transition narrative",
        description: "Document showing the beneficiary is transitioning to a new specialty area within their field.",
        priority: "recommended",
      },
    ],
  },

  "Degree Field Mismatch": {
    category: "Degree Field Mismatch",
    rationale: "The beneficiary's degree does not directly match the employer's stated requirement.",
    items: [
      {
        id: "dfm-1",
        label: "Third-party credential evaluation",
        description: "Academic evaluation mapping the beneficiary's coursework to the required degree field.",
        priority: "required",
      },
      {
        id: "dfm-2",
        label: "Expert opinion letter",
        description: "Letter from an academic expert confirming the degree's relevance to the specialty occupation.",
        priority: "required",
      },
      {
        id: "dfm-3",
        label: "Course-by-course transcript analysis",
        description: "Detailed breakdown showing relevant credit hours in the required discipline.",
        priority: "required",
      },
      {
        id: "dfm-4",
        label: "Broadened degree requirement in support letter",
        description: "Expand the requirement to 'Computer Science, Electrical Engineering, or closely related field.'",
        priority: "recommended",
      },
      {
        id: "dfm-5",
        label: "Industry job postings accepting related degrees",
        description: "5-10 comparable job postings showing the industry accepts the beneficiary's degree for similar roles.",
        priority: "recommended",
      },
    ],
  },

  "Generic Duty Phrasing": {
    category: "Generic Duty Phrasing",
    rationale: "Vague duty descriptions fail to demonstrate the specialty nature of the occupation.",
    items: [
      {
        id: "gdp-1",
        label: "Revised duty statements with technical specificity",
        description: "Replace generic phrases with engineering-specific language referencing tools, methodologies, and frameworks.",
        priority: "required",
      },
      {
        id: "gdp-2",
        label: "Industry expert declaration",
        description: "Expert letter confirming that the described duties require specialized knowledge and a bachelor's degree.",
        priority: "recommended",
      },
      {
        id: "gdp-3",
        label: "OOH / ONET occupation profile printout",
        description: "Bureau of Labor Statistics documentation showing the occupation's typical education requirements.",
        priority: "recommended",
      },
    ],
  },

  "SOC Code Discrepancy": {
    category: "SOC Code Discrepancy",
    rationale: "Mismatched SOC codes between the LCA and I-129 will trigger immediate adjudicator scrutiny.",
    items: [
      {
        id: "scd-1",
        label: "Corrected Form I-129",
        description: "Amend the I-129 to match the SOC code certified on the LCA.",
        priority: "required",
      },
      {
        id: "scd-2",
        label: "O*NET occupation profile comparison",
        description: "Show that both codes map to the same occupation or explain the rationale for the selected code.",
        priority: "recommended",
      },
    ],
  },
};

/**
 * Get evidence items for a specific flag category.
 * Falls back to a generic checklist if no exact match is found.
 */
export function getEvidenceForCategory(category: string): EvidenceCategory | null {
  return EVIDENCE_MAP[category] || null;
}
