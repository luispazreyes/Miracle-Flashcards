// Esquema inferido de specs.md RF-46 (supuesto: validar contra design.png).
export type ProjectStatus = 'active' | 'archived'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  deckCount: number
  wordCount: number
  learnedCount: number
  updatedAt: string // ISO 8601
  ownerId: User['id']
}
