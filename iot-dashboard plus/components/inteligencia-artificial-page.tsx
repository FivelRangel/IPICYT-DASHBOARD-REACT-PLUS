"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, AlertTriangle, RefreshCw, Download, FileSpreadsheet, Info, Brain } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { procesarDatosSensores, type DatoSensor } from "@/lib/procesador-datos"
import * as XLSX from "xlsx"

// Diccionario de tipos de sensor
const TIPOS_SENSOR: Record<number, string> = {
  1: "CO₂",
  2: "Temperatura",
  3: "Humedad",
  4: "PM2.5",
  5: "PM10",
}

export function InteligenciaArtificialPage() {
  const [datosCO2, setDatosCO2] = useState<DatoSensor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resumen, setResumen] = useState<{ total: number; errores: number; validos: number; co2: number }>({
    total: 0,
    errores: 0,
    validos: 0,
    co2: 0,
  })

  // Función para generar datos simulados específicos de CO₂
  const generarDatosCO2Simulados = (cantidad: number): DatoSensor[] => {
    const datos: DatoSensor[] = []
    const ahora = new Date()

    for (let i = 0; i < cantidad; i++) {
      const valor = (Math.random() * 1000 + 400).toFixed(6) // CO₂ entre 400-1400 ppm
      // Generar fechas en los últimos 30 días
      const fecha = new Date(ahora.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString()

      // Crear datos simulados específicos para sensor CO₂ (ID = 1)
      const sensorIdHex = "0x01"
      const dataSinProcesar = "AQAAAA==" // Ejemplo de datos en base64
      const dataPreprocesada = "01 00 00 00 00"

      datos.push({
        sensorId: sensorIdHex,
        tipoSensor: "CO₂",
        dataSinProcesar,
        dataPreprocesada,
        valorProcesado: valor,
        fecha,
      })
    }

    // Ordenar por fecha (más recientes primero)
    return datos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
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

  // Función para cargar datos del endpoint /todos y filtrar por Sensor ID 1
  const cargarDatosCO2 = async () => {
    setLoading(true)
    setError(null)

    try {
      // Verificar si estamos en un entorno de previsualización
      if (esEntornoPreview()) {
        console.log("Entorno de previsualización detectado, usando datos simulados de CO₂")

        // Simular un retraso para mostrar el estado de carga
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Generar datos simulados específicos de CO₂
        const datosCO2Simulados = generarDatosCO2Simulados(150)

        setDatosCO2(datosCO2Simulados)
        setResumen({
          total: 200,
          errores: 25,
          validos: 175,
          co2: datosCO2Simulados.length,
        })

        setError(
          "Usando datos simulados de CO₂ en el entorno de previsualización. En producción, se conectará a la API real.",
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

      // Procesar los datos usando la misma función que reportes
      const { datosFiltrados, errores } = procesarDatosSensores(data, TIPOS_SENSOR)

      // Filtrar solo los datos del Sensor ID 1 (CO₂)
      const datosCO2Filtrados = datosFiltrados.filter((dato) => dato.sensorId === "0x01")

      setDatosCO2(datosCO2Filtrados)
      setResumen({
        total: data.length,
        errores: errores,
        validos: datosFiltrados.length,
        co2: datosCO2Filtrados.length,
      })
    } catch (error) {
      console.error("Error al cargar datos de CO₂:", error)

      // Generar datos simulados como fallback
      const datosCO2Simulados = generarDatosCO2Simulados(150)

      setDatosCO2(datosCO2Simulados)
      setResumen({
        total: 200,
        errores: 25,
        validos: 175,
        co2: datosCO2Simulados.length,
      })

      setError(
        `Error al conectar con la API. Mostrando datos simulados de CO₂. (${error instanceof Error ? error.message : "Error desconocido"})`,
      )
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatosCO2()
  }, [])

  // Función para descargar datos como Excel
  const descargarExcel = () => {
    if (datosCO2.length === 0) return

    try {
      // Preparar los datos para Excel
      const datosParaExcel = datosCO2.map((dato, index) => ({
        "#": index + 1,
        "Tipo de sensor": dato.tipoSensor,
        "Data preprocesada": dato.dataPreprocesada,
        "Valor procesado (float)": Number.parseFloat(dato.valorProcesado),
        Fecha: new Date(dato.fecha).toLocaleString("es-ES"),
        "Fecha ISO": dato.fecha,
      }))

      // Crear un nuevo libro de trabajo
      const workbook = XLSX.utils.book_new()

      // Crear hoja de datos
      const worksheet = XLSX.utils.json_to_sheet(datosParaExcel)

      // Configurar el ancho de las columnas
      const columnWidths = [
        { wch: 5 }, // #
        { wch: 15 }, // Tipo de sensor
        { wch: 20 }, // Data preprocesada
        { wch: 20 }, // Valor procesado
        { wch: 20 }, // Fecha
        { wch: 25 }, // Fecha ISO
      ]
      worksheet["!cols"] = columnWidths

      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, "Datos CO₂")

      // Crear hoja de resumen
      const resumenData = [
        { Métrica: "Total de objetos recibidos", Valor: resumen.total },
        { Métrica: "Registros con error", Valor: resumen.errores },
        { Métrica: "Registros válidos", Valor: resumen.validos },
        { Métrica: "Registros de CO₂ (Sensor ID 1)", Valor: resumen.co2 },
        { Métrica: "Fecha de generación", Valor: new Date().toLocaleString("es-ES") },
      ]

      const resumenWorksheet = XLSX.utils.json_to_sheet(resumenData)
      resumenWorksheet["!cols"] = [{ wch: 30 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(workbook, resumenWorksheet, "Resumen")

      // Generar el archivo y descargarlo
      const fechaActual = new Date().toISOString().split("T")[0]
      const nombreArchivo = `datos_co2_ia_${fechaActual}.xlsx`

      XLSX.writeFile(workbook, nombreArchivo)
    } catch (error) {
      console.error("Error al generar archivo Excel:", error)
      alert("Hubo un error al generar el archivo Excel. Por favor, intente nuevamente.")
    }
  }

  return (
    <div className="flex flex-col p-4 md:p-6 gap-6 w-full max-w-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Inteligencia Artificial</h1>
            <p className="text-muted-foreground">Análisis de datos de CO₂ para modelos de IA</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <Alert className="max-w-md">
          <Info className="h-4 w-4" />
          <AlertTitle>Información</AlertTitle>
          <AlertDescription>
            Datos filtrados del endpoint <code className="text-xs bg-muted p-1 rounded">/todos</code> para Sensor ID 1
            (CO₂)
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={cargarDatosCO2} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Actualizando..." : "Actualizar datos"}
          </Button>

          <Button variant="default" onClick={descargarExcel} disabled={!datosCO2.length || loading}>
            <Download className="mr-2 h-4 w-4" />
            Descargar Excel
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Información</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Datos de CO₂ para Inteligencia Artificial
          </CardTitle>
          <CardDescription>
            <div className="flex flex-wrap gap-3 mt-2">
              <Badge variant="outline" className="text-sm">
                Total de objetos: {resumen.total}
              </Badge>
              <Badge variant="outline" className="text-sm bg-red-50 text-red-700 border-red-200">
                Registros con error: {resumen.errores}
              </Badge>
              <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
                Registros válidos: {resumen.validos}
              </Badge>
              <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
                Datos CO₂: {resumen.co2}
              </Badge>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && datosCO2.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Cargando datos de CO₂...</span>
            </div>
          ) : datosCO2.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron datos de CO₂</h3>
              <p>No hay datos disponibles del Sensor ID 1 para análisis de IA</p>
              <Button variant="outline" className="mt-4" onClick={cargarDatosCO2}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Intentar cargar datos
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {loading ? "Actualizando datos..." : `Mostrando ${datosCO2.length} registros de CO₂`}
                </div>
                <Button variant="secondary" onClick={descargarExcel} disabled={loading}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Excel
                </Button>
              </div>

              <ScrollArea className="h-[600px] w-full rounded-md border">
                <div className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">#</TableHead>
                        <TableHead>Tipo de sensor</TableHead>
                        <TableHead>Data preprocesada</TableHead>
                        <TableHead>Valor procesado (float)</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datosCO2.map((dato, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              {dato.tipoSensor}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[200px] truncate">
                            {dato.dataPreprocesada}
                          </TableCell>
                          <TableCell className="font-mono">
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm">
                              {Number.parseFloat(dato.valorProcesado).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{new Date(dato.fecha).toLocaleString("es-ES")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>

      {datosCO2.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de los datos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{datosCO2.length}</div>
                <div className="text-sm text-blue-600">Registros de CO₂</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {datosCO2.length > 0
                    ? Math.min(...datosCO2.map((d) => Number.parseFloat(d.valorProcesado))).toFixed(2)
                    : "0"}
                </div>
                <div className="text-sm text-green-600">Valor mínimo (ppm)</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {datosCO2.length > 0
                    ? Math.max(...datosCO2.map((d) => Number.parseFloat(d.valorProcesado))).toFixed(2)
                    : "0"}
                </div>
                <div className="text-sm text-orange-600">Valor máximo (ppm)</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {datosCO2.length > 0
                    ? (
                        datosCO2.reduce((sum, d) => sum + Number.parseFloat(d.valorProcesado), 0) / datosCO2.length
                      ).toFixed(2)
                    : "0"}
                </div>
                <div className="text-sm text-purple-600">Promedio (ppm)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
