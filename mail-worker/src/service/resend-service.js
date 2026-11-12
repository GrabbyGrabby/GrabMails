import emailService from './email-service';
import settingService from './setting-service';
import { emailConst } from '../const/entity-const';
import { resolveResendWebhookTransition } from '../utils/resend-webhook-transitions.mjs';

const encoder = new TextEncoder();

function decodeSecretKey(secret) {
	const trimmed = String(secret || '').trim();
	if (!trimmed) return null;
	if (trimmed.startsWith('whsec_')) {
		const b64 = trimmed.slice('whsec_'.length);
		const raw = atob(b64);
		const bytes = new Uint8Array(raw.length);
		for (let i = 0; i < raw.length; i++) {
			bytes[i] = raw.charCodeAt(i);
		}
		return bytes;
	}
	return encoder.encode(trimmed);
}

function base64ToUint8Array(b64) {
	const raw = atob(b64);
	const bytes = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) {
		bytes[i] = raw.charCodeAt(i);
	}
	return bytes;
}

const resendService = {

	async verifyWebhookSignature(c, rawBody, { svixId, svixTimestamp, svixSignature }) {
		try {
			const settingRow = await settingService.query(c).catch(() => null);
			const webhookSecret = c.env.RESEND_WEBHOOK_SECRET || settingRow?.webhookSecret;
			const keyBytes = decodeSecretKey(webhookSecret);
			if (!keyBytes || !svixId || !svixTimestamp || !svixSignature) {
				return false;
			}

			const ts = Number(svixTimestamp);
			const now = Math.floor(Date.now() / 1000);
			if (!Number.isFinite(ts) || Math.abs(now - ts) > 300) {
				return false;
			}

			const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
			const key = await crypto.subtle.importKey(
				'raw',
				keyBytes,
				{ name: 'HMAC', hash: 'SHA-256' },
				false,
				['sign']
			);
			const expectedSig = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent)));

			const signatures = String(svixSignature).split(' ').map(s => s.trim()).filter(Boolean);
			for (const sigEntry of signatures) {
				const [version, b64Sig] = sigEntry.split(',');
				if (version !== 'v1' || !b64Sig) continue;
				try {
					const actualSig = base64ToUint8Array(b64Sig);
					if (actualSig.length === expectedSig.length && crypto.subtle.timingSafeEqual(actualSig, expectedSig)) {
						return true;
					}
				} catch (e) {
					continue;
				}
			}
			return false;
		} catch (e) {
			console.error('Webhook signature verification error:', e);
			return false;
		}
	},

	async webhooks(c, body) {
		const params = resolveResendWebhookTransition(body, emailConst.status);
		if (!params) {
			return;
		}

		const emailRow = await emailService.updateEmailStatus(c, params);

		if (!emailRow) {
			// 未知邮件事件或非法的逆向/重复状态跃迁：记录日志后正常返回，
			// 避免 Resend 因连续收到 500 而熔断关闭 Webhook
			console.warn(`resend webhook: skipped or unknown email_id ${params.resendEmailId}, type ${body.type}`);
			return;
		}

	}
}

export default resendService
