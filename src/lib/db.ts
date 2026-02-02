import Dexie, { type Table } from 'dexie';

export interface LocalBook {
  id: string;
  title: string;
  content: string;
  progress: number;
  lastRead: number;
  offlineAvailable: boolean;
}

export interface SyncQueue {
  id?: number;
  action: 'UPDATE_PROGRESS' | 'COMPLETE_EXERCISE';
  payload: unknown;
  timestamp: number;
}

class NeuroDB extends Dexie {
  books!: Table<LocalBook>;
  syncQueue!: Table<SyncQueue>;

  constructor() {
    super('NeuroReadDB');
    this.version(1).stores({
      books: 'id, title, lastRead',
      syncQueue: '++id, action, timestamp',
    });
  }
}

export const db = new NeuroDB();
