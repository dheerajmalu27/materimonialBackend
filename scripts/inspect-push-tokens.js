import models, { sequelize } from '../src/models/index.js';

const run = async () => {
  await sequelize.authenticate();

  const rows = await models.UserPushToken.findAll({
    order: [['updatedAt', 'DESC']],
    limit: 50,
    raw: true,
  });

  console.log('TOKENS_COUNT', rows.length);
  for (const row of rows) {
    const token = String(row.fcmToken || row.fcm_token || '');
    const masked = token ? `${token.slice(0, 14)}...${token.slice(-8)}` : 'N/A';
    console.log(`userId=${row.userId} token=${masked} updatedAt=${row.updatedAt}`);
  }
};

run()
  .catch((error) => {
    console.error('INSPECT_FAILED', error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
