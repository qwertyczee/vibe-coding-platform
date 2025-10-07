'use client'

import { CommandsLogs } from '@/components/commands-logs/commands-logs'
import { memo } from 'react'

export const Logs = memo(function Logs(props: { className?: string }) {
  return <CommandsLogs className={props.className} />
})
