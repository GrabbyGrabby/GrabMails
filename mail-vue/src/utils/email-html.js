import DOMPurify from 'dompurify'

let hookRegistered = false

function ensureHooks() {
    if (hookRegistered) return
    hookRegistered = true
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
        if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
            node.setAttribute('rel', 'noopener noreferrer')
        }
    })
}

export function sanitizeEmailHtml(html) {
    if (!html || typeof html !== 'string') return ''
    ensureHooks()
    return DOMPurify.sanitize(html, {
        WHOLE_DOCUMENT: true,
        FORBID_TAGS: ['script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'base', 'meta', 'form', 'link', 'portal', 'slot'],
        FORBID_ATTR: ['srcdoc', 'formaction', 'xlink:href'],
        ALLOW_UNKNOWN_PROTOCOLS: false,
        ADD_ATTR: ['target'],
    })
}
