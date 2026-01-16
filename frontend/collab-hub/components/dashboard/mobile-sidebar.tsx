"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/dashboard/sidebar"

interface MobileSidebarProps {
    projects: Array<{
        id: string
        name: string
        description: string
    }>
    onCreateProject: () => void
}

export function MobileSidebar({ projects, onCreateProject }: MobileSidebarProps) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
                <Sidebar
                    projects={projects}
                    onCreateProject={() => {
                        setOpen(false)
                        onCreateProject()
                    }}
                    onNavigate={() => setOpen(false)}
                    className="w-full"
                />
            </SheetContent>
        </Sheet>
    )
}
