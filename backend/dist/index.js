import express from 'express';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
const execAsync = promisify(exec);
const app = express();
app.use(express.json());
const STATE_FILE = '/data/export-state.json';
const EXPORT_DIR = '/data/exports';
let currentExport = null;
async function loadState() {
    try {
        const data = await fs.readFile(STATE_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            return null;
        }
        throw err;
    }
}
async function saveState(state) {
    if (state) {
        await fs.writeFile(STATE_FILE, JSON.stringify(state, null, '\t'));
    }
    else {
        try {
            await fs.unlink(STATE_FILE);
        }
        catch (err) {
            // Ignore if file doesn't exist
        }
    }
}
// Initialize state on startup
(async () => {
    currentExport = await loadState();
})();
app.get('/images', async (req, res) => {
    try {
        const { stdout } = await execAsync('docker images --format "{{json .}}"');
        const images = stdout
            .trim()
            .split('\n')
            .filter(Boolean)
            .map((line) => JSON.parse(line));
        res.json(images);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/export', async (req, res) => {
    const { imageId, imageName, customName, directory } = req.body;
    if (!imageId || !imageName) {
        res.status(400).json({ error: 'imageId and imageName required' });
        return;
    }
    if (currentExport && currentExport.status === 'running') {
        res.status(409).json({ error: 'Export already in progress' });
        return;
    }
    // Create export directory
    const exportPath = directory
        ? path.join(EXPORT_DIR, directory)
        : EXPORT_DIR;
    await fs.mkdir(exportPath, { recursive: true });
    currentExport = {
        imageId,
        imageName,
        customName: customName || imageName,
        status: 'running',
        progress: 0,
    };
    await saveState(currentExport);
    // Start export asynchronously
    performExport(exportPath);
    res.json({ success: true });
});
async function performExport(exportPath) {
    if (!currentExport)
        return;
    try {
        currentExport.progress = 10;
        await saveState(currentExport);
        const filename = currentExport.customName.replace(/[/:\\*?"<>|]/g, '_') + '.tar';
        const outputPath = path.join(exportPath, filename);
        currentExport.progress = 25;
        await saveState(currentExport);
        // Execute docker save
        await execAsync(`docker save -o "${outputPath}" "${currentExport.imageId}"`);
        currentExport.status = 'complete';
        currentExport.progress = 100;
        currentExport.outputPath = outputPath;
        await saveState(currentExport);
    }
    catch (err) {
        if (currentExport) {
            currentExport.status = 'failed';
            currentExport.error = err.message;
            await saveState(currentExport);
        }
    }
}
app.get('/export/status', async (req, res) => {
    res.json(currentExport);
});
app.delete('/export', async (req, res) => {
    currentExport = null;
    await saveState(null);
    res.sendStatus(200);
});
app.post('/export/copy-to-host', async (req, res) => {
    const { hostPath } = req.body;
    if (!currentExport ||
        currentExport.status !== 'complete' ||
        !currentExport.outputPath) {
        res.status(400).json({ error: 'No completed export' });
        return;
    }
    try {
        const { stdout: containerId } = await execAsync("docker ps --filter 'label=com.docker.compose.service=backend' --format '{{.ID}}' | head -1");
        await execAsync(`docker cp ${containerId.trim()}:${currentExport.outputPath} "${hostPath}"`);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.listen(8080, () => {
    console.log('Backend listening on :8080');
});
