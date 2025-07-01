import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, loginUserSchema, updateProfileSchema, addFriendSchema, sendMessageSchema, voiceCallSchema } from "@shared/schema";
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

      // Special password validation - password must match username or email prefix exactly
      const emailPrefix = user.email.split('@')[0].toLowerCase();
      const isValidPassword = password === user.password && (
        password.toLowerCase() === user.username.toLowerCase() ||
        password.toLowerCase() === emailPrefix
      );

      if (!isValidPassword) {
        return res.status(401).json({ message: "Password must match your name or email to continue" });
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
      
      // Clean up the friend code input (remove spaces, convert to uppercase)
      const cleanFriendCode = friendCode.trim().toUpperCase();
      
      const friend = await storage.getUserByFriendCode(cleanFriendCode);
      
      if (!friend) {
        return res.status(404).json({ message: "User not found with this friend code" });
      }

      if (friend.id === userId) {
        return res.status(400).json({ message: "Cannot add yourself as a friend" });
      }

      // Check if friendship already exists
      const existingFriendship = await storage.getFriendship(userId, friend.id);
      if (existingFriendship) {
        if (existingFriendship.status === 'pending') {
          return res.status(400).json({ message: "Friend request already sent" });
        } else if (existingFriendship.status === 'accepted') {
          return res.status(400).json({ message: "You are already friends" });
        }
      }

      const friendship = await storage.createFriendRequest(userId, friend.id);
      res.json({ ...friendship, friend });
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

  // Accept/Reject friend request
  app.patch("/api/user/:id/friends/:friendId", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const friendId = parseInt(req.params.friendId);
      const { status } = req.body;

      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'accepted' or 'rejected'" });
      }

      const success = await storage.updateFriendshipStatus(userId, friendId, status);
      
      if (!success) {
        return res.status(404).json({ message: "Friend request not found" });
      }

      res.json({ success: true, status });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get messages between two users
  app.get("/api/messages/:userId/:friendId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const friendId = parseInt(req.params.friendId);
      
      const messages = await storage.getMessagesBetweenUsers(userId, friendId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send a message
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = sendMessageSchema.parse(req.body);
      const senderId = (req as any).session.userId;
      
      if (!senderId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const message = await storage.sendMessage(senderId, messageData.receiverId, messageData.message);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Voice call operations
  app.post("/api/voice-call", async (req, res) => {
    try {
      const callData = voiceCallSchema.parse(req.body);
      const callerId = (req as any).session.userId;
      
      if (!callerId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (callData.action === 'start') {
        const voiceCall = await storage.createVoiceCall(callerId, callData.receiverId);
        res.json(voiceCall);
      } else {
        // For accept, reject, end actions, we need to find the existing call
        const activeCall = await storage.getActiveVoiceCall(callerId);
        if (!activeCall) {
          return res.status(404).json({ message: "No active call found" });
        }

        let newStatus;
        switch (callData.action) {
          case 'accept':
            newStatus = 'active';
            break;
          case 'reject':
          case 'end':
            newStatus = 'ended';
            break;
          default:
            return res.status(400).json({ message: "Invalid action" });
        }

        await storage.updateVoiceCallStatus(activeCall.id, newStatus);
        res.json({ success: true, status: newStatus });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get active voice call for user
  app.get("/api/voice-call/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const activeCall = await storage.getActiveVoiceCall(userId);
      res.json(activeCall || null);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store user connections
  const userConnections = new Map<number, WebSocket>();
  
  wss.on('connection', (ws) => {
    let userId: number | null = null;
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'auth':
            userId = message.userId;
            if (userId) {
              userConnections.set(userId, ws);
            }
            break;
            
          case 'voice_call_signal':
            // WebRTC signaling for voice calls
            const { targetUserId, signal } = message;
            const targetWs = userConnections.get(targetUserId);
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(JSON.stringify({
                type: 'voice_call_signal',
                fromUserId: userId,
                signal: signal
              }));
            }
            break;
            
          case 'message':
            // Real-time message delivery
            const { receiverId, messageText } = message;
            if (userId) {
              const savedMessage = await storage.sendMessage(userId, receiverId, messageText);
              const receiverWs = userConnections.get(receiverId);
              if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
                receiverWs.send(JSON.stringify({
                  type: 'new_message',
                  message: savedMessage
                }));
              }
            }
            break;
            
          case 'voice_call_action':
            // Voice call state changes
            const { action, callId, targetId } = message;
            const targetConnection = userConnections.get(targetId);
            if (targetConnection && targetConnection.readyState === WebSocket.OPEN) {
              targetConnection.send(JSON.stringify({
                type: 'voice_call_action',
                action: action,
                callId: callId,
                fromUserId: userId
              }));
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        userConnections.delete(userId);
      }
    });
  });
  
  return httpServer;
}
