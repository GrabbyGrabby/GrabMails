import s3Service from './s3-service';
import settingService from './setting-service';
import kvObjService from './kv-obj-service';
import constant from '../const/constant';

const SAFE_PUBLIC_PREFIXES = [constant.ATTACHMENT_PREFIX, 'static/'];

const r2Service = {

	validatePublicKey(rawKey) {
		if (!rawKey || typeof rawKey !== 'string') {
			return null;
		}
		let decoded;
		try {
			decoded = decodeURIComponent(rawKey);
		} catch (e) {
			return null;
		}
		const normalized = decoded.replace(/^\/+/, '');
		if (
			!normalized ||
			normalized.includes('\0') ||
			normalized.includes('\\') ||
			normalized.includes('..') ||
			normalized.split('/').some(seg => seg === '.' || seg === '..')
		) {
			return null;
		}
		if (!SAFE_PUBLIC_PREFIXES.some(prefix => normalized.startsWith(prefix))) {
			return null;
		}
		return normalized;
	},

	buildSafeObjectHeaders(key, meta = {}) {
		const contentType = meta.contentType || 'application/octet-stream';
		const isAttachment = key.startsWith(constant.ATTACHMENT_PREFIX);
		const isSafeRasterImage = /^image\/(png|jpeg|jpg|gif|webp|bmp|avif)$/i.test(contentType.split(';')[0].trim());
		const headers = new Headers();
		headers.set('Content-Type', isAttachment && !isSafeRasterImage && /html|svg|xml|javascript/i.test(contentType)
			? 'application/octet-stream'
			: contentType);
		headers.set('X-Content-Type-Options', 'nosniff');
		if (isAttachment) {
			headers.set('Content-Security-Policy', "default-src 'none'; sandbox");
		}
		if (meta.contentDisposition) {
			if (isAttachment && !isSafeRasterImage) {
				const fnMatch = String(meta.contentDisposition).match(/filename[^;=\n]*=(["']?)(.*?)\1(?:;|$)/i);
				const safeName = (fnMatch?.[2] || 'attachment').replace(/[\r\n"\\;]/g, '_');
				headers.set('Content-Disposition', `attachment; filename="${safeName}"`);
			} else {
				headers.set('Content-Disposition', String(meta.contentDisposition).replace(/[\r\n]/g, ''));
			}
		}
		if (meta.cacheControl) {
			headers.set('Cache-Control', String(meta.cacheControl).replace(/[\r\n]/g, ''));
		}
		return headers;
	},

	async storageType(c) {

		const setting = await settingService.query(c);
		const { bucket, endpoint, s3AccessKey, s3SecretKey } = setting;

		if (!!(bucket && endpoint && s3AccessKey && s3SecretKey)) {
			return 'S3';
		}

		if (c.env.r2) {
			return 'R2';
		}

		return 'KV';
	},

	async putObj(c, key, content, metadata) {

		const storageType = await this.storageType(c);

		if (storageType === 'KV') {
			await kvObjService.putObj(c, key, content, metadata);
		}

		if (storageType === 'R2') {
			await c.env.r2.put(key, content, {
				httpMetadata: { ...metadata }
			});
		}

		if (storageType === 'S3') {
			await s3Service.putObj(c, key, content, metadata);
		}

	},

	async getObj(c, key) {
		const storageType = await this.storageType(c);

		if (storageType === 'KV') {
			return await kvObjService.getObj(c, key);
		}

		if (storageType === 'R2') {
			return await c.env.r2.get(key);
		}

		if (storageType === 'S3') {
			return await s3Service.getObj(c, key);
		}
	},

	/**
	 * Always returns a Response (or null if missing) so HTTP handlers
	 * can serve KV / R2 / S3 the same way.
	 */
	async toObjResp(c, rawKey) {
		try {
			const key = this.validatePublicKey(rawKey);
			if (!key) {
				return null;
			}

			const storageType = await this.storageType(c);

			if (storageType === 'KV') {
				const obj = await kvObjService.getRawObj(c, key);
				if (!obj) return null;
				return new Response(obj.value, {
					headers: this.buildSafeObjectHeaders(key, obj.metadata || {})
				});
			}

			if (storageType === 'R2') {
				const obj = await c.env.r2.get(key);
				if (!obj) {
					return null;
				}
				return new Response(obj.body, {
					headers: this.buildSafeObjectHeaders(key, obj.httpMetadata || {})
				});
			}

			if (storageType === 'S3') {
				const s3Resp = await s3Service.getObj(c, key);
				if (!s3Resp) return null;
				return new Response(s3Resp.body, {
					headers: this.buildSafeObjectHeaders(key, {
						contentType: s3Resp.headers.get('Content-Type'),
						contentDisposition: s3Resp.headers.get('Content-Disposition'),
						cacheControl: s3Resp.headers.get('Cache-Control')
					})
				});
			}

			return null;
		} catch (e) {
			const status = e?.$metadata?.httpStatusCode;
			const code = e?.name || e?.Code || e?.code;
			if (status === 404 || code === 'NoSuchKey' || code === 'NotFound') {
				return null;
			}
			throw e;
		}
	},

	async delete(c, key) {

		const storageType = await this.storageType(c);

		if (storageType === 'KV') {
			await kvObjService.deleteObj(c, key);
		}

		if (storageType === 'R2') {
			await c.env.r2.delete(key);
		}

		if (storageType === 'S3'){
			await s3Service.deleteObj(c, key);
		}

	}

};
export default r2Service;
