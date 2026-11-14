import orm from '../entity/orm';
import { suppression } from '../entity/suppression';
import { eq, and, desc, like } from 'drizzle-orm';

const suppressionService = {
	async isSuppressed(c, email, type = null) {
		if (!email || typeof email !== 'string') return false;
		const cleanEmail = email.trim().toLowerCase();

		try {
			const conditions = [eq(suppression.email, cleanEmail)];
			if (type) {
				conditions.push(eq(suppression.type, type));
			}

			const record = await orm(c)
				.select()
				.from(suppression)
				.where(and(...conditions))
				.get();

			return Boolean(record);
		} catch (e) {
			console.error('Error checking suppression list:', e);
			return false;
		}
	},

	async addSuppression(c, { email, type = 'bounce', reason = '', scope = 'global' }) {
		if (!email || typeof email !== 'string') return;
		const cleanEmail = email.trim().toLowerCase();

		try {
			// Check if already exists for this email and type
			const existing = await orm(c)
				.select()
				.from(suppression)
				.where(and(eq(suppression.email, cleanEmail), eq(suppression.type, type)))
				.get();

			if (existing) {
				if (reason && existing.reason !== reason) {
					await orm(c)
						.update(suppression)
						.set({ reason, scope })
						.where(eq(suppression.suppressionId, existing.suppressionId))
						.run();
				}
				return existing;
			}

			await orm(c).insert(suppression).values({
				email: cleanEmail,
				type,
				scope,
				reason: String(reason || '')
			}).run();
		} catch (e) {
			console.error('Error adding suppression:', e);
		}
	},

	async removeSuppression(c, email, type = null) {
		if (!email || typeof email !== 'string') return;
		const cleanEmail = email.trim().toLowerCase();

		const conditions = [eq(suppression.email, cleanEmail)];
		if (type) {
			conditions.push(eq(suppression.type, type));
		}

		await orm(c)
			.delete(suppression)
			.where(and(...conditions))
			.run();
	},

	async list(c, params = {}) {
		const { email: filterEmail, type, page = 1, pageSize = 20 } = params;
		const p = Math.max(1, Number(page) || 1);
		const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
		const offset = (p - 1) * size;

		const conditions = [];
		if (filterEmail) {
			conditions.push(like(suppression.email, `%${filterEmail.trim().toLowerCase()}%`));
		}
		if (type) {
			conditions.push(eq(suppression.type, type));
		}

		const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

		const rows = await orm(c)
			.select()
			.from(suppression)
			.where(whereClause)
			.orderBy(desc(suppression.createTime))
			.limit(size)
			.offset(offset)
			.all();

		return {
			list: rows,
			page: p,
			pageSize: size
		};
	}
};

export default suppressionService;
