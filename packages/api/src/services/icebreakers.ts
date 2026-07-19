import Anthropic from "@anthropic-ai/sdk";

// Icebreakers are generated once per event (at creation) and stored on the
// event row — connects stay fast and cost one model call per event, not per
// connection. Without an API key the feature degrades to a generic list.
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const FALLBACK_ICEBREAKERS = [
  "What brought you here today?",
  "What's the most interesting thing you've seen or heard so far?",
  "What are you working on right now that you're excited about?",
  "Who's someone here you think everyone should meet?",
  "What's one thing you're hoping to take away from this event?",
];

const SCHEMA = {
  type: "object",
  properties: {
    icebreakers: {
      type: "array",
      items: { type: "string" },
      description: "Conversation starter questions, one sentence each",
    },
  },
  required: ["icebreakers"],
  additionalProperties: false,
} as const;

export async function generateIcebreakers(
  eventName: string,
  location?: string
): Promise<string[]> {
  if (!client) return FALLBACK_ICEBREAKERS;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SCHEMA },
      },
      system:
        "You write icebreaker questions for people who just met at an event by scanning each other's contact QR codes. Questions must be specific to the event's theme, answerable by anyone attending, and short enough to read aloud in one breath. No yes/no questions.",
      messages: [
        {
          role: "user",
          content: `Write 8 icebreaker questions for this event:\nName: ${eventName}${location ? `\nLocation: ${location}` : ""}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") return FALLBACK_ICEBREAKERS;
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return FALLBACK_ICEBREAKERS;
    const parsed = JSON.parse(block.text) as { icebreakers: string[] };
    const list = parsed.icebreakers.filter((s) => typeof s === "string" && s.trim().length > 0);
    return list.length > 0 ? list : FALLBACK_ICEBREAKERS;
  } catch {
    // Generation is best-effort — event creation must never fail because of it.
    return FALLBACK_ICEBREAKERS;
  }
}

export function pickIcebreaker(icebreakers: unknown): string | null {
  if (!Array.isArray(icebreakers) || icebreakers.length === 0) return null;
  return icebreakers[Math.floor(Math.random() * icebreakers.length)];
}
