import { SensorDashboard } from "@/components/sensor-dashboard"

export default function Home() {
  return (
    <main className="flex flex-col p-6 gap-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard CO₂</h1>
        <p className="text-muted-foreground">Visualización de mediciones de CO₂ en tiempo real</p>
      </div>
      <SensorDashboard />
    </main>
  )
}
