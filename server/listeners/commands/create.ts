import { db } from '../../db';
import { groupMembers, groups } from '../../db/schema';
import { validateGroupName } from '../../reserved';
import { parseSubcommand, type Subcommand } from '.';

export default {
	name: 'create',
	handler: async ({ command, respond }) => {
		const { args } = parseSubcommand(command.text);
		const groupName = args;
		if (!groupName) {
			await respond(
				`Couldn't find the group name in your command.\nUsage: \`${command.text.split(' ')[0]} create [group name]\``,
			);
			return;
		}

		if (
			await db.query.groups.findFirst({
				where: {
					name: groupName,
				},
			})
		) {
			await respond('A group of the same name already exists!');
			return;
		}

		if (!validateGroupName(groupName)) {
			await respond(
				'The group name is invalid - make sure it is all lowercase and uses standard characters',
			);
			return;
		}

		await db.transaction(async (tx) => {
			const [group] = await tx
				.insert(groups)
				.values({ name: groupName })
				.returning();

			if (!group) {
				tx.rollback();
				return;
			}

			await tx.insert(groupMembers).values({
				groupId: group.id,
				userId: command.user_id,
				role: 'admin',
			});
		});

		await respond('Group created successfully!');
	},
} satisfies Subcommand;
