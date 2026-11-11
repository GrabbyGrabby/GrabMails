import r2Service from '../service/r2-service';
import app from '../hono/hono';

app.get('/oss/*', async (c) => {
	const rawKey = c.req.path.split('/oss/')[1] || '';
	const key = r2Service.validatePublicKey(rawKey);
	if (!key) {
		return c.text('Forbidden', 403);
	}
	const resp = await r2Service.toObjResp(c, key);
	if (!resp) {
		return c.notFound();
	}
	return resp;
});


