import { LayoutClient } from './layout-client'
import { cookies } from 'next/headers'
import { getHorizontal, getVertical } from '@/components/layout/sizing'

export default async function Page() {
  const store = await cookies()
  const horizontalSizes = getHorizontal(store)
  const verticalSizes = getVertical(store)

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden p-2 space-x-2">
      <LayoutClient
        horizontalSizes={horizontalSizes ?? undefined}
        verticalSizes={verticalSizes ?? undefined}
      />
    </div>
  )
}

