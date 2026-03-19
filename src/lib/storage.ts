// Client-side storage - only stores session token (current user ID)
// All user and couple data is fetched from server-side APIs

export interface User {
  id: string;
  name: string;
  email: string;
  coupleCode: string;
  partnerId?: string;
}

export interface Question {
  id: string;
  text: string;
  category: string;
}

export interface AnswerData {
  question: Question | null;
  userAnswer: string | null;
  partnerAnswer: string | null;
}

const CURRENT_USER_KEY = 'nosdois_current_user_id';

// Session management - stores only user ID in localStorage
export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function setCurrentUserId(userId: string | null): void {
  if (typeof window === 'undefined') return;
  if (userId) {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function logoutUser(): void {
  setCurrentUserId(null);
}

// API functions
export async function registerUser(name: string, email: string, password: string): Promise<User | { error: string }> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Erro ao registrar' };
    }
    
    setCurrentUserId(data.user.id);
    return data.user;
  } catch {
    return { error: 'Erro de conexão' };
  }
}

export async function loginUser(email: string, password: string): Promise<User | { error: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Erro ao fazer login' };
    }
    
    setCurrentUserId(data.user.id);
    return data.user;
  } catch {
    return { error: 'Erro de conexão' };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const userId = getCurrentUserId();
  if (!userId) return null;
  
  try {
    const response = await fetch(`/api/couple/status?userId=${userId}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function getCoupleStatus(userId: string): Promise<{ user: User; partner: User | null } | null> {
  try {
    const response = await fetch(`/api/couple/status?userId=${userId}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data;
  } catch {
    return null;
  }
}

export async function linkPartner(userId: string, partnerCode: string): Promise<{ user: User; partner: User } | { error: string }> {
  try {
    const response = await fetch('/api/couple/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, partnerCode }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Erro ao conectar' };
    }
    
    return data;
  } catch {
    return { error: 'Erro de conexão' };
  }
}

export async function saveAnswer(userId: string, date: string, answer: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const response = await fetch('/api/answers/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, date, answer }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Erro ao salvar resposta' };
    }
    
    return { success: true };
  } catch {
    return { error: 'Erro de conexão' };
  }
}

export async function getAnswersForDate(userId: string, date: string): Promise<AnswerData> {
  try {
    const response = await fetch(`/api/answers/get?userId=${userId}&date=${date}`);
    if (!response.ok) return { question: null, userAnswer: null, partnerAnswer: null };
    
    return response.json();
  } catch {
    return { question: null, userAnswer: null, partnerAnswer: null };
  }
}

export async function getDatesWithAnswers(userId: string): Promise<string[]> {
  try {
    const response = await fetch(`/api/answers/get?userId=${userId}`);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.datesWithAnswers || [];
  } catch {
    return [];
  }
}
