/**
 * MongoDB-Compatible Document Store with File Persistence
 * Implements collection-based querying, insertions, updates, and persistence.
 */

import fs from 'fs';
import path from 'path';
import {
  User,
  Brand,
  SocialPost,
  EngagementMetric,
  AudienceMemoryInsight,
  Recommendation,
  Conversation,
  ScheduledPost,
} from './schema.js';
import { getInitialSeedData } from './seed.js';

interface DatabaseData {
  users: User[];
  brands: Brand[];
  social_posts: SocialPost[];
  engagement_metrics: EngagementMetric[];
  audience_memory: AudienceMemoryInsight[];
  recommendations: Recommendation[];
  conversations: Conversation[];
  scheduled_posts: ScheduledPost[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

class Collection<T extends { _id: string }> {
  private name: keyof DatabaseData;
  private db: LocalDatabase;

  constructor(name: keyof DatabaseData, db: LocalDatabase) {
    this.name = name;
    this.db = db;
  }

  private getItems(): T[] {
    return (this.db.getData()[this.name] as unknown as T[]) || [];
  }

  private setItems(items: T[]) {
    (this.db.getData()[this.name] as unknown as T[]) = items;
    this.db.persist();
  }

  async find(filter?: Partial<Record<keyof T, any>> | ((item: T) => boolean)): Promise<T[]> {
    const items = this.getItems();
    if (!filter) return [...items];

    if (typeof filter === 'function') {
      return items.filter(filter);
    }

    return items.filter((item) => {
      for (const [key, val] of Object.entries(filter)) {
        if ((item as any)[key] !== val) return false;
      }
      return true;
    });
  }

  async findOne(filter: Partial<Record<keyof T, any>> | ((item: T) => boolean)): Promise<T | null> {
    const results = await this.find(filter);
    return results.length > 0 ? results[0] : null;
  }

  async insertOne(doc: T): Promise<T> {
    const items = this.getItems();
    if (!doc._id) {
      doc._id = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    }
    items.unshift(doc);
    this.setItems(items);
    return doc;
  }

  async insertMany(docs: T[]): Promise<T[]> {
    const items = this.getItems();
    for (const doc of docs) {
      if (!doc._id) {
        doc._id = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      }
      items.unshift(doc);
    }
    this.setItems(items);
    return docs;
  }

  async updateOne(
    filter: Partial<Record<keyof T, any>> | ((item: T) => boolean),
    update: Partial<T> | { $set?: Partial<T> }
  ): Promise<boolean> {
    const items = this.getItems();
    const index = items.findIndex((item) => {
      if (typeof filter === 'function') return filter(item);
      for (const [k, v] of Object.entries(filter)) {
        if ((item as any)[k] !== v) return false;
      }
      return true;
    });

    if (index === -1) return false;

    const setObj = '$set' in update && update.$set ? update.$set : update;
    items[index] = { ...items[index], ...setObj };
    this.setItems(items);
    return true;
  }

  async deleteOne(filter: Partial<Record<keyof T, any>> | ((item: T) => boolean)): Promise<boolean> {
    const items = this.getItems();
    const initialLen = items.length;
    const filtered = items.filter((item) => {
      if (typeof filter === 'function') return !filter(item);
      for (const [k, v] of Object.entries(filter)) {
        if ((item as any)[k] === v) return false;
      }
      return true;
    });

    if (filtered.length !== initialLen) {
      this.setItems(filtered);
      return true;
    }
    return false;
  }

  async countDocuments(filter?: Partial<Record<keyof T, any>>): Promise<number> {
    const items = await this.find(filter);
    return items.length;
  }
}

class LocalDatabase {
  private data: DatabaseData;

  constructor() {
    this.data = this.loadData();
  }

  public getData(): DatabaseData {
    return this.data;
  }

  private loadData(): DatabaseData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.brands && parsed.social_posts && parsed.social_posts.length > 0) {
          parsed.scheduled_posts = parsed.scheduled_posts || [];
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load database from disk, re-seeding:', e);
    }

    // Default initial seed
    const seed = getInitialSeedData();
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving initial seed:', e);
    }
    return seed;
  }

  public persist(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error persisting database:', e);
    }
  }

  public resetToDefaultSeed(): void {
    this.data = getInitialSeedData();
    this.persist();
  }

  collection<K extends keyof DatabaseData>(name: K): Collection<any> {
    return new Collection<any>(name, this);
  }
}

export const db = new LocalDatabase();
