"use client"

import { useState, useEffect } from "react"
import { AuthForms } from "@/components/auth-forms"
import { CoupleLink } from "@/components/couple-link"
import { DailyQuestion } from "@/components/daily-question"
import { HistoryCalendar } from "@/components/history-calendar"
import { ProfileTab } from "@/components/profile-tab"
import { BottomNav } from "@/components/bottom-nav"
import { User } from "@/lib/storage"
import { Heart } from "lucide-react"

type AppState = "loading" | "auth" | "link" | "app"

export default function Home() {
  const [appState, setAppState] = useState<AppState>("loading")
  const [user, setUser] = useState<User | null>(null)
  const [view, setView] = useState("home")

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
          setAppState(data.user.partner ? "app" : "link")
        } else {
          setAppState("auth")
        }
      })
      .catch(() => setAppState("auth"))
  }, [])

  const handleAuthSuccess = (u: User) => {
    setUser(u)
    setAppState(u.partner ? "app" : "link")
  }

  const handleLinkSuccess = (u: User) => {
    setUser(u)
    setAppState("app")
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    setAppState("auth")
    setView("home")
  }

  const handlePartnerDisconnect = () => {
    setUser((prev) => prev ? { ...prev, partner: null } : null)
    setAppState("link")
    setView("home")
  }

  const handleUserUpdated = (updated: User) => {
    setUser(updated)
  }

  if (appState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Heart className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (appState === "auth") return <AuthForms onSuccess={handleAuthSuccess} />

  if (appState === "link" && user) {
    return <CoupleLink user={user} onLinked={handleLinkSuccess} />
  }

  if (appState === "app" && user) {
    return (
      <main className="min-h-screen bg-background">
        {view === "home" && <DailyQuestion user={user} />}
        {view === "history" && <HistoryCalendar user={user} />}
        {view === "profile" && (
          <ProfileTab
            user={user}
            onUserUpdated={handleUserUpdated}
            onDisconnect={handlePartnerDisconnect}
            onLogout={handleLogout}
          />
        )}
        <BottomNav currentView={view} onViewChange={setView} />
      </main>
    )
  }

  return null
}
