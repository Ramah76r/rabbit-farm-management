import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("worker"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  assignedRabbits: jsonb("assigned_rabbits").default([]),
});

export const rabbits = pgTable("rabbits", {
  id: serial("id").primaryKey(),
  tagId: text("tag_id").notNull().unique(),
  breed: text("breed").notNull(),
  gender: text("gender").notNull(),
  birthDate: timestamp("birth_date"),
  acquiredDate: timestamp("acquired_date").notNull(),
  status: text("status").notNull().default("active"),
  weight: integer("weight"), // in grams
  cageNumber: text("cage_number"),
  parentMaleId: text("parent_male_id"),
  parentFemaleId: text("parent_female_id"),
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  healthStatus: text("health_status").default("healthy"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const breedingRecords = pgTable("breeding_records", {
  id: serial("id").primaryKey(),
  maleId: text("male_id").notNull(),
  femaleId: text("female_id").notNull(),
  matingDate: timestamp("mating_date").notNull(),
  expectedBirthDate: timestamp("expected_birth_date"),
  actualBirthDate: timestamp("actual_birth_date"),
  status: text("status").notNull().default("pending"),
  litterSize: integer("litter_size"),
  litterAlive: integer("litter_alive"),
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const healthRecords = pgTable("health_records", {
  id: serial("id").primaryKey(),
  rabbitId: text("rabbit_id").notNull(),
  recordDate: timestamp("record_date").notNull(),
  recordType: text("record_type").notNull(), // vaccination, medication, checkup, etc.
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedInventory = pgTable("feed_inventory", {
  id: serial("id").primaryKey(),
  feedType: text("feed_type").notNull(),
  quantity: integer("quantity").notNull(), // in grams or units
  acquired: timestamp("acquired").notNull(),
  expirationDate: timestamp("expiration_date"),
  supplierInfo: text("supplier_info"),
  cost: integer("cost"), // in cents
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedConsumption = pgTable("feed_consumption", {
  id: serial("id").primaryKey(),
  feedId: integer("feed_id").notNull(),
  quantity: integer("quantity").notNull(), // in grams or units
  consumptionDate: timestamp("consumption_date").notNull(),
  groupId: text("group_id"), // cage or group identifier
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activityType: text("activity_type").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  relatedEntityType: text("related_entity_type"), // rabbit, breeding, health, feed
  relatedEntityId: text("related_entity_id"),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"),
  assignedTo: integer("assigned_to"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const insertRabbitSchema = createInsertSchema(rabbits).omit({
  id: true,
  createdAt: true,
});

export const insertBreedingRecordSchema = createInsertSchema(breedingRecords).omit({
  id: true,
  createdAt: true,
});

export const insertHealthRecordSchema = createInsertSchema(healthRecords).omit({
  id: true,
  createdAt: true,
});

export const insertFeedInventorySchema = createInsertSchema(feedInventory).omit({
  id: true,
  createdAt: true,
});

export const insertFeedConsumptionSchema = createInsertSchema(feedConsumption).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Rabbit = typeof rabbits.$inferSelect;
export type InsertRabbit = z.infer<typeof insertRabbitSchema>;

export type BreedingRecord = typeof breedingRecords.$inferSelect;
export type InsertBreedingRecord = z.infer<typeof insertBreedingRecordSchema>;

export type HealthRecord = typeof healthRecords.$inferSelect;
export type InsertHealthRecord = z.infer<typeof insertHealthRecordSchema>;

export type FeedInventory = typeof feedInventory.$inferSelect;
export type InsertFeedInventory = z.infer<typeof insertFeedInventorySchema>;

export type FeedConsumption = typeof feedConsumption.$inferSelect;
export type InsertFeedConsumption = z.infer<typeof insertFeedConsumptionSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
