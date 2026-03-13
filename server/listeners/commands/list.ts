import { db } from '../../db';
import { parseSubcommand, type Subcommand } from '.';

export default {
	name: 'list',
	handler: async ({ command, respond }) => {
		const { args } = parseSubcommand(command.text);
		const groupName = args;

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

		await respond(
			`Members of ${groupName} (${group.members.length}):\n${group.members.map((x) => `<@${x.userId}> (${x.role})`).join('\n')}`,
		);
	},
} satisfies Subcommand;
