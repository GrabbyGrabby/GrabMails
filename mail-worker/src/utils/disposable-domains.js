/**
 * High-confidence disposable and temporary email domains.
 * Blocks burner registrations to maintain domain sender reputation.
 */
const DISPOSABLE_DOMAINS = new Set([
	'mailinator.com',
	'guerrillamail.com',
	'guerrillamail.net',
	'guerrillamail.org',
	'guerrillamailblock.com',
	'sharklasers.com',
	'grr.la',
	'pokemail.net',
	'spam4.me',
	'tempmail.com',
	'temp-mail.org',
	'10minutemail.com',
	'10minutemail.net',
	'throwawaymail.com',
	'yopmail.com',
	'yopmail.fr',
	'yopmail.net',
	'cool.fr.nf',
	'jetable.fr.nf',
	'trashmail.com',
	'trashmail.net',
	'trashmail.org',
	'getairmail.com',
	'dispostable.com',
	'maildrop.cc',
	'inboxkitten.com',
	'burnermail.io',
	'crazymailing.com',
	'fakemailgenerator.com',
	'generator.email',
	'armyspy.com',
	'cuvox.de',
	'dayrep.com',
	'fleckens.hu',
	'gustr.com',
	'jourrapide.com',
	'rhyta.com',
	'superrito.com',
	'teleworm.us',
	'einrot.com',
	'nada.ltd',
	'getnada.com',
	'dropmail.me',
	'mohmal.com',
	'mytemp.email',
	'emailondeck.com',
	'tempail.com',
	'disposablemail.com',
	'internxt.com',
	'minutemail.com',
	'tempinbox.com',
	'mailnesia.com',
	'fakeinbox.com',
	'tmailor.com',
	'bupmail.com',
	'clipmail.eu',
	'zoemail.org'
]);

export function isDisposableDomain(emailOrDomain) {
	if (!emailOrDomain || typeof emailOrDomain !== 'string') {
		return false;
	}
	const parts = emailOrDomain.toLowerCase().trim().split('@');
	const domain = (parts.length > 1 ? parts[1] : parts[0]).trim();
	if (!domain) return false;

	if (DISPOSABLE_DOMAINS.has(domain)) {
		return true;
	}

	// Check common subdomains or patterns
	const subparts = domain.split('.');
	if (subparts.length > 2) {
		const rootDomain = subparts.slice(-2).join('.');
		if (DISPOSABLE_DOMAINS.has(rootDomain)) {
			return true;
		}
	}

	return false;
}

export default {
	isDisposableDomain,
	DISPOSABLE_DOMAINS
};
