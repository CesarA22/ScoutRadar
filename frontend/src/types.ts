export interface Player {
  player_key: string
  player: string
  team: string
  season: number
  position_group: string
  age: number
  minutes: number
  metrics?: Record<string, number>
  umap_x?: number
  umap_y?: number
  cluster_id?: number
  cluster_prob?: number
  is_noise?: number
  rarity_score?: number
  impact_score?: number
  prospect_score?: number
  card?: string
  image_url?: string
}

export interface Filters {
  seasons: number[]
  teams: string[]
  clusters: number[]
  position_groups: string[]
}

export interface FilterState {
  seasons: number[]
  positionGroups: string[]
  teams: string[]
  clusters: number[]
  ageMax: number
  minutesMin: number
}

export const DEFAULT_FILTERS: FilterState = {
  seasons: [2023, 2024],
  positionGroups: [],
  teams: [],
  clusters: [],
  ageMax: 23,
  minutesMin: 400,
}

export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  audit?: Record<string, unknown>
  feedback?: 'up' | 'down' | null
}
