import { ServerResponse } from 'http';
import { config } from './config';
import { harnessCases } from './fixtures/rs2-modules';
import { html } from './http';

/**
 * Standalone host page for the rendering-service web component.
 *
 * `<edu-sharing-render>` takes the **whole node base64-encoded** in its `encoded_node` attribute
 * (`RenderHelperService.getRenderDataForLms` decodes it locally), so rendering one module needs no
 * edu-sharing node request and no application at all - just this page, the built web component and
 * the RS2 mock. That makes every module a cheap, isolated screenshot instead of a full app run.
 *
 * `window.__env.EDU_SHARING_API_URL` is what the web component's non-production environment reads
 * for the repository API; pointing it at the mock is what gives it the client config (needed for
 * the GDPR consent overlay) and the translations.
 */
export function renderHarness(res: ServerResponse, moduleKey: string, locale: string): void {
    // `locale` is not used to build the page: `TranslationsService` reads it straight off the
    // page's own query string, exactly like the application does, and `none` leaves the raw i18n
    // keys in place. It is only echoed into the title so a captured screenshot names its language.
    const harnessCase = harnessCases[moduleKey];
    if (!harnessCase) {
        html(
            res,
            `<!doctype html><meta charset="utf-8"><body>Unknown module "${escapeHtml(moduleKey)}".` +
                ` Known: ${Object.keys(harnessCases).join(', ')}</body>`,
            404,
        );
        return;
    }
    const encodedNode = Buffer.from(JSON.stringify(harnessCase.node), 'utf8').toString('base64');
    const origin = `http://${config.host}:${config.port}`;
    html(
        res,
        `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>RS2 harness - ${escapeHtml(moduleKey)} (${escapeHtml(locale)})</title>
<!-- The component's own stylesheet, including the icon font - without it the material icon
     ligatures render as their raw text ("settings", "fullscreen"). -->
<link rel="stylesheet" href="/web-component/styles.css">
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #fff; }
  .label { padding: 8px 12px; font-size: 13px; color: #444; border-bottom: 1px solid #ddd; }
  /* Fixed width, but the height follows the content: the GDPR consent block is taller than a
     player, and a fixed height would cut it off. */
  .frame { width: 900px; min-height: 320px; margin: 16px; border: 1px solid #ddd; }
</style>
<script>window.__env = { EDU_SHARING_API_URL: ${JSON.stringify(origin + '/edu-sharing/rest')} };</script>
</head>
<body>
<div class="label" data-test="harness-label">${escapeHtml(harnessCase.label)}</div>
<div class="frame">
  <edu-sharing-render
    data-test="harness-component"
    encoded_node="${encodedNode}"
    signature="mock-signature"
    signature_algorithm="SHA256withRSA"
    jwt="mock-jwt"
    render_url="${origin}/rendering2"
    display_mode="full"
    assets_url="/web-component/assets"
    component_height="520"
    footer_height="0"
  ></edu-sharing-render>
</div>
<script src="/web-component/polyfills.js" type="module"></script>
<script src="/web-component/main.js" type="module"></script>
</body>
</html>`,
    );
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);
}
