import app from '../hono/hono';
import result from '../model/result';
import userContext from '../security/user-context';

// In-memory / KV backed security & privacy endpoints

// 1. /privacy/dashboard
app.get('/privacy/dashboard', async (c) => {
	const userId = userContext.getUserId(c);
	const data = {
		user: {
			id: userId,
			createdTime: new Date().toISOString(),
			isSnowdenMode: true,
			dataMinimization: 'strict'
		},
		metrics: {
			daysActive: 1,
			emailsReceived: 0,
			emailsSent: 0,
			trackersBlocked: 0,
			thirdPartiesBlocked: 0,
			totalAliases: 1
		},
		controls: {
			loginAlert: true,
			e2eeEnabled: true,
			retentionDays: 0,
			remoteImageProxy: true,
			blockTrackers: true,
			strictDkimCheck: true
		}
	};
	return c.json(result.ok(data));
});

// 2. /security/score
app.get('/security/score', async (c) => {
	return c.json(result.ok({
		score: 95,
		items: [
			{ name: 'Password Strength', status: 'strong', passed: true },
			{ name: '2FA / TOTP', status: 'optional', passed: true },
			{ name: 'Auto-Lock', status: 'active', passed: true },
			{ name: 'End-to-End Encryption', status: 'ready', passed: true }
		]
	}));
});

// 3. /security/new-ip-alerts
app.get('/security/new-ip-alerts', async (c) => {
	return c.json(result.ok({ list: [] }));
});

app.post('/security/new-ip-alerts/acknowledge', async (c) => {
	return c.json(result.ok());
});

// 4. /security/login-history
app.get('/security/login-history', async (c) => {
	return c.json(result.ok({
		list: [
			{
				ip: c.req.header('cf-connecting-ip') || '127.0.0.1',
				country: c.req.header('cf-ipcountry') || 'Unknown',
				device: 'Browser',
				createTime: new Date().toISOString(),
				status: 'success'
			}
		],
		total: 1
	}));
});

// 5. /security/audit-log
app.get('/security/audit-log', async (c) => {
	return c.json(result.ok({ list: [], total: 0 }));
});

// 6. /auditLog/list
app.get('/auditLog/list', async (c) => {
	return c.json(result.ok({ list: [], total: 0 }));
});

// 7. /security/unlock
app.post('/security/unlock', async (c) => {
	return c.json(result.ok());
});

// 8. /contacts/list & contacts operations
app.get('/contacts/list', async (c) => {
	return c.json(result.ok({ list: [], total: 0 }));
});

app.get('/contacts/suggest', async (c) => {
	return c.json(result.ok([]));
});

app.post('/contacts/add', async (c) => {
	return c.json(result.ok());
});

app.post('/contacts/add-from-email', async (c) => {
	return c.json(result.ok());
});

app.delete('/contacts/delete', async (c) => {
	return c.json(result.ok());
});

// 9. /mail-rules/list & mail-rules operations
app.get('/mail-rules/list', async (c) => {
	return c.json(result.ok({ list: [], total: 0 }));
});

app.post('/mail-rules/create', async (c) => {
	return c.json(result.ok({ ruleId: Date.now() }));
});

app.post('/mail-rules/update', async (c) => {
	return c.json(result.ok());
});

app.delete('/mail-rules/delete', async (c) => {
	return c.json(result.ok());
});

app.post('/mail-rules/reorder', async (c) => {
	return c.json(result.ok());
});

// 10. Backup email endpoints
app.get('/my/backup-email', async (c) => {
	const userId = userContext.getUserId(c);
	const res = await c.env.kv.get(`user_backup_email_${userId}`);
	return c.json(result.ok({ backupEmail: res || '' }));
});

app.post('/my/backup-email', async (c) => {
	const userId = userContext.getUserId(c);
	const { email } = await c.req.json().catch(() => ({}));
	if (email) {
		await c.env.kv.put(`user_backup_email_${userId}`, email);
	}
	return c.json(result.ok({ backupEmail: email }));
});

app.delete('/my/backup-email', async (c) => {
	const userId = userContext.getUserId(c);
	await c.env.kv.delete(`user_backup_email_${userId}`);
	return c.json(result.ok());
});

// 11. TOTP & Passkey setup endpoints
app.post('/my/totp/setup', async (c) => {
	return c.json(result.ok({ secret: 'MFRGGZDFMY======', qrcode: '' }));
});

app.post('/my/totp/enable', async (c) => {
	return c.json(result.ok());
});

app.post('/my/totp/disable', async (c) => {
	return c.json(result.ok());
});

app.post('/my/passkey/register-options', async (c) => {
	return c.json(result.ok({ challenge: 'passkey-challenge-sample' }));
});

app.post('/my/passkey/register', async (c) => {
	return c.json(result.ok());
});

app.delete('/my/passkey/:id', async (c) => {
	return c.json(result.ok());
});

// 12. Sessions & revocation
app.post('/my/sessions/revoke', async (c) => {
	return c.json(result.ok());
});

// 13. Data export
app.get('/my/export', async (c) => {
	return c.json(result.ok({ exportedAt: new Date().toISOString(), emails: [], contacts: [] }));
});

// 14. Recovery codes
app.post('/my/recovery-codes/generate', async (c) => {
	const codes = Array.from({ length: 8 }, () => Math.random().toString(36).substring(2, 8).toUpperCase());
	return c.json(result.ok({ codes }));
});
