import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const groups = pgTable('groups', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	createdAt: timestamp().notNull().defaultNow(),
	name: text().notNull().unique(),
	admins: text().array().notNull().default([]),
	members: text().array().notNull().default([]),
});
