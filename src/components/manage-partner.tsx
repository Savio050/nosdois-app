"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { HeartIcon, UserIcon, Trash2Icon, EditIcon, CheckIcon, XIcon } from "@/components/icons"

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

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/couple/disconnect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) })
      if (!res.ok) throw new Error("Erro ao remover parceiro")
      onDisconnect()
    } catch (err) {
      setError("Erro ao remover parceiro. Tente novamente.")
    } finally {
      setIsLoading(false)
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
    } catch (err) {
      setError("Erro ao atualizar o nome. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <div className="text-center">
        <HeartIcon className="w-10 h-10 text-primary mx-auto mb-2" />
        <h1 className="text-2xl font-bold">Meu Casal</h1>
        <p className="text-muted-foreground text-sm">Gerencie o seu parceiro(a)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Seu perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </CardContent>
      </Card>

      {user.partner ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartIcon className="w-5 h-5 text-pink-500" />
              Seu Parceiro(a)
            </CardTitle>
            <CardDescription>Você está conectado(a) com</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="partnerName">Nome do parceiro(a)</Label>
                <div className="flex gap-2">
                  <Input
                    id="partnerName"
                    value={newPartnerName}
                    onChange={(e) => setNewPartnerName(e.target.value)}
                    placeholder="Nome do parceiro(a)"
                  />
                  <Button size="icon" variant="default" onClick={handleUpdateName} disabled={isLoading}>
                    <CheckIcon className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => { setIsEditing(false); setNewPartnerName(user.partner?.name || "") }}>
                    <XIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{user.partner.name}</p>
                  <p className="text-sm text-muted-foreground">{user.partner.email}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                  <EditIcon className="w-4 h-4" />
                </Button>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
            {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isLoading}>
                  <Trash2Icon className="w-4 h-4 mr-2" />
                  Remover Parceiro(a)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover parceiro(a)?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá desconectar vocês dois. O histórico de respostas será mantido, mas vocês não verão mais as respostas um do outro.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDisconnect} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sim, remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sem parceiro(a)</CardTitle>
            <CardDescription>Você ainda não está conectado(a) com ninguém</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Volte para a tela principal e vincule seu parceiro(a).</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}