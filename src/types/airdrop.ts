// Airdrop-specific types and interfaces

export interface Airdrop {
  id: string;
  title: string;
  description: string | null;
  project_name: string;
  logo_url: string | null;
  requirements: AirdropRequirement[] | null;
  eligibility_criteria: EligibilityCriteria | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'ended' | 'upcoming';
  estimated_reward: string | null;
  blockchain: string | null;
  created_at: string;
}

export interface AirdropRequirement {
  id: string;
  description: string;
  is_completed: boolean;
  verification_method: 'wallet' | 'social' | 'manual';
  required_value?: string;
}

export interface EligibilityCriteria {
  min_balance?: number;
  required_tokens?: string[];
  blockchain_networks?: string[];
  social_requirements?: {
    twitter_followers?: number;
    discord_member?: boolean;
    telegram_member?: boolean;
  };
  wallet_age_days?: number;
  transaction_count?: number;
}

export interface UserAirdrop {
  user_id: string;
  airdrop_id: string;
  status: 'bookmarked' | 'participating' | 'completed' | 'claimed';
  completed_requirements: string[];
  bookmarked_at: string | null;
  completed_at: string | null;
}

export interface AirdropFeedItem extends Airdrop {
  user_status?: UserAirdrop;
  is_bookmarked: boolean;
  is_eligible: boolean;
  time_remaining?: number; // in milliseconds
}

export interface AirdropFilters {
  status?: 'active' | 'ended' | 'upcoming' | 'all';
  blockchain?: string;
  search_term?: string;
  min_reward?: number;
  eligible_only?: boolean;
}

export interface AirdropNotification {
  id: string;
  airdrop_id: string;
  user_id: string;
  type: 'new_airdrop' | 'deadline_reminder' | 'status_update';
  title: string;
  message: string;
  data: {
    airdrop_title: string;
    time_remaining?: number;
    action_required?: string;
  };
  created_at: string;
}
