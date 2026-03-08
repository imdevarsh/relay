import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';

export const appMention = async ({
	event,
	client,
	context,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'app_mention'>) => {
	const command = event.text
		.split(`<@${context.botUserId}>`)[1]
		?.trim()
		.split(' ')[0]
		?.trim();
	if (!command) {
		if (event.user)
			await client.chat.postEphemeral({
				text: "Couldn't parse message",
				channel: event.channel,
				user: event.user,
			});
		return;
	}
	await client.chat.postEphemeral({
		text: command,
		channel: event.channel,
		// biome-ignore lint/style/noNonNullAssertion: quick testing
		user: event.user!,
	});
};
