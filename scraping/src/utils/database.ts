import mongoose from 'mongoose';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private connected = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connect(uri?: string): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://mongodb:27017/seek';
      await mongoose.connect(mongoUri);
      this.connected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.connected = false;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('MongoDB disconnection error:', error);
      throw error;
    }
  }

  public isConnected(): boolean {
    return this.connected && mongoose.connection.readyState === 1;
  }
}