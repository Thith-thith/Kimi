"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Link } from "@/i18n/routing"
import { buttonVariants } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion } from "framer-motion"

interface DockProps {
  className?: string
  activePath: string
  items: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    path: string
  }[]
}

export default function Dock({ items, activePath, className }: DockProps) {
  const [hovered, setHovered] = React.useState<number | null>(null)

  return (
    <div className={cn("flex items-center justify-center w-full", className)}>
      <div
        className={cn(
          "flex items-center gap-5 px-5 py-2.5 rounded-[22px]",
          "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl pointer-events-auto"
        )}
      >
        <TooltipProvider delay={0}>
          {items.map((item, i) => {
            const isActive = activePath === item.path
            const isHovered = hovered === i

            return (
              <Tooltip key={item.label}>
                <TooltipTrigger
                  render={
                    <motion.div
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      animate={{
                        scale: isHovered ? 1.15 : 1,
                        y: isHovered ? -2 : 0,
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 25, mass: 0.5 }}
                      className="relative flex flex-col items-center gap-1"
                    />
                  }
                >
                  <Link
                    href={item.path}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "w-11 h-11 rounded-xl relative cursor-pointer transition-colors duration-100 active:scale-95 flex items-center justify-center p-0",
                      isActive
                        ? "text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800/80"
                        : "text-zinc-400 dark:text-zinc-500",
                      isHovered && "shadow-md shadow-zinc-900/5 dark:shadow-zinc-100/5 bg-zinc-100/80 dark:bg-zinc-800/80"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-[22px] h-[22px] transition-colors duration-100",
                        isActive 
                          ? "text-zinc-900 dark:text-white" 
                          : "text-zinc-400 dark:text-zinc-500"
                      )}
                    />
                    {/* Glowing ring effect */}
                    {isHovered && (
                      <motion.span
                        layoutId="glow"
                        className="absolute inset-0 rounded-xl border border-zinc-950/20 dark:border-white/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </Link>

                  {/* Label — always visible, highlighted when active */}
                  <span
                    className={cn(
                      "text-[8.5px] tracking-tight leading-none font-semibold transition-all duration-100 select-none whitespace-nowrap",
                      isActive
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-400 dark:text-zinc-500"
                    )}
                  >
                    {item.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold px-2.5 py-1">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </div>
    </div>
  )
}
