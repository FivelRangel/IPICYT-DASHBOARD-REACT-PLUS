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
  const [loadingTodos, setLoadingTodos] = useState(false)
  const [loadingMuestra, setLoadingMuestra] = useState(false)
  const [errorTodos, setErrorTodos] = useState<string | null>(null)
  const [errorMuestra, setErrorMuestra] = useState<string | null>(null)
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

  // Función para cargar todos los datos
  const cargarTodosLosDatos = async () => {
    setLoadingTodos(true)
    setErrorTodos(null)

    try {
      const url = "https://ipicyt-ia-gateway-production.up.railway.app/todos"
      const response = await fetch(url)

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
    } catch (error) {
      console.error("Error al cargar todos los datos:", error)
      setErrorTodos(`Error al cargar los datos: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setLoadingTodos(false)
    }
  }

  // Función para cargar muestra de datos
  const cargarMuestraDeDatos = async () => {
    setLoadingMuestra(true)
    setErrorMuestra(null)

    try {
      const url = "https://ipicyt-ia-gateway-production.up.railway.app/sensores"
      const response = await fetch(url)

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
    } catch (error) {
      console.error("Error al cargar muestra de datos:", error)
      setErrorMuestra(`Error al cargar los datos: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setLoadingMuestra(false)
    }
  }

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
    <div className="flex flex-col p-6 gap-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Datos en Crudo</h1>
        <p className="text-muted-foreground">Análisis y visualización de datos sin procesar de los sensores</p>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-2">
          <TabsTrigger value="todos">Análisis de todos los datos almacenados</TabsTrigger>
          <TabsTrigger value="muestra">Análisis de una muestra de 50 datos</TabsTrigger>
        </TabsList>

        {/* Pestaña de todos los datos */}
        <TabsContent value="todos" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <Alert className="max-w-md">
              <Info className="h-4 w-4" />
              <AlertTitle>Información</AlertTitle>
              <AlertDescription>
                Datos obtenidos del endpoint <code className="text-xs bg-muted p-1 rounded">/todos</code>
              </AlertDescription>
            </Alert>

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

          {errorTodos ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorTodos}</AlertDescription>
            </Alert>
          ) : (
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
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTodos && datosTodos.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-lg">Cargando datos...</span>
                  </div>
                ) : datosTodos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron datos válidos para mostrar
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
                          {datosTodos.map((dato, index) => (
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
                              <TableCell>{dato.fecha}</TableCell>
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
                  {loadingTodos ? "Actualizando datos..." : `Mostrando ${datosTodos.length} registros`}
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
          )}
        </TabsContent>

        {/* Pestaña de muestra de datos */}
        <TabsContent value="muestra" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <Alert className="max-w-md">
              <Info className="h-4 w-4" />
              <AlertTitle>Información</AlertTitle>
              <AlertDescription>
                Datos obtenidos del endpoint <code className="text-xs bg-muted p-1 rounded">/sensores</code>
              </AlertDescription>
            </Alert>

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

          {errorMuestra ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMuestra}</AlertDescription>
            </Alert>
          ) : (
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
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMuestra && datosMuestra.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-lg">Cargando datos...</span>
                  </div>
                ) : datosMuestra.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron datos válidos para mostrar
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
                          {datosMuestra.map((dato, index) => (
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
                              <TableCell>{dato.fecha}</TableCell>
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
                  {loadingMuestra ? "Actualizando datos..." : `Mostrando ${datosMuestra.length} registros`}
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
