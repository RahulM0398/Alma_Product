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

  "Specialty Occupation": {
    category: "Specialty Occupation",
    rationale: "USCIS challenges that the position doesn't require a highly specialized bachelor's degree. You must prove the complexity of the duties.",
    items: [
      {
        id: "so-1",
        label: "Technical job description addendum",
        description: "A highly detailed breakdown of duties mapping to specific university-level coursework.",
        priority: "required",
      },
      {
        id: "so-2",
        label: "Expert Opinion Letter (EOL)",
        description: "An evaluation from a university professor certifying that the role requires specialized knowledge.",
        priority: "required",
      },
      {
        id: "so-3",
        label: "Comparable industry job postings",
        description: "5-10 listings from competitors demonstrating that a bachelor's degree in a specific field is standard for the role.",
        priority: "recommended",
      },
      {
        id: "so-4",
        label: "Organizational chart showing peer credentials",
        description: "Show that peers in similar roles within the organization hold equivalent degrees.",
        priority: "recommended",
      },
    ],
  },

  "Wage Level Challenge": {
    category: "Wage Level Challenge",
    rationale: "USCIS challenges the Level I entry-level wage. You must show the duties are performed under direct supervision or align them with Level I definitions.",
    items: [
      {
        id: "wlc-1",
        label: "Revised duty statements emphasizing oversight",
        description: "Remove terms like 'lead', 'architect', or 'independent' and replace them with 'assists', 'collaborates', or 'under supervision'.",
        priority: "required",
      },
      {
        id: "wlc-2",
        label: "Supervisory reporting hierarchy diagram",
        description: "Visually demonstrate that the beneficiary reports directly to senior staff who oversee their daily work.",
        priority: "required",
      },
      {
        id: "wlc-3",
        label: "Detailed supervisor letter",
        description: "A letter from the direct manager describing the close supervision and guidance provided to the beneficiary.",
        priority: "recommended",
      },
    ],
  },

  "Degree Match Challenge": {
    category: "Degree Match Challenge",
    rationale: "USCIS challenges the alignment of the beneficiary's specific degree with the specialty occupation.",
    items: [
      {
        id: "dmc-1",
        label: "Third-party academic credential evaluation",
        description: "Mapping coursework from the beneficiary's degree directly to the required academic field.",
        priority: "required",
      },
      {
        id: "dmc-2",
        label: "Course-by-course transcript analysis",
        description: "Detailed credit-hour breakdown demonstrating sufficient study in the required discipline.",
        priority: "required",
      },
      {
        id: "dmc-3",
        label: "Industry expert evaluation letter",
        description: "A letter from a professor or industry leader explaining why the degree is relevant to the job duties.",
        priority: "recommended",
      },
    ],
  },

  "Missing USCIS RFE Letter": {
    category: "Missing USCIS RFE Letter",
    rationale: "To map specific USCIS challenges, the full text of the RFE letter is required.",
    items: [
      {
        id: "mrfe-1",
        label: "Upload or paste RFE letter",
        description: "Provide the complete PDF text of the official USCIS Request for Evidence letter.",
        priority: "required",
      },
    ],
  },
};

/**
 * Get evidence items for a specific flag category.
 * Falls back to a generic checklist if no exact match is found.
 */
export function getEvidenceForCategory(category: string): EvidenceCategory {
  // Exact match
  if (EVIDENCE_MAP[category]) {
    return EVIDENCE_MAP[category];
  }

  // Fuzzy / alias mapping
  const catLower = category.toLowerCase();
  if (catLower.includes("specialty occupation")) {
    return EVIDENCE_MAP["Specialty Occupation"];
  }
  if (catLower.includes("wage level")) {
    return EVIDENCE_MAP["Wage Level Challenge"] || EVIDENCE_MAP["Wage Level Misalignment"];
  }
  if (catLower.includes("degree")) {
    return EVIDENCE_MAP["Degree Match Challenge"] || EVIDENCE_MAP["Degree Field Mismatch"];
  }

  // Fallback to a generic checklist
  return {
    category: category,
    rationale: "Gathering supporting evidence helps establish eligibility and proactively addresses potential USCIS objections.",
    items: [
      {
        id: "gen-1",
        label: "Clarified Employer Support Letter",
        description: "Refining the job duties and qualifications details in the petition package.",
        priority: "required",
      },
      {
        id: "gen-2",
        label: "Form I-129 / LCA correlation check",
        description: "Verifying that job titles, SOC codes, and worksites are identical across forms.",
        priority: "required",
      },
      {
        id: "gen-3",
        label: "Company profile & credentials",
        description: "Organizational charts, employee counts, or project plans validating the position.",
        priority: "recommended",
      },
    ],
  };
}
