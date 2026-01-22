
import { supabase } from "./supabase";
import { GirlfriendProfile, PaymentRequest } from "../types";
import { PROFILES as INITIAL_PROFILES } from "../constants";

// We use a generic 'app_data' table to simulate the previous Firestore logic
// Table schema assumption: id (text, PK), data (jsonb), updated_at (timestamptz)

export const cloudStore = {
  // Save all profiles to Supabase 'app_data' table
  async saveProfiles(profiles: GirlfriendProfile[]) {
    if (!supabase) return; // Ensure supabase client is initialized
    
    try {
      const { error } = await supabase
        .from('app_data')
        .upsert({ 
          id: 'profiles', 
          data: profiles, 
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;
      console.log("✅ Profiles synced to Supabase (app_data)");
    } catch (e: any) {
      console.error("❌ Failed to save profiles to Supabase (app_data):", e.message);
      throw e; 
    }
  },

  // Load profiles from Supabase 'app_data' table
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
        console.log("📥 Loaded profiles from Supabase (app_data)");
        return data.data as GirlfriendProfile[];
      }
    } catch (e: any) {
      if (e.code === 'PGRST116') {
         console.log("ℹ️ No cloud profiles found in Supabase (app_data). Using local defaults.");
      } else {
         console.error("❌ Failed to load profiles from Supabase (app_data):", e.message);
      }
    }
    return null;
  },

  // Save Payment Requests to Supabase 'app_data' table
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
      console.log("✅ Payment requests synced to Supabase (app_data)");
    } catch (e: any) {
      console.error("❌ Failed to save payment requests to Supabase (app_data):", e.message);
    }
  },

  // Load Payment Requests from Supabase 'app_data' table
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
        console.log("📥 Loaded payment requests from Supabase (app_data)");
        return data.data as PaymentRequest[];
      }
    } catch (e: any) {
      // Ignore not found error
      console.warn("ℹ️ No cloud payment requests found in Supabase (app_data).", e.message);
    }
    return null;
  }
};
