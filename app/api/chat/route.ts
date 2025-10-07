import { type ChatUIMessage } from '@/components/chat/types';
import {
    convertToModelMessages,
    stepCountIs,
    streamText,
    type UIMessageStreamWriter,
} from 'ai';
import { DEFAULT_MODEL } from '@/ai/constants';
import { NextResponse } from 'next/server';
import { getAvailableModels, getModelOptions } from '@/ai/openrouter';
import { tools } from '@/ai/tools';
import prompt from './prompt.md';

interface BodyData {
    messages: ChatUIMessage[];
    modelId?: string;
    reasoningEffort?: 'low' | 'medium';
}

export async function POST(req: Request) {
    const [models, { messages, modelId = DEFAULT_MODEL, reasoningEffort }] =
        await Promise.all([
            getAvailableModels(),
            req.json() as Promise<BodyData>,
        ]);

    const model = models.find(model => model.id === modelId);
    if (!model) {
        return NextResponse.json(
            { error: `Model ${modelId} not found.` },
            { status: 400 }
        );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            let streamClosed = false;
            
            try {
                // Vytvořit writer který implementuje celé rozhraní
                const writer: UIMessageStreamWriter<any> = {
                    write: (chunk: any) => {
                        if (!streamClosed) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                        }
                    },
                    merge: (stream: ReadableStream) => {
                        // Sloučit další stream do hlavního streamu
                        (async () => {
                            const reader = stream.getReader();
                            try {
                                while (true) {
                                    const { done, value } = await reader.read();
                                    if (done) break;
                                    
                                    // Konvertovat value (objekt) na správný formát
                                    if (!streamClosed) {
                                        if (value instanceof Uint8Array) {
                                            controller.enqueue(value);
                                        } else {
                                            // Pokud je value objekt, serializovat ho
                                            controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
                                        }
                                    }
                                }
                            } catch (error) {
                                if (!streamClosed) {
                                    console.error('Error merging stream:', error);
                                }
                            }
                        })();
                    },
                    onError: (error: unknown) => {
                        console.error('Writer error:', error);
                        if (!streamClosed) {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                type: 'error',
                                error: errorMessage,
                            })}\n\n`));
                        }
                    },
                };

                const result = streamText({
                    ...getModelOptions(modelId, { reasoningEffort }),
                    system: prompt,
                    messages: convertToModelMessages(
                        messages.map(message => {
                            message.parts = message.parts.map(part => {
                                if (part.type === 'data-report-errors') {
                                    return {
                                        type: 'text',
                                        text:
                                            `There are errors in the generated code. This is the summary of the errors we have:\n` +
                                            `\`\`\`${part.data.summary}\`\`\`\n` +
                                            (part.data.paths?.length
                                                ? `The following files may contain errors:\n` +
                                                  `\`\`\`${part.data.paths?.join('\n')}\`\`\`\n`
                                                : '') +
                                            `Fix the errors reported.`,
                                    };
                                }
                                return part;
                            });
                            return message;
                        })
                    ),
                    stopWhen: stepCountIs(20),
                    tools: tools({ modelId, writer }),
                    onError: error => {
                        console.error('Error communicating with AI');
                        console.error(JSON.stringify(error, null, 2));
                    },
                });

                result.consumeStream();

                // Odeslat metadata na začátku
                let metadataSent = false;
                const messageMetadata = () => {
                    if (!metadataSent) {
                        metadataSent = true;
                        return {
                            model: model.name,
                        };
                    }
                    return undefined;
                };

                // Stream AI odpovědi
                writer.merge(
                    result.toUIMessageStream({
                        sendReasoning: true,
                        sendStart: false,
                        messageMetadata,
                    })
                );

                // Počkat na dokončení streamu
                await result.response;
                
                streamClosed = true;
                controller.close();
            } catch (error) {
                console.error('Stream error:', error);
                streamClosed = true;
                if (!streamClosed) {
                    controller.error(error);
                }
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}