import fs from 'node:fs/promises';
import {dateFromStringSchema} from '@extension/shared/src/types.ts';
import {z} from 'zod';

const BaseShape = z.strictObject({
	status: z.enum(['idle', 'running', 'complete', 'failed']),
	started: dateFromStringSchema,
	error: z.string(),
});

const CommitShape = z.strictObject({
	operation: z.literal('commit'),
	containerId: z.string(),
	imageName: z.string(),
	...BaseShape.shape,
});

const SaveShape = z.strictObject({
	operation: z.literal('save'),
	imageId: z.string(),
	exportFilename: z.string(),
	...BaseShape.shape,
});

export const StateShape = z.discriminatedUnion('operation', [CommitShape, SaveShape]);
export type State = z.infer<typeof StateShape>;

const STATE_FILE = '/data/export-state.json';

export const loadState = async (): Promise<State | null> => {
	try {
		const data = await fs.readFile(STATE_FILE, 'utf-8');
		console.log(`[loadState] State loaded from "${STATE_FILE}"`);
		const json = JSON.parse(data);
		return StateShape.parse(json);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
			console.log(`[loadState] No existing state file "${STATE_FILE}"`);
			return null;
		}
		console.error(`[loadState] Error loading state file "${STATE_FILE}":`, err);
		throw err;
	}
};

export const saveState = async (state: State | null): Promise<void> => {
	if (state) {
		await fs.writeFile(STATE_FILE, JSON.stringify(state, null, '\t'));
		console.log(`[saveState] State saved to "${STATE_FILE}":`, state.status);
	} else {
		try {
			await fs.unlink(STATE_FILE);
			console.log(`[saveState] State file "${STATE_FILE}" deleted`);
		} catch (err) {
			// Ignore if file doesn't exist
		}
	}
};
