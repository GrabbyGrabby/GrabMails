export function resolveResendWebhookTransition(body, status) {
	if (!body?.data?.email_id) {
		return null;
	}

	const eventTransitions = {
		'email.delivery_delayed': {
			status: status.DELAYED,
			allowedFrom: [status.SENT, status.DELAYED],
			message: null
		},
		'email.delivered': {
			status: status.DELIVERED,
			allowedFrom: [status.SENT, status.DELAYED],
			message: null
		},
		'email.bounced': {
			status: status.BOUNCED,
			allowedFrom: [status.SENT, status.DELAYED, status.DELIVERED],
			message: JSON.stringify(body.data.bounce ?? null)
		},
		'email.complained': {
			status: status.COMPLAINED,
			allowedFrom: [status.SENT, status.DELAYED, status.DELIVERED],
			message: null
		},
		'email.failed': {
			status: status.FAILED,
			allowedFrom: [status.SENT, status.DELAYED],
			message: body.data.failed?.reason ?? null
		}
	};

	const transition = eventTransitions[body.type];
	if (!transition) {
		return null;
	}

	return {
		resendEmailId: body.data.email_id,
		status: transition.status,
		allowedFrom: transition.allowedFrom,
		message: transition.message
	};
}
