// Reserved group names
export const RESERVED = new Set([
	'relay',
	'channel',
	'here',
	'everyone',
	'group',
	'create',
	'migrate',
	'add',
	'remove',
	'join',
	'leave',
	'null',
	'undefined',
]);

export const ALLOWED_CHARS = new Set('qwertyuiopasdfghjklzxcvbnm1234567890_-'.split(''));

export function validateGroupName(groupName: string) {
	if (RESERVED.has(groupName)) return false;
	if (groupName.length < 4 || groupName.length > 25) return false;
	for (const char of groupName) {
		if (!ALLOWED_CHARS.has(char)) return false;
	}
	return true;
}
