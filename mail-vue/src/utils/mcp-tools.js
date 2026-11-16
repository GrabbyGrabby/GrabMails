export const MCP_TOOLS = [
	{
		name: 'search_emails',
		description: 'Search email subject, sender, and body across user mailboxes.',
		inputSchema: {
			type: 'object',
			properties: {
				query: { type: 'string', description: 'Search term or keyword' },
				folder: { type: 'string', enum: ['inbox', 'sent', 'draft', 'trash'], default: 'inbox' },
				limit: { type: 'number', default: 20 }
			},
			required: ['query']
		}
	},
	{
		name: 'get_thread',
		description: 'Read the recent conversation and message thread containing an email.',
		inputSchema: {
			type: 'object',
			properties: {
				emailId: { type: 'string', description: 'The unique ID of the email or thread' }
			},
			required: ['emailId']
		}
	},
	{
		name: 'draft_reply',
		description: 'Generate or stage an email reply draft with recipients and threading derived from the source email without sending.',
		inputSchema: {
			type: 'object',
			properties: {
				emailId: { type: 'string', description: 'Source email ID to reply to' },
				body: { type: 'string', description: 'The response message prose' },
				replyAll: { type: 'boolean', default: false }
			},
			required: ['emailId', 'body']
		}
	},
	{
		name: 'list_events',
		description: 'List upcoming appointments, meetings, and calendar events.',
		inputSchema: {
			type: 'object',
			properties: {
				limit: { type: 'number', default: 20 },
				startsAfter: { type: 'string', description: 'ISO 8601 start timestamp filter' }
			}
		}
	},
	{
		name: 'create_event',
		description: 'Schedule a new calendar appointment or event on user calendar.',
		inputSchema: {
			type: 'object',
			properties: {
				title: { type: 'string', description: 'Title or summary of the meeting' },
				startsAt: { type: 'string', description: 'ISO 8601 start timestamp' },
				endsAt: { type: 'string', description: 'ISO 8601 end timestamp' },
				location: { type: 'string', description: 'Physical or virtual meeting room' },
				description: { type: 'string', description: 'Meeting description or agenda' }
			},
			required: ['title', 'startsAt', 'endsAt']
		}
	},
	{
		name: 'list_mailboxes',
		description: 'List user custom domain mailboxes, active addresses, and sending aliases.',
		inputSchema: {
			type: 'object',
			properties: {}
		}
	}
];

