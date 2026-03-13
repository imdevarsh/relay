import { db } from '../../db';
import { groupMembers } from '../../db/schema';
import { parseSubcommand, type Subcommand } from '.';

export default {
	name: 'invite',
	handler: async ({ command, respond }) => {
		const args = parseSubcommand(command.text).args.split(' ');

		const groupName = args[0];
		const users = args
			.slice(1)
			.map((x) => x.match(/<@(.*?)(\|.*)?>/)?.[1])
			.filter((x) => x !== undefined);

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
			(member) => member.role === 'admin' && member.userId === command.user_id,
		);

		if (!member) {
			await respond('You are not an admin of the provided group!');
			return;
		}

		await db
			.insert(groupMembers)
			.values(
				users.map(
					(user) =>
						({
							groupId: group.id,
							userId: user,
							role: 'member',
						}) satisfies typeof groupMembers.$inferInsert,
				),
			)
			.onConflictDoNothing();

		await respond(`Added ${users.length} user(s) to ${groupName}`);
	},
} satisfies Subcommand;
