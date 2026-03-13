import type { App } from '@slack/bolt';
import commands from './commands';
import events from './events';

export function registerListeners(app: App) {
	commands.register(app);
	events.register(app);
}
