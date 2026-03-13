import type {
	App,
	Middleware,
	SlackCommandMiddlewareArgs,
	StringIndexed,
} from '@slack/bolt';

import create from './create';
import invite from './invite';
import join from './join';
import kick from './kick';
import leave from './leave';
import list from './list';
import migrate from './migrate';

export type Subcommand = {
	name: string;
	handler: Middleware<SlackCommandMiddlewareArgs, StringIndexed>;
};

const subcommands: Subcommand[] = [
	create,
	migrate,
	list,
	join,
	leave,
	invite,
	kick,
];

export function parseSubcommand(text: string): {
	subcommand: string | null;
	args: string;
} {
	const trimmed = text.trim();
	if (!trimmed) {
		return { subcommand: null, args: '' };
	}

	const parts = trimmed.split(/\s+/);
	const subcommand = parts[0]?.toLowerCase() ?? null;
	const args = parts.slice(1).join(' ');

	return { subcommand, args };
}

const register = (app: App) => {
	app.command(/\/relay.*/, async (args) => {
		await args.ack();
		const { subcommand } = parseSubcommand(args.command.text);

		const cmd = subcommands.find((x) => x.name === subcommand);
		if (cmd) {
			await cmd.handler(args);
		} else {
			await args.respond(
				`Unknown subcommand. Available subcommands: ${subcommands.map((x) => `\`${x.name}\``).join(' ')}`,
			);
		}
	});
};

export default { register };
