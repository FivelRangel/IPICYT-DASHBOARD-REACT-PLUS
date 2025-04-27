"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, BarChart, Table } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { SensorData } from "@/lib/api"

interface DownloadReportButtonProps {
  data: SensorData[]
  hourlyAverages: { hour: string; average: number }[]
  timeSeriesChartRef: React.RefObject<HTMLDivElement>
  averageChartRef: React.RefObject<HTMLDivElement>
}

export function DownloadReportButton({
  data,
  hourlyAverages,
  timeSeriesChartRef,
  averageChartRef,
}: DownloadReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  // Función para descargar datos como CSV
  const downloadCSV = () => {
    try {
      setIsGenerating(true)

      // Crear encabezados del CSV
      let csvContent = "ID,Fecha,Hora,CO2 (ppm)\n"

      // Agregar datos
      data.forEach((item) => {
        csvContent += `${item.id},${item.formattedDate},${item.formattedTime},${item.decodedValue.toFixed(2)}\n`
      })

      // Crear blob y descargar
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `datos-co2-${format(new Date(), "yyyy-MM-dd")}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error al generar CSV:", error)
      alert("Hubo un error al generar el archivo CSV. Por favor, intente nuevamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Función para generar PDF de la gráfica de serie de tiempo
  const downloadTimeSeriesChart = async () => {
    if (!timeSeriesChartRef.current) return

    try {
      setIsGenerating(true)

      const element = timeSeriesChartRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      })

      const imgData = canvas.toDataURL("image/png")

      // Crear PDF en orientación horizontal
      const pdf = new jsPDF("l", "mm", "a4")

      // Dimensiones de la página A4 horizontal
      const pageWidth = 297
      const pageHeight = 210

      // Calcular dimensiones para ajustar la imagen manteniendo la proporción
      const imgWidth = pageWidth - 20 // Margen de 10mm en cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Añadir título
      pdf.setFontSize(16)
      pdf.text("Serie de Tiempo - CO₂ (ppm)", pageWidth / 2, 15, { align: "center" })
      pdf.setFontSize(12)
      pdf.text(`Generado el: ${format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}`, pageWidth / 2, 22, {
        align: "center",
      })

      // Añadir línea separadora
      pdf.setLineWidth(0.5)
      pdf.line(10, 25, pageWidth - 10, 25)

      // Añadir imagen centrada
      pdf.addImage(imgData, "PNG", 10, 30, imgWidth, imgHeight)

      pdf.save("serie-tiempo-co2.pdf")
    } catch (error) {
      console.error("Error al generar PDF:", error)
      alert("Hubo un error al generar el PDF. Por favor, intente nuevamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Función para generar PDF de la gráfica de promedio por hora
  const downloadAverageChart = async () => {
    if (!averageChartRef.current) return

    try {
      setIsGenerating(true)

      const element = averageChartRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      })

      const imgData = canvas.toDataURL("image/png")

      // Crear PDF en orientación horizontal
      const pdf = new jsPDF("l", "mm", "a4")

      // Dimensiones de la página A4 horizontal
      const pageWidth = 297
      const pageHeight = 210

      // Calcular dimensiones para ajustar la imagen manteniendo la proporción
      const imgWidth = pageWidth - 20 // Margen de 10mm en cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Añadir título
      pdf.setFontSize(16)
      pdf.text("Promedio por Hora - CO₂ (ppm)", pageWidth / 2, 15, { align: "center" })
      pdf.setFontSize(12)
      pdf.text(`Generado el: ${format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}`, pageWidth / 2, 22, {
        align: "center",
      })

      // Añadir línea separadora
      pdf.setLineWidth(0.5)
      pdf.line(10, 25, pageWidth - 10, 25)

      // Añadir imagen centrada
      pdf.addImage(imgData, "PNG", 10, 30, imgWidth, imgHeight)

      pdf.save("promedio-hora-co2.pdf")
    } catch (error) {
      console.error("Error al generar PDF:", error)
      alert("Hubo un error al generar el PDF. Por favor, intente nuevamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isGenerating || data.length === 0}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Descargar Reportes
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={downloadCSV} disabled={isGenerating || data.length === 0}>
          <Table className="mr-2 h-4 w-4" />
          <span>Datos en CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadTimeSeriesChart} disabled={isGenerating || data.length === 0}>
          <BarChart className="mr-2 h-4 w-4" />
          <span>Gráfica Serie de Tiempo (PDF)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadAverageChart} disabled={isGenerating || data.length === 0}>
          <BarChart className="mr-2 h-4 w-4" />
          <span>Gráfica Promedio por Hora (PDF)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
