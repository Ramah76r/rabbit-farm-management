import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticate, authenticateUser, generateToken, requireRole } from "./auth";
import { 
  insertUserSchema, 
  insertRabbitSchema, 
  insertBreedingRecordSchema,
  insertHealthRecordSchema,
  insertFeedInventorySchema,
  insertFeedConsumptionSchema,
  insertTaskSchema,
  insertActivitySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication routes
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    try {
      const user = await authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = generateToken(user.id);
      
      // Create activity
      await storage.createActivity({
        userId: user.id,
        activityType: "login",
        description: `${user.fullName} logged in`,
        relatedEntityType: "user",
        relatedEntityId: user.id.toString(),
      });
      
      return res.status(200).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // User routes
  app.get("/api/users", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(users.map(user => ({
        ...user,
        password: undefined // Don't send passwords
      })));
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/users", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid user data", errors: validation.error.errors });
      }
      
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(validation.data);
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        activityType: "create",
        description: `Created new user: ${user.fullName}`,
        relatedEntityType: "user",
        relatedEntityId: user.id.toString(),
      });
      
      return res.status(201).json({
        ...user,
        password: undefined
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/users/:id", authenticate, requireRole(["admin"]), async (req, res) => {
    const userId = parseInt(req.params.id);
    
    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        activityType: "update",
        description: `Updated user: ${updatedUser!.fullName}`,
        relatedEntityType: "user",
        relatedEntityId: updatedUser!.id.toString(),
      });
      
      return res.json({
        ...updatedUser,
        password: undefined
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Rabbit routes
  app.get("/api/rabbits", authenticate, async (req, res) => {
    try {
      const rabbits = await storage.getAllRabbits();
      
      // Filter for workers with assigned rabbits
      if (req.user!.role === "worker") {
        const assignedRabbits = req.user!.assignedRabbits as string[];
        return res.json(rabbits.filter(rabbit => 
          assignedRabbits.includes(rabbit.tagId)
        ));
      }
      
      return res.json(rabbits);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/rabbits", authenticate, async (req, res) => {
    try {
      const validation = insertRabbitSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid rabbit data", errors: validation.error.errors });
      }
      
      const existingRabbit = await storage.getRabbitByTagId(req.body.tagId);
      if (existingRabbit) {
        return res.status(400).json({ message: "Rabbit tag ID already exists" });
      }
      
      const rabbit = await storage.createRabbit({
        ...validation.data,
        createdBy: req.user!.id
      });
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        activityType: "create",
        description: `Added new rabbit: ${rabbit.tagId}`,
        relatedEntityType: "rabbit",
        relatedEntityId: rabbit.tagId,
      });
      
      return res.status(201).json(rabbit);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/rabbits/:id", authenticate, async (req, res) => {
    const rabbitId = parseInt(req.params.id);
    
    try {
      const rabbit = await storage.getRabbit(rabbitId);
      
      if (!rabbit) {
        return res.status(404).json({ message: "Rabbit not found" });
      }
      
      // Check permissions for workers
      if (req.user!.role === "worker") {
        const assignedRabbits = req.user!.assignedRabbits as string[];
        if (!assignedRabbits.includes(rabbit.tagId)) {
          return res.status(403).json({ message: "Not authorized to update this rabbit" });
        }
      }
      
      const updatedRabbit = await storage.updateRabbit(rabbitId, req.body);
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        activityType: "update",
        description: `Updated rabbit: ${updatedRabbit!.tagId}`,
        relatedEntityType: "rabbit",
        relatedEntityId: updatedRabbit!.tagId,
      });
      
      return res.json(updatedRabbit);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Breeding records routes
  app.get("/api/breeding-records", authenticate, async (req, res) => {
    try {
      const records = await storage.getAllBreedingRecords();
      
      // Filter for workers with assigned rabbits
      if (req.user!.role === "worker") {
        const assignedRabbits = req.user!.assignedRabbits as string[];
        return res.json(records.filter(record => 
          assignedRabbits.includes(record.maleId) || assignedRabbits.includes(record.femaleId)
        ));
      }
      
      return res.json(records);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/breeding-records", authenticate, async (req, res) => {
    try {
      const validation = insertBreedingRecordSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid breeding record data", errors: validation.error.errors });
      }
      
      // Check permissions for workers
      if (req.user!.role === "worker") {
        const assignedRabbits = req.user!.assignedRabbits as string[];
        if (!assignedRabbits.includes(req.body.maleId) || !assignedRabbits.includes(req.body.femaleId)) {
          return res.status(403).json({ message: "Not authorized to create breeding record for these rabbits" });
        }
      }
      
      const record = await storage.createBreedingRecord({
        ...validation.data,
        createdBy: req.user!.id
      });
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        activityType: "create",
        description: `Created breeding record for ${record.maleId} and ${record.femaleId}`,
        relatedEntityType: "breeding",
        relatedEntityId: record.id.toString(),
      });
      
      return res.status(201).json(record);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/breeding-records/:id", authenticate, async (req, res) => {
    const recordId = parseInt(req.params.id);
    
    try {
      const record = await storage.getBreedingRecord(recordId);
      
      if (!record) {
        return res.status(404).json({ message: "Breeding record not found" });
      }
      
      // Check permissions for workers
      if (req.user!.role === "worker") {
        const assignedRabbits = req.user!.assignedRabbits as string[];
        if (!assignedRabbits.includes(record.maleId) && !assignedRabbits.includes(record.femaleId)) {
          return res.status(403).json({ message: "Not authorized to update this breeding record" });
        }
      }
      
      const updatedRecord = await storage.updateBreedingRecord(recordId, req.body);
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        activityType: "update",
        description: `Updated breeding record for ${updatedRecord!.maleId} and ${updatedRecord!.femaleId}`,
        relatedEntityType: "breeding",
        relatedEntityId: updatedRecord!.id.toString(),
      });
      
      return res.json(updatedRecord);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Health records routes
  app.get("/api/health-records", authenticate, async (req, res) => {
    try {
      const records = await storage.getAllHealthRecords();
      
      // Filter for workers with assigned rabbits
      if (req.user!.role === "worker") {
        const assignedRabbits = req.user!.assignedRabbits as string[];
        return res.json(records.filter(record => 
          assignedRabbits.includes(record.rabbitId)
        ));
      }
      
      return res.json(records);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/rabbits/:tagId/health-records", authenticate, async (req, res) => {
    const tagId = req.params.tagId;
    
    try {
      const rabbit = await storage.getRabbitByTagId(tagId);
      
      if (!rabbit) {
        return res.status(404).json({ message: "Rabbit not found" });
      }
      
      // Check permissions for workers
      if (req.user!.role === "worker") {
        const assignedRabbits = req.user!.assignedRabbits as string[];
        if (!assignedRabbits.includes(rabbit.tagId)) {
          return res.status(403).json({ message: "Not authorized to view health records for this rabbit" });
        }
      }
      
      const records = await storage.getHealthRecordsByRabbitId(tagId);
      return res.json(records);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/health-records", authenticate, async (req, res) => {
    try {
      const validation = insertHealthRecordSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid health record data", errors: validation.error.errors });
      }
      
      // Check permissions for workers
      if (req.user!.role === "worker") {
        const assignedRabbits = req.user!.assignedRabbits as string[];
        if (!assignedRabbits.includes(req.body.rabbitId)) {
          return res.status(403).json({ message: "Not authorized to create health record for this rabbit" });
        }
      }
      
      const record = await storage.createHealthRecord({
        ...validation.data,
        createdBy: req.user!.id
      });
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        activityType: "create",
        description: `Created health record for rabbit ${record.rabbitId}`,
        relatedEntityType: "health",
        relatedEntityId: record.id.toString(),
      });
      
      return res.status(201).json(record);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Feed inventory routes
  app.get("/api/feed-inventory", authenticate, async (req, res) => {
    try {
      const inventory = await storage.getAllFeedInventory();
      return res.json(inventory);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/feed-inventory", authenticate, requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const validation = insertFeedInventorySchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid feed inventory data", errors: validation.error.errors });
      }
      
      const inventory = await storage.createFeedInventory({
        ...validation.data,
        createdBy: req.user!.id
      });
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        activityType: "create",
        description: `Added ${inventory.quantity} units of ${inventory.feedType} feed`,
        relatedEntityType: "feed",
        relatedEntityId: inventory.id.toString(),
      });
      
      return res.status(201).json(inventory);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/feed-consumption", authenticate, async (req, res) => {
    try {
      const validation = insertFeedConsumptionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid feed consumption data", errors: validation.error.errors });
      }
      
      const feedInventory = await storage.getFeedInventory(req.body.feedId);
      
      if (!feedInventory) {
        return res.status(404).json({ message: "Feed inventory not found" });
      }
      
      if (feedInventory.quantity < req.body.quantity) {
        return res.status(400).json({ message: "Insufficient feed quantity" });
      }
      
      // Update inventory
      await storage.updateFeedInventory(feedInventory.id, {
        quantity: feedInventory.quantity - req.body.quantity
      });
      
      const consumption = await storage.createFeedConsumption({
        ...validation.data,
        createdBy: req.user!.id
      });
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        activityType: "create",
        description: `Used ${consumption.quantity} units of feed (ID: ${consumption.feedId})`,
        relatedEntityType: "feed",
        relatedEntityId: consumption.id.toString(),
      });
      
      return res.status(201).json(consumption);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Task routes
  app.get("/api/tasks", authenticate, async (req, res) => {
    try {
      // For workers, only show tasks assigned to them
      if (req.user!.role === "worker") {
        const tasks = await storage.getTasksByAssignee(req.user!.id);
        return res.json(tasks);
      }
      
      const tasks = await storage.getAllTasks();
      return res.json(tasks);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/tasks", authenticate, requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const validation = insertTaskSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid task data", errors: validation.error.errors });
      }
      
      const task = await storage.createTask({
        ...validation.data,
        createdBy: req.user!.id
      });
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        activityType: "create",
        description: `Created task: ${task.title}`,
        relatedEntityType: "task",
        relatedEntityId: task.id.toString(),
      });
      
      return res.status(201).json(task);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/tasks/:id", authenticate, async (req, res) => {
    const taskId = parseInt(req.params.id);
    
    try {
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Workers can only update status of their assigned tasks
      if (req.user!.role === "worker") {
        if (task.assignedTo !== req.user!.id) {
          return res.status(403).json({ message: "Not authorized to update this task" });
        }
        
        // Workers can only update status
        const updatedTask = await storage.updateTask(taskId, {
          status: req.body.status,
          completedAt: req.body.status === "completed" ? new Date() : undefined
        });
        
        // Create activity
        await storage.createActivity({
          userId: req.user!.id,
          activityType: "update",
          description: `Updated task status: ${updatedTask!.title} - ${updatedTask!.status}`,
          relatedEntityType: "task",
          relatedEntityId: updatedTask!.id.toString(),
        });
        
        return res.json(updatedTask);
      }
      
      // Admin/manager can update all fields
      const updatedTask = await storage.updateTask(taskId, req.body);
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        activityType: "update",
        description: `Updated task: ${updatedTask!.title}`,
        relatedEntityType: "task",
        relatedEntityId: updatedTask!.id.toString(),
      });
      
      return res.json(updatedTask);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Activities routes
  app.get("/api/activities", authenticate, requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivities(limit);
      return res.json(activities);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Dashboard statistics
  app.get("/api/dashboard/stats", authenticate, async (req, res) => {
    try {
      const rabbits = await storage.getAllRabbits();
      const breedingRecords = await storage.getAllBreedingRecords();
      const healthRecords = await storage.getAllHealthRecords();
      const feedInventory = await storage.getAllFeedInventory();
      
      // Basic statistics
      const stats = {
        totalRabbits: rabbits.length,
        activeBreeding: breedingRecords.filter(r => r.status === "pending").length,
        activeMedical: rabbits.filter(r => r.healthStatus !== "healthy").length,
        feedStock: feedInventory.reduce((sum, item) => sum + item.quantity, 0) / 1000, // Convert to kg
        
        // Age distribution
        ageDistribution: {
          young: 0, // 0-3 months
          adult: 0, // 3-12 months
          senior: 0 // >12 months
        },
        
        // Breed distribution
        breedDistribution: {} as Record<string, number>,
        
        // Quick stats
        birthRate: 0,
        averageLitterSize: 0,
        mortalityRate: 0,
        rabbitsForSale: rabbits.filter(r => r.status === "for sale").length,
        availableCages: 0 // This would need to be calculated from a cages table
      };
      
      // Calculate age distribution
      const now = new Date();
      rabbits.forEach(rabbit => {
        if (!rabbit.birthDate) return;
        
        const ageInMonths = (now.getTime() - new Date(rabbit.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
        
        if (ageInMonths <= 3) {
          stats.ageDistribution.young++;
        } else if (ageInMonths <= 12) {
          stats.ageDistribution.adult++;
        } else {
          stats.ageDistribution.senior++;
        }
        
        // Breed distribution
        if (!stats.breedDistribution[rabbit.breed]) {
          stats.breedDistribution[rabbit.breed] = 0;
        }
        stats.breedDistribution[rabbit.breed]++;
      });
      
      // Calculate birth rate and litter size
      const successfulBreedings = breedingRecords.filter(r => r.status === "success");
      stats.birthRate = successfulBreedings.length;
      stats.averageLitterSize = successfulBreedings.length > 0 
        ? successfulBreedings.reduce((sum, r) => sum + (r.litterSize || 0), 0) / successfulBreedings.length
        : 0;
      
      // Calculate mortality rate
      const totalBirths = successfulBreedings.reduce((sum, r) => sum + (r.litterSize || 0), 0);
      const totalSurvived = successfulBreedings.reduce((sum, r) => sum + (r.litterAlive || 0), 0);
      stats.mortalityRate = totalBirths > 0 ? 100 * (1 - (totalSurvived / totalBirths)) : 0;
      
      return res.json(stats);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}
