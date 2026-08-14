/**
 * RESQORA AI provider (server-only).
 *
 * Talks directly to Google Gemini through its OpenAI-compatible chat endpoint,
 * so the app has no dependency on any hosted gateway. Configure with:
 *   GEMINI_API_KEY   (required)  — Google AI Studio key
 *   AI_MODEL         (optional)  — defaults to gemini-2.5-flash
 *   AI_API_BASE_URL  (optional)  — override for another OpenAI-compatible API
 */
export type AiMessage = { role: "system" | "user" | "assistant"; content: unknown };

function baseUrl() {
  return (
    process.env["AI_API_BASE_URL"] || "https://generativelanguage.googleapis.com/v1beta/openai"
  ).replace(/\/$/, "");
}

export function aiModel() {
  return process.env["AI_MODEL"] || "gemini-2.5-flash";
}

export function aiApiKey() {
  return process.env["GEMINI_API_KEY"] || process.env["GOOGLE_AI_API_KEY"] || "";
}

/** Sends a chat completion and returns the raw assistant text. */
export async function chatCompletion(options: {
  messages: AiMessage[];
  jsonObject?: boolean;
  label?: string;
}): Promise<string> {
  const key = aiApiKey();
  if (!key) throw new Error("AI is not configured");
  const label = options.label ?? "AI";

  const response = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: aiModel(),
      messages: options.messages,
      ...(options.jsonObject ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (response.status === 429) throw new Error(`${label} is busy right now — please retry in a moment.`);
  if (response.status === 401 || response.status === 403)
    throw new Error("AI credentials were rejected — check GEMINI_API_KEY.");
  if (!response.ok) {
    console.error(`${label} request failed [${response.status}]: ${await response.text()}`);
    throw new Error(`${label} request failed (${response.status})`);
  }

  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return payload.choices?.[0]?.message?.content ?? "";
}
