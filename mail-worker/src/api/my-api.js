import app from '../hono/hono';
import userService from '../service/user-service';
import result from '../model/result';
import userContext from '../security/user-context';

app.get('/my/loginUserInfo', async (c) => {
	const user = await userService.loginUserInfo(c, userContext.getUserId(c));
	return c.json(result.ok(user));
});

app.put('/my/resetPassword', async (c) => {
	await userService.resetPassword(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/my/delete', async (c) => {
	await userService.delete(c, userContext.getUserId(c));
	return c.json(result.ok());
});

// User locale preference
app.get('/my/locale', async (c) => {
	const userId = userContext.getUserId(c);
	const res = await c.env.kv.get(`user_locale_${userId}`);
	return c.json(result.ok(res || 'en'));
});

app.post('/my/locale', async (c) => {
	const userId = userContext.getUserId(c);
	const { locale } = await c.req.json().catch(() => ({}));
	if (locale) {
		await c.env.kv.put(`user_locale_${userId}`, locale);
	}
	return c.json(result.ok(locale));
});

// User wallpaper preference
app.get('/my/wallpaper', async (c) => {
	const userId = userContext.getUserId(c);
	const res = await c.env.kv.get(`user_wallpaper_${userId}`);
	return c.json(result.ok(res ? JSON.parse(res) : null));
});

app.post('/my/wallpaper', async (c) => {
	const userId = userContext.getUserId(c);
	const body = await c.req.json().catch(() => ({}));
	await c.env.kv.put(`user_wallpaper_${userId}`, JSON.stringify(body));
	return c.json(result.ok(body));
});

// User security settings & auto-lock
app.get('/my/security', async (c) => {
	const userId = userContext.getUserId(c);
	const sec = await c.env.kv.get(`user_security_${userId}`);
	const defaultSec = {
		autoLockMinutes: 0,
		twoFactorEnabled: false,
		passkeyEnabled: false,
		backupEmail: '',
		securityScore: 85
	};
	return c.json(result.ok(sec ? JSON.parse(sec) : defaultSec));
});

app.post('/my/security', async (c) => {
	const userId = userContext.getUserId(c);
	const body = await c.req.json().catch(() => ({}));
	await c.env.kv.put(`user_security_${userId}`, JSON.stringify(body));
	return c.json(result.ok(body));
});

// Additional privacy & log endpoints
app.get('/my/loginLog', async (c) => {
	return c.json(result.ok([]));
});

app.get('/my/recovery-codes/status', async (c) => {
	return c.json(result.ok({ generated: false }));
});

app.get('/my/passkey/list', async (c) => {
	return c.json(result.ok([]));
});

app.get('/my/sessions', async (c) => {
	return c.json(result.ok([]));
});

app.get('/security/score', async (c) => {
	return c.json(result.ok({ score: 95 }));
});
