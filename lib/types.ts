export interface Profile {
  id: string
  name: string
  email: string | null
  status: "pending" | "approved" | "rejected"
  is_admin: boolean
  created_at: string
  updated_at: string
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
  created_at: string
  updated_at: string
  // Joined data
  player1?: Profile
  player2?: Profile
  player3?: Profile
  player4?: Profile
  creator?: Profile
}

export interface MatchValidation {
  id: string
  match_id: string
  player_id: string
  validated: boolean
  validated_at: string | null
  created_at: string
}

export interface PlayerStats {
  id: string
  name: string
  total_matches: number
  wins: number
  losses: number
  win_rate: number
}
