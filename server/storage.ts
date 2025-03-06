import { User, InsertUser, Workflow, InsertWorkflow } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, workflows } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>; // Add this line
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Workflow operations
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;

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
    const [user] = await db.insert(users).values({
      ...insertUser,
      preferences: {
        interests: [],
        tier: "free"
      }
    }).returning();
    return user;
  }

  // Add getUsers implementation
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Add updateUser implementation
  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(update)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Add deleteUser implementation
  async deleteUser(id: number): Promise<boolean> {
    const [user] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return !!user;
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
}

export const storage = new DatabaseStorage();