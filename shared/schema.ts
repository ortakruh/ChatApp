import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatar: text("avatar"),
  friendCode: text("friend_code").notNull().unique(),
  about: text("about"),
});

export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  status: text("status").notNull(), // 'pending', 'accepted', 'blocked'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voiceCalls = pgTable("voice_calls", {
  id: serial("id").primaryKey(),
  callerId: integer("caller_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  status: text("status").notNull(), // 'calling', 'active', 'ended'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  displayName: true,
}).extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginUserSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = createInsertSchema(users).pick({
  displayName: true,
  avatar: true,
  about: true,
  friendCode: true,
});

export const addFriendSchema = z.object({
  friendCode: z.string().min(1, "Friend code is required"),
});

export const sendMessageSchema = z.object({
  senderId: z.number().optional(),
  receiverId: z.number(),
  message: z.string().min(1, "Message cannot be empty"),
});

export const voiceCallSchema = z.object({
  receiverId: z.number(),
  action: z.enum(["start", "accept", "reject", "end"]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type AddFriend = z.infer<typeof addFriendSchema>;
export type SendMessage = z.infer<typeof sendMessageSchema>;
export type VoiceCall = z.infer<typeof voiceCallSchema>;
export type User = typeof users.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type DirectMessage = typeof directMessages.$inferSelect;
export type VoiceCallData = typeof voiceCalls.$inferSelect;