"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, AlertTriangle, RefreshCw, Download, FileSpreadsheet, Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { DateRangePicker } from "@/components/date-range-picker"
import { procesarDatosSensores, type DatoSensor } from "@/lib/procesador-datos"

// Diccionario de tipos de sensor
const TIPOS_SENSOR: Record<number, string> = {
  1: "CO₂",
  2: "Temperatura",
  3: "Humedad",
  4: "PM2.5",
  5: "PM10",
}

export function DatosCrudosPage() {
  const [datosTodos, setDatosTodos] = useState<DatoSensor[]>([])
  const [datosMuestra, setDatosMuestra] = useState<DatoSensor[]>([])
  const [datosTodosFiltrados, setDatosTodosFiltrados] = useState<DatoSensor[]>([])
  const [datosMuestraFiltrados, setDatosMuestraFiltrados] = useState<DatoSensor[]>([])
  const [loadingTodos, setLoadingTodos] = useState(false)
  const [loadingMuestra, setLoadingMuestra] = useState(false)
  const [errorTodos, setErrorTodos] = useState<string | null>(null)
  const [errorMuestra, setErrorMuestra] = useState<string | null>(null)
  const [startDateTodos, setStartDateTodos] = useState<Date | null>(null)
  const [endDateTodos, setEndDateTodos] = useState<Date | null>(null)
  const [startDateMuestra, setStartDateMuestra] = useState<Date | null>(null)
  const [endDateMuestra, setEndDateMuestra] = useState<Date | null>(null)
  const [resumenTodos, setResumenTodos] = useState<{ total: number; errores: number; validos: number }>({
    total: 0,
    errores: 0,
    validos: 0,
  })
  const [resumenMuestra, setResumenMuestra] = useState<{ total: number; errores: number; validos: number }>({
    total: 0,
    errores: 0,
    validos: 0,
  })
  const [csvTodos, setCsvTodos] = useState<string | null>(null)
  const [csvMuestra, setCsvMuestra] = useState<string | null>(null)

  // Función para generar datos simulados
  const generarDatosSimulados = (cantidad: number): DatoSensor[] => {
    const tiposSensor = [1, 2, 3, 4, 5]
    const datos: DatoSensor[] = []
    const ahora = new Date()

    for (let i = 0; i < cantidad; i++) {
      const tipoSensorId = tiposSensor[Math.floor(Math.random() * tiposSensor.length)]
      const valor = (Math.random() * 1000).toFixed(6)
      // Generar fechas en los últimos 7 días
      const fecha = new Date(ahora.getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()

      // Crear datos simulados en formato similar al real
      const sensorIdHex = `0x${tipoSensorId.toString(16).padStart(2, "0").toUpperCase()}`
      const dataSinProcesar = "AQAAAA==" // Ejemplo de datos en base64
      const dataPreprocesada = `${tipoSensorId.toString(16).padStart(2, "0").toUpperCase()} 00 00 00 00`

      datos.push({
        sensorId: sensorIdHex,
        tipoSensor: TIPOS_SENSOR[tipoSensorId] || "Desconocido",
        dataSinProcesar,
        dataPreprocesada,
        valorProcesado: valor,
        fecha,
      })
    }

    // Ordenar por fecha
    return datos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  }

  // Función para establecer el rango de fechas automáticamente basado en los datos
  const establecerRangoAutomatico = (
    datos: DatoSensor[],
    setStartDate: (date: Date | null) => void,
    setEndDate: (date: Date | null) => void,
  ) => {
    if (datos.length === 0) return

    const fechas = datos.map((d) => new Date(d.fecha)).sort((a, b) => a.getTime() - b.getTime())
    const fechaMinima = fechas[0]
    const fechaMaxima = fechas[fechas.length - 1]

    setStartDate(fechaMinima)
    setEndDate(fechaMaxima)
  }

  // Función para filtrar datos por rango de fechas
  const filtrarDatosPorFecha = (datos: DatoSensor[], startDate: Date | null, endDate: Date | null): DatoSensor[] => {
    if (!startDate || !endDate) return datos

    return datos.filter((dato) => {
      const fechaDato = new Date(dato.fecha)
      return fechaDato >= startDate && fechaDato <= endDate
    })
  }

  // Función para verificar si estamos en un entorno de previsualización
  const esEntornoPreview = (): boolean => {
    if (typeof window !== "undefined") {
      return (
        window.location.hostname === "localhost" ||
        window.location.hostname.includes("vercel.app") ||
        window.location.hostname.includes("preview")
      )
    }
    return false
  }

  // Función para cargar todos los datos
  const cargarTodosLosDatos = async () => {
    setLoadingTodos(true)
    setErrorTodos(null)

    try {
      // Verificar si estamos en un entorno de previsualización
      if (esEntornoPreview()) {
        console.log("Entorno de previsualización detectado, usando datos simulados")

        // Simular un retraso para mostrar el estado de carga
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Generar datos simulados
        const datosFiltrados = generarDatosSimulados(100)
        const { csv } = procesarDatosSensores([], TIPOS_SENSOR, datosFiltrados)

        setDatosTodos(datosFiltrados)
        setResumenTodos({
          total: 120,
          errores: 20,
          validos: datosFiltrados.length,
        })
        setCsvTodos(csv)

        // Establecer rango automático
        establecerRangoAutomatico(datosFiltrados, setStartDateTodos, setEndDateTodos)

        setErrorTodos(
          "Usando datos simulados en el entorno de previsualización. En producción, se conectará a la API real.",
        )
        return
      }

      const url = "https://ipicyt-ia-gateway-production.up.railway.app/todos"
      console.log("Intentando conectar a:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      // Procesar los datos
      const { datosFiltrados, errores, csv } = procesarDatosSensores(data, TIPOS_SENSOR)

      setDatosTodos(datosFiltrados)
      setResumenTodos({
        total: data.length,
        errores: errores,
        validos: datosFiltrados.length,
      })
      setCsvTodos(csv)

      // Establecer rango automático
      establecerRangoAutomatico(datosFiltrados, setStartDateTodos, setEndDateTodos)
    } catch (error) {
      console.error("Error al cargar todos los datos:", error)

      // Generar datos simulados como fallback
      const datosFiltrados = generarDatosSimulados(100)
      const { csv } = procesarDatosSensores([], TIPOS_SENSOR, datosFiltrados)

      setDatosTodos(datosFiltrados)
      setResumenTodos({
        total: 120,
        errores: 20,
        validos: datosFiltrados.length,
      })
      setCsvTodos(csv)

      // Establecer rango automático
      establecerRangoAutomatico(datosFiltrados, setStartDateTodos, setEndDateTodos)

      setErrorTodos(
        `Error al conectar con la API. Mostrando datos simulados. (${error instanceof Error ? error.message : "Error desconocido"})`,
      )
    } finally {
      setLoadingTodos(false)
    }
  }

  // Función para cargar muestra de datos
  const cargarMuestraDeDatos = async () => {
    setLoadingMuestra(true)
    setErrorMuestra(null)

    try {
      // Verificar si estamos en un entorno de previsualización
      if (esEntornoPreview()) {
        console.log("Entorno de previsualización detectado, usando datos simulados")

        // Simular un retraso para mostrar el estado de carga
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Generar datos simulados
        const datosFiltrados = generarDatosSimulados(50)
        const { csv } = procesarDatosSensores([], TIPOS_SENSOR, datosFiltrados)

        setDatosMuestra(datosFiltrados)
        setResumenMuestra({
          total: 60,
          errores: 10,
          validos: datosFiltrados.length,
        })
        setCsvMuestra(csv)

        // Establecer rango automático
        establecerRangoAutomatico(datosFiltrados, setStartDateMuestra, setEndDateMuestra)

        setErrorMuestra(
          "Usando datos simulados en el entorno de previsualización. En producción, se conectará a la API real.",
        )
        return
      }

      const url = "https://ipicyt-ia-gateway-production.up.railway.app/sensores"
      console.log("Intentando conectar a:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      // Procesar los datos
      const { datosFiltrados, errores, csv } = procesarDatosSensores(data, TIPOS_SENSOR)

      setDatosMuestra(datosFiltrados)
      setResumenMuestra({
        total: data.length,
        errores: errores,
        validos: datosFiltrados.length,
      })
      setCsvMuestra(csv)

      // Establecer rango automático
      establecerRangoAutomatico(datosFiltrados, setStartDateMuestra, setEndDateMuestra)
    } catch (error) {
      console.error("Error al cargar muestra de datos:", error)

      // Generar datos simulados como fallback
      const datosFiltrados = generarDatosSimulados(50)
      const { csv } = procesarDatosSensores([], TIPOS_SENSOR, datosFiltrados)

      setDatosMuestra(datosFiltrados)
      setResumenMuestra({
        total: 60,
        errores: 10,
        validos: datosFiltrados.length,
      })
      setCsvMuestra(csv)

      // Establecer rango automático
      establecerRangoAutomatico(datosFiltrados, setStartDateMuestra, setEndDateMuestra)

      setErrorMuestra(
        `Error al conectar con la API. Mostrando datos simulados. (${error instanceof Error ? error.message : "Error desconocido"})`,
      )
    } finally {
      setLoadingMuestra(false)
    }
  }

  // Efectos para filtrar datos cuando cambian las fechas
  useEffect(() => {
    const filtrados = filtrarDatosPorFecha(datosTodos, startDateTodos, endDateTodos)
    setDatosTodosFiltrados(filtrados)
  }, [datosTodos, startDateTodos, endDateTodos])

  useEffect(() => {
    const filtrados = filtrarDatosPorFecha(datosMuestra, startDateMuestra, endDateMuestra)
    setDatosMuestraFiltrados(filtrados)
  }, [datosMuestra, startDateMuestra, endDateMuestra])

  // Cargar datos al iniciar
  useEffect(() => {
    cargarTodosLosDatos()
    cargarMuestraDeDatos()
  }, [])

  // Función para descargar CSV
  const descargarCSV = (csv: string | null, nombreArchivo: string) => {
    if (!csv) return

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", nombreArchivo)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col p-4 md:p-6 gap-6 w-full max-w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Datos en Crudo</h1>
        <p className="text-muted-foreground">Análisis y visualización de datos sin procesar de los sensores</p>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-2">
          <TabsTrigger value="todos">Análisis de todos los datos almacenados</TabsTrigger>
          <TabsTrigger value="muestra">Análisis de una muestra de 50 datos</TabsTrigger>
        </TabsList>

        {/* Pestaña de todos los datos */}
        <TabsContent value="todos" className="space-y-4">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <Alert className="max-w-md">
                <Info className="h-4 w-4" />
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>
                  Datos obtenidos del endpoint <code className="text-xs bg-muted p-1 rounded">/todos</code>
                </AlertDescription>
              </Alert>

              <DateRangePicker
                startDate={startDateTodos}
                endDate={endDateTodos}
                onChange={(start, end) => {
                  setStartDateTodos(start)
                  setEndDateTodos(end)
                }}
                className="flex-1 min-w-[280px]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={cargarTodosLosDatos} disabled={loadingTodos}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loadingTodos ? "animate-spin" : ""}`} />
                {loadingTodos ? "Actualizando..." : "Actualizar datos"}
              </Button>

              <Button
                variant="secondary"
                onClick={() => descargarCSV(csvTodos, "datos_sensores_completos.csv")}
                disabled={!csvTodos || loadingTodos}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar CSV
              </Button>
            </div>
          </div>

          {errorTodos && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Información</AlertTitle>
              <AlertDescription>{errorTodos}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Resumen de datos</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap gap-3 mt-2">
                  <Badge variant="outline" className="text-sm">
                    Total de objetos: {resumenTodos.total}
                  </Badge>
                  <Badge variant="outline" className="text-sm bg-red-50 text-red-700 border-red-200">
                    Registros con error: {resumenTodos.errores}
                  </Badge>
                  <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
                    Registros válidos: {resumenTodos.validos}
                  </Badge>
                  <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
                    Mostrando: {datosTodosFiltrados.length}
                  </Badge>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTodos && datosTodos.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-lg">Cargando datos...</span>
                </div>
              ) : datosTodosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron datos válidos para el rango de fechas seleccionado
                </div>
              ) : (
                <ScrollArea className="h-[500px] w-full rounded-md border">
                  <div className="p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sensor ID</TableHead>
                          <TableHead>Tipo de sensor</TableHead>
                          <TableHead>Data sin procesar</TableHead>
                          <TableHead>Data preprocesada</TableHead>
                          <TableHead>Valor procesado</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {datosTodosFiltrados.map((dato, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{dato.sensorId}</TableCell>
                            <TableCell>{dato.tipoSensor}</TableCell>
                            <TableCell className="font-mono text-xs max-w-[150px] truncate">
                              {dato.dataSinProcesar}
                            </TableCell>
                            <TableCell className="font-mono text-xs max-w-[200px] truncate">
                              {dato.dataPreprocesada}
                            </TableCell>
                            <TableCell>{dato.valorProcesado}</TableCell>
                            <TableCell>{new Date(dato.fecha).toLocaleString("es-ES")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {loadingTodos ? "Actualizando datos..." : `Mostrando ${datosTodosFiltrados.length} registros`}
              </div>
              <Button
                variant="outline"
                onClick={() => descargarCSV(csvTodos, "datos_sensores_completos.csv")}
                disabled={!csvTodos || loadingTodos}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar CSV
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Pestaña de muestra de datos */}
        <TabsContent value="muestra" className="space-y-4">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <Alert className="max-w-md">
                <Info className="h-4 w-4" />
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>
                  Datos obtenidos del endpoint <code className="text-xs bg-muted p-1 rounded">/sensores</code>
                </AlertDescription>
              </Alert>

              <DateRangePicker
                startDate={startDateMuestra}
                endDate={endDateMuestra}
                onChange={(start, end) => {
                  setStartDateMuestra(start)
                  setEndDateMuestra(end)
                }}
                className="flex-1 min-w-[280px]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={cargarMuestraDeDatos} disabled={loadingMuestra}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loadingMuestra ? "animate-spin" : ""}`} />
                {loadingMuestra ? "Actualizando..." : "Actualizar datos"}
              </Button>

              <Button
                variant="secondary"
                onClick={() => descargarCSV(csvMuestra, "datos_sensores_muestra.csv")}
                disabled={!csvMuestra || loadingMuestra}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar CSV
              </Button>
            </div>
          </div>

          {errorMuestra && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Información</AlertTitle>
              <AlertDescription>{errorMuestra}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Resumen de datos</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap gap-3 mt-2">
                  <Badge variant="outline" className="text-sm">
                    Total de objetos: {resumenMuestra.total}
                  </Badge>
                  <Badge variant="outline" className="text-sm bg-red-50 text-red-700 border-red-200">
                    Registros con error: {resumenMuestra.errores}
                  </Badge>
                  <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
                    Registros válidos: {resumenMuestra.validos}
                  </Badge>
                  <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
                    Mostrando: {datosMuestraFiltrados.length}
                  </Badge>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMuestra && datosMuestra.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-lg">Cargando datos...</span>
                </div>
              ) : datosMuestraFiltrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron datos válidos para el rango de fechas seleccionado
                </div>
              ) : (
                <ScrollArea className="h-[500px] w-full rounded-md border">
                  <div className="p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sensor ID</TableHead>
                          <TableHead>Tipo de sensor</TableHead>
                          <TableHead>Data sin procesar</TableHead>
                          <TableHead>Data preprocesada</TableHead>
                          <TableHead>Valor procesado</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {datosMuestraFiltrados.map((dato, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{dato.sensorId}</TableCell>
                            <TableCell>{dato.tipoSensor}</TableCell>
                            <TableCell className="font-mono text-xs max-w-[150px] truncate">
                              {dato.dataSinProcesar}
                            </TableCell>
                            <TableCell className="font-mono text-xs max-w-[200px] truncate">
                              {dato.dataPreprocesada}
                            </TableCell>
                            <TableCell>{dato.valorProcesado}</TableCell>
                            <TableCell>{new Date(dato.fecha).toLocaleString("es-ES")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {loadingMuestra ? "Actualizando datos..." : `Mostrando ${datosMuestraFiltrados.length} registros`}
              </div>
              <Button
                variant="outline"
                onClick={() => descargarCSV(csvMuestra, "datos_sensores_muestra.csv")}
                disabled={!csvMuestra || loadingMuestra}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar CSV
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
