"use client"

import { useState, useEffect, useRef } from "react"
import { fetchSensorData, type SensorData, filterDataByDateRange, calculateHourlyAverages } from "@/lib/api"
import { SensorCard } from "@/components/sensor-card"
import { TimeSeriesChart } from "@/components/time-series-chart"
import { AveragePerHourChart } from "@/components/average-per-hour-chart"
import { DateRangePicker } from "@/components/date-range-picker"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, RefreshCw, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addDays } from "date-fns"
import { Badge } from "@/components/ui/badge"

export function SensorDashboard() {
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [filteredData, setFilteredData] = useState<SensorData[]>([])
  const [hourlyAverages, setHourlyAverages] = useState<{ hour: string; average: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | null>(addDays(new Date(), -3))
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [usingMockData, setUsingMockData] = useState(true)

  const chartsRef = useRef<HTMLDivElement>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener datos según la configuración
      const data = await fetchSensorData()

      // Verificar si estamos usando datos de mock
      const isMockData = data.length > 0 && data[0].id.startsWith("mock")
      setUsingMockData(isMockData)

      if (data.length === 0) {
        setError("No se pudieron obtener datos. Por favor, intente nuevamente.")
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

  // Usar useEffect con dependencias vacías para cargar datos solo una vez al inicio
  useEffect(() => {
    // Cargar datos iniciales
    fetchData()

    // Configurar actualización automática cada 60 segundos
    const intervalId = setInterval(() => {
      console.log("Actualizando datos automáticamente...")
      fetchData()
    }, 60000)

    return () => {
      console.log("Limpiando intervalo de actualización")
      clearInterval(intervalId)
    }
  }, []) // Dependencias vacías para ejecutar solo al montar

  // Efecto separado para manejar cambios en fechas o datos
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Cargando datos...</span>
      </div>
    )
  }

  if (error) {
    return (
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
    )
  }

  if (filteredData.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateRangeChange}
            className="flex-1 min-w-[280px]"
          />
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar datos
          </Button>
        </div>

        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <div className="rounded-full bg-muted p-3">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No hay datos disponibles</h2>
            <p className="text-muted-foreground max-w-md">
              No se encontraron datos para el rango de fechas seleccionado.
            </p>
            <Button variant="default" className="mt-2" onClick={fetchData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar cargar datos
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const latestReading = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateRangeChange}
            className="flex-1 min-w-[280px]"
          />

          {usingMockData && (
            <Alert variant="warning" className="max-w-md py-2">
              <Info className="h-4 w-4" />
              <AlertTitle className="text-sm font-medium">Modo demostración</AlertTitle>
              <AlertDescription className="text-xs">Visualizando datos simulados para demostración.</AlertDescription>
            </Alert>
          )}
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Actualizando..." : "Actualizar datos"}
        </Button>
      </div>

      {latestReading && (
        <SensorCard
          sensorName="Sensor de CO₂"
          value={latestReading.decodedValue}
          timestamp={latestReading.timestamp}
          formattedDate={latestReading.formattedDate}
          formattedTime={latestReading.formattedTime}
          isMockData={usingMockData}
        />
      )}

      <div ref={chartsRef} className="space-y-6">
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
            <TimeSeriesChart data={filteredData} />
          </CardContent>
        </Card>

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
            <AveragePerHourChart data={hourlyAverages} />
          </CardContent>
        </Card>
      </div>

      {loading && sensorData.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
          <span>Actualizando datos...</span>
        </div>
      )}
    </div>
  )
}

