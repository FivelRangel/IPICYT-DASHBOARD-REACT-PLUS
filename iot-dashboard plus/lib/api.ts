import { format } from "date-fns"
import { es } from "date-fns/locale"

export interface SensorData {
  id: string
  timestamp: string
  data: string
  sensorId: number
  decodedValue: number
  formattedDate: string
  formattedTime: string
  dateObj: Date
}

export function processBase64Data(base64String: string): { isCO2Sensor: boolean; value: number } {
  try {
    console.log("🔍 Decodificando base64:", base64String)
    const binaryString = atob(base64String)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    console.log("🧱 Bytes decodificados:", [...bytes])
    console.log("🧱 Bytes HEX:", [...bytes].map(b => b.toString(16).padStart(2, "0")))

    const isCO2Sensor = bytes[0] === 0x01
    if (!isCO2Sensor) {
      console.warn("⚠️ No es sensor CO₂ (bytes[0] !== 0x01):", bytes[0])
      return { isCO2Sensor: false, value: 0 }
    }

    if (bytes.length < 5) {
      console.warn("⚠️ Datos insuficientes para Float32 (menos de 5 bytes):", bytes.length)
      return { isCO2Sensor: true, value: 0 }
    }

    const floatBytes = bytes.slice(1, 5)
    const buffer = new ArrayBuffer(4)
    new Uint8Array(buffer).set(floatBytes)
    const dataView = new DataView(buffer)
    let value = dataView.getFloat32(0, true) // ✅ Little Endian

    console.log("📈 Valor Float32 bruto:", value)

    if (!Number.isFinite(value) || Math.abs(value) > 10000) {
      console.warn("❌ Valor fuera de rango o inválido:", value)
      value = 0
    }

    const final = Number.parseFloat(value.toFixed(2))
    console.log("🎯 Valor CO₂ redondeado:", final, "ppm")
    return { isCO2Sensor: true, value: final }
  } catch (error) {
    console.error("❌ Error procesando datos Base64:", error)
    return { isCO2Sensor: false, value: 0 }
  }
}

export function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    console.warn("⚠️ Fecha inválida:", dateString)
  }
  return {
    formattedDate: format(date, "dd 'de' MMMM, yyyy", { locale: es }),
    formattedTime: format(date, "HH:mm:ss"),
    dateObj: date,
  }
}

export function generateMockData(days = 3): SensorData[] {
  const mockData: SensorData[] = []
  const now = new Date()

  for (let i = 0; i < days; i++) {
    for (let hourIndex = 0; hourIndex < 8; hourIndex++) {
      const hour = hourIndex * 3
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(hour, Math.floor(Math.random() * 60), 0, 0)

      let baseValue = 500
      if (hour >= 9 && hour <= 18) baseValue = 700
      else if (hour >= 18) baseValue = 900

      const randomVariation = Math.random() * 200 - 100
      const value = baseValue + randomVariation
      const highSpike = Math.random() > 0.9
      const finalValue = highSpike ? value + 300 : value

      const timestamp = date.toISOString()
      const { formattedDate, formattedTime, dateObj } = formatDateTime(timestamp)
      const mockBase64 = "AQAAAA==" // 0x01 + 0x00*4

      mockData.push({
        id: `mock-${i}-${hour}`,
        timestamp,
        data: mockBase64,
        sensorId: 1,
        decodedValue: finalValue,
        formattedDate,
        formattedTime,
        dateObj,
      })
    }
  }

  return mockData.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
}

//const API_URL = "https://ipicyt-ia-gateway-production.up.railway.app/sensores"
const API_URL = "https://ipicyt-ia-gateway-production.up.railway.app/todos"


export async function fetchRealData(): Promise<SensorData[]> {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const rawData = await response.json()
    console.log("📥 Total registros recibidos:", rawData.length)

    const validEntries = rawData
      .filter((item: any) => item.data && item.time)
      .map((item: any, index: number) => {
        console.log(`\n📦 Procesando entrada #${index + 1}`)
        const { isCO2Sensor, value } = processBase64Data(item.data)
        if (!isCO2Sensor) return null

        let timestamp = item.time
        if (timestamp.includes(".")) {
          timestamp = timestamp.replace(/\.(\d{3})\d+/, ".$1")
        }

        try {
          const { formattedDate, formattedTime, dateObj } = formatDateTime(timestamp)
          const entry: SensorData = {
            id: item.deduplicationId || `real-${Date.now()}-${Math.random()}`,
            timestamp,
            data: item.data,
            sensorId: 1,
            decodedValue: value,
            formattedDate,
            formattedTime,
            dateObj,
          }
          console.log("✅ Entrada válida:", entry)
          return entry
        } catch (err) {
          console.error("❌ Error al formatear fecha:", timestamp, err)
          return null
        }
      })
      .filter(Boolean)

    console.log("✅ Total datos válidos de CO₂:", validEntries.length)

    console.log("📄 === LISTA DETALLADA DE DATOS VÁLIDOS DE CO₂ ===")
    validEntries.forEach((entry, index) => {
      console.log(`\n📦 Entrada #${index + 1}`)
      console.log("🟡 ID:", entry.id)
      console.log("🕒 Timestamp:", entry.timestamp)
      console.log("📆 Fecha:", entry.formattedDate)
      console.log("⏰ Hora:", entry.formattedTime)
      console.log("🧬 Base64:", entry.data)

      const binaryString = atob(entry.data)
      const bytes = Array.from(binaryString).map(c => c.charCodeAt(0))
      console.log("🧱 Bytes (dec):", bytes)
      console.log("🧱 Bytes (hex):", bytes.map(b => b.toString(16).padStart(2, "0")))

      const floatBytes = bytes.slice(1, 5)
      const buffer = new ArrayBuffer(4)
      new Uint8Array(buffer).set(floatBytes)
      const float = new DataView(buffer).getFloat32(0, true) // Little Endian
      console.log("🔢 Float32 bruto:", float)
      console.log("🎯 Valor CO₂ redondeado:", entry.decodedValue, "ppm")
    })

    return validEntries
  } catch (error) {
    console.error("❌ Error al obtener datos reales:", error)
    throw error
  }
}

export async function fetchSensorData(): Promise<SensorData[]> {
  const useMockData = localStorage.getItem("useMockData") !== "false"
  console.log("🔧 Configuración: useMockData =", useMockData)

  if (useMockData) {
    console.log("🧪 Usando datos simulados")
    return generateMockData(3)
  } else {
    try {
      console.log("🌐 Intentando obtener datos reales")
      const realData = await fetchRealData()
      if (realData.length === 0) {
        console.warn("🚨 Motivo: fetchRealData devolvió 0 entradas válidas")
        throw new Error("No hay datos válidos de CO₂")
      }
      return realData
    } catch (error) {
      console.error("⚠️ Fallo al obtener datos reales. Usando simulados:", error)
      return generateMockData(3)
    }
  }
}

export function calculateHourlyAverages(data: SensorData[]): { hour: string; average: number }[] {
  const hourlyData: Record<string, number[]> = {}

  data.forEach((item) => {
    const hour = format(item.dateObj, "yyyy-MM-dd HH:00")
    if (!hourlyData[hour]) hourlyData[hour] = []
    hourlyData[hour].push(item.decodedValue)
  })

  const result = Object.entries(hourlyData)
    .map(([hour, values]) => {
      const sum = values.reduce((acc, val) => acc + val, 0)
      const average = sum / values.length
      return {
        hour: format(new Date(hour), "dd/MM HH:00"),
        average: Number.parseFloat(average.toFixed(2)),
      }
    })
    .sort((a, b) => a.hour.localeCompare(b.hour))

  console.log("📊 Promedios horarios:", result)
  return result
}

export function filterDataByDateRange(data: SensorData[], startDate: Date | null, endDate: Date | null): SensorData[] {
  console.log("📅 Filtrando entre fechas:", startDate, "->", endDate)
  if (!startDate || !endDate) return data
  const filtered = data.filter((item) => item.dateObj >= startDate && item.dateObj <= endDate)
  console.log(`📦 Resultados después del filtro: ${filtered.length}/${data.length}`)
  return filtered
}
