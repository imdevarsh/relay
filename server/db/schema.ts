import { defineRelations } from 'drizzle-orm';
import {
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

export const groups = pgTable('groups', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	createdAt: timestamp().notNull().defaultNow(),
	name: text().notNull().unique(),
});

export const groupRoleEnum = pgEnum('group_role', ['admin', 'member']);

export const groupMembers = pgTable(
	'group_members',
	{
		groupId: integer()
			.notNull()
			.references(() => groups.id, { onDelete: 'cascade' }),
		userId: text().notNull(),
		role: groupRoleEnum().notNull().default('member'),
		joinedAt: timestamp().notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

export const relations = defineRelations({ groups, groupMembers }, (r) => ({
	groups: {
		members: r.many.groupMembers({
			from: r.groups.id,
			to: r.groupMembers.groupId,
		}),
	},
}));
