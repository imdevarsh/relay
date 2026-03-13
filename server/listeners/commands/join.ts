import { db } from '../../db';
import { groupMembers } from '../../db/schema';
import { parseSubcommand, type Subcommand } from '.';

export default {
	name: 'join',
	handler: async ({ command, respond }) => {
		const { args } = parseSubcommand(command.text);
		const groupName = args;
		if (!groupName) {
			await respond(
				`Couldn't find the group name in your command.\nUsage: \`${command.text.split(' ')[0]} join [group name]\``,
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

		if (group.members.some((member) => member.userId === command.user_id)) {
			await respond('You are already in the provided group!');
			return;
		}

		await db.insert(groupMembers).values({
			groupId: group.id,
			userId: command.user_id,
			role: 'member',
		});

		await respond(`You have successfully joined the group ${groupName}!`);
	},
} satisfies Subcommand;
