"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const AlertDialogContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null)

function AlertDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setOpen(false)} />
          <div className="relative z-50 grid w-full max-w-lg gap-4 bg-background p-6 shadow-lg rounded-lg mx-4">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child) && (child.type === AlertDialogContent || child.props.__isContent)) {
                return child.props.children
              }
              return null
            })}
          </div>
        </div>
      )}
    </AlertDialogContext.Provider>
  )
}

function AlertDialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  const ctx = React.useContext(AlertDialogContext)
  const child = React.Children.only(children) as React.ReactElement
  return React.cloneElement(child, { onClick: () => ctx?.setOpen(true) })
}

function AlertDialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div __isContent className={cn("", className)}>{children}</div>
}

function AlertDialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>{children}</div>
}

function AlertDialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
}

function AlertDialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
}

function AlertDialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>{children}</div>
}

function AlertDialogAction({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const ctx = React.useContext(AlertDialogContext)
  return (
    <button
      className={cn("inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90", className)}
      onClick={() => { onClick?.(); ctx?.setOpen(false) }}
    >
      {children}
    </button>
  )
}

function AlertDialogCancel({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(AlertDialogContext)
  return (
    <button
      className={cn("inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground mt-2 sm:mt-0", className)}
      onClick={() => ctx?.setOpen(false)}
    >
      {children}
    </button>
  )
}

export { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel }
