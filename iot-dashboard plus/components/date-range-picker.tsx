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
  className?: string
}

export function DateRangePicker({ startDate, endDate, onChange, className }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: startDate || undefined,
    to: endDate || undefined,
  })

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range)
    onChange(range?.from || null, range?.to || null)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal min-w-[280px]",
              !date?.from && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {date?.from ? (
                date.to ? (
                  <>
                    <span className="font-medium text-primary">{format(date.from, "dd/MM/yyyy", { locale: es })}</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="font-medium text-primary">{format(date.to, "dd/MM/yyyy", { locale: es })}</span>
                  </>
                ) : (
                  <span className="font-medium text-primary">{format(date.from, "dd/MM/yyyy", { locale: es })}</span>
                )
              ) : (
                <span>Seleccionar rango de fechas</span>
              )}
            </span>
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
            className="rounded-md border"
          />
          <div className="p-3 border-t bg-muted/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Rango seleccionado</span>
              </div>
              {date?.from && date?.to && (
                <span className="font-medium">
                  {Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24))} días
                </span>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
