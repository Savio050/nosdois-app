"use client"

import { useState } from "react"
import { HeartIcon, UserIcon, EditIcon, CheckIcon, XIcon, Trash2Icon } from "@/components/icons"

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

interface ManagePartnerProps {
  user: User
  onDisconnect: () => void
  onPartnerUpdated: (newName: string) => void
}

export function ManagePartner({ user, onDisconnect, onPartnerUpdated }: ManagePartnerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newPartnerName, setNewPartnerName] = useState(user.partner?.name || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/couple/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
      if (!res.ok) throw new Error("Erro ao remover parceiro")
      onDisconnect()
    } catch {
      setError("Erro ao remover parceiro. Tente novamente.")
    } finally {
      setIsLoading(false)
      setShowConfirm(false)
    }
  }

  const handleUpdateName = async () => {
    if (!newPartnerName.trim()) return
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch("/api/couple/update-partner-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, partnerName: newPartnerName.trim() }),
      })
      if (!res.ok) throw new Error("Erro ao atualizar nome")
      setSuccessMsg("Nome atualizado com sucesso!")
      setIsEditing(false)
      onPartnerUpdated(newPartnerName.trim())
      setTimeout(() => setSuccessMsg(""), 3000)
    } catch {
      setError("Erro ao atualizar o nome. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 pb-24">
      <div className="text-center pt-4">
        <HeartIcon className="w-10 h-10 text-primary mx-auto mb-2" />
        <h1 className="text-2xl font-bold">Meu Casal</h1>
        <p className="text-muted-foreground text-sm">Gerencie o seu parceiro(a)</p>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <UserIcon className="w-5 h-5" />
          <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Seu perfil</span>
        </div>
        <p className="font-bold text-lg">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      {user.partner ? (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <HeartIcon className="w-5 h-5 text-pink-500" />
            <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Parceiro(a)</span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do parceiro(a)</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={newPartnerName}
                  onChange={(e) => setNewPartnerName(e.target.value)}
                  placeholder="Nome do parceiro(a)"
                />
                <button
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  onClick={handleUpdateName}
                  disabled={isLoading}
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  onClick={() => { setIsEditing(false); setNewPartnerName(user.partner?.name || "") }}
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">{user.partner.name}</p>
                <p className="text-sm text-muted-foreground">{user.partner.email}</p>
              </div>
              <button
                className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsEditing(true)}
              >
                <EditIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

          {!showConfirm ? (
            <button
              className="w-full inline-flex items-center justify-center h-10 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-medium disabled:opacity-50"
              onClick={() => setShowConfirm(true)}
              disabled={isLoading}
            >
              <Trash2Icon className="w-4 h-4 mr-2" />
              Remover Parceiro(a)
            </button>
          ) : (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 space-y-3">
              <p className="text-sm font-semibold">Tem certeza?</p>
              <p className="text-xs text-muted-foreground">
                Isso ir&aacute; desconectar voc&ecirc;s dois. O hist&oacute;rico ser&aacute; mantido.
              </p>
              <div className="flex gap-2">
                <button
                  className="flex-1 inline-flex items-center justify-center h-9 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-medium disabled:opacity-50"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                >
                  {isLoading ? "Removendo..." : "Sim, remover"}
                </button>
                <button
                  className="flex-1 inline-flex items-center justify-center h-9 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-4">
          <p className="font-semibold">Sem parceiro(a)</p>
          <p className="text-sm text-muted-foreground mt-1">Voc&ecirc; ainda n&atilde;o est&aacute; conectado(a) com ningu&eacute;m.</p>
        </div>
      )}
    </div>
  )
}
