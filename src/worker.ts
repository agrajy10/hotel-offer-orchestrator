import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities/fetchHotels';
import { env } from './config/env';

const run = async (): Promise<void> => {
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
};

run().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
