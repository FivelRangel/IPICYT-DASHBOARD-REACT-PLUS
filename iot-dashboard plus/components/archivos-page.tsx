"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, File, Trash2, Eye, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { fileStorage, type StoredFile } from "@/lib/file-storage"
import { useToast } from "@/hooks/use-toast"

export function ArchivosPage() {
  const [pdfFiles, setPdfFiles] = useState<StoredFile[]>([])
  const [selectedPdf, setSelectedPdf] = useState<StoredFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Cargar archivos al iniciar
  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = () => {
    const files = fileStorage.getAllFiles()
    setPdfFiles(files)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (file.type !== "application/pdf") {
          toast({
            title: "Error",
            description: `El archivo "${file.name}" no es un PDF válido.`,
            variant: "destructive",
          })
          continue
        }

        await fileStorage.uploadFile(file)
      }

      loadFiles()

      toast({
        title: "Archivos subidos",
        description: `Se subieron ${files.length} archivo(s) correctamente.`,
      })

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Error al subir archivos: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = (id: string) => {
    const success = fileStorage.deleteFile(id)

    if (success) {
      loadFiles()

      if (selectedPdf && selectedPdf.id === id) {
        setSelectedPdf(null)
      }

      toast({
        title: "Archivo eliminado",
        description: "El archivo se eliminó correctamente.",
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo.",
        variant: "destructive",
      })
    }
  }

  const handleViewFile = (file: StoredFile) => {
    setSelectedPdf(file)
  }

  return (
    <div className="flex flex-col p-4 md:p-6 gap-6 w-full max-w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Archivos PDF</h1>
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
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Solo se permiten archivos PDF. Puedes seleccionar múltiples archivos.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Subiendo..." : "Subir archivo"}
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
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No hay archivos</AlertTitle>
                  <AlertDescription>No se han subido archivos PDF. Sube un archivo para comenzar.</AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="h-[400px] w-full rounded-md border">
                  <div className="p-4">
                    <div className="w-full overflow-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left pb-2 px-2 md:px-4">Nombre</th>
                            <th className="text-left pb-2 px-2 md:px-4">Tamaño</th>
                            <th className="text-left pb-2 px-2 md:px-4 hidden md:table-cell">Fecha</th>
                            <th className="text-right pb-2 px-2 md:px-4">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pdfFiles.map((file) => (
                            <tr key={file.id} className="border-b">
                              <td className="py-2 px-2 md:px-4 flex items-center">
                                <File className="mr-2 h-4 w-4 flex-shrink-0" />
                                <span className="truncate max-w-[150px] md:max-w-[200px]">{file.name}</span>
                              </td>
                              <td className="py-2 px-2 md:px-4">{fileStorage.formatFileSize(file.size)}</td>
                              <td className="py-2 px-2 md:px-4 hidden md:table-cell">
                                {file.uploadDate.toLocaleDateString("es-ES")}
                              </td>
                              <td className="py-2 px-2 md:px-4 text-right">
                                <div className="flex justify-end gap-1 md:gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" onClick={() => handleViewFile(file)}>
                                        <Eye className="h-4 w-4" />
                                        <span className="hidden md:inline ml-1">Ver</span>
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl h-[80vh]">
                                      <DialogHeader>
                                        <DialogTitle className="truncate">{file.name}</DialogTitle>
                                      </DialogHeader>
                                      <div className="w-full h-full">
                                        <iframe
                                          src={file.url}
                                          className="w-full h-[calc(80vh-80px)]"
                                          title={file.name}
                                        />
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteFile(file.id)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="hidden md:inline ml-1">Eliminar</span>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                  <p className="text-muted-foreground text-center">Selecciona un archivo para visualizarlo</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      const filesTab = document.querySelector('[data-state="inactive"]') as HTMLElement
                      if (filesTab) filesTab.click()
                    }}
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
