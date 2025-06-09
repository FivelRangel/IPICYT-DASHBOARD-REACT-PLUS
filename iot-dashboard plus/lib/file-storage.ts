// Sistema de almacenamiento de archivos simulado para el entorno de previsualización
// En producción, esto debería conectarse a un servicio de almacenamiento real

export interface StoredFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadDate: Date
}

class FileStorage {
  private files: Map<string, StoredFile> = new Map()
  private readonly STORAGE_KEY = "iot_dashboard_files"

  constructor() {
    this.loadFromLocalStorage()
  }

  private loadFromLocalStorage() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY)
        if (stored) {
          const data = JSON.parse(stored)
          this.files = new Map(
            data.map((file: any) => [
              file.id,
              {
                ...file,
                uploadDate: new Date(file.uploadDate),
              },
            ]),
          )
        }
      } catch (error) {
        console.error("Error loading files from localStorage:", error)
      }
    }
  }

  private saveToLocalStorage() {
    if (typeof window !== "undefined") {
      try {
        const data = Array.from(this.files.values())
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error("Error saving files to localStorage:", error)
      }
    }
  }

  async uploadFile(file: File): Promise<StoredFile> {
    return new Promise((resolve, reject) => {
      if (file.type !== "application/pdf") {
        reject(new Error("Solo se permiten archivos PDF"))
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const url = reader.result as string

        const storedFile: StoredFile = {
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          url,
          uploadDate: new Date(),
        }

        this.files.set(id, storedFile)
        this.saveToLocalStorage()
        resolve(storedFile)
      }

      reader.onerror = () => {
        reject(new Error("Error al leer el archivo"))
      }

      reader.readAsDataURL(file)
    })
  }

  getAllFiles(): StoredFile[] {
    return Array.from(this.files.values()).sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())
  }

  getFile(id: string): StoredFile | undefined {
    return this.files.get(id)
  }

  deleteFile(id: string): boolean {
    const deleted = this.files.delete(id)
    if (deleted) {
      this.saveToLocalStorage()
    }
    return deleted
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}

export const fileStorage = new FileStorage()
