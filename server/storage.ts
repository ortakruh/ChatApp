import { users, friendships, type User, type InsertUser, type Friendship, type UpdateProfile } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined>;
  getUserByFriendCode(friendCode: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, 'confirmPassword'> & { friendCode: string }): Promise<User>;
  updateUser(id: number, updates: Partial<UpdateProfile>): Promise<User | undefined>;
  
  // Friend operations
  getFriendsByUserId(userId: number): Promise<(User & { status: string })[]>;
  createFriendRequest(userId: number, friendId: number): Promise<Friendship>;
  updateFriendshipStatus(userId: number, friendId: number, status: string): Promise<boolean>;
  getFriendship(userId: number, friendId: number): Promise<Friendship | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private friendships: Map<number, Friendship>;
  private currentUserId: number;
  private currentFriendshipId: number;

  constructor() {
    this.users = new Map();
    this.friendships = new Map();
    this.currentUserId = 1;
    this.currentFriendshipId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.email === emailOrUsername || user.username === emailOrUsername
    );
  }

  async getUserByFriendCode(friendCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.friendCode === friendCode);
  }

  async createUser(userData: Omit<InsertUser, 'confirmPassword'> & { friendCode: string }): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName || null,
      avatar: null,
      friendCode: userData.friendCode,
      about: null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<UpdateProfile> & { friendCode?: string }): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getFriendsByUserId(userId: number): Promise<(User & { status: string; isRequestReceiver?: boolean; friendshipId: number })[]> {
    const userFriendships = Array.from(this.friendships.values()).filter(
      friendship => friendship.userId === userId || friendship.friendId === userId
    );

    const friends: (User & { status: string; isRequestReceiver?: boolean; friendshipId: number })[] = [];
    
    for (const friendship of userFriendships) {
      const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId;
      const friend = this.users.get(friendId);
      if (friend) {
        friends.push({ 
          ...friend, 
          status: friendship.status,
          isRequestReceiver: friendship.friendId === userId, // true if this user received the request
          friendshipId: friendship.id
        });
      }
    }

    return friends;
  }

  async createFriendRequest(userId: number, friendId: number): Promise<Friendship> {
    const id = this.currentFriendshipId++;
    const friendship: Friendship = {
      id,
      userId,
      friendId,
      status: 'pending',
      createdAt: new Date(),
    };
    this.friendships.set(id, friendship);
    return friendship;
  }

  async updateFriendshipStatus(userId: number, friendId: number, status: string): Promise<boolean> {
    const friendship = Array.from(this.friendships.values()).find(
      f => (f.userId === userId && f.friendId === friendId) || 
           (f.userId === friendId && f.friendId === userId)
    );
    
    if (!friendship) return false;
    
    friendship.status = status;
    this.friendships.set(friendship.id, friendship);
    return true;
  }

  async getFriendship(userId: number, friendId: number): Promise<Friendship | undefined> {
    return Array.from(this.friendships.values()).find(
      f => (f.userId === userId && f.friendId === friendId) || 
           (f.userId === friendId && f.friendId === userId)
    );
  }
}

export const storage = new MemStorage();
