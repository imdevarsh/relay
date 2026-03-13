import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { groupMembers } from '../../db/schema';
import { parseSubcommand, type Subcommand } from '.';

export default {
	name: 'leave',
	handler: async ({ command, respond }) => {
		const { args } = parseSubcommand(command.text);
		const groupName = args;
		if (!groupName) {
			await respond(
				`Couldn't find the group name in your command.\nUsage: \`${command.text.split(' ')[0]} leave [group name]\``,
			);
			return;
		}

		const group = await db.query.groups.findFirst({
			where: {
				name: groupName,
			},
			with: {
				members: true,
			},
		});

		if (!group) {
			await respond(`No group found with the name ${groupName}`);
			return;
		}

		const member = group.members.find(
			(member) => member.userId === command.user_id,
		);

		if (!member) {
			await respond('You are not in the provided group!');
			return;
		}

		if (
			member.role === 'admin' &&
			group.members.filter((member) => member.role === 'admin').length < 2
		) {
			await respond(
				'You cannot leave this group because you are the last admin!',
			);
			return;
		}

		await db
			.delete(groupMembers)
			.where(
				and(
					eq(groupMembers.groupId, group.id),
					eq(groupMembers.userId, command.user_id),
				),
			);

		await respond(`You have successfully left the group ${groupName}!`);
	},
} satisfies Subcommand;
