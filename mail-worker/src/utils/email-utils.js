import { parseHTML } from 'linkedom';

const emailUtils = {

	getDomain(email) {
		if (typeof email !== 'string') return '';
		const parts = email.split('@');
		return parts.length === 2 ? parts[1] : '';
	},

	parseAllowedDomains(envDomain) {
		if (Array.isArray(envDomain)) {
			return envDomain.map(d => String(d).trim().toLowerCase()).filter(Boolean);
		}
		if (typeof envDomain === 'string') {
			try {
				const parsed = JSON.parse(envDomain);
				if (Array.isArray(parsed)) {
					return parsed.map(d => String(d).trim().toLowerCase()).filter(Boolean);
				}
			} catch (e) {
				return envDomain.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
			}
		}
		return [];
	},

	isAllowedDomain(envDomain, email) {
		const domain = this.getDomain(email).toLowerCase();
		if (!domain) return false;
		const domains = this.parseAllowedDomains(envDomain);
		return domains.includes(domain);
	},

	getName(email) {
		if (typeof email !== 'string') return '';
		const parts = email.trim().split('@');
		return parts.length === 2 ? parts[0] : '';
	},

	getBaseEmail(email) {
		const parts = email.split('@');
		if (parts.length !== 2) return '';
		const localPart = parts[0].split('+')[0];
		return localPart + '@' + parts[1];
	},

	formatText(text) {
		if (!text) return ''
		return text
			.split('\n')
			.map(line => {
				return line.replace(/[\u200B-\u200F\uFEFF\u034F\u200B-\u200F\u00A0\u3000\u00AD]/g, '')
					.replace(/\s+/g, ' ')
					.trim();
			})
			.join('\n')
			.replace(/\n{3,}/g, '\n')
			.trim();
	},

	htmlToText(content) {
		if (!content) return ''
		try {
			const wrappedContent = content.includes('<body')
				? content
				: `<!DOCTYPE html><html><body>${content}</body></html>`;
			const { document } = parseHTML(wrappedContent);
			document.querySelectorAll('style, script, title').forEach(el => el.remove());
			let text = document.body.innerText;
			return this.formatText(text);
		} catch (e) {
			console.error(e)
			return ''
		}
	}
};

export default emailUtils;
