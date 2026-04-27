"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import { ChevronLeft, ChevronRight, Heart } from "lucide-react"
import { User, getAnswersForDate, getDatesWithAnswers } from "@/lib/storage"
interface HistoryCalendarProps { user: User }
const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"]
const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
function fmtKey(d: Date) { return d.toISOString().split("T")[0] }
interface DayAnswers { question: string | null; category: string | null; userAnswer: string | null; partnerAnswer: string | null }
export function HistoryCalendar({ user }: HistoryCalendarProps) {
  const [month, setMonth] = useState(new Date())
  const [selected, setSelected] = useState<Date | null>(null)
  const [datesWithAnswers, setDatesWithAnswers] = useState<Set<string>>(new Set())
  const [dayData, setDayData] = useState<DayAnswers | null>(null)
  const [loadingDay, setLoadingDay] = useState(false)
  useEffect(() => { getDatesWithAnswers().then(dates => setDatesWithAnswers(new Set(dates))) }, [])
  const loadDay = useCallback(async (date: Date) => {
    setLoadingDay(true); setDayData(null)
    const data = await getAnswersForDate(fmtKey(date))
    setDayData({ question: data.question?.text ?? null, category: data.question?.category ?? null, userAnswer: data.userAnswer, partnerAnswer: data.partnerAnswer })
    setLoadingDay(false)
  }, [])
  const handleSelect = (date: Date) => { setSelected(date); loadDay(date) }
  const calDays = useMemo(() => {
    const y = month.getFullYear(), m = month.getMonth()
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < first.getDay(); i++) days.push(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(y, m, d))
    return days
  }, [month])
  const today = new Date(); today.setHours(0,0,0,0)
  const goMonth = (dir: number) => { setMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + dir); return d }); setSelected(null); setDayData(null) }
  const partnerName = user.partner?.name ?? "Parceiro(a)"
  return (
    <div className="min-h-screen pb-24 bg-background px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center pt-10 pb-6">
          <h1 className="font-serif text-2xl font-bold">Historico</h1>
          <p className="text-sm text-muted-foreground mt-1">Reviva as respostas de voces</p>
        </div>
        <div className="bg-card rounded-3xl shadow-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => goMonth(-1)} className="w-9 h-9 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <span className="font-serif font-medium">{MONTHS[month.getMonth()]} {month.getFullYear()}</span>
            <button onClick={() => goMonth(1)} className="w-9 h-9 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors" disabled={month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear()}><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-7 mb-2">{DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((date, i) => {
              if (!date) return <div key={i} />
              const key = fmtKey(date)
              const isToday = date.getTime() === today.getTime()
              const isFuture = date > today
              const hasData = datesWithAnswers.has(key)
              const isSelected = selected && fmtKey(selected) === key
              return (
                <button key={i} onClick={() => !isFuture && handleSelect(date)} disabled={isFuture}
                  className={["aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all", isFuture ? "text-muted-foreground/30 cursor-not-allowed" : "cursor-pointer", isToday ? "bg-primary text-primary-foreground font-bold" : "", isSelected && !isToday ? "bg-primary/15 ring-2 ring-primary/40" : "", !isToday && !isFuture ? "hover:bg-secondary" : ""].join(" ")}>
                  <span>{date.getDate()}</span>
                  {hasData && !isToday && <Heart className="w-2.5 h-2.5 text-primary mt-0.5" fill="currentColor" />}
                </button>
              )
            })}
          </div>
        </div>
        {!selected && (<div className="text-center py-10"><Heart className="w-12 h-12 text-primary/20 mx-auto mb-3" fill="currentColor" /><p className="text-sm text-muted-foreground">Selecione um dia para ver as respostas</p></div>)}
        {selected && (
          <div className="space-y-3">
            {loadingDay ? (<div className="bg-card rounded-3xl p-8 text-center"><Heart className="w-8 h-8 text-primary mx-auto animate-pulse" /></div>
            ) : dayData?.question ? (
              <div className="space-y-3">
                <div className="bg-card rounded-3xl shadow-xl overflow-hidden">
                  <div className="bg-primary/10 px-5 py-5 text-center">
                    <p className="text-xs text-muted-foreground capitalize mb-2">{selected.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
                    <p className="font-serif text-lg text-foreground leading-relaxed">{dayData.question}</p>
                    {dayData.category && <span className="inline-block mt-2 text-xs text-muted-foreground bg-background/50 px-3 py-0.5 rounded-full">{dayData.category}</span>}
                  </div>
                </div>
                {dayData.userAnswer && (<div className="bg-card rounded-2xl shadow p-4"><div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{user.name.charAt(0).toUpperCase()}</div><span className="text-sm font-medium">{user.name}</span></div><p className="text-sm text-foreground leading-relaxed pl-9">{dayData.userAnswer}</p></div>)}
                {dayData.partnerAnswer && (<div className="bg-card rounded-2xl shadow p-4"><div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center text-xs font-bold text-accent">{partnerName.charAt(0).toUpperCase()}</div><span className="text-sm font-medium">{partnerName}</span></div><p className="text-sm text-foreground leading-relaxed pl-9">{dayData.partnerAnswer}</p></div>)}
                {!dayData.userAnswer && !dayData.partnerAnswer && (<div className="bg-card rounded-2xl shadow p-6 text-center"><p className="text-sm text-muted-foreground">Nenhuma resposta para este dia</p></div>)}
              </div>
            ) : (<div className="bg-card rounded-2xl shadow p-6 text-center"><p className="text-sm text-muted-foreground">Nenhuma pergunta para este dia</p></div>)}
          </div>
        )}
      </div>
    </div>
  )
}