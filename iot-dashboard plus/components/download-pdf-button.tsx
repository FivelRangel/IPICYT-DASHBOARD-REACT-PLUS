"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface DownloadPdfButtonProps {
  targetRef: React.RefObject<HTMLElement>
}

export function DownloadPdfButton({ targetRef }: DownloadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    if (!targetRef.current) return

    try {
      setIsGenerating(true)

      const element = targetRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true, // Permitir contenido de origen cruzado
      })

      const imgData = canvas.toDataURL("image/png")

      // Calcular dimensiones para ajustar al PDF
      const imgWidth = 190
      const pageHeight = 290
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      const pdf = new jsPDF("p", "mm", "a4")

      // Añadir título
      pdf.setFontSize(16)
      pdf.text("Reporte de Mediciones de CO₂", 105, 15, { align: "center" })
      pdf.setFontSize(12)
      pdf.text(`Generado el: ${new Date().toLocaleString("es-ES")}`, 105, 22, { align: "center" })

      // Añadir línea separadora
      pdf.setLineWidth(0.5)
      pdf.line(10, 25, 200, 25)

      // Posición inicial después del título
      position = 30

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Si la imagen es más grande que una página, añadir más páginas
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save("reporte-co2.pdf")
    } catch (error) {
      console.error("Error al generar PDF:", error)
      alert("Hubo un error al generar el PDF. Por favor, intente nuevamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={isGenerating}>
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generando PDF...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Descargar Reporte PDF
        </>
      )}
    </Button>
  )
}
