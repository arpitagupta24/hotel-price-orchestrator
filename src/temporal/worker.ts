import path from 'path';
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';
import { HOTEL_TASK_QUEUE } from './constants';

async function main(): Promise<void> {
  const address = process.env.TEMPORAL_ADDRESS ?? '127.0.0.1:7233';
  const connection = await NativeConnection.connect({ address });
  const workflowsPath = path.join(__dirname, __filename.endsWith('.ts') ? 'workflows.ts' : 'workflows.js');

  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: HOTEL_TASK_QUEUE,
    workflowsPath,
    activities,
  });

  await worker.run();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
