import app from './hono/webs';
import { email } from './email/email';
import userService from './service/user-service';
import verifyRecordService from './service/verify-record-service';
import emailService from './service/email-service';
import r2Service from './service/r2-service';
import oauthService from './service/oauth-service';
import analysisService from './service/analysis-service';
export default {
	 async fetch(req, env, ctx) {

		const url = new URL(req.url)

		// AI Markdown content negotiation & direct markdown routes
		const acceptHeader = req.headers.get('accept') || '';
		const wantsMarkdown = acceptHeader.includes('text/markdown') && !acceptHeader.includes('text/html');

		if (url.pathname === '/research/email-privacy-study-2026.md' || (wantsMarkdown && url.pathname === '/research/email-privacy-study-2026')) {
			const mdReq = new Request(new URL('/research-email-privacy-study-2026.md', req.url), req);
			const resp = await env.assets.fetch(mdReq);
			return new Response(resp.body, {
				headers: {
					'Content-Type': 'text/markdown; charset=utf-8',
					'X-Robots-Tag': 'noindex, follow'
				}
			});
		}

		if (url.pathname === '/faq.md' || (wantsMarkdown && url.pathname === '/faq')) {
			const mdReq = new Request(new URL('/faq.md', req.url), req);
			const resp = await env.assets.fetch(mdReq);
			return new Response(resp.body, {
				headers: {
					'Content-Type': 'text/markdown; charset=utf-8',
					'X-Robots-Tag': 'noindex, follow'
				}
			});
		}

		if (url.pathname === '/index.md' || (wantsMarkdown && (url.pathname === '/' || url.pathname === ''))) {
			const mdReq = new Request(new URL('/index.md', req.url), req);
			const resp = await env.assets.fetch(mdReq);
			return new Response(resp.body, {
				headers: {
					'Content-Type': 'text/markdown; charset=utf-8',
					'X-Robots-Tag': 'noindex, follow'
				}
			});
		}

		if (url.pathname.startsWith('/api/')) {
			url.pathname = url.pathname.replace('/api', '')
			req = new Request(url.toString(), req)
			return app.fetch(req, env, ctx);
		}

		if (url.pathname.startsWith('/oss/')) {
			const key = url.pathname.slice('/oss/'.length);
			const resp = await r2Service.toObjResp({ env }, key);
			return resp || new Response('Not Found', { status: 404 });
		}

		 if (['/static/','/attachments/'].some(p => url.pathname.startsWith(p))) {
			 const resp = await r2Service.toObjResp({ env }, url.pathname.substring(1));
			 return resp || new Response('Not Found', { status: 404 });
		 }

		return env.assets.fetch(req);
	},
	email: email,
	async scheduled(c, env, ctx) {
		if (c.cron === '*/30 * * * *') {
			await analysisService.refreshEchartsCache({ env })
			return;
		}

		await verifyRecordService.clearRecord({ env })
		await userService.resetDaySendCount({ env })
		await emailService.completeReceiveAll({ env })
		await emailService.autoClean({ env })
		await analysisService.refreshEchartsCache({ env })
		await oauthService.clearNoBindOathUser({ env })
	},
};

