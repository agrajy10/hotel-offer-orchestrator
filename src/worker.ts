import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities/fetchHotels';
import { env } from './config/env';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const run = async (): Promise<void> => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const connection = await NativeConnection.connect({
        address: env.temporalAddress,
      });

      const worker = await Worker.create({
        connection,
        namespace: env.temporalNamespace,
        workflowsPath: require.resolve('./workflows/hotelOffers'),
        activities,
        taskQueue: env.taskQueue,
      });

      console.log(
        `Temporal worker connected to ${env.temporalAddress} namespace=${env.temporalNamespace} taskQueue=${env.taskQueue}`
      );

      await worker.run();
      return;
    } catch (err) {
      console.error(`Worker failed to start (attempt ${attempt}):`, err);
      await sleep(3000);
    }
  }
};

run().catch((err) => {
  console.error('Worker crashed:', err);
  process.exit(1);
});
