"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { format } from "date-fns"

export default function TestShadcn() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>()

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>shadcn sanity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={() => alert("ok")}>Button</Button>

          <Tabs defaultValue="a" className="space-y-3">
            <TabsList className="z-10">
              <TabsTrigger value="a">A</TabsTrigger>
              <TabsTrigger value="b">B</TabsTrigger>
            </TabsList>
            <TabsContent value="a">Tab A</TabsContent>
            <TabsContent value="b">Tab B</TabsContent>
          </Tabs>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-60 justify-start bg-transparent">
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={8} className="w-auto p-0 z-[2147483647]">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d)
                  if (d) setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>
    </div>
  )
}
