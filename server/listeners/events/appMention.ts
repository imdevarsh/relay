import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import { db } from '../../db';

export const appMention = async ({
	event,
	client,
	context,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'app_mention'>) => {
	if (!event.user) return;

	const command = event.text
		.split(`<@${context.botUserId}>`)[1]
		?.trim()
		.split(' ')[0]
		?.trim()
		.toLowerCase();
	if (!command) {
		await client.chat.postEphemeral({
			text: "Couldn't parse message - try visting my App Home for more details",
			channel: event.channel,
			user: event.user,
		});
		return;
	}

	const group = await db.query.groups.findFirst({
		where: {
			name: command,
		},
		with: {
			members: true,
		},
	});

	if (!group) {
		await client.chat.postEphemeral({
			text: `Couldn't find a group named '${command}' - if you want to make a new group, visit my App Home`,
			channel: event.channel,
			user: event.user,
		});
		return;
	}

	if (
		!group.members.some(
			(member) => member.role === 'admin' && member.userId === event.user,
		)
	) {
		await client.chat.postEphemeral({
			text: `Sorry, you can't ping the group '${command}' because you are not an admin of it!`,
			channel: event.channel,
			user: event.user,
		});
		return;
	}

	await client.chat.postEphemeral({
		text: `Sending pings to ${group.members.length} ${group.members.length === 1 ? 'member' : 'members'} of '${command}'`,
		channel: event.channel,
		user: event.user,
	});

	const permalink = (
		await client.chat.getPermalink({
			channel: event.channel,
			message_ts: event.ts,
		})
	).permalink;

	if (!permalink) {
		console.error('Failed to fetch permalink');
		return;
	}

	const errorMembers: string[] = [];

	for (const member of group.members) {
		try {
			await client.chat.postMessage({
				markdown_text: `<@${event.user}> has [pinged the group '${command}'](${permalink})!`,
				channel: member.userId,
			});
		} catch (error) {
			console.error(error);
			errorMembers.push(member.userId);
		}
	}
	if (errorMembers.length > 0) {
		await client.chat.postEphemeral({
			text: `Failed to ping ${errorMembers.length} ${errorMembers.length === 1 ? 'member' : 'members'} of '${command}' - ${errorMembers.map((x) => `<@${x}>`).join(' ')}`,
			channel: event.channel,
			user: event.user,
		});
	} else {
		await client.chat.postEphemeral({
			text: `Successfully pinged ${group.members.length} ${group.members.length === 1 ? 'member' : 'members'} of '${command}'!`,
			channel: event.channel,
			user: event.user,
		});
	}
};
