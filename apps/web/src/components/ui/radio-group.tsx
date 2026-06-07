"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { cn } from "@/lib/utils"

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props<any>) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  children,
  ...props
}: RadioPrimitive.Root.Props<any>) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "relative flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-800 bg-background text-zinc-700 dark:text-zinc-300 select-none cursor-pointer text-center px-3 py-2 rounded-xl transition-all font-semibold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/60 data-[checked]:bg-zinc-950 dark:data-[checked]:bg-zinc-100 data-[checked]:text-zinc-50 dark:data-[checked]:text-zinc-950 data-[checked]:border-zinc-950 dark:data-[checked]:border-zinc-100 data-[checked]:shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioGroupItem }
