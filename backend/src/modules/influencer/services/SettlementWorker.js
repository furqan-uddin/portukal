import { SettlementService } from './SettlementService.js';

let isRunning = false;

/**
 * Settlement Background Worker (Runs Settlement Engine periodically)
 */
export const startSettlementWorker = (intervalMs = 60 * 60 * 1000) => {
    console.log(`[SettlementWorker] Background Settlement Cron Initialized (Interval: ${intervalMs / 1000}s)`);

    const execute = async () => {
        if (isRunning) {
            console.log('[SettlementWorker] Previous settlement job is still running. Skipping cycle.');
            return;
        }

        isRunning = true;
        try {
            console.log('[SettlementWorker] Running scheduled settlement batch...');
            const batch = await SettlementService.runSettlementBatch();
            console.log(`[SettlementWorker] Batch ${batch.batchId} completed. Processed: ${batch.processedOrders}, Settled: ${batch.successful}, Failed: ${batch.failed}`);
        } catch (err) {
            console.error('[SettlementWorker] Error in background settlement job:', err);
        } finally {
            isRunning = false;
        }
    };

    // Run initial check after 10s startup, then periodically
    setTimeout(execute, 10000);
    setInterval(execute, intervalMs);
};
