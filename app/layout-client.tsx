'use client'

import { Chat } from './chat'
import { FileExplorer } from './file-explorer'
import { Header } from './header'
import { Horizontal, Vertical } from '@/components/layout/panels'
import { Logs } from './logs'
import { Preview } from './preview'
import { ViewSwitcher } from '@/components/view-switcher/view-switcher'
import { useCurrentView } from './state'

interface Props {
  horizontalSizes?: number[]
  verticalSizes?: number[]
}

export function LayoutClient({ horizontalSizes, verticalSizes }: Props) {
  const currentView = useCurrentView()

  // Mobile layout component
  function MobileLayout() {
    return (
      <div className="flex flex-1 w-full overflow-hidden pt-2 md:hidden">
        <div className="flex flex-col w-full">
          <div className="flex justify-center mb-2">
            <ViewSwitcher />
          </div>
          <div className="flex flex-1 space-x-2">
            <div className="flex-1">
              <Chat className="h-full overflow-hidden" />
            </div>
            <div className="flex-1">
              {currentView === 'preview' ? (
                <Preview className="h-full overflow-hidden" />
              ) : (
                <FileExplorer className="h-full overflow-hidden" />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Desktop layout component
  function DesktopLayout() {
    return (
      <div className="hidden flex-1 w-full min-h-0 overflow-hidden pt-2 md:flex">
        <Horizontal
          defaultLayout={horizontalSizes ?? [50, 50]}
          left={<Chat className="flex-1 overflow-hidden" />}
          right={
            currentView === 'preview' ? (
              <Preview className="flex-1 overflow-hidden" />
            ) : (
              <Vertical
                defaultLayout={verticalSizes ?? [50, 50]}
                top={<FileExplorer className="flex-1 overflow-hidden" />}
                bottom={<Logs className="flex-1 overflow-hidden" />}
              />
            )
          }
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between w-full mb-2">
        <Header className="flex items-center" />
        <div className="hidden md:block">
          <ViewSwitcher />
        </div>
      </div>

      <MobileLayout />
      <DesktopLayout />
    </>
  )
}