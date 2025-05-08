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

// Función actualizada con impresión de valores
export function processBase64Data(base64String: string): { isCO2Sensor: boolean; value: number } {
  try {
    const binaryString = atob(base64String)
    const bytes = new Uint8Array(binaryString.length)

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const sensorId = bytes[0]
    const valueBytes = bytes.slice(1, 5)
    const dataView = new DataView(valueBytes.buffer)
    const value = dataView.getFloat32(0, true) // Little Endian

    const isCO2Sensor = sensorId === 0x01

    if (isCO2Sensor) {
      console.log(`Valor original (base64): ${base64String} → valor procesado: ${value.toFixed(2)}`)
    }

    return { isCO2Sensor, value: Math.round(value * 100) / 100 }
  } catch (error) {
    console.error("Error procesando datos Base64:", error)
    return { isCO2Sensor: false, value: 0 }
  }
}

export function formatDateTime(dateString: string) {
  const date = new Date(dateString)
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

      const mockBase64 = "AQAAAA==" // Simula [0x01, 0x00, 0x00, 0x00, 0x00]

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
      .map((item: any) => {
        const { isCO2Sensor, value } = processBase64Data(item.data || "")
        if (!isCO2Sensor) return null

        const timestamp = item.timestamp
        const { formattedDate, formattedTime, dateObj } = formatDateTime(timestamp)

        return {
          id: item.id || `real-${Date.now()}-${Math.random()}`,
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
  } catch (error) {
    console.error("Error al obtener datos reales:", error)
    throw error
  }
}

export async function fetchSensorData(): Promise<SensorData[]> {
  const useMockData = localStorage.getItem("useMockData") !== "false"

  if (useMockData) {
    console.log("Usando datos simulados")
    return generateMockData(3)
  } else {
    try {
      console.log("Intentando obtener datos reales")
      return await fetchRealData()
    } catch (error) {
      console.error("Error al obtener datos reales, usando datos simulados como fallback:", error)
      return generateMockData(3)
    }
  }
}

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

export function filterDataByDateRange(data: SensorData[], startDate: Date | null, endDate: Date | null): SensorData[] {
  if (!startDate || !endDate) return data

  return data.filter((item) => {
    const date = item.dateObj
    return date >= startDate && date <= endDate
  })
}
