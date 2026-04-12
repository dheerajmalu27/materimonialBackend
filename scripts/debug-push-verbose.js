/**
 * Verbose push diagnostic — prints full Expo push API response.
 * Usage: node scripts/debug-push-verbose.js <targetUserId>
 * Example: node scripts/debug-push-verbose.js 1
 */
import models, { sequelize } from '../src/models/index.js';

const targetUserId = Number(process.argv[2] || 1);

const run = async () => {
  await sequelize.authenticate();

  const tokenRow = await models.UserPushToken.findOne({
    where: { userId: targetUserId },
    raw: true,
  });

  if (!tokenRow) {
    console.log(`NO_TOKEN  userId=${targetUserId}`);
    return;
  }

  const token = tokenRow.expoPushToken;
  console.log(`TOKEN     userId=${targetUserId} token=${token}`);
  console.log(`UPDATED   ${tokenRow.updatedAt}`);

  if (!token.startsWith('ExponentPushToken[')) {
    console.warn('INVALID_TOKEN_FORMAT — token does not start with ExponentPushToken[');
    return;
  }

  const payload = {
    to: token,
    sound: 'default',
    title: 'Debug Push Test',
    body: `Test push to userId ${targetUserId}`,
    priority: 'high',
    channelId: 'default',
    data: { type: 'interest_received', senderId: '1', senderName: 'Debug' },
  };

  console.log('\nSENDING payload:', JSON.stringify(payload, null, 2));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify(payload),
  });

  console.log('\nHTTP_STATUS', response.status, response.statusText);

  const body = await response.text();
  console.log('\nRAW_RESPONSE:\n', body);

  try {
    const parsed = JSON.parse(body);
    const result = Array.isArray(parsed?.data) ? parsed.data[0] : parsed;
    console.log('\nPARSED_RESULT:', JSON.stringify(result, null, 2));

    if (result?.status === 'error') {
      console.error('\nPUSH_ERROR:', result.message || result.details?.error);
    } else if (result?.status === 'ok') {
      console.log('\nPUSH_OK — receipt id:', result.id);
      console.log('Notification is in Expo delivery queue. Check receipt to confirm FCM/APNs delivery:');
      console.log(`  node scripts/debug-push-receipt.js ${result.id}`);
    }
  } catch {
    console.error('Failed to parse Expo response as JSON');
  }
};

run()
  .catch((err) => {
    console.error('SCRIPT_ERROR', err?.message || err);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
