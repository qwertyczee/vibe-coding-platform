import { streamObject, type ModelMessage } from 'ai';
import { getModelOptions } from '@/ai/openrouter';
import { Deferred } from '@/lib/deferred';
import z from 'zod/v3';

export type File = z.infer<typeof fileSchema>;

const fileSchema = z.object({
    path: z
        .string()
        .describe(
            "Path to the file in the Vercel Sandbox (relative paths from sandbox root, e.g., 'src/main.js', 'package.json', 'components/Button.tsx')"
        ),
    content: z
        .string()
        .describe(
            'The content of the file as a utf8 string (complete file contents that will replace any existing file at this path)'
        ),
});

interface Params {
    messages: ModelMessage[];
    modelId: string;
    paths: string[];
}

interface FileContentChunk {
    files: z.infer<typeof fileSchema>[];
    paths: string[];
    written: string[];
}

enum FileState {
    NotStarted = 0,
    Started = 1,
    InProgress = 2,
    Complete = 3,
}

export async function* getContents(
    params: Params
): AsyncGenerator<FileContentChunk> {
    console.log('🔍 getContents started with paths:', params.paths);
    const generated: z.infer<typeof fileSchema>[] = [];
    const deferred = new Deferred<void>();
    const fileStates = new Map<string, FileState>(); // Sleduje stav každého souboru
    
    const result = streamObject({
        ...getModelOptions(params.modelId, { reasoningEffort: 'minimal' }),
        maxOutputTokens: 64000,
        system: 'You are a file content generator. You must generate files based on the conversation history and the provided paths. NEVER generate lock files (pnpm-lock.yaml, package-lock.json, yarn.lock) - these are automatically created by package managers.',
        messages: [
            ...params.messages,
            {
                role: 'user',
                content: `Generate the content of the following files according to the conversation: ${params.paths.map(
                    path => `\n - ${path}`
                )}`,
            },
        ],
        schema: z.object({ files: z.array(fileSchema) }),
        onError: error => {
            deferred.reject(error);
            console.error('Error communicating with AI');
            console.error(JSON.stringify(error, null, 2));
        },
    });

    console.log('🔄 Starting to process partialObjectStream');
    
    for await (const items of result.partialObjectStream) {
        if (!Array.isArray(items?.files)) {
            continue;
        }

        const written = generated.map(file => file.path);
        const newFiles = items.files.slice(generated.length);
        
        // Kompletní soubory (všechny kromě posledního)
        const completeFiles = newFiles
            .slice(0, -1)
            .map(file => fileSchema.parse(file));

        // Yield kompletní soubory
        if (completeFiles.length > 0) {
            const paths = written.concat(completeFiles.map(f => f.path));
            console.log('✅ Yielding complete files:', completeFiles.map(f => f.path));
            
            // Označ je jako complete
            completeFiles.forEach(f => fileStates.set(f.path, FileState.Complete));
            
            yield { files: completeFiles, paths, written };
            generated.push(...completeFiles);
        }
        
        // Soubor v procesu (poslední)
        const inProgressFile = newFiles[newFiles.length - 1];
        
        if (inProgressFile?.path) {
            const currentState = fileStates.get(inProgressFile.path) || FileState.NotStarted;
            const paths = [...written, ...generated.map(f => f.path), inProgressFile.path];
            
            // START - první yield pro tento soubor
            if (currentState === FileState.NotStarted) {
                console.log('🚀 Yielding START for file:', inProgressFile.path);
                yield { files: [], written: generated.map(f => f.path), paths };
                fileStates.set(inProgressFile.path, FileState.Started);
            }
            // IN-PROGRESS - druhý yield JEN JEDNOU když má dostatek contentu
            else if (currentState === FileState.Started && 
                     inProgressFile.content && 
                     inProgressFile.content.length > 100) {
                console.log('⏳ Yielding IN-PROGRESS for file:', inProgressFile.path, 
                    `(${inProgressFile.content.length} chars)`);
                yield { files: [], written: generated.map(f => f.path), paths };
                fileStates.set(inProgressFile.path, FileState.InProgress);
            }
            // Po InProgress už žádné další yieldy dokud není complete
        }
    }

    console.log('🏁 Finished processing partialObjectStream, waiting for final result');
    const raceResult = await Promise.race([result.object, deferred.promise]);
    console.log('🏆 Race result received, files count:', raceResult?.files?.length || 0);
    
    if (!raceResult) {
        throw new Error(
            'Unexpected Error: Deferred was resolved before the result'
        );
    }

    const written = generated.map(file => file.path);
    const files = raceResult.files.slice(generated.length);
    const paths = written.concat(files.map(file => file.path));
    
    if (files.length > 0) {
        console.log('🎯 Final yield of COMPLETE files:', files.map(f => f.path));
        yield { files, written, paths };
        generated.push(...files);
    }
    
    console.log('✨ getContents completed, total files generated:', generated.length);
}