"use client"

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

interface AveragePerHourChartProps {
  data: { hour: string; average: number }[]
}

export function AveragePerHourChart({ data }: AveragePerHourChartProps) {
  // Optimización: Si hay demasiados puntos, reducir la cantidad de datos mostrados
  let chartData = [...data]

  // Si hay más de 50 barras, muestrear los datos para mejorar el rendimiento
  if (chartData.length > 50) {
    const sampleRate = Math.ceil(chartData.length / 50)
    chartData = chartData.filter((_, index) => index % sampleRate === 0)
  }

  return (
    <div className="w-full h-[400px]">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="hour" tick={{ fontSize: 12 }} tickMargin={10} />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 12 }}
              tickMargin={10}
              label={{
                value: "Promedio CO₂ (ppm)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" },
              }}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(2)} ppm`, "Promedio CO₂"]}
              labelFormatter={(label) => `Hora: ${label}`}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "6px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend />
            <Bar dataKey="average" name="Promedio CO₂" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No hay datos disponibles para el rango seleccionado
        </div>
      )}
    </div>
  )
}
