
import { supabase } from "./supabase";
import { GirlfriendProfile, PaymentRequest } from "../types";

// We use a generic 'app_data' table to simulate the previous Firestore logic
// Table schema assumption: id (text, PK), data (jsonb), updated_at (timestamptz)

export const cloudStore = {
  // Save all profiles to Supabase
  async saveProfiles(profiles: GirlfriendProfile[]) {
    if (!supabase) return;
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn("⚠️ Cloud Sync Skipped: User is not authenticated.");
      return;
    }

    try {
      // Ensure we are saving JSON data correctly
      const { error } = await supabase
        .from('app_data')
        .upsert({ 
          id: 'profiles', 
          data: profiles, 
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;
      console.log("✅ Profiles synced to Supabase");
    } catch (e: any) {
      console.error("❌ Failed to save to Cloud:", e.message);
      throw e; // Re-throw to alert user
    }
  },

  // Load profiles from Supabase
  async loadProfiles(): Promise<GirlfriendProfile[] | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('app_data')
        .select('data')
        .eq('id', 'profiles')
        .single();

      if (error) throw error;
      
      if (data && data.data) {
        console.log("📥 Loaded profiles from Supabase");
        return data.data as GirlfriendProfile[];
      }
    } catch (e: any) {
      if (e.code === 'PGRST116') {
         // No rows found, which is fine for first load
         console.log("ℹ️ No cloud profiles found. Using local defaults.");
      } else {
         console.error("❌ Failed to load from Cloud:", e.message);
      }
    }
    return null;
  },

  // Save Payment Requests to Supabase (simulating a table)
  async savePaymentRequests(requests: PaymentRequest[]) {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('app_data')
        .upsert({ 
          id: 'payment_requests', 
          data: requests, 
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;
    } catch (e: any) {
      console.error("❌ Failed to save payment requests:", e.message);
    }
  },

  // Load Payment Requests
  async loadPaymentRequests(): Promise<PaymentRequest[] | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('app_data')
        .select('data')
        .eq('id', 'payment_requests')
        .single();

      if (error) throw error;
      
      if (data && data.data) {
        return data.data as PaymentRequest[];
      }
    } catch (e: any) {
      // Ignore not found error
    }
    return null;
  }
};
