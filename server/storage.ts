import { 
  users, type User, type InsertUser,
  rabbits, type Rabbit, type InsertRabbit,
  breedingRecords, type BreedingRecord, type InsertBreedingRecord,
  healthRecords, type HealthRecord, type InsertHealthRecord,
  feedInventory, type FeedInventory, type InsertFeedInventory,
  feedConsumption, type FeedConsumption, type InsertFeedConsumption,
  activities, type Activity, type InsertActivity,
  tasks, type Task, type InsertTask
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Rabbit operations
  getRabbit(id: number): Promise<Rabbit | undefined>;
  getRabbitByTagId(tagId: string): Promise<Rabbit | undefined>;
  createRabbit(rabbit: InsertRabbit): Promise<Rabbit>;
  updateRabbit(id: number, rabbitData: Partial<InsertRabbit>): Promise<Rabbit | undefined>;
  getAllRabbits(): Promise<Rabbit[]>;
  
  // Breeding operations
  getBreedingRecord(id: number): Promise<BreedingRecord | undefined>;
  createBreedingRecord(record: InsertBreedingRecord): Promise<BreedingRecord>;
  updateBreedingRecord(id: number, recordData: Partial<InsertBreedingRecord>): Promise<BreedingRecord | undefined>;
  getAllBreedingRecords(): Promise<BreedingRecord[]>;
  
  // Health operations
  getHealthRecord(id: number): Promise<HealthRecord | undefined>;
  createHealthRecord(record: InsertHealthRecord): Promise<HealthRecord>;
  updateHealthRecord(id: number, recordData: Partial<InsertHealthRecord>): Promise<HealthRecord | undefined>;
  getAllHealthRecords(): Promise<HealthRecord[]>;
  getHealthRecordsByRabbitId(rabbitId: string): Promise<HealthRecord[]>;
  
  // Feed inventory operations
  getFeedInventory(id: number): Promise<FeedInventory | undefined>;
  createFeedInventory(inventory: InsertFeedInventory): Promise<FeedInventory>;
  updateFeedInventory(id: number, inventoryData: Partial<InsertFeedInventory>): Promise<FeedInventory | undefined>;
  getAllFeedInventory(): Promise<FeedInventory[]>;
  
  // Feed consumption operations
  getFeedConsumption(id: number): Promise<FeedConsumption | undefined>;
  createFeedConsumption(consumption: InsertFeedConsumption): Promise<FeedConsumption>;
  getAllFeedConsumption(): Promise<FeedConsumption[]>;
  
  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(limit: number): Promise<Activity[]>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  getTasksByAssignee(userId: number): Promise<Task[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rabbits: Map<number, Rabbit>;
  private breedingRecords: Map<number, BreedingRecord>;
  private healthRecords: Map<number, HealthRecord>;
  private feedInventory: Map<number, FeedInventory>;
  private feedConsumption: Map<number, FeedConsumption>;
  private activities: Map<number, Activity>;
  private tasks: Map<number, Task>;
  
  private userIdCounter: number;
  private rabbitIdCounter: number;
  private breedingIdCounter: number;
  private healthIdCounter: number;
  private feedInventoryIdCounter: number;
  private feedConsumptionIdCounter: number;
  private activityIdCounter: number;
  private taskIdCounter: number;

  constructor() {
    this.users = new Map();
    this.rabbits = new Map();
    this.breedingRecords = new Map();
    this.healthRecords = new Map();
    this.feedInventory = new Map();
    this.feedConsumption = new Map();
    this.activities = new Map();
    this.tasks = new Map();
    
    this.userIdCounter = 1;
    this.rabbitIdCounter = 1;
    this.breedingIdCounter = 1;
    this.healthIdCounter = 1;
    this.feedInventoryIdCounter = 1;
    this.feedConsumptionIdCounter = 1;
    this.activityIdCounter = 1;
    this.taskIdCounter = 1;
    
    // Initialize with admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      fullName: "مدير النظام",
      role: "admin",
      isActive: true,
      assignedRabbits: []
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...userData, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Rabbit operations
  async getRabbit(id: number): Promise<Rabbit | undefined> {
    return this.rabbits.get(id);
  }

  async getRabbitByTagId(tagId: string): Promise<Rabbit | undefined> {
    return Array.from(this.rabbits.values()).find(
      (rabbit) => rabbit.tagId === tagId,
    );
  }

  async createRabbit(rabbitData: InsertRabbit): Promise<Rabbit> {
    const id = this.rabbitIdCounter++;
    const rabbit: Rabbit = { ...rabbitData, id, createdAt: new Date() };
    this.rabbits.set(id, rabbit);
    return rabbit;
  }

  async updateRabbit(id: number, rabbitData: Partial<InsertRabbit>): Promise<Rabbit | undefined> {
    const rabbit = this.rabbits.get(id);
    if (!rabbit) return undefined;
    
    const updatedRabbit: Rabbit = { ...rabbit, ...rabbitData };
    this.rabbits.set(id, updatedRabbit);
    return updatedRabbit;
  }

  async getAllRabbits(): Promise<Rabbit[]> {
    return Array.from(this.rabbits.values());
  }
  
  // Breeding operations
  async getBreedingRecord(id: number): Promise<BreedingRecord | undefined> {
    return this.breedingRecords.get(id);
  }

  async createBreedingRecord(recordData: InsertBreedingRecord): Promise<BreedingRecord> {
    const id = this.breedingIdCounter++;
    const record: BreedingRecord = { ...recordData, id, createdAt: new Date() };
    this.breedingRecords.set(id, record);
    return record;
  }

  async updateBreedingRecord(id: number, recordData: Partial<InsertBreedingRecord>): Promise<BreedingRecord | undefined> {
    const record = this.breedingRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord: BreedingRecord = { ...record, ...recordData };
    this.breedingRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async getAllBreedingRecords(): Promise<BreedingRecord[]> {
    return Array.from(this.breedingRecords.values());
  }
  
  // Health operations
  async getHealthRecord(id: number): Promise<HealthRecord | undefined> {
    return this.healthRecords.get(id);
  }

  async createHealthRecord(recordData: InsertHealthRecord): Promise<HealthRecord> {
    const id = this.healthIdCounter++;
    const record: HealthRecord = { ...recordData, id, createdAt: new Date() };
    this.healthRecords.set(id, record);
    return record;
  }

  async updateHealthRecord(id: number, recordData: Partial<InsertHealthRecord>): Promise<HealthRecord | undefined> {
    const record = this.healthRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord: HealthRecord = { ...record, ...recordData };
    this.healthRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async getAllHealthRecords(): Promise<HealthRecord[]> {
    return Array.from(this.healthRecords.values());
  }

  async getHealthRecordsByRabbitId(rabbitId: string): Promise<HealthRecord[]> {
    return Array.from(this.healthRecords.values()).filter(
      (record) => record.rabbitId === rabbitId,
    );
  }
  
  // Feed inventory operations
  async getFeedInventory(id: number): Promise<FeedInventory | undefined> {
    return this.feedInventory.get(id);
  }

  async createFeedInventory(inventoryData: InsertFeedInventory): Promise<FeedInventory> {
    const id = this.feedInventoryIdCounter++;
    const inventory: FeedInventory = { ...inventoryData, id, createdAt: new Date() };
    this.feedInventory.set(id, inventory);
    return inventory;
  }

  async updateFeedInventory(id: number, inventoryData: Partial<InsertFeedInventory>): Promise<FeedInventory | undefined> {
    const inventory = this.feedInventory.get(id);
    if (!inventory) return undefined;
    
    const updatedInventory: FeedInventory = { ...inventory, ...inventoryData };
    this.feedInventory.set(id, updatedInventory);
    return updatedInventory;
  }

  async getAllFeedInventory(): Promise<FeedInventory[]> {
    return Array.from(this.feedInventory.values());
  }
  
  // Feed consumption operations
  async getFeedConsumption(id: number): Promise<FeedConsumption | undefined> {
    return this.feedConsumption.get(id);
  }

  async createFeedConsumption(consumptionData: InsertFeedConsumption): Promise<FeedConsumption> {
    const id = this.feedConsumptionIdCounter++;
    const consumption: FeedConsumption = { ...consumptionData, id, createdAt: new Date() };
    this.feedConsumption.set(id, consumption);
    return consumption;
  }

  async getAllFeedConsumption(): Promise<FeedConsumption[]> {
    return Array.from(this.feedConsumption.values());
  }
  
  // Activity operations
  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const activity: Activity = { ...activityData, id, timestamp: new Date() };
    this.activities.set(id, activity);
    return activity;
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const task: Task = { ...taskData, id, createdAt: new Date() };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask: Task = { ...task, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByAssignee(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.assignedTo === userId,
    );
  }
}

export const storage = new MemStorage();
