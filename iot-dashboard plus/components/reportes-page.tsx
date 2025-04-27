"use client"

import { useState, useEffect, useRef } from "react"
import { fetchSensorData, type SensorData, filterDataByDateRange, calculateHourlyAverages } from "@/lib/api"
import { DateRangePicker } from "@/components/date-range-picker"
import { DownloadReportButton } from "@/components/download-report-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, RefreshCw, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { TimeSeriesChart } from "@/components/time-series-chart"
import { AveragePerHourChart } from "@/components/average-per-hour-chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ReportesPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [filteredData, setFilteredData] = useState<SensorData[]>([])
  const [hourlyAverages, setHourlyAverages] = useState<{ hour: string; average: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | null>(addDays(new Date(), -3))
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [usingMockData, setUsingMockData] = useState(true)

  const timeSeriesChartRef = useRef<HTMLDivElement>(null)
  const averageChartRef = useRef<HTMLDivElement>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener datos (simulados en la previsualización)
      const data = await fetchSensorData()

      // Verificar si estamos usando datos de mock
      const isMockData = data.length > 0 && data[0].id.startsWith("mock")
      setUsingMockData(isMockData)

      if (data.length === 0) {
        setError("No se pudieron obtener datos. Por favor, intente nuevamente más tarde.")
      } else {
        setSensorData(data)

        // Aplicar filtro de fechas inicial
        const filtered = filterDataByDateRange(data, startDate, endDate)
        setFilteredData(filtered)

        // Calcular promedios por hora
        const averages = calculateHourlyAverages(filtered)
        setHourlyAverages(averages)
      }
    } catch (err) {
      console.error("Error al cargar datos:", err)
      setError("Error al cargar los datos. Por favor, intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (sensorData.length > 0) {
      const filtered = filterDataByDateRange(sensorData, startDate, endDate)
      setFilteredData(filtered)

      const averages = calculateHourlyAverages(filtered)
      setHourlyAverages(averages)
    }
  }, [startDate, endDate, sensorData])

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start)
    setEndDate(end)
  }

  if (loading && sensorData.length === 0) {
    return (
      <div className="flex flex-col p-6 gap-6 w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">Generación y descarga de reportes de CO₂</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Cargando datos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-6 gap-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">Generación y descarga de reportes de CO₂</p>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{error}</p>
            <Button variant="outline" className="mt-2" onClick={fetchData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <DateRangePicker startDate={startDate} endDate={endDate} onChange={handleDateRangeChange} />

              {usingMockData && (
                <Alert variant="warning" className="max-w-md py-2">
                  <Info className="h-4 w-4" />
                  <AlertTitle className="text-sm font-medium">Modo demostración</AlertTitle>
                  <AlertDescription className="text-xs">
                    Visualizando datos simulados para demostración.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Actualizando..." : "Actualizar datos"}
              </Button>

              <DownloadReportButton
                data={filteredData}
                hourlyAverages={hourlyAverages}
                timeSeriesChartRef={timeSeriesChartRef}
                averageChartRef={averageChartRef}
              />
            </div>
          </div>

          <Tabs defaultValue="time-series" className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2">
              <TabsTrigger value="time-series">Serie de Tiempo</TabsTrigger>
              <TabsTrigger value="hourly-average">Promedio por Hora</TabsTrigger>
            </TabsList>
            <TabsContent value="time-series">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Serie de Tiempo - CO₂ (ppm)</CardTitle>
                    {usingMockData && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Datos simulados
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div ref={timeSeriesChartRef} className="w-full">
                    <TimeSeriesChart data={filteredData} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="hourly-average">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Promedio por Hora - CO₂ (ppm)</CardTitle>
                    {usingMockData && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Datos simulados
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div ref={averageChartRef} className="w-full">
                    <AveragePerHourChart data={hourlyAverages} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
