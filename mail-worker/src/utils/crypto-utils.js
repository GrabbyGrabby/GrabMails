const encoder = new TextEncoder();

const saltHashUtils = {

	generateSalt(length = 16) {
		const array = new Uint8Array(length);
		crypto.getRandomValues(array);
		return btoa(String.fromCharCode(...array));
	},


	async hashPassword(password) {
		const salt = this.generateSalt();
		const hash = await this.genHashPassword(password, salt);
		return { salt, hash };
	},

	async genHashPassword(password, salt) {
		const data = encoder.encode(salt + password);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return btoa(String.fromCharCode(...hashArray));
	},

	async verifyPassword(inputPassword, salt, storedHash) {
		if (typeof inputPassword !== 'string' || typeof salt !== 'string' || typeof storedHash !== 'string') {
			return false;
		}
		const hash = await this.genHashPassword(inputPassword, salt);
		return await this.timingSafeEqual(hash, storedHash);
	},

	async timingSafeEqual(a, b) {
		if (typeof a !== 'string' || typeof b !== 'string') {
			return false;
		}
		const [digestA, digestB] = await Promise.all([
			crypto.subtle.digest('SHA-256', encoder.encode(a)),
			crypto.subtle.digest('SHA-256', encoder.encode(b))
		]);
		return crypto.subtle.timingSafeEqual(digestA, digestB);
	},

	genRandomPwd(length = 12) {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const maxByte = 256 - (256 % chars.length);
		let result = '';
		const buf = new Uint8Array(Math.max(length * 2, 32));
		while (result.length < length) {
			crypto.getRandomValues(buf);
			for (let i = 0; i < buf.length && result.length < length; i++) {
				if (buf[i] < maxByte) {
					result += chars.charAt(buf[i] % chars.length);
				}
			}
		}
		return result;
	}
};

export default saltHashUtils;
