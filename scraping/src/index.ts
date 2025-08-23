import dotenv from 'dotenv';
import { DatabaseManager } from './utils/database';

dotenv.config();

async function startScrapingService() {
  const dbManager = DatabaseManager.getInstance();
  
  try {
    await dbManager.connect();
    console.log('Scraping service started successfully');
    
    // Keep the service running
    process.on('SIGINT', async () => {
      console.log('Shutting down scraping service...');
      await dbManager.disconnect();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start scraping service:', error);
    process.exit(1);
  }
}

startScrapingService();