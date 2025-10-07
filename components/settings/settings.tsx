import { AutoFixErrors } from './auto-fix-errors'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ReasoningEffort } from './reasoning-effort'
import { ModelSelector } from './model-selector'
import { SlidersVerticalIcon } from 'lucide-react'

export function Settings() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="cursor-pointer" variant="outline" size="sm">
          <SlidersVerticalIcon className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-96">
        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Model Selection</h3>
            <ModelSelector />
          </div>
          <AutoFixErrors />
          <ReasoningEffort />
        </div>
      </PopoverContent>
    </Popover>
  )
}
