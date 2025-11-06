import express from 'express';
import fs from 'node:fs/promises';
import {exec} from 'node:child_process';
import {promisify, inspect} from 'node:util';
import path from 'node:path';
import {existsSync, unlinkSync} from 'node:fs';
import {dateFromStringSchema, type StatusShapeType} from '@extension/shared/src/types.ts';
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
	exportPath: z.string(),
	exportFilename: z.string(),
	...BaseShape.shape,
});

const StateShape = z.discriminatedUnion('operation', [CommitShape, SaveShape]);
type State = z.infer<typeof StateShape>;

const STATE_FILE = '/data/export-state.json';
const EXPORT_DIR = '/data/exports';
const SOCKET_PATH = '/run/guest-services/backend.sock';

const execAsync = promisify(exec);

/**
 * Convert Error to a string.
 *
 * @param error - The error.
 * @returns The string representation.
 */
export const errorToString = (error: unknown) => {
	if (typeof error === 'string') {
		return error;
	} else if (error instanceof Error) {
		const parts = [error.name];
		if (typeof error.message === 'string' && error.message.length > 0) {
			parts.push(error.message);
		}
		if (typeof error.stack === 'string' && error.stack.length > 0) {
			parts.push(error.stack);
		}
		return parts.join('\n');
	} else {
		return inspect(error, {showHidden: false, depth: 10, colors: false});
	}
};

const loadState = async (): Promise<State | null> => {
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

const saveState = async (state: State | null): Promise<void> => {
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

const performCommit = async (options: {containerId: string; imageName: string}): Promise<void> => {
	const {containerId, imageName} = options;
	const state: State = {
		operation: 'commit',
		status: 'running',
		started: new Date(),
		error: '',
		containerId,
		imageName,
	};

	try {
		await saveState(state);
		await execAsync(`docker commit "${containerId}" "${imageName}"`);
		state.status = 'complete';
		await saveState(state);
	} catch (err) {
		console.error('[performCommit] Commit failed:', err);
		state.status = 'failed';
		state.error = errorToString(err);
		await saveState(state);
	}
};

const performExport = async (options: {imageId: string; exportPath: string; exportFilename: string}): Promise<void> => {
	const {imageId, exportPath, exportFilename} = options;
	const state: State = {
		operation: 'save',
		status: 'running',
		started: new Date(),
		error: '',
		imageId,
		exportPath,
		exportFilename,
	};

	try {
		await saveState(state);

		const filename = exportFilename.replace(/[/:\\*?"<>|]/g, '_') + '.tar';
		const outputPath = path.join(exportPath, filename);

		await execAsync(`docker save -o "${outputPath}" "${imageId}"`);

		console.log('[performExport] Export complete');
		state.status = 'complete';
		await saveState(state);
	} catch (err) {
		console.error('[performExport] Export failed:', err);
		state.status = 'failed';
		state.error = errorToString(err);
		await saveState(state);
	}
};

const initialize = async (): Promise<void> => {
	// Initialize state on startup
	console.log('[startup] Initializing backend...');
	const state = await loadState();
	console.log('[startup] Ready. Current export:', state?.status || 'none');
};

const main = async (): Promise<void> => {
	// Initialize
	await initialize();

	// Express
	const app = express();
	app.use(express.json());

	// Logging middleware
	app.use((req, res, next) => {
		const start = Date.now();
		const timestamp = new Date().toISOString();

		console.log(`[${timestamp}] ${req.method} ${req.path}`);

		res.on('finish', () => {
			const duration = Date.now() - start;
			console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
		});

		next();
	});

	app.get('/status', async (req, res) => {
		console.log('[/status] Fetching Backend Status');

		const state = await loadState();

		const data = {
			status: state ? state.status : 'idle',
			started: state ? state.started : null,
			error: state ? state.error : null,
			operation: state ? state.operation : null,
		} satisfies StatusShapeType;

		console.log('[/status] ', data);

		res.json(data);
	});

	app.get('/containers', async (req, res) => {
		console.log('[/containers] Fetching Docker containers');
		try {
			const {stdout} = await execAsync('docker ps --all --format "{{json .}}"');
			const data = stdout
				.trim()
				.split('\n')
				.filter(Boolean)
				.map((line) => JSON.parse(line));
			console.log(`[/containers] Found ${data.length} containers`);
			res.json(data);
		} catch (err) {
			console.error('[/containers] Error:', err);
			res.status(500).json({error: (err as Error).message});
		}
	});

	app.get('/images', async (req, res) => {
		console.log('[/images] Fetching Docker images');
		try {
			const {stdout} = await execAsync('docker images --all --format "{{json .}}"');
			const data = stdout
				.trim()
				.split('\n')
				.filter(Boolean)
				.map((line) => JSON.parse(line));
			console.log(`[/images] Found ${data.length} images`);
			res.json(data);
		} catch (err) {
			console.error('[/images] Error:', err);
			res.status(500).json({error: (err as Error).message});
		}
	});

	app.post('/commit', async (req, res) => {
		const result = z
			.looseObject({
				containerId: z.string(),
				imageName: z.string(),
			})
			.safeParse(req.body);

		if (!result.success) {
			const errorMessage = z.treeifyError(result.error);
			console.error('[/commit] Missing required fields', errorMessage);
			res.status(400).json({error: errorMessage});
			return;
		}

		console.log('[/commit] Request:', result.data);

		const state = await loadState();
		if (state && state.status === 'running') {
			const message = `A "${state.operation}" already in progress`;
			console.warn(`[/commit] ${message}`);
			res.status(409).json({error: message});
			return;
		}

		console.log('[/commit] Starting commit process');
		performCommit(result.data);

		res.json({success: true});
	});

	app.post('/export', async (req, res) => {
		const result = z
			.looseObject({
				imageId: z.string(),
				imageName: z.string(),
				directory: z.string().optional(),
				exportFilename: z.string(),
			})
			.safeParse(req.body);

		if (!result.success) {
			const errorMessage = z.treeifyError(result.error);
			console.error('[/export] Missing required fields', errorMessage);
			res.status(400).json({error: errorMessage});
			return;
		}

		console.log('[/export] Request:', result.data);

		const state = await loadState();
		if (state && state.status === 'running') {
			const message = `A "${state.operation}" already in progress`;
			console.warn(`[/export] ${message}`);
			res.status(409).json({error: message});
			return;
		}

		const exportPath = result.data.directory ? path.join(EXPORT_DIR, result.data.directory) : EXPORT_DIR;

		console.log('[/export] Creating export directory:', exportPath);
		await fs.mkdir(exportPath, {recursive: true});

		console.log('[/export] Starting export process');
		performExport({imageId: result.data.imageId, exportPath, exportFilename: result.data.exportFilename});

		res.json({success: true});
	});

	/*
	app.post('/export/copy-to-host', async (req, res) => {
		const {hostPath} = req.body as {hostPath: string};

		console.log('[/export/copy-to-host] Request to copy to:', hostPath);

		const state = await loadState();
		if (!state || state.status !== 'complete') {
			console.error('[/export/copy-to-host] No completed export available');
			res.status(400).json({error: 'No completed export'});
			return;
		}

		try {
			console.log('[/export/copy-to-host] Finding backend container...');
			const {stdout: containerId} = await execAsync("docker ps --filter 'label=com.docker.compose.service=snapshot-tools' --format '{{.ID}}' | head -1");

			const id = containerId.trim();
			console.log('[/export/copy-to-host] Container ID:', id);
			console.log('[/export/copy-to-host] Copying from:', currentState.outputPath);

			await execAsync(`docker cp ${id}:${currentState.outputPath} "${hostPath}"`);

			console.log('[/export/copy-to-host] Copy successful');
			res.json({success: true});
		} catch (err) {
			console.error('[/export/copy-to-host] Copy failed:', err);
			res.status(500).json({error: (err as Error).message});
		}
	});
	*/

	// Remove old socket if exists
	if (existsSync(SOCKET_PATH)) {
		console.log(`[startup] Removing old socket file "${SOCKET_PATH}"`);
		unlinkSync(SOCKET_PATH);
	}

	// Listen on Unix socket for extension API
	app.listen(SOCKET_PATH, () => {
		console.log(`[server] Backend listening on Unix socket "${SOCKET_PATH}"`);
	});
};

void main();
