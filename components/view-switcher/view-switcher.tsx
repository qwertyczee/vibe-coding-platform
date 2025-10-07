'use client'

import { Switch } from '@/components/ui/switch'
import { useCurrentView, useSetCurrentView } from '@/app/state'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

export function ViewSwitcher({ className }: Props) {
  const currentView = useCurrentView()
  const setCurrentView = useSetCurrentView()

  const handleToggle = (checked: boolean) => {
    setCurrentView(checked ? 'code' : 'preview')
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <span className={cn(
        'text-sm font-medium transition-colors',
        currentView === 'preview' ? 'text-primary' : 'text-muted-foreground'
      )}>
        Preview
      </span>
      <Switch
        checked={currentView === 'code'}
        onCheckedChange={handleToggle}
        aria-label="Toggle between preview and code view"
      />
      <span className={cn(
        'text-sm font-medium transition-colors',
        currentView === 'code' ? 'text-primary' : 'text-muted-foreground'
      )}>
        Code
      </span>
    </div>
  )
}