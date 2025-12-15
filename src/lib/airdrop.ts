// Airdrop service for database operations
import { supabase } from './supabase';
import type {
  Airdrop,
  UserAirdrop,
  AirdropFilters,
  AirdropFeedItem,
} from '../types/airdrop';

export class AirdropService {
  // Get all airdrops with optional filtering
  static async getAirdrops(
    filters?: AirdropFilters
  ): Promise<AirdropFeedItem[]> {
    let query = supabase
      .from('airdrops')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.blockchain) {
      query = query.eq('blockchain', filters.blockchain);
    }

    if (filters?.search_term) {
      query = query.or(
        `title.ilike.%${filters.search_term}%,project_name.ilike.%${filters.search_term}%`
      );
    }

    const { data: airdrops, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch airdrops: ${error.message}`);
    }

    // Transform to AirdropFeedItem format
    return (airdrops || []).map((airdrop) => ({
      ...airdrop,
      is_bookmarked: false, // Will be updated with user-specific data
      is_eligible: true, // Will be calculated based on user wallet
      time_remaining: airdrop.end_date
        ? new Date(airdrop.end_date).getTime() - Date.now()
        : undefined,
    }));
  }

  // Get airdrops for a specific user with bookmark status
  static async getUserAirdrops(
    userId: string,
    filters?: AirdropFilters
  ): Promise<AirdropFeedItem[]> {
    let query = supabase
      .from('airdrops')
      .select(
        `
        *,
        user_airdrops!inner(
          user_id,
          airdrop_id,
          status,
          completed_requirements,
          bookmarked_at,
          completed_at
        )
      `
      )
      .eq('user_airdrops.user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data: airdrops, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch user airdrops: ${error.message}`);
    }

    return (airdrops || []).map((airdrop) => ({
      ...airdrop,
      user_status: airdrop.user_airdrops[0],
      is_bookmarked: true,
      is_eligible: true,
      time_remaining: airdrop.end_date
        ? new Date(airdrop.end_date).getTime() - Date.now()
        : undefined,
    }));
  }

  // Bookmark an airdrop
  static async bookmarkAirdrop(
    userId: string,
    airdropId: string
  ): Promise<UserAirdrop> {
    const { data, error } = await supabase
      .from('user_airdrops')
      .upsert({
        user_id: userId,
        airdrop_id: airdropId,
        status: 'bookmarked',
        bookmarked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to bookmark airdrop: ${error.message}`);
    }

    return data;
  }

  // Remove bookmark from an airdrop
  static async removeBookmark(
    userId: string,
    airdropId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_airdrops')
      .delete()
      .eq('user_id', userId)
      .eq('airdrop_id', airdropId);

    if (error) {
      throw new Error(`Failed to remove bookmark: ${error.message}`);
    }
  }

  // Update airdrop participation status
  static async updateParticipationStatus(
    userId: string,
    airdropId: string,
    status: 'participating' | 'completed' | 'claimed',
    completedRequirements?: string[]
  ): Promise<UserAirdrop> {
    const updateData: any = {
      user_id: userId,
      airdrop_id: airdropId,
      status,
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (completedRequirements) {
      updateData.completed_requirements = completedRequirements;
    }

    const { data, error } = await supabase
      .from('user_airdrops')
      .upsert(updateData)
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to update participation status: ${error.message}`
      );
    }

    return data;
  }

  // Get airdrops approaching deadline for reminder notifications
  static async getAirdropsApproachingDeadline(
    hoursAhead: number = 24
  ): Promise<Airdrop[]> {
    const deadlineThreshold = new Date();
    deadlineThreshold.setHours(deadlineThreshold.getHours() + hoursAhead);

    const { data: airdrops, error } = await supabase
      .from('airdrops')
      .select('*')
      .eq('status', 'active')
      .lte('end_date', deadlineThreshold.toISOString())
      .gte('end_date', new Date().toISOString());

    if (error) {
      throw new Error(
        `Failed to fetch airdrops approaching deadline: ${error.message}`
      );
    }

    return airdrops || [];
  }

  // Create airdrop reminder notification
  static async createReminderNotification(
    userId: string,
    airdrop: Airdrop
  ): Promise<void> {
    const timeRemaining = airdrop.end_date
      ? new Date(airdrop.end_date).getTime() - Date.now()
      : 0;
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type: 'airdrop_reminder',
      title: `Airdrop Deadline Reminder: ${airdrop.title}`,
      message: `Only ${hoursRemaining} hours left to participate in ${airdrop.project_name} airdrop!`,
      data: {
        airdrop_id: airdrop.id,
        airdrop_title: airdrop.title,
        time_remaining: timeRemaining,
        action_required: 'Complete remaining requirements',
      },
    });

    if (error) {
      throw new Error(
        `Failed to create reminder notification: ${error.message}`
      );
    }
  }

  // Get recommended airdrops based on wallet criteria
  static async getRecommendedAirdrops(
    userId: string,
    walletAddress?: string
  ): Promise<AirdropFeedItem[]> {
    // For now, return active airdrops that user hasn't bookmarked
    // In a real implementation, this would analyze wallet holdings and transaction history

    let query = supabase
      .from('airdrops')
      .select(
        `
        *,
        user_airdrops(user_id, airdrop_id)
      `
      )
      .eq('status', 'active')
      .is('user_airdrops.user_id', null)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: airdrops, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch recommended airdrops: ${error.message}`);
    }

    return (airdrops || []).map((airdrop) => ({
      ...airdrop,
      is_bookmarked: false,
      is_eligible: true, // Would be calculated based on wallet analysis
      time_remaining: airdrop.end_date
        ? new Date(airdrop.end_date).getTime() - Date.now()
        : undefined,
    }));
  }

  // Create a new airdrop (admin function)
  static async createAirdrop(
    airdropData: Omit<Airdrop, 'id' | 'created_at'>
  ): Promise<Airdrop> {
    const { data, error } = await supabase
      .from('airdrops')
      .insert(airdropData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create airdrop: ${error.message}`);
    }

    return data;
  }

  // Send new airdrop notification to all users
  static async notifyNewAirdrop(airdrop: Airdrop): Promise<void> {
    // Get all users to send notification
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError) {
      throw new Error(
        `Failed to fetch users for notification: ${usersError.message}`
      );
    }

    if (!users || users.length === 0) return;

    // Create notifications for all users
    const notifications = users.map((user) => ({
      user_id: user.id,
      type: 'new_airdrop',
      title: `New Airdrop: ${airdrop.title}`,
      message: `${airdrop.project_name} has launched a new airdrop! Check it out now.`,
      data: {
        airdrop_id: airdrop.id,
        airdrop_title: airdrop.title,
        project_name: airdrop.project_name,
      },
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      throw new Error(
        `Failed to send new airdrop notifications: ${error.message}`
      );
    }
  }
}
