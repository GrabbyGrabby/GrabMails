const encoder = new TextEncoder();

const base64url = (input) => {
	const str = btoa(String.fromCharCode(...new Uint8Array(input)));
	return str.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const base64urlDecode = (str) => {
	str = str.replace(/-/g, '+').replace(/_/g, '/');
	while (str.length % 4) str += '=';
	return Uint8Array.from(atob(str), c => c.charCodeAt(0));
};

const unsubscribeUtils = {
	async generateToken(c, email) {
		const secret = c.env.jwt_secret || 'grabmail_unsub_secret';
		const cleanEmail = email.trim().toLowerCase();
		const data = `${cleanEmail}:${Date.now()}`;

		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(secret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign']
		);

		const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
		const sigStr = base64url(signature);
		const dataStr = base64url(encoder.encode(data));

		return `${dataStr}.${sigStr}`;
	},

	async verifyToken(c, token, expectedEmail = null) {
		if (!token || typeof token !== 'string') return null;
		const parts = token.split('.');
		if (parts.length !== 2) return null;

		const [dataStr, sigStr] = parts;
		const secret = c.env.jwt_secret || 'grabmail_unsub_secret';

		try {
			const key = await crypto.subtle.importKey(
				'raw',
				encoder.encode(secret),
				{ name: 'HMAC', hash: 'SHA-256' },
				false,
				['verify']
			);

			const signatureBytes = base64urlDecode(sigStr);
			const valid = await crypto.subtle.verify(
				'HMAC',
				key,
				signatureBytes,
				encoder.encode(new TextDecoder().decode(base64urlDecode(dataStr)))
			);

			if (!valid) return null;

			const decodedData = new TextDecoder().decode(base64urlDecode(dataStr));
			const [email] = decodedData.split(':');

			if (expectedEmail && email.toLowerCase() !== expectedEmail.toLowerCase()) {
				return null;
			}

			return email;
		} catch (e) {
			return null;
		}
	}
};

export default unsubscribeUtils;
