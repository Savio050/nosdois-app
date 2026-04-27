"use client"

import { useState, useEffect, useCallback } from "react"
import { Heart, Send } from "lucide-react"
import { User, getAnswersForDate, saveAnswer } from "@/lib/storage"

interface DailyQuestionProps {
  user: User
}

export function DailyQuestion({ user }: DailyQuestionProps) {
  const [question, setQuestion] = useState<{ id: string; text: string; category: string } | null>(null)
  const [myAnswer, setMyAnswer] = useState("")
  const [userAnswer, setUserAnswer] = useState<string | null>(null)
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split("T")[0]

  const load = useCallback(async () => {
    const data = await getAnswersForDate(today)
    setQuestion(data.question)
    setUserAnswer(data.userAnswer)
    setPartnerAnswer(data.partnerAnswer)
    if (data.userAnswer) setMyAnswer(data.userAnswer)
    setLoading(false)
  }, [today])

  useEffect(() => { load() }, [load])

  // Poll for partner answer every 15s after user answered
  useEffect(() => {
    if (!userAnswer || partnerAnswer) return
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [userAnswer, partnerAnswer, load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!myAnswer.trim()) return
    setSubmitting(true)
    const result = await saveAnswer(today, myAnswer)
    if (!("error" in result)) await load()
    setSubmitting(false)
  }

  const partnerName = user.partner?.name ?? "seu amor"
  const dateLabel = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Heart className="w-10 h-10 text-primary animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="px-4 pt-10 pb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <Avatar name={user.name} url={user.avatarUrl} size="sm" />
          <Heart className="w-5 h-5 text-primary" fill="currentColor" />
          <Avatar name={partnerName} url={user.partner?.avatarUrl} size="sm" />
        </div>
        <p className="text-sm text-muted-foreground capitalize mt-3">{dateLabel}</p>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">
        {/* Question card */}
        <div className="bg-card rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-primary/10 px-6 py-8 text-center">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Pergunta do Dia</span>
            <p className="font-serif text-xl text-foreground leading-relaxed mt-3">
              {question?.text ?? "Carregando pergunta..."}
            </p>
            {question?.category && (
              <span className="inline-block mt-3 text-xs text-muted-foreground uppercase tracking-wide bg-background/50 px-3 py-1 rounded-full">
                {question.category}
              </span>
            )}
          </div>

          {/* Answer form */}
          <div className="p-5">
            {!userAnswer ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                  placeholder="Escreva sua resposta..."
                  value={myAnswer}
                  onChange={(e) => setMyAnswer(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-input bg-secondary/30 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="submit"
                  disabled={submitting || !myAnswer.trim()}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Salvando..." : "Enviar Resposta"}
                </button>
              </form>
            ) : !partnerAnswer ? (
              <div className="text-center py-4">
                <Heart className="w-8 h-8 text-primary mx-auto mb-2 animate-pulse" fill="currentColor" />
                <p className="text-sm text-muted-foreground">
                  Aguardando <span className="font-medium text-foreground">{partnerName}</span> responder...
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Both answers */}
        {userAnswer && partnerAnswer && (
          <div className="space-y-3">
            <p className="font-serif text-lg text-center text-foreground">Respostas de Vocês</p>
            <AnswerCard name={user.name} answer={userAnswer} avatarUrl={user.avatarUrl} />
            <AnswerCard name={partnerName} answer={partnerAnswer} avatarUrl={user.partner?.avatarUrl} />
          </div>
        )}

        {/* My answer preview while waiting */}
        {userAnswer && !partnerAnswer && (
          <AnswerCard name={user.name} answer={userAnswer} avatarUrl={user.avatarUrl} dim />
        )}
      </div>
    </div>
  )
}

function Avatar({ name, url, size = "md" }: { name: string; url?: string | null; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-9 h-9 text-sm" : "w-11 h-11 text-base"
  if (url) return <img src={url} alt={name} className={`${sz} rounded-full object-cover ring-2 ring-primary/20`} />
  return (
    <div className={`${sz} rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function AnswerCard({ name, answer, avatarUrl, dim }: { name: string; answer: string; avatarUrl?: string | null; dim?: boolean }) {
  return (
    <div className={`bg-card rounded-2xl shadow-lg p-4 ${dim ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <Avatar name={name} url={avatarUrl} size="sm" />
        <span className="font-medium text-sm">{name}</span>
      </div>
      <p className="text-sm text-foreground leading-relaxed pl-11">{answer}</p>
    </div>
  )
}
