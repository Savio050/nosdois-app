"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { HeartIcon } from "@/components/icons";
import { User, Question, getCoupleStatus, saveAnswer, getAnswersForDate } from "@/lib/storage";

interface DailyQuestionProps {
  user: User;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function DailyQuestion({ user }: DailyQuestionProps) {
  const [partner, setPartner] = useState<User | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [dateKey, setDateKey] = useState("");
  const [myAnswer, setMyAnswer] = useState("");
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const data = await getAnswersForDate(user.id, date);
      setQuestion(data.question);
      setUserAnswer(data.userAnswer);
      setPartnerAnswer(data.partnerAnswer);
      if (data.userAnswer) {
        setMyAnswer(data.userAnswer);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    const today = new Date();
    const key = formatDateKey(today);
    setDateKey(key);
    
    // Load partner info
    getCoupleStatus(user.id).then(status => {
      if (status?.partner) {
        setPartner(status.partner);
      }
    });
  }, [user.id]);

  useEffect(() => {
    if (dateKey) {
      loadData(dateKey);
    }
  }, [dateKey, loadData]);

  // Poll for partner's answer every 10 seconds if we've answered but partner hasn't
  useEffect(() => {
    if (userAnswer && !partnerAnswer && dateKey) {
      const interval = setInterval(() => {
        loadData(dateKey);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [userAnswer, partnerAnswer, dateKey, loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myAnswer.trim()) return;
    
    setIsSubmitting(true);
    try {
      const result = await saveAnswer(user.id, dateKey, myAnswer);
      if (!("error" in result)) {
        await loadData(dateKey);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const bothAnswered = userAnswer && partnerAnswer;

  if (isLoading) {
    return (
      <div className="p-4 pb-24">
        <div className="max-w-lg mx-auto text-center pt-20">
          <HeartIcon className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Couple Header */}
        <div className="text-center mb-8 pt-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="text-lg font-medium text-foreground">{user.name}</span>
            <HeartIcon className="w-6 h-6 text-primary animate-pulse" />
            <span className="text-lg font-medium text-foreground">{partner?.name || "..."}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>

        {/* Today's Question */}
        <Card className="border-0 shadow-xl mb-6 overflow-hidden">
          <CardHeader className="bg-primary/10 text-center py-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Pergunta do Dia
            </p>
            <h2 className="font-serif text-2xl text-foreground leading-relaxed text-balance">
              {question?.text || "Carregando pergunta..."}
            </h2>
            {question?.category && (
              <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wide">
                {question.category}
              </p>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <Textarea
                placeholder="Escreva sua resposta aqui..."
                value={myAnswer}
                onChange={(e) => setMyAnswer(e.target.value)}
                className="min-h-32 bg-secondary/30 border-0 resize-none text-base"
                disabled={!!userAnswer}
              />
              {!userAnswer && (
                <Button 
                  type="submit" 
                  className="w-full mt-4" 
                  size="lg"
                  disabled={isSubmitting || !myAnswer.trim()}
                >
                  {isSubmitting ? "Salvando..." : "Enviar Resposta"}
                </Button>
              )}
              {userAnswer && !partnerAnswer && (
                <div className="mt-4 p-4 bg-accent/20 rounded-lg text-center">
                  <HeartIcon className="w-8 h-8 text-accent mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-muted-foreground">
                    Resposta enviada! Aguardando {partner?.name || "seu amor"} responder...
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Both Answers */}
        {bothAnswered && (
          <div className="space-y-4">
            <h3 className="font-serif text-xl text-center text-foreground mb-4">
              Suas Respostas
            </h3>
            
            <Card className="border-0 shadow-lg bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-foreground">{user.name}</span>
                </div>
                <p className="text-foreground leading-relaxed pl-10">
                  {userAnswer}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center">
                    <span className="text-sm font-semibold text-accent">
                      {partner?.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  <span className="font-medium text-foreground">{partner?.name || "Parceiro(a)"}</span>
                </div>
                <p className="text-foreground leading-relaxed pl-10">
                  {partnerAnswer}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
