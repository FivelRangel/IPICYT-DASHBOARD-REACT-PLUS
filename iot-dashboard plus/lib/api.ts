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

const TIPOS_SENSOR: Record<number, string> = {
  0x01: "CO2",
  0x02: "Temperatura",
  0x03: "Humedad",
  0x04: "PM2_5",
  0x05: "PM10",
}

// ✅ Igual que en Python: little-endian '<f'
export function processBase64Data(base64String: string): { isCO2Sensor: boolean; value: number } {
  try {
    const binaryString = atob(base64String)
    const bytes = new Uint8Array(binaryString.length)

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    if (bytes.length < 5) {
      throw new Error("Datos insuficientes para procesar Float32.")
    }

    const sensorId = bytes[0]
    const valueBytes = bytes.slice(1, 5)
    const dataView = new DataView(valueBytes.buffer)
    const value = dataView.getFloat32(0, true) // ← little-endian (true)

    return {
      isCO2Sensor: sensorId === 0x01,
      value: Math.round(value * 1000000) / 1000000, // Mismo redondeo que Python
    }
  } catch (error) {
    console.error("Error procesando datos Base64:", error)
    return { isCO2Sensor: false, value: 0 }
  }
}

export function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    throw new RangeError("Invalid time value: " + dateString)
  }
  return {
    formattedDate: format(date, "dd 'de' MMMM, yyyy", { locale: es }),
    formattedTime: format(date, "HH:mm:ss"),
    dateObj: date,
  }
}

const API_URL = "https://ipicyt-ia-gateway-production.up.railway.app/sensores"

export async function fetchSensorData(): Promise<SensorData[]> {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`)
    }

    const data = await response.json()

    const processed: SensorData[] = []

    for (const item of data) {
      if (item.code === "UPLINK_CODEC") {
        continue
      }

      const encodedData = item.data
      if (!encodedData || typeof encodedData !== "string") continue

      const { isCO2Sensor, value } = processBase64Data(encodedData)
      if (!isCO2Sensor) continue

      const timestamp = item.timestamp || item.time
      let dateObj: Date, formattedDate: string, formattedTime: string

      try {
        const parsed = formatDateTime(timestamp)
        dateObj = parsed.dateObj
        formattedDate = parsed.formattedDate
        formattedTime = parsed.formattedTime
      } catch (e) {
        console.warn("Fecha inválida:", timestamp)
        continue
      }

      processed.push({
        id: item.id || `${Date.now()}-${Math.random()}`,
        timestamp,
        data: encodedData,
        sensorId: 1,
        decodedValue: value,
        formattedDate,
        formattedTime,
        dateObj,
      })
    }

    return processed
  } catch (err) {
    console.error("Error al obtener datos reales:", err)
    return []
  }
}
