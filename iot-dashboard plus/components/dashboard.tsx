"use client"

import type React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { MoonStar, Sun, BarChart3, Home, Settings, FileText, FolderOpen, Database } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

export function Dashboard({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()
  const pathname = usePathname()

  const menuItems = [
    {
      title: "Inicio",
      icon: Home,
      href: "/",
    },
    {
      title: "Dashboard",
      icon: BarChart3,
      href: "/",
    },
    {
      title: "Reportes",
      icon: FileText,
      href: "/reportes",
    },
    {
      title: "Datos en Crudo",
      icon: Database,
      href: "/datos-crudos",
    },
    {
      title: "Archivos PDF",
      icon: FolderOpen,
      href: "/archivos",
    },
    {
      title: "Configuración",
      icon: Settings,
      href: "/configuracion",
    },
  ]

  return (
    <div className="flex h-screen">
      <Sidebar>
        <SidebarHeader className="border-b px-6 py-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            <span className="font-bold">CO₂ Monitor</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={item.href === pathname}>
                  <a href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <div className="flex justify-between">
            <Button variant="outline" size="icon" onClick={() => setTheme("light")}>
              <Sun className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setTheme("dark")}>
              <MoonStar className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-col">
          <header className="border-b p-4">
            <div className="flex items-center justify-between">
              <SidebarTrigger />
              <div className="text-sm font-medium">IPICYT - Sistema de Monitoreo CO₂</div>
            </div>
          </header>
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </SidebarInset>
    </div>
  )
}
