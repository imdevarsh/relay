// used in prod to deploy to Vercel

import { App } from '@slack/bolt';
import { createHandler, VercelReceiver } from '@vercel/slack-bolt';
import { registerListeners } from '../../server/listeners';

const receiver = new VercelReceiver({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	receiver,
	deferInitialization: true,
});

registerListeners(app);

export const POST = createHandler(app, receiver);
