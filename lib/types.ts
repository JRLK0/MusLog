export interface Profile {
  id: string
  name: string
  email: string | null
  status: "pending" | "approved" | "rejected"
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface SeasonPlayer {
  id: string
  name: string
  season_id: string
  created_by: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  season?: Season
  creator?: Profile
}

export interface Season {
  id: string
  name: string
  start_date: string
  end_date: string | null
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  creator?: Profile
}

export interface Match {
  id: string
  created_by: string
  played_at: string
  player1_id: string
  player2_id: string
  player3_id: string
  player4_id: string
  winner_team: 1 | 2
  status: "pending" | "validated" | "rejected"
  team1_score: number
  team2_score: number
  season_id?: string | null
  created_at: string
  updated_at: string
  // Joined data
  player1?: Profile
  player2?: Profile
  player3?: Profile
  player4?: Profile
  temp_player1_id?: string | null
  temp_player2_id?: string | null
  temp_player3_id?: string | null
  temp_player4_id?: string | null
  temp_player1?: SeasonPlayer
  temp_player2?: SeasonPlayer
  temp_player3?: SeasonPlayer
  temp_player4?: SeasonPlayer
  creator?: Profile
  season?: Season
  validations?: MatchValidation[]
}

export interface MatchValidation {
  id: string
  match_id: string
  player_id: string
  validated: boolean
  validated_at: string | null
  created_at: string
  player?: Profile
}

export interface PlayerStats {
  id: string
  name: string
  total_matches: number
  wins: number
  losses: number
  win_rate: number
}
