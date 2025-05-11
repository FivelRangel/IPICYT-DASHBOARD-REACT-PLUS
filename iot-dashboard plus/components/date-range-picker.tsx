"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (start: Date | null, end: Date | null) => void
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  })

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range)
    onChange(range?.from || null, range?.to || null)
  }

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-full justify-start text-left font-normal md:w-auto", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
  date.to ? (
    <>
      {format(date.from, "dd/MM/yyyy", { locale: es })} - {format(date.to, "dd/MM/yyyy", { locale: es })}
    </>
  ) : (
    format(date.from, "dd/MM/yyyy", { locale: es })
  )
) : (
  <span>Todos los datos</span>
)}

          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
