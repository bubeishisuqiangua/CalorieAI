
import { MealHistoryItem } from "../types";

/**
 * Senior Engineer Note:
 * LocalStorage has a 5MB limit. IndexedDB has essentially no limit (based on disk space).
 * This service provides a "Local Cloud" experience and is ready for remote Cloud sync.
 */

const DB_NAME = 'CalorieAI_DB';
const STORE_NAME = 'meals';
const DB_VERSION = 1;

class StorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject("IndexedDB failed to open");
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };
    });
  }

  /**
   * INSTRUCTIONS FOR CLOUD CONNECTION:
   * To connect to a real cloud (e.g., Supabase), replace the logic inside these 
   * functions with calls to your Supabase/Firebase client.
   */

  async saveMeal(meal: MealHistoryItem): Promise<void> {
    if (!this.db) await this.init();
    
    // CLOUD SYNC POINT: You would call `supabase.from('meals').insert(meal)` here.
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(meal);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject("Failed to save meal to persistent storage");
    });
  }

  async getAllMeals(): Promise<MealHistoryItem[]> {
    if (!this.db) await this.init();
    
    // CLOUD SYNC POINT: You would call `supabase.from('meals').select('*')` here.

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        // Sort by time descending
        const results = request.result as MealHistoryItem[];
        resolve(results.sort((a, b) => b.id.localeCompare(a.id)));
      };
      request.onerror = () => reject("Failed to fetch meals");
    });
  }

  async deleteMeal(id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject("Failed to delete meal");
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
    });
  }
}

export const storageService = new StorageService();
