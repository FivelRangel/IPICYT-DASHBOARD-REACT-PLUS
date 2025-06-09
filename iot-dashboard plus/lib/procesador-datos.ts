import base64 from "base-64"

export interface DatoSensor {
  sensorId: string
  tipoSensor: string
  dataSinProcesar: string
  dataPreprocesada: string
  valorProcesado: string
  fecha: string
}

// Función para decodificar base64 a array de bytes
function base64ToBytes(base64Str: string): Uint8Array {
  try {
    // Decodificar base64 a string binario
    const binaryString = base64.decode(base64Str)
    // Convertir string binario a array de bytes
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  } catch (error) {
    console.error("Error decodificando base64:", error)
    return new Uint8Array(0)
  }
}

// Función para convertir bytes a valor float
function bytesToFloat(bytes: Uint8Array, offset = 0): number {
  if (bytes.length < offset + 4) {
    throw new Error("No hay suficientes bytes para convertir a float")
  }

  // Crear un ArrayBuffer y DataView para leer el float
  const buffer = new ArrayBuffer(4)
  const view = new DataView(buffer)

  // Copiar los bytes al buffer
  for (let i = 0; i < 4; i++) {
    view.setUint8(i, bytes[offset + i])
  }

  // Leer el float en formato big-endian
  return view.getFloat32(0, false) // false para big-endian
}

// Función para convertir bytes a representación hexadecimal
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join(" ")
}

// Modificar la función procesarDatosSensores para aceptar datos simulados
export function procesarDatosSensores(
  data: any[],
  tiposSensor: Record<number, string>,
  datosSimulados?: DatoSensor[],
): { datosFiltrados: DatoSensor[]; errores: number; csv: string } {
  // Si se proporcionan datos simulados, usarlos directamente
  if (datosSimulados && datosSimulados.length > 0) {
    const csv = generarCSV(datosSimulados, data.length || 60, data.length ? 0 : 10)
    return { datosFiltrados: datosSimulados, errores: data.length ? 0 : 10, csv }
  }

  const datosFiltrados: DatoSensor[] = []
  let errores = 0

  // Procesar cada elemento de los datos
  for (const item of data) {
    // Verificar si hay un código de error
    if (item.code === "UPLINK_CODEC") {
      errores++
      continue
    }

    // Obtener los datos codificados
    const encodedData = item.data
    if (!encodedData) {
      continue
    }

    const fecha = item.time || new Date().toISOString()

    try {
      // Decodificar los datos de base64
      const decodedBytes = base64ToBytes(encodedData)

      if (decodedBytes.length < 5) {
        console.log(`Datos insuficientes en: ${encodedData}`)
        continue
      }

      // Extraer ID del sensor y valor
      const sensorId = decodedBytes[0]
      const sensorValueBytes = decodedBytes.slice(1, 5)
      const sensorValue = bytesToFloat(decodedBytes, 1)
      const tipoSensor = tiposSensor[sensorId] || "Desconocido"

      // Convertir bytes a representación hexadecimal
      const hexData = bytesToHex(decodedBytes)

      // Agregar a los datos filtrados
      datosFiltrados.push({
        sensorId: `0x${sensorId.toString(16).padStart(2, "0").toUpperCase()}`,
        tipoSensor,
        dataSinProcesar: encodedData,
        dataPreprocesada: hexData,
        valorProcesado: sensorValue.toFixed(6),
        fecha,
      })
    } catch (error) {
      console.error(`Error procesando data '${encodedData}':`, error)
      continue
    }
  }

  // Generar CSV
  const csv = generarCSV(datosFiltrados, data.length, errores)

  return { datosFiltrados, errores, csv }
}

// Función para generar CSV
function generarCSV(datos: DatoSensor[], totalObjetos: number, errores: number): string {
  let csvContent = ""

  // Encabezado de resumen
  csvContent += `Total de objetos recibidos;${totalObjetos}\n`
  csvContent += `Registros con error;${errores}\n`
  csvContent += `Registros sin error;${datos.length}\n\n`

  // Encabezados de tabla
  csvContent += "Sensor ID;Tipo de sensor;Data sin procesar;Data preprocesada;Valor procesado (float);Fecha\n"

  // Filas de datos
  for (const dato of datos) {
    csvContent += `${dato.sensorId};${dato.tipoSensor};${dato.dataSinProcesar};${dato.dataPreprocesada};${dato.valorProcesado};${dato.fecha}\n`
  }

  return csvContent
}
