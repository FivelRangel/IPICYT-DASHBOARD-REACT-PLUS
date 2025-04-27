"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, File, Trash2, Eye } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface PDFFile {
  id: string
  name: string
  size: string
  date: string
  url: string
}

export function ArchivosPage() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([
    {
      id: "1",
      name: "Reporte-Enero-2023.pdf",
      size: "1.2 MB",
      date: "15/01/2023",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
    {
      id: "2",
      name: "Reporte-Febrero-2023.pdf",
      size: "0.8 MB",
      date: "10/02/2023",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
  ])
  const [selectedPdf, setSelectedPdf] = useState<PDFFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles: PDFFile[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type === "application/pdf") {
        // Crear URL para el archivo
        const url = URL.createObjectURL(file)

        // Formatear tamaño
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)

        // Formatear fecha
        const today = new Date()
        const date = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`

        newFiles.push({
          id: `file-${Date.now()}-${i}`,
          name: file.name,
          size: `${sizeInMB} MB`,
          date: date,
          url: url,
        })
      }
    }

    setPdfFiles([...pdfFiles, ...newFiles])

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDeleteFile = (id: string) => {
    setPdfFiles(pdfFiles.filter((file) => file.id !== id))
    if (selectedPdf && selectedPdf.id === id) {
      setSelectedPdf(null)
    }
  }

  const handleViewFile = (file: PDFFile) => {
    setSelectedPdf(file)
  }

  return (
    <div className="flex flex-col p-6 gap-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Archivos PDF</h1>
        <p className="text-muted-foreground">Almacenamiento y visualización de reportes PDF</p>
      </div>

      <Tabs defaultValue="files" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="files">Archivos</TabsTrigger>
          <TabsTrigger value="viewer">Visor PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subir nuevo archivo</CardTitle>
              <CardDescription>Sube archivos PDF para almacenarlos y visualizarlos posteriormente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="pdf-upload">Archivo PDF</Label>
                  <Input
                    id="pdf-upload"
                    type="file"
                    ref={fileInputRef}
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    multiple
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Subir archivo
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Archivos almacenados</CardTitle>
              <CardDescription>Lista de archivos PDF disponibles para visualización</CardDescription>
            </CardHeader>
            <CardContent>
              {pdfFiles.length === 0 ? (
                <Alert>
                  <AlertTitle>No hay archivos</AlertTitle>
                  <AlertDescription>No se han subido archivos PDF. Sube un archivo para comenzar.</AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="h-[300px] w-full rounded-md border">
                  <div className="p-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2">Nombre</th>
                          <th className="text-left pb-2">Tamaño</th>
                          <th className="text-left pb-2">Fecha</th>
                          <th className="text-right pb-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pdfFiles.map((file) => (
                          <tr key={file.id} className="border-b">
                            <td className="py-2 flex items-center">
                              <File className="mr-2 h-4 w-4" />
                              {file.name}
                            </td>
                            <td className="py-2">{file.size}</td>
                            <td className="py-2">{file.date}</td>
                            <td className="py-2 text-right">
                              <div className="flex justify-end gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleViewFile(file)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl h-[80vh]">
                                    <DialogHeader>
                                      <DialogTitle>{file.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="w-full h-full">
                                      <iframe src={file.url} className="w-full h-[calc(80vh-80px)]" title={file.name} />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteFile(file.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="viewer">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Visor de PDF</CardTitle>
              <CardDescription>Visualiza los archivos PDF almacenados</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPdf ? (
                <div className="w-full h-[70vh] border rounded-md overflow-hidden">
                  <iframe src={selectedPdf.url} className="w-full h-full" title={selectedPdf.name} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] border rounded-md">
                  <File className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Selecciona un archivo para visualizarlo</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => document.getElementById("files-tab")?.click()}
                  >
                    Ir a archivos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
