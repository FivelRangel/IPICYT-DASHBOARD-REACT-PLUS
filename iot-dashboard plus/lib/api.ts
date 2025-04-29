// Interfaz de datos para lecturas de CO₂
interface DataPoint {
    timestamp: number;  // Marca de tiempo en milisegundos (Date.getTime())
    co2: number;        // Valor de CO₂ en ppm
}

/**
 * Formatea un timestamp (ms desde 1970) a una cadena de fecha y hora legible.
 * Ejemplo de salida: "2025-04-29 00:46:32".
 */
function formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    // Formatear con año-mes-día horas:minutos:segundos
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Genera datos simulados (mock) de CO₂ para propósitos de prueba.
 * Retorna un arreglo de objetos DataPoint con valores de CO₂ aleatorios en un rango razonable.
 */
function generateMockData(): DataPoint[] {
    const data: DataPoint[] = [];
    const now = Date.now();
    // Generar 24 valores (uno por cada hora pasada) con variaciones aleatorias
    for (let i = 0; i < 24; i++) {
        const timestamp = now - (23 - i) * 60 * 60 * 1000;  // horas hacia atrás
        // Valor de CO₂ aleatorio entre 350 y 2000 ppm (rango razonable)
        const co2Value = 350 + Math.random() * 1650;
        data.push({
            timestamp: Math.floor(timestamp),
            co2: Math.round(co2Value)
        });
    }
    return data;
}

/**
 * Obtiene datos reales del sensor CO₂ (por ejemplo, de una API o dispositivo).
 * Procesa una carga útil codificada en Base64 de 5 bytes: 
 * - Byte 0: ID del sensor (0x01 para CO₂)
 * - Bytes 1-4: valor UInt32 Big Endian representando el CO₂ en ppm.
 * Filtra valores fuera de rango (menos de 200 o más de 5000 ppm).
 */
async function fetchRealData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];
    try {
        // Supongamos que fetch devuelve una respuesta JSON con los datos base64
        const response = await fetch('https://ipicyt-ia-gateway-production.up.railway.app/sensores');  // URL_DE_LA_API es un ejemplo de URL
        const jsonData = await response.json();
        // Asumimos que jsonData contiene un arreglo de lecturas, cada una con un campo base64 (por ejemplo, jsonData.data o similar)
        const readings = Array.isArray(jsonData) ? jsonData : jsonData.readings || jsonData.data || [jsonData];
        for (const entry of readings) {
            // Obtener la cadena Base64 del objeto de entrada (ajustar la clave según estructura real de jsonData)
            const base64Str: string | undefined = entry.base64 || entry.data || entry.payload;
            if (!base64Str) continue; // si no hay campo base64, ignorar esta entrada
            // Decodificar Base64 a bytes
            let bytes: Uint8Array;
            try {
                if (typeof Buffer !== 'undefined') {
                    // Entorno Node.js
                    bytes = Uint8Array.from(Buffer.from(base64Str, 'base64'));
                } else {
                    // Entorno navegador
                    const binaryStr = atob(base64Str);
                    const len = binaryStr.length;
                    bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryStr.charCodeAt(i);
                    }
                }
            } catch (decodeError) {
                console.error('Error decodificando base64:', decodeError);
                continue;
            }
            if (bytes.length < 5) {
                console.warn('Datos base64 ignorados, longitud insuficiente:', bytes.length);
                continue;
            }
            // Verificar ID del sensor (byte 0)
            const sensorId = bytes[0];
            if (sensorId !== 0x01) {
                // Si el ID no corresponde a CO₂ (0x01), descartar esta lectura
                continue;
            }
            // Extraer los siguientes 4 bytes como entero de 32 bits sin signo (Big Endian)
            const value = (bytes[1] * 0x1000000) + ((bytes[2] << 16) | (bytes[3] << 8) | bytes[4]);
            // Interpretar el valor como ppm de CO₂
            const co2ppm = value;
            // Filtrar valores fuera de rango razonable
            if (co2ppm < 200 || co2ppm > 5000) {
                console.warn('Valor de CO₂ fuera de rango, descartado:', co2ppm);
                continue;
            }
            // Usar timestamp proporcionado si existe; de lo contrario, usar tiempo actual
            let timestamp: number;
            if (entry.timestamp) {
                // Si el timestamp viene en segundos, convertir a ms; si es cadena, parsear fecha
                timestamp = typeof entry.timestamp === 'number' 
                    ? (entry.timestamp > 1e12 ? entry.timestamp : entry.timestamp * 1000)
                    : new Date(entry.timestamp).getTime();
            } else {
                timestamp = Date.now();
            }
            dataPoints.push({ timestamp, co2: co2ppm });
        }
        // Ordenar los puntos de datos por tiempo ascendente
        dataPoints.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
        console.error('Error en fetchRealData:', error);
    }
    return dataPoints;
}

/**
 * Obtiene datos del sensor CO₂, ya sean reales o simulados, según la disponibilidad.
 * Puede usarse un indicador (por ejemplo, una variable de configuración) para decidir el origen.
 * En este caso, se intenta obtener datos reales y si falla o no hay datos, se generan datos simulados.
 */
async function fetchSensorData(useMock: boolean = false): Promise<DataPoint[]> {
    if (useMock) {
        // Retornar datos simulados inmediatamente
        return generateMockData();
    }
    // Intentar obtener datos reales
    const realData = await fetchRealData();
    if (realData.length > 0) {
        return realData;
    } else {
        // Si no se obtuvieron datos reales, retornar simulados como respaldo
        return generateMockData();
    }
}

/**
 * Calcula los promedios horarios de los valores de CO₂.
 * Agrupa la lista de puntos de datos por cada hora calendario y retorna una nueva lista 
 * con un punto de datos (timestamp al inicio de la hora, valor promedio) por cada hora con datos.
 */
function calculateHourlyAverages(data: DataPoint[]): DataPoint[] {
    const hourlySums: { [hourStart: number]: { sum: number, count: number } } = {};
    for (const item of data) {
        const date = new Date(item.timestamp);
        // Normalizar la fecha al inicio de la hora (minutos, segundos y ms en 0)
        date.setMinutes(0, 0, 0, 0);
        const hourStart = date.getTime();
        if (!hourlySums[hourStart]) {
            hourlySums[hourStart] = { sum: 0, count: 0 };
        }
        hourlySums[hourStart].sum += item.co2;
        hourlySums[hourStart].count += 1;
    }
    // Construir el array de promedios por hora
    const hourlyAverages: DataPoint[] = [];
    for (const hourStart in hourlySums) {
        const entry = hourlySums[hourStart];
        const average = entry.sum / entry.count;
        hourlyAverages.push({ timestamp: Number(hourStart), co2: parseFloat(average.toFixed(2)) });
    }
    // Ordenar los promedios por hora por si acaso
    hourlyAverages.sort((a, b) => a.timestamp - b.timestamp);
    return hourlyAverages;
}

/**
 * Filtra una lista de datos de CO₂ para que solo incluya aquellos dentro de un rango de fechas dado.
 * @param data Lista de puntos de datos a filtrar.
 * @param startDate Fecha de inicio del rango (inclusive).
 * @param endDate Fecha de fin del rango (inclusive).
 * @returns Nuevo array con puntos de datos cuyos timestamps estén dentro del rango especificado.
 */
function filterDataByDateRange(data: DataPoint[], startDate: Date, endDate: Date): DataPoint[] {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    return data.filter(item => item.timestamp >= startTime && item.timestamp <= endTime);
}

// Exportar tipos y funciones (si este módulo se utiliza en un entorno con módulos ES)
export {
    DataPoint,
    formatDateTime,
    generateMockData,
    fetchRealData,
    fetchSensorData,
    calculateHourlyAverages,
    filterDataByDateRange
};
