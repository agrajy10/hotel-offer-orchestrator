import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities/fetchHotels';
import { env } from './config/env';

const RETRY_DELAY_MS = 3000;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const log = (message: string): void => {
  console.log(`[worker] ${new Date().toISOString()} ${message}`);
};

const logError = (message: string, err?: unknown): void => {
  const detail = err instanceof Error ? err.message : err ? String(err) : '';
  console.error(`[worker] ${new Date().toISOString()} ${message}${detail ? ` — ${detail}` : ''}`);
};

const run = async (): Promise<void> => {
  log(`starting taskQueue=${env.taskQueue} temporal=${env.temporalAddress} namespace=${env.temporalNamespace}`);

  for (let attempt = 1; ; attempt += 1) {
    try {
      log(`connecting to temporal at ${env.temporalAddress} (attempt ${attempt})`);
      const connection = await NativeConnection.connect({
        address: env.temporalAddress,
      });
      log(`connected to temporal at ${env.temporalAddress}`);

      const worker = await Worker.create({
        connection,
        namespace: env.temporalNamespace,
        workflowsPath: require.resolve('./workflows/hotelOffers'),
        activities,
        taskQueue: env.taskQueue,
      });

      log(`READY — polling task queue "${env.taskQueue}"`);

      await worker.run();
      log('worker run() finished');
      return;
    } catch (err) {
      logError(`not ready (attempt ${attempt})`, err);
      log(`retrying in ${RETRY_DELAY_MS / 1000}s`);
      await sleep(RETRY_DELAY_MS);
    }
  }
};

process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down');
  process.exit(0);
});

run().catch((err) => {
  logError('CRASHED unexpectedly', err);
  process.exit(1);
});
