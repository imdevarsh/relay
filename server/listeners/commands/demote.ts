import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../../db';
import { groupMembers } from '../../db/schema';
import { parseSubcommand, type Subcommand } from '.';

export default {
	name: 'demote',
	handler: async ({ command, respond }) => {
		const args = parseSubcommand(command.text).args.split(' ');

		const groupName = args[0];
		if (!groupName) {
			await respond(
				`Couldn't find the group name in your command.\nUsage: \`${command.command} demote [group name] @user1 @user2 ...\``,
			);
			return;
		}

		const users = args
			.slice(1)
			.map((x) => x.match(/<@(.*?)(\|.*)?>/)?.[1])
			.filter((x) => x !== undefined);
		if (users.length === 0) {
			await respond(
				`No valid user mentions found in your command.\nUsage: \`${command.command} demote [group name] @user1 @user2 ...\``,
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
			(member) => member.role === 'admin' && member.userId === command.user_id,
		);

		if (!member) {
			await respond('You are not an admin of the provided group!');
			return;
		}

		if (
			group.members.some(
				(member) => member.role === 'member' && users.includes(member.userId),
			)
		) {
			await respond(
				`These users are already standard members: ${group.members.filter((member) => member.role === 'member' && users.includes(member.userId)).map((x) => `<@${x.userId}>`)}`,
			);
			return;
		}

		if (
			users.some(
				(user) => !group.members.some((member) => member.userId === user),
			)
		) {
			await respond(
				`These users are not in the usergroup: ${users
					.filter(
						(user) => !group.members.some((member) => member.userId === user),
					)
					.map((x) => `<@${x}>`)}`,
			);
			return;
		}

		await db
			.update(groupMembers)
			.set({
				role: 'member',
			})
			.where(
				and(
					eq(groupMembers.groupId, group.id),
					inArray(groupMembers.userId, users),
				),
			);

		await respond(`Demoted ${users.length} user(s) to standard member`);
	},
} satisfies Subcommand;
