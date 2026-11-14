import test from 'node:test';
import assert from 'node:assert/strict';
import { isDisposableDomain } from '../src/utils/disposable-domains.js';
import unsubscribeUtils from '../src/utils/unsubscribe-utils.js';

test('isDisposableDomain correctly detects burner email domains', () => {
	assert.equal(isDisposableDomain('test@mailinator.com'), true);
	assert.equal(isDisposableDomain('random@tempmail.com'), true);
	assert.equal(isDisposableDomain('spammer@10minutemail.com'), true);
	assert.equal(isDisposableDomain('user@guerrillamail.com'), true);
	assert.equal(isDisposableDomain('user@sharklasers.com'), true);
	assert.equal(isDisposableDomain('user@yopmail.com'), true);

	// Legitimate domains should not be blocked
	assert.equal(isDisposableDomain('user@gmail.com'), false);
	assert.equal(isDisposableDomain('shiva@grabby.qzz.io'), false);
	assert.equal(isDisposableDomain('founder@acme.org'), false);
	assert.equal(isDisposableDomain(''), false);
	assert.equal(isDisposableDomain(null), false);
});

test('unsubscribeUtils generates and verifies RFC 8058 HMAC tokens', async () => {
	const mockContext = {
		env: {
			jwt_secret: 'test-secret-key-12345'
		}
	};

	const email = 'subscriber@example.com';
	const token = await unsubscribeUtils.generateToken(mockContext, email);

	assert.ok(token);
	assert.equal(typeof token, 'string');
	assert.equal(token.includes('.'), true);

	// Verification with correct email
	const verifiedEmail = await unsubscribeUtils.verifyToken(mockContext, token, email);
	assert.equal(verifiedEmail, email);

	// Verification without email param should extract email from token
	const extractedEmail = await unsubscribeUtils.verifyToken(mockContext, token);
	assert.equal(extractedEmail, email);

	// Verification with mismatched email should fail
	const mismatchResult = await unsubscribeUtils.verifyToken(mockContext, token, 'other@example.com');
	assert.equal(mismatchResult, null);

	// Verification with tampered token should fail
	const tamperedToken = token.slice(0, -4) + 'abcd';
	const tamperedResult = await unsubscribeUtils.verifyToken(mockContext, tamperedToken, email);
	assert.equal(tamperedResult, null);
});
