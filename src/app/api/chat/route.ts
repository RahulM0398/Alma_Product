import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Alma, a specialized H-1B petition filing assistant embedded inside the Alma Pre-Flight audit workspace. You help immigration paralegals and attorneys understand audit findings, USCIS filing requirements, and cross-document consistency rules.

Your context includes the user's current petition documents and any audit results from the Pre-Flight engine.

Formatting & Style:
- Always format your answers using clean, structured Markdown.
- Use descriptive headings (e.g., ## Section Title or ### Sub-section) to break information into logical parts.
- Present details in complete, well-formed paragraphs with double newlines separating them. Avoid raw, single-line blocks of text.
- Use bold text (**keyword**) to emphasize critical elements, documents, or terms.
- Use inline code (\`field_name\` or \`value\`) to reference exact values, fields, or snippets.
- Use bullet points or numbered lists for comparison, lists of inconsistencies, or step-by-step instructions.
- Ensure your layout feels highly organized, professional, and digestible, similar to ChatGPT's outputs.

Content Rules:
- Answer directly and specifically. No filler or generic disclaimers.
- Reference specific documents (LCA, I-129, Support Letter, Credentials, RFE Letter) by name.
- When discussing conflicts or fixes, reference the exact text that needs to change.
- Use immigration-specific terminology accurately.
- If you don't have enough context, say so directly.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, apiKey: clientApiKey, context } = body;

    const apiKey = clientApiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Please define OPENAI_API_KEY in your .env.local file." },
        { status: 400 }
      );
    }

    // Build context block from petition data
    let contextBlock = "";
    if (context) {
      contextBlock = "\n\nCurrent petition context:\n";
      if (context.formI129) contextBlock += `\n[Form I-129]:\n${context.formI129.slice(0, 2000)}\n`;
      if (context.lcaText) contextBlock += `\n[Certified LCA]:\n${context.lcaText.slice(0, 2000)}\n`;
      if (context.supportLetter) contextBlock += `\n[Support Letter]:\n${context.supportLetter.slice(0, 2000)}\n`;
      if (context.credentials) contextBlock += `\n[Credentials]:\n${context.credentials.slice(0, 2000)}\n`;
      if (context.rfeLetter) contextBlock += `\n[USCIS RFE Letter]:\n${context.rfeLetter.slice(0, 3000)}\n`;
      if (context.auditResult) {
        contextBlock += `\n[Audit Results]:\nRFE Risk Score: ${context.auditResult.rfe_risk_score}/100\nSummary: ${context.auditResult.scrutiny_summary}\nFlags: ${JSON.stringify(context.auditResult.flags?.map((f: { id: string; severity: string; category: string; conflict_summary: string; remediation_action: string }) => ({
          id: f.id, severity: f.severity, category: f.category, summary: f.conflict_summary, fix: f.remediation_action
        })))}\n`;
      }
    }

    const fullSystemPrompt = SYSTEM_PROMPT + contextBlock;

    // Convert messages to OpenAI format
    const openAiMessages = [
      { role: "system", content: fullSystemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: openAiMessages,
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "OpenAI API error: " + response.status + " — " + errorText },
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

    return NextResponse.json({ reply: text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
