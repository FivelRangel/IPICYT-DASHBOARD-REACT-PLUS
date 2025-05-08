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

// Decodifica solo sensores de CO₂ (0x01)
export function processBase64Data(base64String: string): { isCO2Sensor: boolean; value: number } {
  try {
    const binaryString = atob(base64String)
    const bytes = new Uint8Array(binaryString.length)

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const isCO2Sensor = bytes[0] === 0x01
    let value = 0

    if (isCO2Sensor && bytes.length >= 5) {
      const floatBytes = bytes.slice(1, 5)
      const dataView = new DataView(floatBytes.buffer)
      value = dataView.getFloat32(0, false) // Big Endian
    }

    if (!Number.isFinite(value)) value = 0

    return { isCO2Sensor, value: Number.parseFloat(value.toFixed(2)) }
  } catch (error) {
    console.error("Error procesando datos Base64:", error)
    return { isCO2Sensor: false, value: 0 }
  }
}

// Formatea fecha y hora
export function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    console.warn("Fecha inválida:", dateString)
  }
  return {
    formattedDate: format(date, "dd 'de' MMMM, yyyy", { locale: es }),
    formattedTime: format(date, "HH:mm:ss"),
    dateObj: date,
  }
}

// Genera datos simulados
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

const API_URL = "https://ipicyt-ia-gateway-production.up.railway.app/sensores"

// Obtiene datos reales y filtra válidos CO₂
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

    const rawData = await response.json()
    console.log("Total registros recibidos:", rawData.length)

    const validEntries = rawData
      .filter((item: any) => {
        const isValid = item.data && item.time
        if (!isValid) {
          console.warn("Descartado por falta de data o time:", item)
        }
        return isValid
      })
      .map((item: any) => {
        const { isCO2Sensor, value } = processBase64Data(item.data)
        if (!isCO2Sensor) {
          console.warn("Descartado: no es sensor de CO₂:", item.data)
          return null
        }

        let timestamp = item.time
        if (timestamp.includes(".")) {
          timestamp = timestamp.replace(/\.(\d{3})\d+/, ".$1")
        }

        try {
          const { formattedDate, formattedTime, dateObj } = formatDateTime(timestamp)

          return {
            id: item.deduplicationId || `real-${Date.now()}-${Math.random()}`,
            timestamp,
            data: item.data,
            sensorId: 1,
            decodedValue: value,
            formattedDate,
            formattedTime,
            dateObj,
          }
        } catch (err) {
          console.error("Error al formatear fecha:", timestamp, err)
          return null
        }
      })
      .filter(Boolean)

    console.log("Total datos válidos de CO₂:", validEntries.length)
    return validEntries
  } catch (error) {
    console.error("Error al obtener datos reales:", error)
    throw error
  }
}

// Usa datos reales o simulados según localStorage
export async function fetchSensorData(): Promise<SensorData[]> {
  const useMockData = localStorage.getItem("useMockData") !== "false"

  if (useMockData) {
    console.log("Usando datos simulados")
    return generateMockData(3)
  } else {
    try {
      console.log("Intentando obtener datos reales")
      const realData = await fetchRealData()
      if (realData.length === 0) {
        throw new Error("No hay datos válidos de CO₂")
      }
      return realData
    } catch (error) {
      console.error("Fallo al obtener datos reales. Usando simulados:", error)
      return generateMockData(3)
    }
  }
}

// Calcula promedios por hora
export function calculateHourlyAverages(data: SensorData[]): { hour: string; average: number }[] {
  const hourlyData: Record<string, number[]> = {}

  data.forEach((item) => {
    const hour = format(item.dateObj, "yyyy-MM-dd HH:00")
    if (!hourlyData[hour]) hourlyData[hour] = []
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

// Filtra datos por fechas
export function filterDataByDateRange(data: SensorData[], startDate: Date | null, endDate: Date | null): SensorData[] {
  if (!startDate || !endDate) return data
  return data.filter((item) => item.dateObj >= startDate && item.dateObj <= endDate)
}
