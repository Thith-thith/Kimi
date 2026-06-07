"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({ ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider {...props} />
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger {...props} />
}

function TooltipPortal({ ...props }: TooltipPrimitive.Portal.Props) {
  return <TooltipPrimitive.Portal {...props} />
}

function TooltipContent({
  className,
  side = "top",
  ...props
}: TooltipPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <TooltipPortal>
      <TooltipPrimitive.Positioner side={side}>
        <TooltipPrimitive.Popup
          className={cn(
            "z-50 overflow-hidden rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 shadow-md dark:bg-zinc-50 dark:text-zinc-900 animate-in fade-in duration-100",
            className
          )}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPortal>
  )
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
}
