import { parseHTML } from 'linkedom';
import domainUtils from '../utils/domain-uitls';

const BLOCKED_TAGS = 'script, iframe, frame, frameset, object, embed, applet, base, meta, form, link, foreignobject, animate, set';
const URI_ATTRS = new Set(['href', 'src', 'xlink:href', 'action', 'formaction', 'poster', 'background']);

function isUnsafeUri(val) {
	const cleaned = String(val || '').replace(/[\u0000-\u0020]+/g, '').toLowerCase();
	return (
		cleaned.startsWith('javascript:') ||
		cleaned.startsWith('vbscript:') ||
		cleaned.startsWith('data:text/html') ||
		cleaned.startsWith('data:application/')
	);
}

function generateNonce() {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return btoa(String.fromCharCode(...bytes));
}

export default function emailHtmlTemplate(rawHtml, domain) {
	const { document } = parseHTML(String(rawHtml || ''));
	document.querySelectorAll(BLOCKED_TAGS).forEach(el => el.remove());

	for (const el of document.querySelectorAll('*')) {
		for (const attr of Array.from(el.attributes || [])) {
			const name = attr.name.toLowerCase();
			if (name.startsWith('on') || name === 'srcdoc') {
				el.removeAttribute(attr.name);
			} else if (URI_ATTRS.has(name) && isUnsafeUri(attr.value)) {
				el.removeAttribute(attr.name);
			}
		}
	}

	const ossBase = domain ? domainUtils.toOssDomain(domain) + '/' : '/';
	const bodyStyle = document.body?.getAttribute('style') || '';
	const headStyles = document.body
		? Array.from(document.querySelectorAll('head style')).map(s => s.outerHTML).join('')
		: '';
	const bodyContent = document.body ? document.body.innerHTML : document.toString();

	const cleanHtml = (headStyles + bodyContent).replace(/{{domain}}/g, ossBase);
	const safeHtmlJson = JSON.stringify(cleanHtml).replace(/</g, '\\u003C');
	const safeBodyStyleJson = JSON.stringify(bodyStyle).replace(/</g, '\\u003C');
	const nonce = generateNonce();

	const html = `<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src https: http: data:; font-src https: data:;">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            background: #FFF;
        }

        .content-box {
            padding: 15px 10px;
            width: 100%;
            height: 100%;
            overflow: auto;
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .content-html {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div class='content-box'>
        <div id='container' class='content-html'></div>
    </div>

    <script nonce="${nonce}">
        function renderHTML(cleanHtml, bodyStyle) {
            const container = document.getElementById('container');
            const shadowRoot = container.attachShadow({ mode: 'open' });

            const styleEl = document.createElement('style');
            styleEl.textContent = \`
                :host {
                    all: initial;
                    width: 100%;
                    height: 100%;
                    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    color: #13181D;
                    word-break: break-word;
                    overflow: auto;
                }
                h1, h2, h3, h4 {
                    font-size: 18px;
                    font-weight: 700;
                }
                p {
                    margin: 0;
                }
                a {
                    text-decoration: none;
                    color: #0E70DF;
                }
                .shadow-content {
                    background: #FFFFFF;
                    width: fit-content;
                    height: fit-content;
                    min-width: 100%;
                }
                img:not(table img) {
                    max-width: 100% !important;
                    height: auto !important;
                }
            \`;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'shadow-content';
            if (bodyStyle) {
                contentDiv.setAttribute('style', bodyStyle);
            }
            contentDiv.innerHTML = cleanHtml;

            shadowRoot.appendChild(styleEl);
            shadowRoot.appendChild(contentDiv);

            autoScale(shadowRoot, container);
        }

        function autoScale(shadowRoot, container) {
            if (!shadowRoot || !container) return;
            const shadowContent = shadowRoot.querySelector('.shadow-content');
            if (!shadowContent) return;
            const parentWidth = container.offsetWidth;
            const childWidth = shadowContent.scrollWidth;
            if (childWidth === 0) return;
            shadowRoot.host.style.zoom = parentWidth / childWidth;
        }

        renderHTML(${safeHtmlJson}, ${safeBodyStyleJson});
    </script>
</body>
</html>`;

	return { html, nonce };
}
