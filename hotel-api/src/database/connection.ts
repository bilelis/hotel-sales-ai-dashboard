import { MongoClient, Db } from 'mongodb';
import { config } from '../config/index.js';

class DatabaseManager {
  private client: MongoClient | null = null;
  private dbInstance: Db | null = null;
  private asOfDate: string = '2026-10-17';
  private isConnecting: boolean = false;

  public async connect(): Promise<Db> {
    if (this.dbInstance && this.client) {
      return this.dbInstance;
    }

    if (this.isConnecting) {
      while (this.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (this.dbInstance) return this.dbInstance;
    }

    this.isConnecting = true;
    try {
      console.log(`🔌 Connecting to MongoDB at ${config.mongoUri}...`);
      this.client = new MongoClient(config.mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      await this.client.connect();

      // Check target DB or auto-detect if collections exist in hotel vs hotel_db
      let selectedDbName = config.dbName;
      try {
        const adminDb = this.client.db().admin();
        const dbs = await adminDb.listDatabases();
        const dbNames = dbs.databases.map((d: { name: string }) => d.name);

        if (!dbNames.includes(selectedDbName)) {
          if (dbNames.includes('hotel_db') && selectedDbName === 'hotel') {
            console.log(`ℹ️ Database "${selectedDbName}" not found; switching to populated database "hotel_db".`);
            selectedDbName = 'hotel_db';
          } else if (dbNames.includes('hotel') && selectedDbName === 'hotel_db') {
            selectedDbName = 'hotel';
          }
        }
      } catch (err) {
        // Fallback gracefully to configured dbName if listDatabases is restricted
      }

      this.dbInstance = this.client.db(selectedDbName);

      // Determine 'data_as_of' date
      try {
        const metaDoc = await this.dbInstance.collection('meta').findOne({
          $or: [{ _id: 'data_as_of' as any }, { key: 'data_as_of' }]
        });
        if (metaDoc?.value) {
          this.asOfDate = String(metaDoc.value);
        }
      } catch (e) {
        console.warn('⚠️ Could not read data_as_of from meta collection, using fallback:', this.asOfDate);
      }

      console.log(`✅ MongoDB connected successfully to database "${selectedDbName}" (data as of: ${this.asOfDate})`);
      return this.dbInstance;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  public getDb(): Db {
    if (!this.dbInstance) {
      throw new Error('Database is not connected. Call connect() first.');
    }
    return this.dbInstance;
  }

  public getClient(): MongoClient {
    if (!this.client) {
      throw new Error('MongoClient is not initialized.');
    }
    return this.client;
  }

  public getAsOfDate(): string {
    return this.asOfDate;
  }

  public async ping(): Promise<boolean> {
    try {
      if (!this.dbInstance) return false;
      await this.dbInstance.command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.dbInstance = null;
      console.log('🔌 MongoDB connection closed gracefully.');
    }
  }
}

export const dbManager = new DatabaseManager();
