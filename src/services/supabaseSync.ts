import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { GroceryItem, Chore, Appointment } from '../types';

export type RealtimeChangeHandler = {
  onGroceryChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', item: any) => void;
  onChoreChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', chore: any) => void;
  onAppointmentChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', appt: any) => void;
  onNoteChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', note: any) => void;
};

let activeChannel: any = null;

/**
 * Subscribes to Supabase Realtime changes across family tables
 */
export const subscribeToFamilyRealtime = (handlers: RealtimeChangeHandler): (() => void) => {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) {
    return () => {};
  }

  // Clean up any existing channel
  if (activeChannel) {
    client.removeChannel(activeChannel);
    activeChannel = null;
  }

  try {
    const channel = client
      .channel('famly_live_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'groceries' },
        (payload) => {
          if (handlers.onGroceryChange) {
            handlers.onGroceryChange(payload.eventType as any, payload.new || payload.old);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chores' },
        (payload) => {
          if (handlers.onChoreChange) {
            handlers.onChoreChange(payload.eventType as any, payload.new || payload.old);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          if (handlers.onAppointmentChange) {
            handlers.onAppointmentChange(payload.eventType as any, payload.new || payload.old);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        (payload) => {
          if (handlers.onNoteChange) {
            handlers.onNoteChange(payload.eventType as any, payload.new || payload.old);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('⚡ Famly Realtime: Subscribed to live cloud changes');
        }
      });

    activeChannel = channel;

    return () => {
      if (client && activeChannel) {
        client.removeChannel(activeChannel);
        activeChannel = null;
      }
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
};

/**
 * Background Offline-First Sync Helpers
 */
export const syncGroceryToCloud = async (item: GroceryItem, familyId = 'fam_1'): Promise<void> => {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) return;

  try {
    await client.from('groceries').upsert({
      id: item.id,
      family_id: familyId,
      name: item.name,
      store: item.store || 'Rewe',
      amount: item.amount || '',
      category: item.category || 'produce',
      checked: Boolean(item.checked),
      added_by_member_id: item.addedByMemberId || null,
    });
  } catch (err) {
    console.warn('Cloud grocery sync deferred (offline):', err);
  }
};

export const deleteGroceryFromCloud = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) return;

  try {
    await client.from('groceries').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud grocery delete deferred:', err);
  }
};

export const syncChoreToCloud = async (chore: Chore, familyId = 'fam_1'): Promise<void> => {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) return;

  try {
    await client.from('chores').upsert({
      id: chore.id,
      family_id: familyId,
      title: chore.title,
      assigned_member_id: chore.assignedMemberId,
      frequency: chore.frequency,
      completed: Boolean(chore.completed),
      stars: chore.stars || 1,
    });
  } catch (err) {
    console.warn('Cloud chore sync deferred:', err);
  }
};

export const deleteChoreFromCloud = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) return;

  try {
    await client.from('chores').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud chore delete deferred:', err);
  }
};

export const syncAppointmentToCloud = async (appt: Appointment, familyId = 'fam_1'): Promise<void> => {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) return;

  try {
    await client.from('appointments').upsert({
      id: appt.id,
      family_id: familyId,
      title: appt.title,
      date: appt.date,
      time: appt.time,
      duration_minutes: appt.durationMinutes || 60,
      location: appt.location || null,
      member_ids: appt.memberIds || [],
      category: appt.category || 'family',
      notes: appt.notes || null,
    });
  } catch (err) {
    console.warn('Cloud appointment sync deferred:', err);
  }
};

export const deleteAppointmentFromCloud = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) return;

  try {
    await client.from('appointments').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud appointment delete deferred:', err);
  }
};
