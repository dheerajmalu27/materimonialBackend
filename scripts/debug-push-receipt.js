/**
 * Check Expo push receipt to see if FCM/APNs actually delivered the notification.
 * Receipts are available ~15 seconds after ticket creation.
 * Usage: node scripts/debug-push-receipt.js <receiptId>
 * Example: node scripts/debug-push-receipt.js 019cf61b-1081-730f-ba58-3099fac6a478
 */

const receiptId = process.argv[2];

if (!receiptId) {
  console.error('Usage: node scripts/debug-push-receipt.js <receiptId>');
  process.exit(1);
}

const checkReceipt = async () => {
  console.log(`Checking receipt: ${receiptId}`);

  const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ ids: [receiptId] }),
  });

  console.log('HTTP_STATUS', response.status, response.statusText);

  const body = await response.text();
  console.log('\nRAW_RESPONSE:\n', body);

  try {
    const parsed = JSON.parse(body);
    const receipt = parsed?.data?.[receiptId];

    if (!receipt) {
      console.log('\nNo receipt found yet — receipts are available ~15-30 seconds after sending.');
      console.log('Run this script again in 30 seconds.');
      return;
    }

    console.log('\nRECEIPT:', JSON.stringify(receipt, null, 2));

    if (receipt.status === 'ok') {
      console.log('\n✅ FCM/APNs DELIVERED the notification to the device.');
      console.log('If the device still did not show it, the issue is on the device side (permissions, DND, app state).');
    } else if (receipt.status === 'error') {
      console.error('\n❌ FCM/APNs DELIVERY FAILED.');
      console.error('Error:', receipt.message);
      console.error('Details:', JSON.stringify(receipt.details, null, 2));

      if (receipt.details?.error === 'DeviceNotRegistered') {
        console.error('→ The push token is no longer valid on this device.');
        console.error('→ The app needs to be reopened to register a fresh token.');
      } else if (receipt.details?.error === 'InvalidCredentials') {
        console.error('→ The Expo project credentials are wrong.');
        console.error('→ The development build must have been built with matching Expo project credentials.');
      } else if (receipt.details?.error === 'MessageRateExceeded') {
        console.error('→ Too many pushes sent to this device recently.');
      }
    }
  } catch {
    console.error('Failed to parse receipt response as JSON');
  }
};

checkReceipt().catch((err) => {
  console.error('SCRIPT_ERROR', err?.message || err);
  process.exit(1);
});
