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

// Decodificar Base64
export function processBase64Data(base64String: string): { isCO2Sensor: boolean; value: number } {
  try {
    const binaryString = atob(base64String)
    const bytes = new Uint8Array(binaryString.length)

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Solo considerar válidos los datos que:
    // - Tienen longitud de 5 bytes
    // - El primer byte es 0x01 (CO₂)
    if (bytes.length !== 5 || bytes[0] !== 0x01) {
      return { isCO2Sensor: false, value: 0 }
    }

    const dataView = new DataView(bytes.buffer)
    const value = dataView.getFloat32(1, false) // Big Endian

    // Extra chequeo: valor dentro de rango razonable de CO₂ (ppm)
    if (!Number.isFinite(value) || value < 200 || value > 5000) {
      return { isCO2Sensor: false, value: 0 }
    }

    return { isCO2Sensor: true, value }
  } catch (error) {
    console.error("Error procesando datos Base64:", error)
    return { isCO2Sensor: false, value: 0 }
  }
}


// Formatear fecha
export function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return {
    formattedDate: format(date, "dd 'de' MMMM, yyyy", { locale: es }),
    formattedTime: format(date, "HH:mm:ss"),
    dateObj: date,
  }
}

// Mock
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
      if (hour >= 9 && hour <= 18) {
        baseValue = 700
      } else if (hour >= 18) {
        baseValue = 900
      }

      const randomVariation = Math.random() * 200 - 100
      const value = baseValue + randomVariation
      const highSpike = Math.random() > 0.9
      const finalValue = highSpike ? value + 300 : value

      const timestamp = date.toISOString()
      const { formattedDate, formattedTime, dateObj } = formatDateTime(timestamp)
      const mockBase64 = "AQAAAA==" // [0x01, 0x00, 0x00, 0x00, 0x00]

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

// API
const API_URL = "https://ipicyt-ia-gateway-production.up.railway.app/sensores"

async function fetchRealData(): Promise<SensorData[]> {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const data = await response.json()

    return data
      .filter((item: any) => !item.level && item.data && item.time)
      .map((item: any) => {
        const { isCO2Sensor, value } = processBase64Data(item.data || "")

        if (!isCO2Sensor || isNaN(value)) return null

        const timestamp = item.time
        const { formattedDate, formattedTime, dateObj } = formatDateTime(timestamp)

        return {
          id: item.deduplicationId || item.id || `real-${Date.now()}-${Math.random()}`,
          timestamp,
          data: item.data,
          sensorId: 1,
          decodedValue: value,
          formattedDate,
          formattedTime,
          dateObj,
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()) // Ordenados por fecha
  } catch (error) {
    console.error("Error al obtener datos reales:", error)
    throw error
  }
}

// Fetch de sensor
export async function fetchSensorData(): Promise<SensorData[]> {
  const useMockData = localStorage.getItem("useMockData") !== "false"

  if (useMockData) {
    console.log("Usando datos simulados")
    return generateMockData(3)
  } else {
    try {
      console.log("Obteniendo datos reales")
      return await fetchRealData()
    } catch (error) {
      console.error("Error real, usando mock:", error)
      return generateMockData(3)
    }
  }
}

// Promedios
export function calculateHourlyAverages(data: SensorData[]): { hour: string; average: number }[] {
  const hourlyData: Record<string, number[]> = {}

  data.forEach((item) => {
    const hour = format(item.dateObj, "yyyy-MM-dd HH:00")
    if (!hourlyData[hour]) {
      hourlyData[hour] = []
    }
    hourlyData[hour].push(item.decodedValue)
  })

  return Object.entries(hourlyData)
    .map(([hour, values]) => {
      const sum = values.reduce((acc, val) => acc + val, 0)
      const average = sum / values.length

      return {
        hour: format(new Date(hour), "dd/MM HH:00"),
        average: Number.parseFloat(average.toFixed(2)),
      }
    })
    .sort((a, b) => a.hour.localeCompare(b.hour))
}

// Filtro por fecha
export function filterDataByDateRange(data: SensorData[], startDate: Date | null, endDate: Date | null): SensorData[] {
  if (!startDate || !endDate) return data

  return data.filter((item) => item.dateObj >= startDate && item.dateObj <= endDate)
}
