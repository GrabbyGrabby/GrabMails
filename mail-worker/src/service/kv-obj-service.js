const kvObjService = {

	async putObj(c, key, content, metadata) {
		await c.env.kv.put(key, content, { metadata: metadata });
	},

	async deleteObj(c, keys) {

		if (typeof keys === 'string') {
			keys = [keys];
		}

		if (keys.length === 0) {
			return;
		}

		await Promise.all(keys.map( key => c.env.kv.delete(key)));
	},

	async getRawObj(c, key) {
		const obj = await c.env.kv.getWithMetadata(key, { type: "arrayBuffer"});
		if (!obj.value) {
			return null;
		}
		return obj;
	},

	async getObj(c, key) {
		const obj = await c.env.kv.getWithMetadata(key, { type: "arrayBuffer"});
		if (!obj.value) {
			return null;
		}

		const headers = {
			'Content-Type': obj.metadata?.contentType || 'application/octet-stream',
			'X-Content-Type-Options': 'nosniff'
		};
		if (obj.metadata?.contentDisposition) {
			headers['Content-Disposition'] = obj.metadata.contentDisposition;
		}
		if (obj.metadata?.cacheControl) {
			headers['Cache-Control'] = obj.metadata.cacheControl;
		}

		return new Response(obj.value, { headers });
	},

	async toObjResp(c, key) {

		return await this.getObj(c, key);

	}

};

export default kvObjService;
