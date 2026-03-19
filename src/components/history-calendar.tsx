"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HeartIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { User, getCoupleStatus, getAnswersForDate, getDatesWithAnswers } from "@/lib/storage";

interface HistoryCalendarProps {
  user: User;
}

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

interface SelectedDateAnswers {
  question: string | null;
  category: string | null;
  userAnswer: string | null;
  partnerAnswer: string | null;
}

export function HistoryCalendar({ user }: HistoryCalendarProps) {
  const [partner, setPartner] = useState<User | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [datesWithAnswers, setDatesWithAnswers] = useState<Set<string>>(new Set());
  const [selectedDateAnswers, setSelectedDateAnswers] = useState<SelectedDateAnswers | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load partner info
    getCoupleStatus(user.id).then(status => {
      if (status?.partner) {
        setPartner(status.partner);
      }
    });
    
    // Load dates with answers
    getDatesWithAnswers(user.id).then(dates => {
      setDatesWithAnswers(new Set(dates));
    });
  }, [user.id]);

  const loadSelectedDateAnswers = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const dateKey = formatDateKey(date);
      const data = await getAnswersForDate(user.id, dateKey);
      
      setSelectedDateAnswers({
        question: data.question?.text || null,
        category: data.question?.category || null,
        userAnswer: data.userAnswer,
        partnerAnswer: data.partnerAnswer,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    loadSelectedDateAnswers(date);
  }, [loadSelectedDateAnswers]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [currentDate]);

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
    setSelectedDate(null);
    setSelectedDateAnswers(null);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isFuture = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const hasAnswers = (date: Date) => {
    return datesWithAnswers.has(formatDateKey(date));
  };

  return (
    <div className="p-4 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <h1 className="font-serif text-2xl text-foreground mb-1">Histórico</h1>
          <p className="text-sm text-muted-foreground">
            Reviva as respostas de vocês
          </p>
        </div>

        {/* Calendar */}
        <Card className="border-0 shadow-xl mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigateMonth(-1)}
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </Button>
              <span className="font-serif text-lg font-medium text-foreground">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigateMonth(1)}
              >
                <ChevronRightIcon className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_OF_WEEK.map(day => (
                <div 
                  key={day} 
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => (
                <button
                  key={index}
                  onClick={() => date && !isFuture(date) && handleSelectDate(date)}
                  disabled={!date || isFuture(date)}
                  className={`
                    aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                    transition-all duration-200
                    ${!date ? 'invisible' : ''}
                    ${date && isFuture(date) ? 'text-muted-foreground/40 cursor-not-allowed' : ''}
                    ${date && !isFuture(date) ? 'hover:bg-primary/10 cursor-pointer' : ''}
                    ${date && isToday(date) ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                    ${date && selectedDate?.toDateString() === date.toDateString() && !isToday(date) ? 'bg-accent/30 ring-2 ring-accent' : ''}
                  `}
                >
                  <span className={date && isToday(date) ? 'font-bold' : ''}>
                    {date?.getDate()}
                  </span>
                  {date && hasAnswers(date) && !isToday(date) && (
                    <HeartIcon className="w-3 h-3 text-primary mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {isLoading ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="py-8 text-center">
                  <HeartIcon className="w-8 h-8 text-primary mx-auto animate-pulse" />
                  <p className="text-muted-foreground text-sm mt-2">Carregando...</p>
                </CardContent>
              </Card>
            ) : selectedDateAnswers?.question ? (
              <>
                <Card className="border-0 shadow-xl overflow-hidden">
                  <CardHeader className="bg-primary/10 text-center py-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                      {selectedDate.toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </p>
                    <h2 className="font-serif text-xl text-foreground leading-relaxed text-balance">
                      {selectedDateAnswers.question}
                    </h2>
                    {selectedDateAnswers.category && (
                      <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wide">
                        {selectedDateAnswers.category}
                      </p>
                    )}
                  </CardHeader>
                </Card>

                {selectedDateAnswers.userAnswer || selectedDateAnswers.partnerAnswer ? (
                  <div className="space-y-3">
                    {selectedDateAnswers.userAnswer && (
                      <Card className="border-0 shadow-lg">
                        <CardContent className="pt-5 pb-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-foreground">{user.name}</span>
                          </div>
                          <p className="text-foreground text-sm leading-relaxed pl-9">
                            {selectedDateAnswers.userAnswer}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {selectedDateAnswers.partnerAnswer && (
                      <Card className="border-0 shadow-lg">
                        <CardContent className="pt-5 pb-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center">
                              <span className="text-xs font-semibold text-accent">
                                {partner?.name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {partner?.name || "Parceiro(a)"}
                            </span>
                          </div>
                          <p className="text-foreground text-sm leading-relaxed pl-9">
                            {selectedDateAnswers.partnerAnswer}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground text-sm">
                        Nenhuma resposta para este dia
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    Nenhuma pergunta atribuída para este dia
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty state when no date selected */}
        {!selectedDate && (
          <div className="text-center py-8">
            <HeartIcon className="w-12 h-12 text-primary/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Selecione um dia para ver as respostas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
