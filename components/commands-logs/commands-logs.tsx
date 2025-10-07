'use client'

import { Panel, PanelHeader } from '@/components/panels/panels'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SquareChevronRight } from 'lucide-react'
import { useEffect, useRef, memo, useMemo } from 'react'
import { useCommands } from '@/app/state'

interface Props {
  className?: string
}

export const CommandsLogs = memo(function CommandsLogs(props: Props) {
  const commands = useCommands()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [commands])

  const memoizedCommands = useMemo(() => {
    return commands.map((command) => {
      const date = new Date(command.startedAt).toLocaleTimeString(
        'en-US',
        {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }
      )

      const line = `${command.command} ${command.args.join(' ')}`
      const body = command.logs?.map((log) => log.data).join('') || ''
      
      return {
        key: command.cmdId,
        content: `[${date}] ${line}\n${body}`
      }
    })
  }, [commands])

  return (
    <Panel className={props.className}>
      <PanelHeader>
        <SquareChevronRight className="mr-2 w-4" />
        <span className="font-mono uppercase font-semibold">
          Sandbox Remote Output
        </span>
      </PanelHeader>
      <div className="h-[calc(100%-2rem)]">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-2">
            {memoizedCommands.map((command) => (
              <pre
                key={command.key}
                className="whitespace-pre-wrap font-mono text-sm"
              >
                {command.content}
              </pre>
            ))}
          </div>
          <div ref={bottomRef} />
        </ScrollArea>
      </div>
    </Panel>
  )
})
