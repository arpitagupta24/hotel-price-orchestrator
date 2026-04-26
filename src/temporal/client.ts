import { Client, Connection } from '@temporalio/client';
import { hotelOrchestrationWorkflow } from './workflows';
import { HOTEL_TASK_QUEUE, HOTEL_WORKFLOW_ID_PREFIX } from './constants';
import type { OrchestratedHotel } from '../types/hotel';

let temporalClient: Client | null = null;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getClient(): Promise<Client> {
  if (!temporalClient) {
    const address = process.env.TEMPORAL_ADDRESS ?? '127.0.0.1:7233';
    let lastError: unknown;
    const maxAttempts = 8;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const connection = await Connection.connect({ address });
        temporalClient = new Client({ connection, namespace: 'default' });
        break;
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await sleep(1500);
        }
      }
    }

    if (!temporalClient) {
      throw lastError instanceof Error
        ? new Error(`Temporal unavailable at ${address}: ${lastError.message}`)
        : new Error(`Temporal unavailable at ${address}`);
    }
  }
  return temporalClient;
}

export async function runHotelOrchestration(city: string): Promise<OrchestratedHotel[]> {
  const client = await getClient();
  const workflowId = `${HOTEL_WORKFLOW_ID_PREFIX}:${city.trim().toLowerCase()}:${Date.now()}`;
  const handle = await client.workflow.start(hotelOrchestrationWorkflow, {
    taskQueue: HOTEL_TASK_QUEUE,
    workflowId,
    args: [city],
  });
  return handle.result();
}
