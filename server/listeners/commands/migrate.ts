import { db } from '../../db';
import { groupMembers, groups } from '../../db/schema';
import { validateGroupName } from '../../reserved';
import { parseSubcommand, type Subcommand } from '.';

export default {
	name: 'migrate',
	handler: async ({ client, command, respond }) => {
		const args = parseSubcommand(command.text).args.split(' ');
		const usergroupId = args[0]?.match(/<!subteam\^(.*?)(\|.*)?>/)?.[1];

		if (!usergroupId) {
			await respond(
				`Couldn't find the usergroup in your command.\nUsage: \`${command.command} migrate @usergroup\``,
			);
			return;
		}

		const groupName = (
			await client.usergroups.list({
				include_disabled: true,
			})
		).usergroups?.find((x) => x.id === usergroupId)?.name;

		if (!groupName) {
			await respond("Couldn't find that usergroup!");
			return;
		}

		if (!validateGroupName(groupName)) {
			await respond(
				'The name of the provided usergroup is not a valid Relay group name.',
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

		const { users } = await client.usergroups.users.list({
			usergroup: usergroupId,
			include_disabled: true,
		});

		if (!users) {
			await respond('Failed to get users from existing usergroup');
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

			await tx.insert(groupMembers).values(
				users.map(
					(user) =>
						({
							groupId: group.id,
							userId: user,
							role: 'member',
						}) satisfies typeof groupMembers.$inferInsert,
				),
			);
		});

		await respond(`${users.length} member(s) migrated successfully!`);
	},
} satisfies Subcommand;
