import Anthropic from "@anthropic-ai/sdk"

// Lazy singleton — avoids instantiation on import in environments without the key
let _client: Anthropic | null = null

export function getAIClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

export async function generateText(prompt: string, maxTokens = 200): Promise<string> {
  const client = getAIClient()
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  })
  const block = message.content[0]
  return block.type === "text" ? block.text.trim() : ""
}
