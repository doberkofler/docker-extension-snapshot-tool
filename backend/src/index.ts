// backend/src/index.ts
import express from 'express';
import fs from 'fs/promises';
import {exec} from 'child_process';
import {promisify} from 'util';
import path from 'path';
import {existsSync, unlinkSync} from 'fs';

const execAsync = promisify(exec);
const app = express();
app.use(express.json());

const STATE_FILE = '/data/export-state.json';
const EXPORT_DIR = '/data/exports';
const SOCKET_PATH = '/run/guest-services/backend.sock';

type ExportState = {
	imageId: string;
	imageName: string;
	customName: string;
	status: 'idle' | 'running' | 'complete' | 'failed';
	progress: number;
	outputPath?: string;
	error?: string;
};

let currentExport: ExportState | null = null;

// Logging middleware
app.use((req, res, next) => {
	const start = Date.now();
	const timestamp = new Date().toISOString();

	res.on('finish', () => {
		const duration = Date.now() - start;
		console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
	});

	next();
});

async function loadState(): Promise<ExportState | null> {
	try {
		const data = await fs.readFile(STATE_FILE, 'utf-8');
		console.log('[loadState] State loaded from disk');
		return JSON.parse(data);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
			console.log('[loadState] No existing state file');
			return null;
		}
		console.error('[loadState] Error loading state:', err);
		throw err;
	}
}

async function saveState(state: ExportState | null): Promise<void> {
	if (state) {
		await fs.writeFile(STATE_FILE, JSON.stringify(state, null, '\t'));
		console.log('[saveState] State saved to disk:', state.status);
	} else {
		try {
			await fs.unlink(STATE_FILE);
			console.log('[saveState] State file deleted');
		} catch (err) {
			// Ignore if file doesn't exist
		}
	}
}

// Initialize state on startup
(async () => {
	console.log('[startup] Initializing backend...');
	currentExport = await loadState();
	console.log('[startup] Ready. Current export:', currentExport?.status || 'none');
})();

app.get('/images', async (req, res) => {
	console.log('[/images] Fetching Docker images');
	try {
		const {stdout} = await execAsync('docker images --format "{{json .}}"');
		const images = stdout
			.trim()
			.split('\n')
			.filter(Boolean)
			.map((line) => JSON.parse(line));
		console.log(`[/images] Found ${images.length} images`);
		res.json(images);
	} catch (err) {
		console.error('[/images] Error:', err);
		res.status(500).json({error: (err as Error).message});
	}
});

app.post('/export', async (req, res) => {
	const {imageId, imageName, customName, directory} = req.body as {
		imageId: string;
		imageName: string;
		customName?: string;
		directory?: string;
	};

	console.log('[/export] Request:', {imageId, imageName, customName, directory});

	if (!imageId || !imageName) {
		console.error('[/export] Missing required fields');
		res.status(400).json({error: 'imageId and imageName required'});
		return;
	}

	if (currentExport && currentExport.status === 'running') {
		console.warn('[/export] Export already in progress');
		res.status(409).json({error: 'Export already in progress'});
		return;
	}

	const exportPath = directory ? path.join(EXPORT_DIR, directory) : EXPORT_DIR;

	console.log('[/export] Creating export directory:', exportPath);
	await fs.mkdir(exportPath, {recursive: true});

	currentExport = {
		imageId,
		imageName,
		customName: customName || imageName,
		status: 'running',
		progress: 0,
	};
	await saveState(currentExport);

	console.log('[/export] Starting export process');
	performExport(exportPath);

	res.json({success: true});
});

async function performExport(exportPath: string): Promise<void> {
	if (!currentExport) {
		console.error('[performExport] No current export');
		return;
	}

	console.log('[performExport] Starting export for:', currentExport.imageName);

	try {
		currentExport.progress = 10;
		await saveState(currentExport);

		const filename = currentExport.customName.replace(/[/:\\*?"<>|]/g, '_') + '.tar';
		const outputPath = path.join(exportPath, filename);

		console.log('[performExport] Output file:', outputPath);

		currentExport.progress = 25;
		await saveState(currentExport);

		console.log('[performExport] Executing docker save...');
		await execAsync(`docker save -o "${outputPath}" "${currentExport.imageId}"`);

		console.log('[performExport] Export complete');
		currentExport.status = 'complete';
		currentExport.progress = 100;
		currentExport.outputPath = outputPath;
		await saveState(currentExport);
	} catch (err) {
		console.error('[performExport] Export failed:', err);
		if (currentExport) {
			currentExport.status = 'failed';
			currentExport.error = (err as Error).message;
			await saveState(currentExport);
		}
	}
}

app.get('/export/status', async (req, res) => {
	console.log('[/export/status] Current status:', currentExport?.status || 'none');
	res.json(currentExport);
});

app.delete('/export', async (req, res) => {
	console.log('[/export] Clearing export state');
	currentExport = null;
	await saveState(null);
	res.sendStatus(200);
});

app.post('/export/copy-to-host', async (req, res) => {
	const {hostPath} = req.body as {hostPath: string};

	console.log('[/export/copy-to-host] Request to copy to:', hostPath);

	if (!currentExport || currentExport.status !== 'complete' || !currentExport.outputPath) {
		console.error('[/export/copy-to-host] No completed export available');
		res.status(400).json({error: 'No completed export'});
		return;
	}

	try {
		console.log('[/export/copy-to-host] Finding backend container...');
		const {stdout: containerId} = await execAsync("docker ps --filter 'label=com.docker.compose.service=snapshot-tools' --format '{{.ID}}' | head -1");

		const id = containerId.trim();
		console.log('[/export/copy-to-host] Container ID:', id);
		console.log('[/export/copy-to-host] Copying from:', currentExport.outputPath);

		await execAsync(`docker cp ${id}:${currentExport.outputPath} "${hostPath}"`);

		console.log('[/export/copy-to-host] Copy successful');
		res.json({success: true});
	} catch (err) {
		console.error('[/export/copy-to-host] Copy failed:', err);
		res.status(500).json({error: (err as Error).message});
	}
});

// Remove old socket if exists
if (existsSync(SOCKET_PATH)) {
	console.log('[startup] Removing old socket file');
	unlinkSync(SOCKET_PATH);
}

// Listen on Unix socket for extension API
app.listen(SOCKET_PATH, () => {
	console.log('[server] Backend listening on Unix socket:', SOCKET_PATH);
});
