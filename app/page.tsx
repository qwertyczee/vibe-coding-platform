'use client'

import { Chat } from './chat'
import { FileExplorer } from './file-explorer'
import { Header } from './header'
import { Horizontal, Vertical } from '@/components/layout/panels'
import { Logs } from './logs'
import { Preview } from './preview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Page() {
  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden p-2 space-y-2">
      <Header className="flex items-center w-full" />

      <div className="flex flex-1 w-full min-h-0 overflow-hidden">
        <Horizontal
          defaultLayout={[30, 70]}
          left={<Chat className="flex-1 overflow-hidden" />}
          right={
            <Tabs defaultValue="code" className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="code" className="flex-1 min-h-0">
                <Vertical
                  defaultLayout={[75, 25]}
                  top={<FileExplorer className="flex-1 overflow-hidden" />}
                  bottom={<Logs className="flex-1 overflow-hidden" />}
                />
              </TabsContent>
              
              <TabsContent value="preview" className="flex-1 min-h-0">
                <Preview className="flex-1 overflow-hidden" />
              </TabsContent>
            </Tabs>
          }
        />
      </div>
    </div>
  )
}