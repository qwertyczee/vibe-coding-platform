'use client'

import type { ChatUIMessage } from '@/components/chat/types'
import { TEST_PROMPTS } from '@/ai/constants'
import { MessageCircleIcon, SendIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Input } from '@/components/ui/input'
import { Message } from '@/components/chat/message'
import { Panel, PanelHeader } from '@/components/panels/panels'
import { Settings } from '@/components/settings/settings'
import { useChat } from '@ai-sdk/react'
import { useLocalStorageValue } from '@/lib/use-local-storage-value'
import { useCallback, useEffect } from 'react'
import { useSharedChatContext } from '@/lib/chat-context'
import { useSettings } from '@/components/settings/use-settings'
import { useSandboxStore } from './state'

interface Props {
  className: string
  modelId?: string
}

export function Chat({ className }: Props) {
  const [input, setInput] = useLocalStorageValue('prompt-input')
  const { chat } = useSharedChatContext()
  const { modelId, reasoningEffort } = useSettings()
  const { messages, sendMessage, status } = useChat<ChatUIMessage>({ chat })
  const { setChatStatus } = useSandboxStore()

  const validateAndSubmitMessage = useCallback(
    (text: string) => {
      if (text.trim()) {
        sendMessage({ text }, { body: { modelId, reasoningEffort } })
        setInput('')
      }
    },
    [sendMessage, modelId, setInput, reasoningEffort]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      validateAndSubmitMessage(input)
    },
    [validateAndSubmitMessage, input]
  )

  useEffect(() => {
    setChatStatus(status)
  }, [status, setChatStatus])

  return (
    <Panel className={className}>
      <PanelHeader>
        <div className="flex items-center font-mono font-semibold uppercase tracking-wide text-[11px] text-muted-foreground">
          <MessageCircleIcon className="mr-2 w-3.5 h-3.5" />
          Chat
        </div>
        <div className="ml-auto font-mono text-[10px] opacity-60">[{status}]</div>
      </PanelHeader>

      {/* Messages Area */}
      {messages.length === 0 ? (
        <div className="flex-1 min-h-0">
          <div className="flex h-full flex-col items-center justify-center font-mono text-xs text-muted-foreground">
            <p className="mb-2 font-semibold">Click and try one of these prompts:</p>
            <ul className="p-3 space-y-1 text-center">
              {TEST_PROMPTS.map((prompt, idx) => (
                <li
                  key={idx}
                  className="px-3 py-2 rounded-sm border border-dashed border-border/80 bg-muted/30 shadow-sm cursor-pointer hover:bg-muted hover:text-foreground"
                  onClick={() => validateAndSubmitMessage(prompt)}
                >
                  {prompt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <Conversation className="relative w-full">
          <ConversationContent className="space-y-4">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}

      {/* Composer */}
      <form
        className="flex items-center gap-2 p-2 border-t bg-background/80 border-border/80"
        onSubmit={handleSubmit}
      >
        <Settings />

        {/* Textbox-style input */}
        <Input
          aria-label="Message"
          className={[
            'w-full font-mono text-[12px] leading-[1.2]',
            'h-9 px-3 py-2 rounded-md',
            'bg-[#0f1113] border border-[#262a31]',
            'placeholder:text-[#7d828b]',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
            'focus-visible:ring-2 focus-visible:ring-[#3a404a] focus-visible:border-[#3a404a]',
          ].join(' ')}
          disabled={status === 'streaming' || status === 'submitted'}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          value={input}
        />

        {/* Compact send button */}
        <Button
          type="submit"
          size="sm"
          className="h-8 px-2 text-[11px] font-medium rounded-md bg-secondary border border-border hover:bg-secondary/80"
          disabled={status !== 'ready' || !input.trim()}
        >
          <SendIcon className="w-3.5 h-3.5" />
        </Button>
      </form>
    </Panel>
  )
}
