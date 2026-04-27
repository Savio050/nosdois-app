// API client utilities — session is managed via httpOnly cookie, no localStorage

export interface User {
  id: string
  email: string
  name: string
  coupleCode: string
  avatarUrl?: string | null
  partner?: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
  } | null
}

export interface Question {
  id: string
  text: string
  category: string
}

export interface AnswerData {
  question: Question | null
  userAnswer: string | null
  partnerAnswer: string | null
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    return data.user ?? null
  } catch {
    return null
  }
}

export async function loginUser(email: string, password: string): Promise<User | { error: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Erro ao fazer login' }
    return data.user
  } catch {
    return { error: 'Erro de conexão' }
  }
}

export async function registerUser(name: string, email: string, password: string): Promise<User | { error: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Erro ao registrar' }
    return data.user
  } catch {
    return { error: 'Erro de conexão' }
  }
}

export async function logoutUser(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
}

export async function linkPartner(partnerCode: string): Promise<{ user: User } | { error: string }> {
  try {
    const res = await fetch('/api/couple/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerCode }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Erro ao conectar' }
    return { user: data.user }
  } catch {
    return { error: 'Erro de conexão' }
  }
}

export async function disconnectPartner(): Promise<{ success: boolean } | { error: string }> {
  try {
    const res = await fetch('/api/couple/disconnect', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Erro ao desconectar' }
    return { success: true }
  } catch {
    return { error: 'Erro de conexão' }
  }
}

export async function getAnswersForDate(date: string): Promise<AnswerData> {
  try {
    const res = await fetch(`/api/answers/get?date=${date}`)
    if (!res.ok) return { question: null, userAnswer: null, partnerAnswer: null }
    return res.json()
  } catch {
    return { question: null, userAnswer: null, partnerAnswer: null }
  }
}

export async function saveAnswer(date: string, answer: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const res = await fetch('/api/answers/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, answer }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Erro ao salvar' }
    return { success: true }
  } catch {
    return { error: 'Erro de conexão' }
  }
}

export async function getDatesWithAnswers(): Promise<string[]> {
  try {
    const res = await fetch('/api/answers/get')
    if (!res.ok) return []
    const data = await res.json()
    return data.datesWithAnswers ?? []
  } catch {
    return []
  }
}

export async function updateProfile(payload: {
  name?: string
  currentPassword?: string
  newPassword?: string
}): Promise<User | { error: string }> {
  try {
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Erro ao atualizar' }
    return data.user
  } catch {
    return { error: 'Erro de conexão' }
  }
}

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string } | { error: string }> {
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Erro ao enviar foto' }
    return { avatarUrl: data.avatarUrl }
  } catch {
    return { error: 'Erro de conexão' }
  }
}
