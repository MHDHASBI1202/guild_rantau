// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const members = sqliteTable('members', {
 id: text('id').primaryKey(), name: text('name').notNull(), role: text('role').notNull(),
 color: text('color').notNull(), xp: integer('xp').notNull().default(0),
 gender: text('gender').notNull().default('netral'),
 hairStyle: text('hair_style').notNull().default('pendek'),
 skinTone: text('skin_tone').notNull().default('#e8bd94'),
 wood: integer('wood').notNull().default(0), herbs: integer('herbs').notNull().default(0),
 lastAction: integer('last_action').notNull().default(0), activity: text('activity').notNull().default('Tiba di kamp'),
 joinedAt: integer('joined_at').notNull(), bed: text('bed').notNull(),
 lastSeen: integer('last_seen').notNull().default(0),
 cosmetics: text('cosmetics').notNull().default('{}'),
 highestLevel: integer('highest_level').notNull().default(1),
 spinsUsed: integer('spins_used').notNull().default(0),
});
export const spinHistory=sqliteTable('spin_history',{
 id:text('id').primaryKey(), memberId:text('member_id').notNull().references(()=>members.id,{onDelete:'cascade'}),
 itemId:text('item_id').notNull(), attemptId:text('attempt_id').notNull(), createdAt:integer('created_at').notNull(),
},table=>[index('spin_history_member_time').on(table.memberId,table.createdAt)]);
export const campState=sqliteTable('camp_state',{
 id:integer('id').primaryKey(),wood:integer('wood').notNull().default(0),herbs:integer('herbs').notNull().default(0),
 defense:integer('defense').notNull().default(0),comfort:integer('comfort').notNull().default(0),exploration:integer('exploration').notNull().default(0),
 craft:integer('craft').notNull().default(0),farm:integer('farm').notNull().default(0),magic:integer('magic').notNull().default(0),updatedAt:integer('updated_at').notNull().default(0),
});
export const worldEvents=sqliteTable('world_events',{
 id:text('id').primaryKey(),memberId:text('member_id').notNull().references(()=>members.id,{onDelete:'cascade'}),
 action:text('action').notNull(),role:text('role').notNull(),amount:integer('amount').notNull(),attemptId:text('attempt_id').notNull(),createdAt:integer('created_at').notNull(),
},table=>[index('world_events_time').on(table.createdAt)]);

export const authSessions=sqliteTable('auth_sessions',{
 tokenHash:text('token_hash').primaryKey(),userId:text('user_id').notNull(),email:text('email').notNull(),name:text('name'),expiresAt:integer('expires_at').notNull(),createdAt:integer('created_at').notNull(),
},table=>[index('auth_sessions_expiry').on(table.expiresAt),index('auth_sessions_user').on(table.userId)]);
export const authChallenges=sqliteTable('auth_challenges',{
 tokenHash:text('token_hash').primaryKey(),nonce:text('nonce').notNull(),expiresAt:integer('expires_at').notNull(),
},table=>[index('auth_challenges_expiry').on(table.expiresAt)]);
