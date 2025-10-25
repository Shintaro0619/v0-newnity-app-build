"use client"

import { useEffect, useRef, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type Props = {
  value?: Date
  onChange: (d?: Date) => void
  placeholder?: string
  minDate?: Date
  className?: string
}

export default function InlineCalendar({ value, onChange, placeholder = "Pick a date", minDate, className }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full justify-start text-left font-normal border-2 bg-zinc-800 hover:bg-background",
          !value && "text-muted-foreground",
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? format(value, "PPP") : <span>{placeholder}</span>}
      </Button>

      {/* Portal を使わず同ツリーに描画 */}
      {mounted && open && (
        <div
          data-inline-calendar
          className="absolute left-0 top-full mt-2 z-50 w-[280px] rounded-md border bg-background shadow pointer-events-auto"
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => {
              onChange(d)
              if (d) setOpen(false)
            }}
            initialFocus
            disabled={(d) => !!minDate && d < minDate}
          />
        </div>
      )}
    </div>
  )
}
