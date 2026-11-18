import BizError from '../error/biz-error';
import settingService from './setting-service';
import { t } from '../i18n/i18n'

const turnstileService = {

	async verify(c, token) {

		const settingRow = await settingService.query(c)

		if (
			typeof settingRow.siteKey !== 'string' || !settingRow.siteKey.trim() ||
			typeof settingRow.secretKey !== 'string' || !settingRow.secretKey.trim()
		) {
			return;
		}

		if (!token) {
			throw new BizError(t('emptyBotToken'),400);
		}

		const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				secret: settingRow.secretKey.trim(),
				response: token,
				remoteip: c.req.header('cf-connecting-ip')
			})
		});

		const result = await res.json();

		if (!result.success) {
			throw new BizError(t('botVerifyFail'),400)
		}
	}
};

export default turnstileService;
