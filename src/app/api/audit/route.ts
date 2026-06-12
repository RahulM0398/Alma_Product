import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a zero-tolerance USCIS Adjudication Auditor evaluating a drafted H-1B petition package. Your sole objective is to analyze the unstructured text across a filing package, detect internal inconsistencies, identify structural compliance vulnerabilities, and surface actionable rephrasing recommendations to eliminate Specialty Occupation and Wage Level RFEs before submission.

Execute these verification passes:

Pass 1: Job Title & Identity Alignment — Scan and compare job titles across documents. Flag drift in seniority or classification.

Pass 2: Wage Level vs. Task Complexity — Identify the Wage Level in the LCA. For Level I, flag words like "Lead", "Architect", "Manage", "Formulate strategy", "Unsupervised execution". Flag experience conflicts.

Pass 3: Specialty Occupation & Degree Alignment — Compare degree requirements against the beneficiary's actual major. Flag generic duty phrasing.

Text constraints:
- scrutiny_summary: max 25 words, direct, no fluff
- conflict_summary: max 30 words
- remediation_action: concise, start with action verb

Return ONLY a valid JSON object matching this exact schema:
{
  "rfe_risk_score": 0,
  "scrutiny_summary": "",
  "document_status": [
    { "document": "Form I-129", "status": "verified" },
    { "document": "LCA Form", "status": "verified" },
    { "document": "Support Letter", "status": "verified" },
    { "document": "Credentials", "status": "verified" }
  ],
  "flags": [
    {
      "id": "FLG-001",
      "severity": "critical",
      "category": "",
      "source_document": "",
      "target_document": "",
      "conflict_summary": "",
      "exact_source_snippet": "",
      "exact_target_snippet": "",
      "remediation_action": ""
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formI129, lcaText, supportLetter, credentials, rfeLetter, mode, apiKey: clientApiKey } = body;

    const apiKey = clientApiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Please define OPENAI_API_KEY in your .env.local file to use live OpenAI audits." },
        { status: 400 }
      );
    }

    let systemInstruction = SYSTEM_PROMPT;
    let userPrompt = "";

    if (mode === "post-filing") {
      systemInstruction = `You are a zero-tolerance USCIS Adjudication Auditor analyzing a USCIS Request for Evidence (RFE) letter alongside draft H-1B petition documents. Your objective is to map each USCIS objection in the RFE letter directly to sections of the draft petition documents (Form I-129, LCA, Support Letter, or Credentials), explain the mismatch, and generate remediation actions.

Return ONLY a valid JSON object matching this exact schema:
{
  "rfe_risk_score": 0,
  "scrutiny_summary": "",
  "document_status": [
    { "document": "Form I-129", "status": "verified" },
    { "document": "LCA Form", "status": "verified" },
    { "document": "Support Letter", "status": "verified" },
    { "document": "Credentials", "status": "verified" },
    { "document": "USCIS RFE Letter", "status": "verified" }
  ],
  "flags": [
    {
      "id": "FLG-001",
      "severity": "critical",
      "category": "Objection Category (e.g. Specialty Occupation or Wage Level)",
      "source_document": "USCIS RFE Letter",
      "target_document": "Document with the conflict (e.g. Employer Support Letter)",
      "conflict_summary": "Summary of USCIS challenge and the draft mismatch",
      "exact_source_snippet": "Snippet from the USCIS RFE letter",
      "exact_target_snippet": "Snippet from the draft document",
      "remediation_action": "Action to fix it",
      "suggested_replacement": "Optional draft correction text",
      "target_field": "Optional draft target field"
    }
  ]
}`;

      userPrompt = `Analyze these draft H-1B petition documents and map them against the USCIS RFE Letter objections:

<USCIS_RFE_Letter>
${rfeLetter || "Not provided"}
</USCIS_RFE_Letter>

<Form_I129_Text>
${formI129 || "Not provided"}
</Form_I129_Text>

<Certified_LCA_Text>
${lcaText || "Not provided"}
</Certified_LCA_Text>

<Employer_Support_Letter_Text>
${supportLetter || "Not provided"}
</Employer_Support_Letter_Text>

<Beneficiary_Credentials_Text>
${credentials || "Not provided"}
</Beneficiary_Credentials_Text>`;
    } else {
      userPrompt = `Analyze these four H-1B petition documents for cross-document inconsistencies:

<Form_I129_Text>
${formI129 || "Not provided"}
</Form_I129_Text>

<Certified_LCA_Text>
${lcaText || "Not provided"}
</Certified_LCA_Text>

<Employer_Support_Letter_Text>
${supportLetter || "Not provided"}
</Employer_Support_Letter_Text>

<Beneficiary_Credentials_Text>
${credentials || "Not provided"}
</Beneficiary_Credentials_Text>`;
    }

    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "OpenAI API error: " + response.status + " " + errorText },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json(
        { error: "Empty response from OpenAI API." },
        { status: 502 }
      );
    }

    const auditResult = JSON.parse(text);
    return NextResponse.json(auditResult);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
