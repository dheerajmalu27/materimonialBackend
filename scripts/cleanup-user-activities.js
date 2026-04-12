import { sequelize } from '../src/models/index.js';
import { cleanupOldUserActivities } from '../src/services/userActivity.service.js';

const run = async () => {
  const retentionDays = process.env.USER_ACTIVITY_RETENTION_DAYS || '180';

  try {
    await sequelize.authenticate();

    const result = await cleanupOldUserActivities({ retentionDays });

    console.log('[user-activities-cleanup] completed', result);
    process.exit(0);
  } catch (error) {
    console.error('[user-activities-cleanup] failed', error?.message || error);
    process.exit(1);
  }
};

run();
