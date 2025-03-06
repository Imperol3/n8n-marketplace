import { pgTable, text, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "user", "viewer"] }).notNull().default("viewer"),
});

export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  filePath: text("file_path").notNull(),
  metadata: jsonb("metadata").$type<{
    category: string;
    tags: string[];
    previewUrl?: string;
  }>().notNull().default({
    category: '',
    tags: [],
    previewUrl: null
  }),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).pick({
  title: true,
  description: true,
  filePath: true,
  metadata: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;