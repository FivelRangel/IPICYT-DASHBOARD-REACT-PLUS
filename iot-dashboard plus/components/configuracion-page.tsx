"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Save, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function ConfiguracionPage() {
  const [useMockData, setUseMockData] = useState(true)
  const [saved, setSaved] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Cargar la configuración al iniciar
  useEffect(() => {
    const storedValue = localStorage.getItem("useMockData")
    if (storedValue !== null) {
      setUseMockData(storedValue === "true")
    }
  }, [])

  const handleSaveConfig = () => {
    // Guardar en localStorage
    localStorage.setItem("useMockData", useMockData.toString())

    // Mostrar notificación
    toast({
      title: "Configuración guardada",
      description: `Usando datos ${useMockData ? "simulados" : "reales"}.`,
      duration: 3000,
    })

    setSaved(true)

    // Mostrar el check por 2 segundos
    setTimeout(() => {
      setSaved(false)
    }, 2000)
  }

  const handleUpdateDashboard = () => {
    // Redirigir al dashboard para ver los cambios
    router.push("/")

    // Forzar recarga de la página para aplicar los cambios
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  return (
    <div className="flex flex-col p-6 gap-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Personaliza el comportamiento del dashboard</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fuente de datos</CardTitle>
          <CardDescription>Configura el origen de los datos para el dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="mock-data" className="flex flex-col space-y-1">
                <span>Usar datos simulados</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Activa esta opción para usar datos generados localmente
                </span>
              </Label>
              <Switch id="mock-data" checked={useMockData} onCheckedChange={setUseMockData} />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Información importante</AlertTitle>
              <AlertDescription>
                {useMockData
                  ? "Los datos simulados son generados localmente y no requieren conexión a un servidor externo."
                  : "Los datos reales requieren conexión al servidor API. Si hay problemas de conexión, el dashboard podría no mostrar datos."}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleUpdateDashboard}>
            Actualizar dashboard
          </Button>
          <Button onClick={handleSaveConfig}>
            {saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar configuración
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
