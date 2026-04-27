"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { loginUser, registerUser, User } from "@/lib/storage"

interface AuthFormsProps {
  onSuccess: (user: User) => void
}

export function AuthForms({ onSuccess }: AuthFormsProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (isLogin) {
        const result = await loginUser(email, password)
        if ("error" in result) { setError(result.error); return }
        onSuccess(result)
      } else {
        if (!name.trim()) { setError("Por favor, insira seu nome"); return }
        const result = await registerUser(name, email, password)
        if ("error" in result) { setError(result.error); return }
        onSuccess(result)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Heart className="w-10 h-10 text-primary" fill="currentColor" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground">NósDois</h1>
          <p className="text-muted-foreground mt-1">Conecte-se com seu amor</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-3xl shadow-xl p-6">
          <h2 className="font-serif text-2xl font-semibold text-center mb-6">
            {isLogin ? "Entrar" : "Criar Conta"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-foreground/80 block mb-1.5">Seu Nome</label>
                <input
                  type="text"
                  placeholder="Como quer ser chamado(a)?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 rounded-xl border border-input bg-secondary/40 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground/80 block mb-1.5">Email</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 rounded-xl border border-input bg-secondary/40 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground/80 block mb-1.5">Senha</label>
              <input
                type="password"
                placeholder={isLogin ? "Sua senha" : "Mínimo 6 caracteres"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isLogin ? 1 : 6}
                className="w-full h-12 rounded-xl border border-input bg-secondary/40 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center bg-destructive/10 py-2 px-3 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError("") }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
