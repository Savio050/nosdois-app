"use client"

import { useState, useEffect } from "react"
import { AuthForms } from "@/components/auth-forms"
import { CoupleLink } from "@/components/couple-link"
import { DailyQuestion } from "@/components/daily-question"
import { HistoryCalendar } from "@/components/history-calendar"
import { BottomNav } from "@/components/bottom-nav"
import { ManagePartner } from "@/components/manage-partner"

interface User {
  id: string
  name: string
  email: string
  partner?: {
    id: string
    name: string
    email: string
  } | null
}

export default function Home() {
  const [appState, setAppState] = useState<"loading" | "auth" | "link" | "app">("loading")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [view, setView] = useState("home")

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user)
          setAppState(data.user.partner ? "app" : "link")
        } else {
          setAppState("auth")
        }
      })
      .catch(() => setAppState("auth"))
  }, [])

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user)
    setAppState(user.partner ? "app" : "link")
  }

  const handleLinkSuccess = (user: User) => {
    setCurrentUser(user)
    setAppState("app")
  }

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      setCurrentUser(null)
      setAppState("auth")
      setView("home")
    })
  }

  const handlePartnerDisconnect = () => {
    setCurrentUser((prev) => prev ? { ...prev, partner: null } : null)
    setAppState("link")
    setView("home")
  }

  const handlePartnerNameUpdated = (newName: string) => {
    setCurrentUser((prev) =>
      prev && prev.partner
        ? { ...prev, partner: { ...prev.partner, name: newName } }
        : prev
    )
  }

  if (appState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (appState === "auth") {
    return <AuthForms onSuccess={handleAuthSuccess} />
  }

  if (appState === "link" && currentUser) {
    return <CoupleLink user={currentUser} onLinked={handleLinkSuccess} />
  }

  if (appState === "app" && currentUser) {
    return (
      <main className="min-h-screen bg-background">
        {view === "home" && <DailyQuestion user={currentUser} />}
        {view === "history" && <HistoryCalendar user={currentUser} />}
        {view === "partner" && (
          <ManagePartner
            user={currentUser}
            onDisconnect={handlePartnerDisconnect}
            onPartnerUpdated={handlePartnerNameUpdated}
          />
        )}
        <BottomNav
          currentView={view}
          onViewChange={setView}
          onLogout={handleLogout}
        />
      </main>
    )
  }

  return null
}
