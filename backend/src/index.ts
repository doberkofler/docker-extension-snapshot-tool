import express from 'express';
import {exec} from 'node:child_process';
import {promisify} from 'node:util';
import {existsSync, unlinkSync} from 'node:fs';

const SOCKET_PATH = '/run/guest-services/backend.sock';

const execAsync = promisify(exec);

const main = async (): Promise<void> => {
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
