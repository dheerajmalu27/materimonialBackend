import { sequelize } from '../src/models/index.js';
import { sendInterestReceivedPush } from '../src/services/pushNotification.service.js';

const targetUserId = Number(process.argv[2] || 51);
const senderId = Number(process.argv[3] || 1);
const senderName = process.argv[4] || 'Test Sender';

const run = async () => {
  await sequelize.authenticate();

  const result = await sendInterestReceivedPush({
    targetUserId,
    senderId,
    senderName,
  });

  console.log('PUSH_TEST_RESULT', JSON.stringify({ targetUserId, senderId, senderName, ...result }));
};

run()
  .catch((error) => {
    console.error('PUSH_TEST_FAILED', error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
