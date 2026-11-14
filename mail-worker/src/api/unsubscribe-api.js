import app from '../hono/hono';
import unsubscribeUtils from '../utils/unsubscribe-utils';
import suppressionService from '../service/suppression-service';
import result from '../model/result';

// RFC 8058 One-Click Unsubscribe (POST handler for email clients like Gmail and Yahoo)
app.post('/public/unsubscribe', async (c) => {
	const token = c.req.query('token');
	const emailParam = c.req.query('email');

	if (!token) {
		return c.text('Missing unsubscribe token', 400);
	}

	const verifiedEmail = await unsubscribeUtils.verifyToken(c, token, emailParam);
	if (!verifiedEmail) {
		return c.text('Invalid or expired unsubscribe token', 403);
	}

	await suppressionService.addSuppression(c, {
		email: verifiedEmail,
		type: 'unsubscribe',
		reason: 'RFC 8058 One-Click Unsubscribe from inbox'
	});

	return c.text('Unsubscribed successfully', 200);
});

// Human user click unsubscribe (GET handler showing a clean confirmation page)
app.get('/public/unsubscribe', async (c) => {
	const token = c.req.query('token');
	const emailParam = c.req.query('email');

	if (!token) {
		return c.html(`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<title>Unsubscribe Error</title>
				<style>
					body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
					.card { background: white; border-radius: 16px; padding: 40px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
					h1 { font-size: 22px; color: #ef4444; margin-bottom: 12px; }
					p { color: #64748b; line-height: 1.6; }
				</style>
			</head>
			<body>
				<div class="card">
					<h1>Invalid Request</h1>
					<p>No unsubscribe token was provided. If you followed a link, please check that the entire link was copied correctly.</p>
				</div>
			</body>
			</html>
		`, 400);
	}

	const verifiedEmail = await unsubscribeUtils.verifyToken(c, token, emailParam);
	if (!verifiedEmail) {
		return c.html(`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<title>Invalid Token</title>
				<style>
					body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
					.card { background: white; border-radius: 16px; padding: 40px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
					h1 { font-size: 22px; color: #ef4444; margin-bottom: 12px; }
					p { color: #64748b; line-height: 1.6; }
				</style>
			</head>
			<body>
				<div class="card">
					<h1>Link Expired or Invalid</h1>
					<p>This unsubscribe link could not be verified. Please contact support or update your notification preferences.</p>
				</div>
			</body>
			</html>
		`, 403);
	}

	await suppressionService.addSuppression(c, {
		email: verifiedEmail,
		type: 'unsubscribe',
		reason: 'Web one-click unsubscribe page'
	});

	return c.html(`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title>Unsubscribed Successfully</title>
			<style>
				body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
				.card { background: white; border-radius: 16px; padding: 40px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
				.icon { width: 56px; height: 56px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 28px; }
				h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
				p { color: #64748b; line-height: 1.6; font-size: 15px; margin-bottom: 24px; }
				.email-tag { display: inline-block; background: #f1f5f9; padding: 6px 14px; border-radius: 20px; font-weight: 600; color: #334155; font-size: 14px; word-break: break-all; }
			</style>
		</head>
		<body>
			<div class="card">
				<div class="icon">✓</div>
				<h1>Unsubscribed</h1>
				<p>You have successfully unsubscribed from this publication. You will no longer receive emails at:</p>
				<div class="email-tag">${verifiedEmail}</div>
			</div>
		</body>
		</html>
	`, 200);
});

// Admin API to query suppression list
app.get('/suppression/list', async (c) => {
	const data = await suppressionService.list(c, c.req.query());
	return c.json(result.ok(data));
});

// Admin API to manually delete from suppression list
app.delete('/suppression/delete', async (c) => {
	const email = c.req.query('email');
	const type = c.req.query('type') || null;
	await suppressionService.removeSuppression(c, email, type);
	return c.json(result.ok());
});
