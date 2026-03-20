"use client";

import { HomeIcon, CalendarIcon, LogOutIcon, UserIcon } from "lucide-react";

type BottomNavProps = {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
};

export function BottomNav({ currentView, onViewChange, onLogout }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-10">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        <button
          onClick={() => onViewChange("home")}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${currentView === "home" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-xs font-medium">Inicio</span>
        </button>

        <button
          onClick={() => onViewChange("calendar")}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${currentView === "calendar" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <CalendarIcon className="w-6 h-6" />
          <span className="text-xs font-medium">Historico</span>
        </button>

        <button
          onClick={() => onViewChange("partner")}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${currentView === "partner" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <UserIcon className="w-6 h-6" />
          <span className="text-xs font-medium">Parceiro</span>
        </button>

        <div>
          <button
            onClick={onLogout}
            className="flex flex-col items-center gap-1 px-6 py-2 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <LogOutIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Sair</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
