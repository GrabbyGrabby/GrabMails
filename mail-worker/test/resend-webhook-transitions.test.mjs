import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveResendWebhookTransition } from '../src/utils/resend-webhook-transitions.mjs';

const EMAIL_STATUS = {
	RECEIVE: 0,
	SENT: 1,
	DELIVERED: 2,
	BOUNCED: 3,
	COMPLAINED: 4,
	DELAYED: 5,
	SAVING: 6,
	NOONE: 7,
	FAILED: 8
};

test('ignores events without data.email_id', () => {
	assert.equal(resolveResendWebhookTransition(null, EMAIL_STATUS), null);
	assert.equal(resolveResendWebhookTransition({ type: 'email.delivered', data: {} }, EMAIL_STATUS), null);
});

test('ignores unknown or informational events so status cannot regress to SENT', () => {
	assert.equal(
		resolveResendWebhookTransition({ type: 'email.sent', data: { email_id: 'em_1' } }, EMAIL_STATUS),
		null
	);
	assert.equal(
		resolveResendWebhookTransition({ type: 'email.opened', data: { email_id: 'em_1' } }, EMAIL_STATUS),
		null
	);
});

test('email.delivery_delayed only transitions from SENT or DELAYED', () => {
	const result = resolveResendWebhookTransition(
		{ type: 'email.delivery_delayed', data: { email_id: 'em_2' } },
		EMAIL_STATUS
	);
	assert.deepEqual(result, {
		resendEmailId: 'em_2',
		status: EMAIL_STATUS.DELAYED,
		allowedFrom: [EMAIL_STATUS.SENT, EMAIL_STATUS.DELAYED],
		message: null
	});
	assert.equal(result.allowedFrom.includes(EMAIL_STATUS.DELIVERED), false);
});

test('email.delivered only transitions from SENT or DELAYED', () => {
	const result = resolveResendWebhookTransition(
		{ type: 'email.delivered', data: { email_id: 'em_3' } },
		EMAIL_STATUS
	);
	assert.deepEqual(result, {
		resendEmailId: 'em_3',
		status: EMAIL_STATUS.DELIVERED,
		allowedFrom: [EMAIL_STATUS.SENT, EMAIL_STATUS.DELAYED],
		message: null
	});
	assert.equal(result.allowedFrom.includes(EMAIL_STATUS.BOUNCED), false);
});

test('email.bounced serializes bounce payload and preserves forward-only allowedFrom', () => {
	const bounce = { message: 'Mailbox unavailable' };
	const result = resolveResendWebhookTransition(
		{ type: 'email.bounced', data: { email_id: 'em_4', bounce } },
		EMAIL_STATUS
	);
	assert.deepEqual(result, {
		resendEmailId: 'em_4',
		status: EMAIL_STATUS.BOUNCED,
		allowedFrom: [EMAIL_STATUS.SENT, EMAIL_STATUS.DELAYED, EMAIL_STATUS.DELIVERED],
		message: JSON.stringify(bounce)
	});
});

test('email.failed captures failure reason without overwriting terminal states', () => {
	const result = resolveResendWebhookTransition(
		{ type: 'email.failed', data: { email_id: 'em_5', failed: { reason: 'Suppressed recipient' } } },
		EMAIL_STATUS
	);
	assert.deepEqual(result, {
		resendEmailId: 'em_5',
		status: EMAIL_STATUS.FAILED,
		allowedFrom: [EMAIL_STATUS.SENT, EMAIL_STATUS.DELAYED],
		message: 'Suppressed recipient'
	});
});
