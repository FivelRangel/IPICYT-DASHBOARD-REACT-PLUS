"use client"

import type { SensorData } from "@/lib/api"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { format } from "date-fns"

interface TimeSeriesChartProps {
  data: SensorData[]
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  // Optimización: Si hay demasiados puntos, reducir la cantidad de datos mostrados
  let chartData = data.map((item) => ({
    timestamp: item.dateObj,
    value: item.decodedValue,
    formattedTime: format(item.dateObj, "dd/MM HH:mm"),
  }))

  // Si hay más de 100 puntos, muestrear los datos para mejorar el rendimiento
  if (chartData.length > 100) {
    const sampleRate = Math.ceil(chartData.length / 100)
    chartData = chartData.filter((_, index) => index % sampleRate === 0)
  }

  return (
    <div className="w-full h-[400px]">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="formattedTime" tick={{ fontSize: 12 }} tickMargin={10} />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 12 }}
              tickMargin={10}
              label={{
                value: "CO₂ (ppm)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" },
              }}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(2)} ppm`, "CO₂"]}
              labelFormatter={(label) => `Fecha: ${label}`}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "6px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              name="CO₂"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No hay datos disponibles para el rango seleccionado
        </div>
      )}
    </div>
  )
}
