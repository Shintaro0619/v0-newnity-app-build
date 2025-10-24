"use client"

import { useEffect, useState } from "react"
import { Controller } from "react-hook-form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export function RHFDateField({
  control,
  name,
  placeholder = "Pick a date",
  minDate,
}: {
  control: any
  name: string
  placeholder?: string
  minDate?: Date
}) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-9 w-full rounded-md border border-input bg-background" />
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              onClick={() => setOpen((v) => !v)}
              tabIndex={0}
              className={cn(
                "w-full justify-start text-left font-normal border-2 bg-zinc-800 hover:bg-background",
                !field.value && "text-muted-foreground",
                fieldState.invalid && "border-destructive",
              )}
              variant="outline"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {field.value ? format(field.value as Date, "PPP") : <span>{placeholder}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            forceMount
            className="w-auto p-0"
            align="start"
            side="bottom"
            sideOffset={6}
            style={{ zIndex: 2147483647, position: "fixed" }}
          >
            <Calendar
              mode="single"
              selected={field.value as Date | undefined}
              onSelect={(d) => {
                field.onChange(d)
                setOpen(false)
              }}
              initialFocus
              disabled={(date) => !!minDate && date < minDate}
            />
          </PopoverContent>
        </Popover>
      )}
    />
  )
}
