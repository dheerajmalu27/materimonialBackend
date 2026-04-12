import models, { sequelize } from '../src/models/index.js';
import { logActivity } from '../src/utils/activityLogger.js';

const userId = Number(process.argv[2] || 51);

const run = async () => {
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + 365 * 24 * 60 * 60 * 1000);

  const description = {
    planCode: 'premium_yearly',
    planName: 'Premium',
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    amountInr: 0,
    amountInPaise: 0,
    currency: 'INR',
    razorpayOrderId: `manual_override_user_${userId}`,
    razorpayPaymentId: `manual_override_user_${userId}`,
    activatedVia: 'manual_admin_override',
  };

  await sequelize.authenticate();

  const user = await models.User.findByPk(userId);
  if (!user) {
    console.error(`USER_NOT_FOUND: ${userId}`);
    process.exitCode = 2;
    return;
  }

  await logActivity({
    userId,
    action: 'subscription_activated',
    description,
  });

  const latest = await models.UserActivity.findOne({
    where: { userId },
    order: [['id', 'DESC']],
  });

  console.log('UPDATED_USER', userId);
  console.log('LATEST_ACTION', latest?.action || 'N/A');
  console.log('LATEST_DESCRIPTION', latest?.description || 'N/A');
};

run()
  .catch((error) => {
    console.error('UPDATE_FAILED', error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
