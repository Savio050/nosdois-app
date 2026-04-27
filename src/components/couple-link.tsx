"use client"

import { useState } from "react"
import { Heart, Copy, Check, Link2 } from "lucide-react"
import { linkPartner, User } from "@/lib/storage"

interface CoupleLinkProps {
  user: User
  onLinked: (user: User) => void
}

export function CoupleLink({ user, onLinked }: CoupleLinkProps) {
  const [partnerCode, setPartnerCode] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(user.coupleCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await linkPartner(partnerCode.toUpperCase())
      if ("error" in result) { setError(result.error); return }
      onLinked(result.user)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
            <Heart className="w-8 h-8 text-primary" fill="currentColor" />
          </div>
          <h1 className="font-serif text-2xl font-bold">Olá, {user.name}!</h1>
          <p className="text-muted-foreground text-sm mt-1">Conecte-se com seu amor para começar</p>
        </div>

        {/* Your code */}
        <div className="bg-card rounded-3xl shadow-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Seu código</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Compartilhe este código com seu amor</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary rounded-xl p-4 text-center">
              <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
                {user.coupleCode}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="h-14 w-14 rounded-xl border border-input bg-background flex items-center justify-center hover:bg-secondary transition-colors"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Enter partner's code */}
        <div className="bg-card rounded-3xl shadow-lg p-5">
          <h3 className="font-serif text-lg font-semibold mb-1">Conectar com parceiro(a)</h3>
          <p className="text-xs text-muted-foreground mb-4">Ou insira o código que seu amor compartilhou</p>

          <form onSubmit={handleLink} className="space-y-3">
            <input
              type="text"
              placeholder="Ex: ABC123"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full h-12 rounded-xl border border-input bg-secondary/40 px-4 text-center font-mono text-xl tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 py-2 px-3 rounded-xl text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || partnerCode.length < 6}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Conectando..." : "Conectar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
