"use client"

import { useState, useRef } from "react"
import { Heart, Camera, Check, X, LogOut, Trash2, Link2, Eye, EyeOff } from "lucide-react"
import { User, updateProfile, uploadAvatar, disconnectPartner } from "@/lib/storage"

interface ProfileTabProps {
  user: User
  onUserUpdated: (user: User) => void
  onDisconnect: () => void
  onLogout: () => void
}

export function ProfileTab({ user, onUserUpdated, onDisconnect, onLogout }: ProfileTabProps) {
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(user.name)
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPass, setCurrentPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [passLoading, setPassLoading] = useState(false)
  const [passError, setPassError] = useState("")
  const [passSuccess, setPassSuccess] = useState("")
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState("")
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl)
  const [disconnectConfirm, setDisconnectConfirm] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim() === user.name) { setEditingName(false); return }
    setNameLoading(true); setNameError("")
    const result = await updateProfile({ name: newName.trim() })
    if ("error" in result) { setNameError(result.error) }
    else { onUserUpdated(result); setEditingName(false) }
    setNameLoading(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== confirmPass) { setPassError("As senhas nao coincidem"); return }
    if (newPass.length < 6) { setPassError("Nova senha deve ter pelo menos 6 caracteres"); return }
    setPassLoading(true); setPassError(""); setPassSuccess("")
    const result = await updateProfile({ currentPassword: currentPass, newPassword: newPass })
    if ("error" in result) { setPassError(result.error) }
    else {
      setPassSuccess("Senha alterada com sucesso!")
      setCurrentPass(""); setNewPass(""); setConfirmPass("")
      setChangingPassword(false)
      setTimeout(() => setPassSuccess(""), 3000)
    }
    setPassLoading(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true); setAvatarError("")
    const result = await uploadAvatar(file)
    if ("error" in result) { setAvatarError(result.error) }
    else { setAvatarUrl(result.avatarUrl); onUserUpdated({ ...user, avatarUrl: result.avatarUrl }) }
    setAvatarLoading(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    const result = await disconnectPartner()
    setDisconnecting(false)
    if (!("error" in result)) onDisconnect()
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="max-w-lg mx-auto px-4">
        <div className="text-center pt-10 pb-6">
          <h1 className="font-serif text-2xl font-bold">Meu Perfil</h1>
        </div>

        {/* Avatar + Nome */}
        <div className="bg-card rounded-3xl shadow-xl p-5 mb-4">
          <div className="flex flex-col items-center mb-5">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/20" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center ring-4 ring-primary/20">
                  <span className="text-3xl font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <button onClick={() => fileRef.current?.click()} disabled={avatarLoading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                {avatarLoading
                  ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  : <Camera className="w-4 h-4" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            {avatarError && <p className="text-xs text-destructive mt-2">{avatarError}</p>}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</label>
              {editingName ? (
                <div className="flex gap-2 mt-1.5">
                  <input value={newName} onChange={e => setNewName(e.target.value)} autoFocus
                    className="flex-1 h-11 rounded-xl border border-input bg-secondary/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <button onClick={handleSaveName} disabled={nameLoading}
                    className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingName(false); setNewName(user.name); setNameError("") }}
                    className="w-11 h-11 rounded-xl border border-input flex items-center justify-center hover:bg-secondary">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <p className="font-semibold">{user.name}</p>
                  <button onClick={() => setEditingName(true)} className="text-xs text-primary hover:underline">Editar</button>
                </div>
              )}
              {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
              <p className="font-medium mt-1 text-foreground/70 text-sm">{user.email}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Codigo do Casal</label>
              <p className="font-mono font-bold mt-1 tracking-widest text-primary">{user.coupleCode}</p>
            </div>
          </div>
        </div>

        {/* Senha */}
        <div className="bg-card rounded-3xl shadow-xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Seguranca</h3>
            {!changingPassword && (
              <button onClick={() => setChangingPassword(true)} className="text-xs text-primary hover:underline">Alterar senha</button>
            )}
          </div>
          {passSuccess && <p className="text-xs text-green-600 mt-2">{passSuccess}</p>}
          {changingPassword && (
            <form onSubmit={handleChangePassword} className="space-y-3 mt-4">
              <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder="Senha atual" value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)} required
                  className="w-full h-11 rounded-xl border border-input bg-secondary/40 px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-muted-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <input type={showPass ? "text" : "password"} placeholder="Nova senha (min. 6 caracteres)"
                value={newPass} onChange={e => setNewPass(e.target.value)} required minLength={6}
                className="w-full h-11 rounded-xl border border-input bg-secondary/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input type={showPass ? "text" : "password"} placeholder="Confirmar nova senha"
                value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required
                className="w-full h-11 rounded-xl border border-input bg-secondary/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              {passError && <p className="text-xs text-destructive">{passError}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={passLoading}
                  className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                  {passLoading ? "Salvando..." : "Salvar Senha"}
                </button>
                <button type="button" onClick={() => { setChangingPassword(false); setPassError(""); setCurrentPass(""); setNewPass(""); setConfirmPass("") }}
                  className="flex-1 h-10 rounded-xl border border-input text-sm hover:bg-secondary transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Parceiro */}
        <div className="bg-card rounded-3xl shadow-xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-primary" fill="currentColor" />
            <h3 className="font-semibold">Meu Casal</h3>
          </div>
          {user.partner ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-secondary/40 rounded-2xl p-3">
                {user.partner.avatarUrl ? (
                  <img src={user.partner.avatarUrl} alt={user.partner.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {user.partner.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">{user.partner.name}</p>
                  <p className="text-xs text-muted-foreground">{user.partner.email}</p>
                </div>
              </div>
              {!disconnectConfirm ? (
                <button onClick={() => setDisconnectConfirm(true)}
                  className="w-full h-10 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors">
                  <Trash2 className="w-4 h-4" /> Remover Parceiro(a)
                </button>
              ) : (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <p className="text-sm font-semibold text-center">Tem certeza?</p>
                  <p className="text-xs text-muted-foreground text-center">Voces serao desconectados. O historico sera mantido.</p>
                  <div className="flex gap-2">
                    <button onClick={handleDisconnect} disabled={disconnecting}
                      className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 disabled:opacity-50">
                      {disconnecting ? "Removendo..." : "Sim, remover"}
                    </button>
                    <button onClick={() => setDisconnectConfirm(false)}
                      className="flex-1 h-10 rounded-xl border border-input text-sm hover:bg-secondary transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground bg-secondary/30 rounded-2xl p-3">
              <Link2 className="w-4 h-4" />
              <p className="text-sm">Sem parceiro(a) conectado(a)</p>
            </div>
          )}
        </div>

        <button onClick={onLogout}
          className="w-full h-12 rounded-2xl border border-input text-muted-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary hover:text-foreground transition-colors mb-2">
          <LogOut className="w-4 h-4" /> Sair da Conta
        </button>
      </div>
    </div>
  )
}
