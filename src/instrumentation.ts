const globalForScheduler = globalThis as unknown as {
  backupSchedulerStarted?: boolean;
};

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  if (globalForScheduler.backupSchedulerStarted) {
    return;
  }
  globalForScheduler.backupSchedulerStarted = true;

  const { checkAndRunScheduledBackup } = await import('@/lib/backup');

  // Initial check 60 seconds after boot so server startup stays fast
  const initialTimer = setTimeout(() => {
    checkAndRunScheduledBackup().catch((err) =>
      console.error('Initial scheduled backup check error:', err)
    );
  }, 60 * 1000);
  initialTimer.unref?.();

  // Check every hour whether a daily/weekly rotating backup is due
  const interval = setInterval(() => {
    checkAndRunScheduledBackup().catch((err) =>
      console.error('Hourly scheduled backup check error:', err)
    );
  }, 60 * 60 * 1000);
  interval.unref?.();

  console.log('Rotating auto-backup scheduler registered (hourly check).');
}
