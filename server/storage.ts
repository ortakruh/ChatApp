import { users, friendships, directMessages, voiceCalls, type User, type InsertUser, type Friendship, type UpdateProfile, type DirectMessage, type VoiceCallData, type SendMessage, type VoiceCall } from "@shared/schema";

// New Group Types
export type Group = {
  id: number;
  name: string;
  ownerId: number;
  createdAt: Date;
};

export type GroupMember = {
  id: number;
  groupId: number;
  userId: number;
  joinedAt: Date;
};

export type GroupMessage = {
  id: number;
  groupId: number;
  senderId: number;
  message: string;
  createdAt: Date;
};

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

  // Message operations
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<DirectMessage[]>;
  sendMessage(senderId: number, receiverId: number, message: string): Promise<DirectMessage>;

  // Voice call operations
  createVoiceCall(callerId: number, receiverId: number): Promise<VoiceCallData>;
  updateVoiceCallStatus(callId: number, status: string): Promise<boolean>;
  getActiveVoiceCall(userId: number): Promise<VoiceCallData | undefined>;

  // Group operations (NEW)
  createGroup(name: string, ownerId: number): Promise<Group>;
  addUserToGroup(groupId: number, userId: number): Promise<GroupMember>;
  getGroupsForUser(userId: number): Promise<Group[]>;
  getGroupMembers(groupId: number): Promise<User[]>;
  sendGroupMessage(groupId: number, senderId: number, message: string): Promise<GroupMessage>;
  getGroupMessages(groupId: number): Promise<GroupMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private friendships: Map<number, Friendship>;
  private messages: Map<number, DirectMessage>;
  private voiceCalls: Map<number, VoiceCallData>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private groupMessages: Map<number, GroupMessage>;
  private currentUserId: number;
  private currentFriendshipId: number;
  private currentMessageId: number;
  private currentVoiceCallId: number;
  private currentGroupId: number;
  private currentGroupMemberId: number;
  private currentGroupMessageId: number;

  constructor() {
    this.users = new Map();
    this.friendships = new Map();
    this.messages = new Map();
    this.voiceCalls = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.groupMessages = new Map();
    this.currentUserId = 1;
    this.currentFriendshipId = 1;
    this.currentMessageId = 1;
    this.currentVoiceCallId = 1;
    this.currentGroupId = 1;
    this.currentGroupMemberId = 1;
    this.currentGroupMessageId = 1;
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

  // Message operations
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<DirectMessage[]> {
    return Array.from(this.messages.values())
      .filter(m => 
        (m.senderId === userId1 && m.receiverId === userId2) ||
        (m.senderId === userId2 && m.receiverId === userId1)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async sendMessage(senderId: number, receiverId: number, message: string): Promise<DirectMessage> {
    const id = this.currentMessageId++;
    const directMessage: DirectMessage = {
      id,
      senderId,
      receiverId,
      message,
      createdAt: new Date(),
    };
    this.messages.set(id, directMessage);
    return directMessage;
  }

  // Voice call operations
  async createVoiceCall(callerId: number, receiverId: number): Promise<VoiceCallData> {
    const id = this.currentVoiceCallId++;
    const voiceCall: VoiceCallData = {
      id,
      callerId,
      receiverId,
      status: 'calling',
      createdAt: new Date(),
    };
    this.voiceCalls.set(id, voiceCall);
    return voiceCall;
  }

  async updateVoiceCallStatus(callId: number, status: string): Promise<boolean> {
    const voiceCall = this.voiceCalls.get(callId);
    if (!voiceCall) return false;

    voiceCall.status = status;
    this.voiceCalls.set(callId, voiceCall);
    return true;
  }

  async getActiveVoiceCall(userId: number): Promise<VoiceCallData | undefined> {
    return Array.from(this.voiceCalls.values()).find(
      v => (v.callerId === userId || v.receiverId === userId) && 
           (v.status === 'calling' || v.status === 'active')
    );
  }

  // Group operations
  async createGroup(name: string, ownerId: number): Promise<Group> {
    const id = this.currentGroupId++;
    const group: Group = {
      id,
      name,
      ownerId,
      createdAt: new Date(),
    };
    this.groups.set(id, group);
    return group;
  }

  async addUserToGroup(groupId: number, userId: number): Promise<GroupMember> {
    const id = this.currentGroupMemberId++;
    const groupMember: GroupMember = {
      id,
      groupId,
      userId,
      joinedAt: new Date(),
    };
    this.groupMembers.set(id, groupMember);
    return groupMember;
  }

  async getGroupsForUser(userId: number): Promise<Group[]> {
    const groupIds = Array.from(this.groupMembers.values())
      .filter(gm => gm.userId === userId)
      .map(gm => gm.groupId);

    return Array.from(this.groups.values()).filter(group => groupIds.includes(group.id));
  }

  async getGroupMembers(groupId: number): Promise<User[]> {
    const userIds = Array.from(this.groupMembers.values())
      .filter(gm => gm.groupId === groupId)
      .map(gm => gm.userId);

    return Array.from(this.users.values()).filter(user => userIds.includes(user.id));
  }

  async sendGroupMessage(groupId: number, senderId: number, message: string): Promise<GroupMessage> {
    const id = this.currentGroupMessageId++;
    const groupMessage: GroupMessage = {
      id,
      groupId,
      senderId,
      message,
      createdAt: new Date(),
    };
    this.groupMessages.set(id, groupMessage);
    return groupMessage;
  }

  async getGroupMessages(groupId: number): Promise<GroupMessage[]> {
    return Array.from(this.groupMessages.values())
      .filter(gm => gm.groupId === groupId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export const storage = new MemStorage();