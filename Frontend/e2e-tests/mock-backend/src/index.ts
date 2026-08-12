import * as fs from 'fs';
import { config } from './config';
import { createServer } from './server';

// Start each run with an empty miss log so it only ever describes the current run.
try {
    fs.rmSync(config.unmockedLog, { force: true });
} catch {
    // ignore
}

createServer().listen(config.port, config.host, () => {
    const base = `http://${config.host}:${config.port}/edu-sharing/`;
    console.log(`[mock] REST API on ${base}rest`);
    if (config.apiOnly) {
        console.log('[mock] --api-only: the application itself is not served');
    } else {
        console.log(`[mock] application from ${config.distDir} on ${base}`);
    }
});
