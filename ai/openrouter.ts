import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { Models, SUPPORTED_MODELS } from './constants';
import type { JSONValue } from 'ai';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import type { LanguageModelV2 } from '@ai-sdk/provider';

export async function getAvailableModels() {
    return SUPPORTED_MODELS.map((modelId: string) => ({
        id: modelId,
        name: modelId,
    }));
}

export interface ModelOptions {
    model: LanguageModelV2;
    providerOptions?: Record<string, Record<string, JSONValue>>;
    headers?: Record<string, string>;
}

export function getModelOptions(
    modelId: string,
    options?: { reasoningEffort?: 'minimal' | 'low' | 'medium' }
): ModelOptions {
    const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
    });

    if (modelId === Models.OpenAIGPT5) {
        return {
            model: openrouter(modelId),
            providerOptions: {
                openai: {
                    include: ['reasoning.encrypted_content'],
                    reasoningEffort: options?.reasoningEffort ?? 'low',
                    reasoningSummary: 'auto',
                    serviceTier: 'priority',
                } satisfies OpenAIResponsesProviderOptions,
            },
        };
    }

    if (modelId === Models.AnthropicClaude45Sonnet) {
        return {
            model: openrouter(modelId),
            headers: {
                'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
            },
            providerOptions: {
                anthropic: {
                    cacheControl: { type: 'ephemeral' },
                },
            },
        };
    }

    return {
        model: openrouter(modelId),
    };
}
