import { Op } from 'sequelize';
import UserActivity from '../models/userActivity.model.js';

export const PRESERVED_USER_ACTIVITY_ACTIONS = [
  'subscription_activated',
  'SUBSCRIPTION_ACTIVATED',
];

export const cleanupOldUserActivities = async ({
  retentionDays = 180,
  preserveActions = PRESERVED_USER_ACTIVITY_ACTIONS,
} = {}) => {
  const parsedRetention = Number.parseInt(String(retentionDays), 10);
  const safeRetentionDays = Number.isFinite(parsedRetention) && parsedRetention > 0 ? parsedRetention : 180;

  const cutoff = new Date(Date.now() - safeRetentionDays * 24 * 60 * 60 * 1000);

  const whereClause = {
    createdAt: {
      [Op.lt]: cutoff,
    },
  };

  if (Array.isArray(preserveActions) && preserveActions.length > 0) {
    whereClause.action = {
      [Op.notIn]: preserveActions,
    };
  }

  const deletedCount = await UserActivity.destroy({ where: whereClause });

  return {
    retentionDays: safeRetentionDays,
    cutoff: cutoff.toISOString(),
    deletedCount,
    preserveActions,
  };
};
