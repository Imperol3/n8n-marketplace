import { User, InsertUser, Workflow, InsertWorkflow, Tier, InsertTier, Domain, InsertDomain, Analytics } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, workflows, accessTiers, domains, analytics } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // User favorites operations
  addFavoriteWorkflow(userId: number, workflowId: number): Promise<User | undefined>;
  removeFavoriteWorkflow(userId: number, workflowId: number): Promise<User | undefined>;
  getFavoriteWorkflows(userId: number): Promise<Workflow[]>;
  
  // Download history operations
  recordWorkflowDownload(userId: number, workflowId: number): Promise<User | undefined>;
  getDownloadHistory(userId: number): Promise<{ workflowId: number, downloadedAt: string }[]>;

  // Tier operations
  getTiers(): Promise<Tier[]>;
  getTier(id: number): Promise<Tier | undefined>;
  createTier(tier: InsertTier): Promise<Tier>;
  updateTier(id: number, tier: Partial<InsertTier>): Promise<Tier | undefined>;
  deleteTier(id: number): Promise<boolean>;

  // Workflow operations
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;
  
  // Rating operations
  addWorkflowRating(workflowId: number, userId: number, rating: number, review?: string): Promise<Workflow | undefined>;
  getWorkflowRatings(workflowId: number): Promise<{ userId: number; rating: number; review?: string; createdAt: string }[]>;
  
  // Documentation operations
  addWorkflowDocumentation(workflowId: number, documentation: string): Promise<Workflow | undefined>;
  getWorkflowDocumentation(workflowId: number): Promise<string | undefined>;

  // Domain operations
  getDomains(): Promise<Domain[]>;
  getDomain(id: number): Promise<Domain | undefined>;
  getDomainByName(domain: string): Promise<Domain | undefined>;
  createDomain(domain: InsertDomain): Promise<Domain>;
  updateDomain(id: number, domain: Partial<Domain>): Promise<Domain | undefined>;
  deleteDomain(id: number): Promise<boolean>;
  
  // Analytics operations
  getAnalytics(): Promise<Analytics | undefined>;
  incrementTotalUsers(): Promise<Analytics | undefined>;
  recordUserActivity(userId: number): Promise<Analytics | undefined>;
  incrementTotalDownloads(workflowId: number): Promise<Analytics | undefined>;
  getActiveUsers(): Promise<{ userId: number, lastActive: string, pageViews: number }[]>;
  getDownloadsPerWorkflow(): Promise<{ workflowId: number, downloads: number }[]>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(update)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [user] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return !!user;
  }

  async getTiers(): Promise<Tier[]> {
    return await db.select().from(accessTiers).orderBy(accessTiers.level);
  }

  async getTier(id: number): Promise<Tier | undefined> {
    const [tier] = await db.select().from(accessTiers).where(eq(accessTiers.id, id));
    return tier;
  }

  async createTier(insertTier: InsertTier): Promise<Tier> {
    const [tier] = await db.insert(accessTiers).values(insertTier).returning();
    return tier;
  }

  async updateTier(id: number, update: Partial<InsertTier>): Promise<Tier | undefined> {
    const [tier] = await db
      .update(accessTiers)
      .set(update)
      .where(eq(accessTiers.id, id))
      .returning();
    return tier;
  }

  async deleteTier(id: number): Promise<boolean> {
    const [tier] = await db
      .delete(accessTiers)
      .where(eq(accessTiers.id, id))
      .returning();
    return !!tier;
  }

  async getWorkflows(): Promise<Workflow[]> {
    return await db.select().from(workflows);
  }

  async getWorkflow(id: number): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const [workflow] = await db.insert(workflows).values(insertWorkflow).returning();
    return workflow;
  }

  async updateWorkflow(id: number, update: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const [workflow] = await db
      .update(workflows)
      .set(update)
      .where(eq(workflows.id, id))
      .returning();
    return workflow;
  }

  async deleteWorkflow(id: number): Promise<boolean> {
    const [workflow] = await db
      .delete(workflows)
      .where(eq(workflows.id, id))
      .returning();
    return !!workflow;
  }

  async getDomains(): Promise<Domain[]> {
    return await db.select().from(domains);
  }

  async getDomain(id: number): Promise<Domain | undefined> {
    const [domain] = await db.select().from(domains).where(eq(domains.id, id));
    return domain;
  }

  async getDomainByName(domainName: string): Promise<Domain | undefined> {
    const [domain] = await db.select().from(domains).where(eq(domains.domain, domainName));
    return domain;
  }

  async createDomain(insertDomain: InsertDomain): Promise<Domain> {
    const [domain] = await db.insert(domains).values(insertDomain).returning();
    return domain;
  }

  async updateDomain(id: number, update: Partial<Domain>): Promise<Domain | undefined> {
    const [domain] = await db
      .update(domains)
      .set(update)
      .where(eq(domains.id, id))
      .returning();
    return domain;
  }

  async deleteDomain(id: number): Promise<boolean> {
    const [domain] = await db
      .delete(domains)
      .where(eq(domains.id, id))
      .returning();
    return !!domain;
  }

  // User favorites operations
  async addFavoriteWorkflow(userId: number, workflowId: number): Promise<User | undefined> {
    // Get the current user
    const user = await this.getUser(userId);
    if (!user) return undefined;

    // Get the workflow to verify it exists
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return undefined;

    // Initialize favoriteWorkflows array if it doesn't exist
    if (!user.preferences.favoriteWorkflows) {
      user.preferences.favoriteWorkflows = [];
    }

    // Add the workflow ID if it's not already favorited
    if (!user.preferences.favoriteWorkflows.includes(workflowId)) {
      user.preferences.favoriteWorkflows.push(workflowId);
      
      // Update the user in the database
      return await this.updateUser(userId, {
        preferences: user.preferences
      });
    }

    return user;
  }

  async removeFavoriteWorkflow(userId: number, workflowId: number): Promise<User | undefined> {
    // Get the current user
    const user = await this.getUser(userId);
    if (!user || !user.preferences.favoriteWorkflows) return undefined;

    // Filter out the workflow ID from favorites
    user.preferences.favoriteWorkflows = user.preferences.favoriteWorkflows.filter(id => id !== workflowId);
    
    // Update the user in the database
    return await this.updateUser(userId, {
      preferences: user.preferences
    });
  }

  async getFavoriteWorkflows(userId: number): Promise<Workflow[]> {
    // Get the current user
    const user = await this.getUser(userId);
    if (!user || !user.preferences.favoriteWorkflows || user.preferences.favoriteWorkflows.length === 0) {
      return [];
    }

    // Get all workflows that match the favorite IDs
    const favoriteWorkflows: Workflow[] = [];
    for (const workflowId of user.preferences.favoriteWorkflows) {
      const workflow = await this.getWorkflow(workflowId);
      if (workflow) favoriteWorkflows.push(workflow);
    }

    return favoriteWorkflows;
  }

  // Download history operations
  async recordWorkflowDownload(userId: number, workflowId: number): Promise<User | undefined> {
    // Get the current user
    const user = await this.getUser(userId);
    if (!user) return undefined;

    // Get the workflow to verify it exists
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return undefined;

    // Initialize downloadHistory array if it doesn't exist
    if (!user.preferences.downloadHistory) {
      user.preferences.downloadHistory = [];
    }

    // Add the download record
    user.preferences.downloadHistory.push({
      workflowId,
      downloadedAt: new Date().toISOString()
    });
    
    // Update the user in the database
    return await this.updateUser(userId, {
      preferences: user.preferences
    });
  }

  async getDownloadHistory(userId: number): Promise<{ workflowId: number, downloadedAt: string }[]> {
    // Get the current user
    const user = await this.getUser(userId);
    if (!user || !user.preferences.downloadHistory) {
      return [];
    }

    return user.preferences.downloadHistory;
  }

  // Rating operations
  async addWorkflowRating(workflowId: number, userId: number, rating: number, review?: string): Promise<Workflow | undefined> {
    // Get the workflow
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return undefined;

    // Ensure the user exists
    const user = await this.getUser(userId);
    if (!user) return undefined;

    // Initialize ratings array if it doesn't exist
    if (!workflow.metadata.ratings) {
      workflow.metadata.ratings = [];
    }

    // Check if user already rated this workflow
    const existingRatingIndex = workflow.metadata.ratings.findIndex(r => r.userId === userId);
    
    if (existingRatingIndex !== -1) {
      // Update existing rating
      workflow.metadata.ratings[existingRatingIndex] = {
        userId,
        rating,
        review,
        createdAt: new Date().toISOString()
      };
    } else {
      // Add new rating
      workflow.metadata.ratings.push({
        userId,
        rating,
        review,
        createdAt: new Date().toISOString()
      });
    }

    // Calculate average rating
    const totalRating = workflow.metadata.ratings.reduce((sum, r) => sum + r.rating, 0);
    workflow.metadata.averageRating = workflow.metadata.ratings.length > 0 
      ? totalRating / workflow.metadata.ratings.length 
      : 0;

    // Update the workflow in the database
    return await this.updateWorkflow(workflowId, {
      metadata: workflow.metadata
    });
  }

  async getWorkflowRatings(workflowId: number): Promise<{ userId: number; rating: number; review?: string; createdAt: string }[]> {
    // Get the workflow
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow || !workflow.metadata.ratings) {
      return [];
    }

    return workflow.metadata.ratings;
  }

  // Documentation operations
  async addWorkflowDocumentation(workflowId: number, documentation: string): Promise<Workflow | undefined> {
    // Get the workflow
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return undefined;

    // Update the documentation
    workflow.metadata.documentation = documentation;

    // Update the workflow in the database
    return await this.updateWorkflow(workflowId, {
      metadata: workflow.metadata
    });
  }

  async getWorkflowDocumentation(workflowId: number): Promise<string | undefined> {
    // Get the workflow
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return undefined;

    return workflow.metadata.documentation;
  }

  // Analytics operations
  async getAnalytics(): Promise<Analytics | undefined> {
    try {
      // Try to get existing analytics record
      const analyticsResults = await db.select().from(analytics);
      const analyticsRecord = analyticsResults.length > 0 ? analyticsResults[0] : null;
      
      // If no record exists, create a new one
      if (!analyticsRecord) {
        console.log('Creating new analytics record');
        try {
          const [newRecord] = await db.insert(analytics).values({
            totalUsers: 0,
            totalDownloads: 0,
            activeUsers: {},
            downloadsPerWorkflow: {},
            lastUpdated: new Date()
          }).returning();
          return newRecord;
        } catch (insertError) {
          console.error('Error creating analytics record:', insertError);
          return undefined;
        }
      }
      
      return analyticsRecord;
    } catch (error) {
      console.error('Error getting analytics record:', error);
      return undefined;
    }
  }

  async incrementTotalUsers(): Promise<Analytics | undefined> {
    // Get or create analytics record
    const analyticsRecord = await this.getAnalytics();
    if (!analyticsRecord) return undefined;
    
    // Increment total users and update last updated timestamp
    const [updatedRecord] = await db
      .update(analytics)
      .set({ 
        totalUsers: analyticsRecord.totalUsers + 1,
        lastUpdated: new Date()
      })
      .where(eq(analytics.id, analyticsRecord.id))
      .returning();
    
    return updatedRecord;
  }

  async recordUserActivity(userId: number): Promise<Analytics | undefined> {
    try {
      // Get or create analytics record
      const analyticsRecord = await this.getAnalytics();
      if (!analyticsRecord) return undefined;
      
      // Update active users record
      let activeUsersData: Record<string, { lastActive: string, pageViews: number }> = {};
      
      // Parse existing active users if it exists
      if (analyticsRecord.activeUsers) {
        if (typeof analyticsRecord.activeUsers === 'string') {
          try {
            activeUsersData = JSON.parse(analyticsRecord.activeUsers as string);
          } catch (e) {
            console.error('Failed to parse activeUsers JSON:', e);
            activeUsersData = {};
          }
        } else if (typeof analyticsRecord.activeUsers === 'object') {
          activeUsersData = analyticsRecord.activeUsers as Record<string, { lastActive: string, pageViews: number }>;
        }
      }
      
      // Update or add user activity
      const userIdStr = userId.toString();
      const existingData = activeUsersData[userIdStr];
      activeUsersData[userIdStr] = {
        lastActive: new Date().toISOString(),
        pageViews: (existingData?.pageViews || 0) + 1
      };
      
      // Update record
      const [updatedRecord] = await db
        .update(analytics)
        .set({ 
          activeUsers: activeUsersData,
          lastUpdated: new Date()
        })
        .where(eq(analytics.id, analyticsRecord.id))
        .returning();
      
      return updatedRecord;
    } catch (error) {
      console.error('Error recording user activity:', error);
      return undefined;
    }
  }

  async incrementTotalDownloads(workflowId: number): Promise<Analytics | undefined> {
    try {
      // Get or create analytics record
      const analyticsRecord = await this.getAnalytics();
      if (!analyticsRecord) return undefined;
      
      // Update downloads per workflow
      let downloadsData: Record<number, number> = {};
      
      // Parse existing downloads if it exists
      if (analyticsRecord.downloadsPerWorkflow) {
        if (typeof analyticsRecord.downloadsPerWorkflow === 'string') {
          try {
            downloadsData = JSON.parse(analyticsRecord.downloadsPerWorkflow as string);
          } catch (e) {
            console.error('Failed to parse downloadsPerWorkflow JSON:', e);
            downloadsData = {};
          }
        } else if (typeof analyticsRecord.downloadsPerWorkflow === 'object') {
          downloadsData = analyticsRecord.downloadsPerWorkflow as Record<number, number>;
        }
      }
      
      // Update download count
      const workflowIdStr = workflowId.toString();
      const currentCount = downloadsData[workflowIdStr] || 0;
      downloadsData[workflowIdStr] = currentCount + 1;
      
      console.log(`Recording download for workflow ${workflowId}, new count: ${downloadsData[workflowIdStr]}`);
      
      // Update record
      const [updatedRecord] = await db
        .update(analytics)
        .set({ 
          totalDownloads: analyticsRecord.totalDownloads + 1,
          downloadsPerWorkflow: downloadsData,
          lastUpdated: new Date()
        })
        .where(eq(analytics.id, analyticsRecord.id))
        .returning();
      
      return updatedRecord;
    } catch (error) {
      console.error('Error incrementing total downloads:', error);
      return undefined;
    }
  }

  async getActiveUsers(): Promise<{ userId: number, lastActive: string, pageViews: number }[]> {
    try {
      const analyticsRecord = await this.getAnalytics();
      if (!analyticsRecord) return [];
      
      let activeUsersData: Record<string, { lastActive: string, pageViews: number }> = {};
      
      // Parse existing active users if it exists
      if (analyticsRecord.activeUsers) {
        if (typeof analyticsRecord.activeUsers === 'string') {
          try {
            activeUsersData = JSON.parse(analyticsRecord.activeUsers as string);
          } catch (e) {
            console.error('Failed to parse activeUsers JSON:', e);
            return [];
          }
        } else if (typeof analyticsRecord.activeUsers === 'object') {
          activeUsersData = analyticsRecord.activeUsers as Record<string, { lastActive: string, pageViews: number }>;
        }
      }
      
      // Convert object to array
      return Object.entries(activeUsersData)
        .filter(([_, data]) => data && data.lastActive) // Filter out null/undefined entries
        .map(([userId, data]) => ({
          userId: parseInt(userId),
          lastActive: data.lastActive,
          pageViews: data.pageViews || 0
        }));
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  }

  async getDownloadsPerWorkflow(): Promise<{ workflowId: number, downloads: number }[]> {
    try {
      const analyticsRecord = await this.getAnalytics();
      if (!analyticsRecord) return [];
      
      let downloadsData: Record<string, number> = {};
      
      // Parse existing downloads if it exists
      if (analyticsRecord.downloadsPerWorkflow) {
        if (typeof analyticsRecord.downloadsPerWorkflow === 'string') {
          try {
            downloadsData = JSON.parse(analyticsRecord.downloadsPerWorkflow as string);
          } catch (e) {
            console.error('Failed to parse downloadsPerWorkflow JSON:', e);
            return [];
          }
        } else if (typeof analyticsRecord.downloadsPerWorkflow === 'object') {
          downloadsData = analyticsRecord.downloadsPerWorkflow as Record<string, number>;
        }
      }
      
      // Convert object to array
      return Object.entries(downloadsData)
        .filter(([_, count]) => count) // Filter out zero or undefined counts
        .map(([workflowId, downloads]) => ({
          workflowId: parseInt(workflowId),
          downloads: downloads || 0
        }));
    } catch (error) {
      console.error('Error getting downloads per workflow:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();