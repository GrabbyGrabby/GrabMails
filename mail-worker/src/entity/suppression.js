import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const suppression = sqliteTable('suppression', {
	suppressionId: integer('suppression_id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull(),
	type: text('type').default('bounce').notNull(), // 'bounce', 'complaint', 'unsubscribe'
	scope: text('scope').default('global').notNull(), // 'global', 'transactional'
	reason: text('reason').default(''),
	createTime: text('create_time').default(sql`CURRENT_TIMESTAMP`).notNull()
});

export default suppression;
