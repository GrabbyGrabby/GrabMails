import { Hono } from 'hono';
const app = new Hono();

import result from '../model/result';
import { cors } from 'hono/cors';
import emailUtils from '../utils/email-utils';

app.use('*', async (c, next) => {
	await next();
	c.header('X-Content-Type-Options', 'nosniff');
	c.header('Referrer-Policy', 'no-referrer');
	c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	if (!c.req.path.startsWith('/telegram/getEmail/')) {
		c.header('X-Frame-Options', 'DENY');
	}
});

app.use('*', cors({
	origin: (origin, c) => {
		if (!origin) return undefined;
		try {
			const reqOrigin = new URL(c.req.url).origin;
			if (origin === reqOrigin) return origin;
			const originUrl = new URL(origin);
			const domains = emailUtils.parseAllowedDomains(c.env?.domain);
			if (originUrl.protocol === 'https:' && domains.includes(originUrl.hostname.toLowerCase())) {
				return origin;
			}
			if ((originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') && /^https?:$/.test(originUrl.protocol)) {
				return origin;
			}
		} catch (e) {
			return undefined;
		}
		return undefined;
	},
	allowHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	maxAge: 86400
}));

app.onError((err, c) => {
	if (err.name === 'BizError') {
		console.log(err.message);
	} else {
		console.error(err);
	}

	if (err.message === `Cannot read properties of undefined (reading 'get')`) {
		return c.json(result.fail('KV数据库未绑定<br/>KV database not bound',502));
	}

	if (err.message === `Cannot read properties of undefined (reading 'put')`) {
		return c.json(result.fail('KV数据库未绑定<br/>KV database not bound',502));
	}

	if (err.message === `Cannot read properties of undefined (reading 'prepare')`) {
		return c.json(result.fail('D1数据库未绑定<br/>D1 database not bound',502));
	}

	if (err.message?.includes('D1_ERROR: no such column')) {
		return c.json(result.fail('请按照文档更新数据库<br/>Please update the database as documented',502));
	}

	if (err.name === 'BizError') {
		return c.json(result.fail(err.message, err.code));
	}

	return c.json(result.fail('Internal server error', 500));
});

export default app;


