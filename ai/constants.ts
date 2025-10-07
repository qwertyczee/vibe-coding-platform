export enum Models {
  OpenAIGPT5 = 'openai/gpt-5',
  OpenAIGPT5Mini = 'openai/gpt-5-mini',
  XaiGrok4Fast = 'x-ai/grok-4-fast',
  ZaiGLM46 = 'z-ai/glm-4.6',
  AnthropicClaude45Sonnet = 'anthropic/claude-sonnet-4.5',
  GoogleGeminiFlash = 'google/gemini-2.5-flash',
}

export const DEFAULT_MODEL = Models.OpenAIGPT5

export const SUPPORTED_MODELS: string[] = [
  Models.OpenAIGPT5,
  Models.OpenAIGPT5Mini,
  Models.XaiGrok4Fast,
  Models.ZaiGLM46,
  Models.AnthropicClaude45Sonnet,
  Models.GoogleGeminiFlash,
]

export const TEST_PROMPTS = [
  'Generate a Next.js app that allows to list and search Pokemons',
  'Create a `golang` server that responds with "Hello World" to any request',
  'Create simple nodejs backend in one file, do not create anything else'
]
