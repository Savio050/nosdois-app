"use client"

import { Home, Calendar, User } from "lucide-react"

type BottomNavProps = {
  currentView: string
  onViewChange: (view: string) => void
}

const tabs = [
  { id: "home", label: "Início", icon: Home },
  { id: "history", label: "Histórico", icon: Calendar },
  { id: "profile", label: "Perfil", icon: User },
]

export function BottomNav({ currentView, onViewChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-10">
      <div className="max-w-lg mx-auto flex items-center justify-around py-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`flex flex-col items-center gap-1 px-8 py-2 rounded-xl transition-all duration-200 ${
              currentView === id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`w-6 h-6 transition-transform duration-200 ${currentView === id ? "scale-110" : ""}`} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
