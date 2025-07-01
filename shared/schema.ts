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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type AddFriend = z.infer<typeof addFriendSchema>;
export type User = typeof users.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
