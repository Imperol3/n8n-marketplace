import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define access tiers table
export const accessTiers = pgTable("access_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  level: serial("level").notNull(), // Higher number means higher access
  active: text("active").notNull().default("true"),
});

// Add API tokens table
export const apiTokens = pgTable("api_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: serial("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "user", "viewer"] }).notNull().default("viewer"),
  preferences: jsonb("preferences").$type<{
    interests: string[];
    tier: string;
  }>().notNull().default({
    interests: [],
    tier: "free"
  }),
});

// Define workflow status as a type
export type WorkflowStatus = "draft" | "in_progress" | "needs_edit" | "published";

// Common workflow categories
export const WORKFLOW_CATEGORIES = [
  "Sales",
  "Marketing",
  "AI Agents",
  "Productivity",
  "Lead Generation",
  "Email Management",
  "SEO",
  "Social Media",
  "Analytics",
  "Customer Service",
] as const;

export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  filePath: text("file_path").notNull(),
  featuredImage: text("featured_image").notNull(),
  extraImages: text("extra_images").array(),
  videoUrl: text("video_url"),
  status: text("status", {
    enum: ["draft", "in_progress", "needs_edit", "published"]
  }).notNull().default("draft"),
  metadata: jsonb("metadata").$type<{
    categories: string[];
    tags: string[];
    previewUrl?: string;
    requiredTier: string;
  }>().notNull().default({
    categories: [],
    tags: [],
    requiredTier: "free"
  }),
});

// Add insert schemas
export const insertTierSchema = createInsertSchema(accessTiers);
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  preferences: true,
  email: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).pick({
  title: true,
  description: true,
  filePath: true,
  featuredImage: true,
  extraImages: true,
  videoUrl: true,
  status: true,
  metadata: true,
});

// Export types
export type InsertTier = z.infer<typeof insertTierSchema>;
export type Tier = typeof accessTiers.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;
export type ApiToken = typeof apiTokens.$inferSelect;
export const insertApiTokenSchema = createInsertSchema(apiTokens);
export type InsertApiToken = z.infer<typeof insertApiTokenSchema>;