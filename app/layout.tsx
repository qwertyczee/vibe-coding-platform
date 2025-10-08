import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ChatProvider } from '@/lib/chat-context';
import { CommandLogsStream } from '@/components/commands-logs/commands-logs-stream';
import { ErrorMonitor } from '@/components/error-monitor/error-monitor';
import { SandboxState } from '@/components/modals/sandbox-state';
import { Toaster } from '@/components/ui/sonner';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Script from 'next/script';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});

const jetbrains = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

const title = 'OSS Vibe Coding Platform';
const description = `This is a demo of an end-to-end coding platform where the user can enter text prompts, and the agent will create a full stack application. It uses Vercel's AI Cloud services like Sandbox for secure code execution, AI Gateway for GPT-5 and other models support, Fluid Compute for efficient rendering and streaming, and it's built with Next.js and the AI SDK.`;

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        images: [
            {
                url: 'https://assets.vercel.com/image/upload/v1754588799/OSSvibecodingplatform/OG.png',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        images: [
            {
                url: 'https://assets.vercel.com/image/upload/v1754588799/OSSvibecodingplatform/OG.png',
            },
        ],
    },
};

export default function RootLayout({
    children,
}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <Script src="https://unpkg.com/react-scan/dist/auto.global.js" />
            <body
                className={cn(
                    'min-h-screen bg-background text-foreground antialiased',
                    inter.variable,
                    jetbrains.variable
                )}
            >
                <Suspense fallback={null}>
                    <NuqsAdapter>
                        <ChatProvider>
                            <ErrorMonitor>
                                <div className="flex min-h-screen flex-col">
                                    {children}
                                </div>
                            </ErrorMonitor>
                        </ChatProvider>
                    </NuqsAdapter>
                </Suspense>
                <Toaster />
                <CommandLogsStream />
                <SandboxState />
            </body>
        </html>
    );
}
