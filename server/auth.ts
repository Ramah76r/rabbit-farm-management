import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "rabbit-farm-secret-key";

export const generateToken = (userId: number): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

export const authenticateUser = async (username: string, password: string) => {
  const user = await storage.getUserByUsername(username);
  
  if (!user) {
    return null;
  }
  
  // In a real app, you would hash and compare passwords
  if (user.password !== password) {
    return null;
  }
  
  // Update last login
  await storage.updateUser(user.id, { lastLogin: new Date() });
  
  return user;
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ message: "User account is inactive" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    next();
  };
};

// Extending Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: import("@shared/schema").User;
    }
  }
}
