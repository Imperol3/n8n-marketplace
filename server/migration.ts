import { pool, db } from './db';
import { analytics } from '@shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Run database migrations for any missing tables or structure changes
 */
export async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Check if analytics table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'analytics'
      );
    `);
    
    const analyticsTableExists = tableCheck.rows[0].exists;
    console.log(`Analytics table exists: ${analyticsTableExists}`);
    
    // Create analytics table if it doesn't exist
    if (!analyticsTableExists) {
      console.log('Creating analytics table...');
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS analytics (
          id SERIAL PRIMARY KEY,
          total_users INTEGER DEFAULT 0,
          active_users JSONB DEFAULT '{}' NOT NULL,
          total_downloads INTEGER DEFAULT 0,
          downloads_per_workflow JSONB DEFAULT '{}' NOT NULL,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Initialize with first record
      await db.insert(analytics).values({
        totalUsers: 0,
        totalDownloads: 0,
        activeUsers: {},
        downloadsPerWorkflow: {},
        lastUpdated: new Date()
      }).execute();
      
      console.log('Analytics table created and initialized');
    }
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running database migrations:', error);
  }
}