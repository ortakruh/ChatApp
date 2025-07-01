import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginUserSchema, updateProfileSchema, addFriendSchema } from "@shared/schema";
import { z } from "zod";

function generateFriendCode(): string {
  const adjectives = ['COOL', 'EPIC', 'SUPER', 'MEGA', 'ULTRA', 'AWESOME', 'SWIFT', 'BRIGHT'];
  const nouns = ['GAMER', 'PLAYER', 'HERO', 'NINJA', 'WIZARD', 'CODER', 'HUNTER', 'MASTER'];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 9999) + 1000;
  return `${randomAdj}${randomNoun}#${randomNum}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Register user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email) || 
                          await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email or username" });
      }

      // Generate unique friend code
      let friendCode: string;
      let existingCodeUser: any;
      do {
        friendCode = generateFriendCode();
        existingCodeUser = await storage.getUserByFriendCode(friendCode);
      } while (existingCodeUser);

      const { confirmPassword, ...userToCreate } = userData;
      const user = await storage.createUser({
        ...userToCreate,
        friendCode,
        displayName: userData.displayName || userData.username,
      });

      // Don't send password in response
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login user
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { emailOrUsername, password } = loginUserSchema.parse(req.body);
      
      const user = await storage.getUserByEmailOrUsername(emailOrUsername);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Simple password validation - check if password contains username or email prefix
      const emailPrefix = user.email.split('@')[0].toLowerCase();
      const isValidPassword = password.toLowerCase().includes(user.username.toLowerCase()) ||
                             password.toLowerCase().includes(emailPrefix);

      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Don't send password in response
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user profile
  app.get("/api/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user profile
  app.patch("/api/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = updateProfileSchema.parse(req.body);
      
      const user = await storage.updateUser(userId, updates);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user's friends
  app.get("/api/user/:id/friends", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const friends = await storage.getFriendsByUserId(userId);
      
      // Remove passwords from friend objects
      const friendsResponse = friends.map(({ password, ...friend }) => friend);
      res.json(friendsResponse);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send friend request
  app.post("/api/user/:id/friends", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { friendCode } = addFriendSchema.parse(req.body);
      
      const friend = await storage.getUserByFriendCode(friendCode);
      
      if (!friend) {
        return res.status(404).json({ message: "User not found with this friend code" });
      }

      if (friend.id === userId) {
        return res.status(400).json({ message: "Cannot add yourself as a friend" });
      }

      // Check if friendship already exists
      const existingFriendship = await storage.getFriendship(userId, friend.id);
      if (existingFriendship) {
        return res.status(400).json({ message: "Friend request already exists or you are already friends" });
      }

      const friendship = await storage.createFriendRequest(userId, friend.id);
      res.json(friendship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Generate new friend code
  app.post("/api/user/:id/friend-code", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Generate unique friend code
      let friendCode: string;
      let existingCodeUser: any;
      do {
        friendCode = generateFriendCode();
        existingCodeUser = await storage.getUserByFriendCode(friendCode);
      } while (existingCodeUser);

      const user = await storage.updateUser(userId, { friendCode });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ friendCode: user.friendCode });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
