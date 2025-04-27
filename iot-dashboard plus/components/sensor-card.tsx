"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Clock, Gauge } from "lucide-react"

interface SensorCardProps {
  sensorName: string
  value: number
  timestamp: string
  formattedDate: string
  formattedTime: string
  isMockData?: boolean
}

export function SensorCard({
  sensorName,
  value,
  timestamp,
  formattedDate,
  formattedTime,
  isMockData = false,
}: SensorCardProps) {
  const formattedValue = value.toFixed(2)
  const isHighValue = value > 1000

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">{sensorName}</CardTitle>
            {isMockData && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Simulado
              </Badge>
            )}
          </div>
          {isHighValue ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                duration: 0.5,
              }}
            >
              <Badge variant="destructive" className="text-sm font-medium">
                Nivel Alto
              </Badge>
            </motion.div>
          ) : (
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
            >
              Nivel Normal
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center">
            <Gauge className="h-5 w-5 text-muted-foreground mr-2" />
            <div className="text-3xl font-bold">
              {formattedValue} <span className="text-lg font-normal text-muted-foreground">ppm</span>
            </div>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <div>
              <time dateTime={timestamp}>
                {formattedDate} - {formattedTime}
              </time>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
