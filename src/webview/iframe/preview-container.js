const container = document.getElementById('container');

window.addEventListener('message', event => {
	if (event.data?.type !== 'DATA') return;
	const iframe = document.createElement('iframe');
	iframe.setAttribute('sandbox', 'allow-same-origin');
	iframe.srcdoc = buildIframeHtml(event.data?.payload?.html);
	iframe.style.width = '100%';
	iframe.style.height = '100%';
	iframe.style.border = 'none';
	container.replaceChildren(iframe);
});

window.parent.postMessage({ type: 'READY' }, '*');

function buildIframeHtml(html) {
	return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta http-equiv="Content-Security-Policy"
      content="
        default-src 'none';
        script-src 'self';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        font-src 'self' data:;
        connect-src 'self';
        frame-src 'none';
        object-src 'none';
      ">
  </head>
  <body>
  ${html}
  </body>
  </html>`;
}
