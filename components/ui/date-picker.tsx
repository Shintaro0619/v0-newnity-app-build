"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

type Props = {
  value?: Date
  onChange?: (d: Date | undefined) => void
  placeholder?: string
  disablePast?: boolean
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", disablePast = true }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span className="text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[2147483647]" align="start" sideOffset={6}>
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange?.(d)
            if (d) setOpen(false)
          }}
          disabled={disablePast ? (d) => d < new Date() : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}
