
import { doc, setDoc, getDoc } from "firebase/firestore";
import { GirlfriendProfile } from "../types";
import { db, auth } from "./firebase";

const COLLECTION_NAME = "app_data";
const DOC_ID = "profiles";

export const cloudStore = {
  // Save all profiles to Google Cloud
  async saveProfiles(profiles: GirlfriendProfile[]) {
    if (!db) return;
    
    // Check if user is authenticated before trying to write
    if (!auth.currentUser) {
      console.warn("⚠️ Cloud Sync Skipped: User is not authenticated.");
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, DOC_ID);
      await setDoc(docRef, { data: profiles, updatedAt: new Date().toISOString() }, { merge: true });
      console.log("✅ Profiles synced to Google Cloud");
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        console.warn("⚠️ Cloud Save Failed: Permission denied. Check Firestore rules or user role.");
      } else {
        console.error("❌ Failed to save to Cloud:", e);
      }
    }
  },

  // Load profiles from Google Cloud
  async loadProfiles(): Promise<GirlfriendProfile[] | null> {
    if (!db) return null;

    try {
      const docRef = doc(db, COLLECTION_NAME, DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log("📥 Loaded profiles from Google Cloud");
        return docSnap.data().data as GirlfriendProfile[];
      }
    } catch (e: any) {
      // Suppress permission errors on initial load for unauthenticated users
      if (e.code === 'permission-denied') {
        console.log("ℹ️ Could not load cloud profiles (Permission denied). Using local defaults.");
      } else {
        console.error("❌ Failed to load from Cloud:", e);
      }
    }
    return null;
  }
};
