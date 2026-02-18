
"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"
import {
  Panel as ResizablePrimitivePanel,
  PanelGroup as ResizablePrimitivePanelGroup,
  PanelResizeHandle as ResizablePrimitivePanelResizeHandle,
} from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = React.forwardRef<
  React.ElementRef<typeof ResizablePrimitivePanelGroup>,
  React.ComponentProps<typeof ResizablePrimitivePanelGroup>
>(({ className, ...props }, ref) => (
  <ResizablePrimitivePanelGroup
    ref={ref}
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
))
ResizablePanelGroup.displayName = "ResizablePanelGroup"

const ResizablePanel = ResizablePrimitivePanel

const ResizableHandle = ({
  className,
  withHandle,
  ...props
}: React.ComponentProps<typeof ResizablePrimitivePanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitivePanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitivePanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
