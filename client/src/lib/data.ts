import { STORAGE_KEYS } from '@/utils/constants';
import {
  User, Rabbit, BreedingRecord, HealthRecord,
  FeedInventory, FeedConsumption, Activity, Task
} from '@shared/schema';

// Load data from localStorage
export const loadData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error loading data for ${key}:`, error);
    return [];
  }
};

// Save data to localStorage
export const saveData = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving data for ${key}:`, error);
  }
};

// Generate a unique ID for new items
export const generateId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

// Data access functions

// Rabbits
export const getRabbits = (): Rabbit[] => {
  return loadData<Rabbit>(STORAGE_KEYS.RABBITS);
};

export const getRabbitById = (id: number): Rabbit | undefined => {
  const rabbits = getRabbits();
  return rabbits.find(rabbit => rabbit.id === id);
};

export const getRabbitByTagId = (tagId: string): Rabbit | undefined => {
  const rabbits = getRabbits();
  return rabbits.find(rabbit => rabbit.tagId === tagId);
};

export const addRabbit = (rabbit: Omit<Rabbit, 'id' | 'createdAt'>): Rabbit => {
  const rabbits = getRabbits();
  const newRabbit: Rabbit = {
    ...rabbit,
    id: generateId(),
    createdAt: new Date()
  };
  
  saveData(STORAGE_KEYS.RABBITS, [...rabbits, newRabbit]);
  return newRabbit;
};

export const updateRabbit = (id: number, data: Partial<Rabbit>): Rabbit | undefined => {
  const rabbits = getRabbits();
  const index = rabbits.findIndex(rabbit => rabbit.id === id);
  
  if (index === -1) return undefined;
  
  const updatedRabbit = { ...rabbits[index], ...data };
  rabbits[index] = updatedRabbit;
  
  saveData(STORAGE_KEYS.RABBITS, rabbits);
  return updatedRabbit;
};

// Breeding Records
export const getBreedingRecords = (): BreedingRecord[] => {
  return loadData<BreedingRecord>(STORAGE_KEYS.BREEDING_RECORDS);
};

export const getBreedingRecordById = (id: number): BreedingRecord | undefined => {
  const records = getBreedingRecords();
  return records.find(record => record.id === id);
};

export const addBreedingRecord = (record: Omit<BreedingRecord, 'id' | 'createdAt'>): BreedingRecord => {
  const records = getBreedingRecords();
  const newRecord: BreedingRecord = {
    ...record,
    id: generateId(),
    createdAt: new Date()
  };
  
  saveData(STORAGE_KEYS.BREEDING_RECORDS, [...records, newRecord]);
  return newRecord;
};

export const updateBreedingRecord = (id: number, data: Partial<BreedingRecord>): BreedingRecord | undefined => {
  const records = getBreedingRecords();
  const index = records.findIndex(record => record.id === id);
  
  if (index === -1) return undefined;
  
  const updatedRecord = { ...records[index], ...data };
  records[index] = updatedRecord;
  
  saveData(STORAGE_KEYS.BREEDING_RECORDS, records);
  return updatedRecord;
};

// Health Records
export const getHealthRecords = (): HealthRecord[] => {
  return loadData<HealthRecord>(STORAGE_KEYS.HEALTH_RECORDS);
};

export const getHealthRecordById = (id: number): HealthRecord | undefined => {
  const records = getHealthRecords();
  return records.find(record => record.id === id);
};

export const getHealthRecordsByRabbitId = (rabbitId: string): HealthRecord[] => {
  const records = getHealthRecords();
  return records.filter(record => record.rabbitId === rabbitId);
};

export const addHealthRecord = (record: Omit<HealthRecord, 'id' | 'createdAt'>): HealthRecord => {
  const records = getHealthRecords();
  const newRecord: HealthRecord = {
    ...record,
    id: generateId(),
    createdAt: new Date()
  };
  
  saveData(STORAGE_KEYS.HEALTH_RECORDS, [...records, newRecord]);
  return newRecord;
};

export const updateHealthRecord = (id: number, data: Partial<HealthRecord>): HealthRecord | undefined => {
  const records = getHealthRecords();
  const index = records.findIndex(record => record.id === id);
  
  if (index === -1) return undefined;
  
  const updatedRecord = { ...records[index], ...data };
  records[index] = updatedRecord;
  
  saveData(STORAGE_KEYS.HEALTH_RECORDS, records);
  return updatedRecord;
};

// Feed Inventory
export const getFeedInventory = (): FeedInventory[] => {
  return loadData<FeedInventory>(STORAGE_KEYS.FEED_INVENTORY);
};

export const getFeedInventoryById = (id: number): FeedInventory | undefined => {
  const inventory = getFeedInventory();
  return inventory.find(item => item.id === id);
};

export const addFeedInventory = (item: Omit<FeedInventory, 'id' | 'createdAt'>): FeedInventory => {
  const inventory = getFeedInventory();
  const newItem: FeedInventory = {
    ...item,
    id: generateId(),
    createdAt: new Date()
  };
  
  saveData(STORAGE_KEYS.FEED_INVENTORY, [...inventory, newItem]);
  return newItem;
};

export const updateFeedInventory = (id: number, data: Partial<FeedInventory>): FeedInventory | undefined => {
  const inventory = getFeedInventory();
  const index = inventory.findIndex(item => item.id === id);
  
  if (index === -1) return undefined;
  
  const updatedItem = { ...inventory[index], ...data };
  inventory[index] = updatedItem;
  
  saveData(STORAGE_KEYS.FEED_INVENTORY, inventory);
  return updatedItem;
};

// Feed Consumption
export const getFeedConsumption = (): FeedConsumption[] => {
  return loadData<FeedConsumption>(STORAGE_KEYS.FEED_CONSUMPTION);
};

export const addFeedConsumption = (item: Omit<FeedConsumption, 'id' | 'createdAt'>): FeedConsumption => {
  const consumption = getFeedConsumption();
  const newItem: FeedConsumption = {
    ...item,
    id: generateId(),
    createdAt: new Date()
  };
  
  saveData(STORAGE_KEYS.FEED_CONSUMPTION, [...consumption, newItem]);
  return newItem;
};

// Tasks
export const getTasks = (): Task[] => {
  return loadData<Task>(STORAGE_KEYS.TASKS);
};

export const getTaskById = (id: number): Task | undefined => {
  const tasks = getTasks();
  return tasks.find(task => task.id === id);
};

export const getTasksByAssignee = (userId: number): Task[] => {
  const tasks = getTasks();
  return tasks.filter(task => task.assignedTo === userId);
};

export const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>): Task => {
  const tasks = getTasks();
  const newTask: Task = {
    ...task,
    id: generateId(),
    createdAt: new Date(),
    completedAt: undefined
  };
  
  saveData(STORAGE_KEYS.TASKS, [...tasks, newTask]);
  return newTask;
};

export const updateTask = (id: number, data: Partial<Task>): Task | undefined => {
  const tasks = getTasks();
  const index = tasks.findIndex(task => task.id === id);
  
  if (index === -1) return undefined;
  
  // If status is changed to completed, set completedAt
  let updatedData = { ...data };
  if (data.status === 'completed' && tasks[index].status !== 'completed') {
    updatedData.completedAt = new Date();
  }
  
  const updatedTask = { ...tasks[index], ...updatedData };
  tasks[index] = updatedTask;
  
  saveData(STORAGE_KEYS.TASKS, tasks);
  return updatedTask;
};

// Activities
export const getActivities = (): Activity[] => {
  return loadData<Activity>(STORAGE_KEYS.ACTIVITIES);
};

export const getRecentActivities = (limit: number = 10): Activity[] => {
  const activities = getActivities();
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

export const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>): Activity => {
  const activities = getActivities();
  const newActivity: Activity = {
    ...activity,
    id: generateId(),
    timestamp: new Date()
  };
  
  saveData(STORAGE_KEYS.ACTIVITIES, [...activities, newActivity]);
  return newActivity;
};

// Users
export const getUsers = (): User[] => {
  return loadData<User>(STORAGE_KEYS.USERS);
};

export const getUserById = (id: number): User | undefined => {
  const users = getUsers();
  return users.find(user => user.id === id);
};

export const getUserByUsername = (username: string): User | undefined => {
  const users = getUsers();
  return users.find(user => user.username === username);
};

export const addUser = (user: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): User => {
  const users = getUsers();
  const newUser: User = {
    ...user,
    id: generateId(),
    createdAt: new Date(),
    lastLogin: undefined
  };
  
  saveData(STORAGE_KEYS.USERS, [...users, newUser]);
  return newUser;
};

export const updateUser = (id: number, data: Partial<User>): User | undefined => {
  const users = getUsers();
  const index = users.findIndex(user => user.id === id);
  
  if (index === -1) return undefined;
  
  const updatedUser = { ...users[index], ...data };
  users[index] = updatedUser;
  
  saveData(STORAGE_KEYS.USERS, users);
  return updatedUser;
};

// Initialize default data if not exists
export const initializeDefaultData = () => {
  // Check if users exist
  const users = getUsers();
  
  if (users.length === 0) {
    // Add default admin user
    addUser({
      username: 'admin',
      password: 'admin123', // In a real app, this would be hashed
      fullName: 'مدير النظام',
      role: 'admin',
      isActive: true,
      assignedRabbits: []
    });
  }
};
