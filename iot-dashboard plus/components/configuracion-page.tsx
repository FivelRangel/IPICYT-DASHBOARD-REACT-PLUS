"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Save, Check, Palette } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

export function ConfiguracionPage() {
  const [useMockData, setUseMockData] = useState(true)
  const [saved, setSaved] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  // Cargar la configuración al iniciar
  useEffect(() => {
    try {
      const storedValue = localStorage.getItem("useMockData")
      if (storedValue !== null) {
        setUseMockData(storedValue === "true")
      }
    } catch (error) {
      console.error("Error al acceder a localStorage:", error)
      // Mantener el valor predeterminado (true) si hay un error
    }
  }, [])

  const handleSaveConfig = () => {
    try {
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
    } catch (error) {
      console.error("Error al guardar en localStorage:", error)
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleUpdateDashboard = () => {
    // Redirigir al dashboard para ver los cambios
    router.push("/")

    // Forzar recarga de la página para aplicar los cambios
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  const handleThemeChange = (isDark: boolean) => {
    setTheme(isDark ? "dark" : "light")
  }

  return (
    <div className="flex flex-col p-4 md:p-6 gap-6 w-full max-w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Personaliza el comportamiento del dashboard</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Fuente de datos
            </CardTitle>
            <CardDescription>Configura el origen de los datos para el dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="mock-data" className="flex flex-col space-y-1 flex-1">
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
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
            <Button variant="outline" onClick={handleUpdateDashboard} className="w-full sm:w-auto">
              Actualizar dashboard
            </Button>
            <Button onClick={handleSaveConfig} className="w-full sm:w-auto">
              {saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar configuración
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apariencia
            </CardTitle>
            <CardDescription>Personaliza la apariencia del dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="theme-mode" className="flex flex-col space-y-1 flex-1">
                  <span>Modo oscuro</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Activa esta opción para usar el tema oscuro
                  </span>
                </Label>
                <Switch id="theme-mode" checked={theme === "dark"} onCheckedChange={handleThemeChange} />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>
                  También puedes cambiar el tema usando los botones en la parte inferior del menú lateral.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Guardar preferencias
            </Button>
          </CardFooter>
        </Card>

        {/* Card adicional para información del sistema */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Información del sistema</CardTitle>
            <CardDescription>Detalles sobre el estado actual del dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">Versión</span>
                <span className="text-sm text-muted-foreground">v1.0.0</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">Última actualización</span>
                <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString("es-ES")}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">Estado</span>
                <span className="text-sm text-green-600">Operativo</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
