'use client';

import { Chat } from './chat';
import { FileExplorer } from './file-explorer';
import { Header } from './header';
import { Horizontal, Vertical } from '@/components/layout/panels';
import { Logs } from './logs';
import { Preview } from './preview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Page() {
    return (
        <div className="flex h-screen max-h-screen flex-col space-y-2 overflow-hidden p-2">
            <Header className="flex w-full items-center" />

            <div className="flex min-h-0 w-full flex-1 overflow-hidden">
                <Horizontal
                    defaultLayout={[30, 70]}
                    left={<Chat className="flex-1 overflow-hidden" />}
                    right={
                        <Tabs
                            defaultValue="code"
                            className="flex h-full w-full flex-col"
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="code">Code</TabsTrigger>
                                <TabsTrigger value="preview">
                                    Preview
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent
                                value="code"
                                className="min-h-0 flex-1 data-[state=inactive]:hidden"
                                forceMount
                            >
                                <Vertical
                                    defaultLayout={[75, 25]}
                                    top={
                                        <FileExplorer className="flex-1 overflow-hidden" />
                                    }
                                    bottom={
                                        <Logs className="flex-1 overflow-hidden" />
                                    }
                                />
                            </TabsContent>

                            <TabsContent
                                value="preview"
                                className="min-h-0 flex-1 data-[state=inactive]:hidden"
                                forceMount
                            >
                                <Preview className="flex-1 overflow-hidden" />
                            </TabsContent>
                        </Tabs>
                    }
                />
            </div>
        </div>
    );
}
