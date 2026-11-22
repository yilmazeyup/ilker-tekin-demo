// Builds the demo site into _site/, the way GitHub Pages publishes it:
//   /          the start page (site/index.html): the demo explained, with the app and the panel side by side
//   /app/      the member app, exported for the web
//   /admin/    the salon's panel with the 3D floor
//   /hulp/     the explainer video (site/hulp/)
//   /404.html  the app again: GitHub Pages answers unknown addresses with it, so a link to a screen opens that screen
// Everything in site/ is copied over as is.
//
// With DEMO_PATH set (the Pages workflow passes the repository secret of that name), all of the above goes into a
// private folder of that name, and the root gets the same "coming soon" page as savastana.com (cover/), so only
// someone with the link to the folder sees the demo. The 404 page is then that "coming soon" page as well; it hands a
// link to an app screen inside the folder over to the app, which puts the address back before it starts.
//
// Usage: node scripts/build-site.mjs [base path], by default /ilker-tekin-demo (ignored when DEMO_PATH is set)
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const hidden = (process.env.DEMO_PATH ?? '').replace(/^\/+|\/+$/g, '');
const base = hidden ? `/${hidden}` : (process.argv[2] ?? '/ilker-tekin-demo').replace(/\/$/, '');
const out = hidden ? `_site/${hidden}` : '_site';
const run = (command, cwd, env = {}) => execSync(command, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });

fs.rmSync('_site', { recursive: true, force: true });
run(`npx expo export --platform web --output-dir ../../${out}/app`, 'apps/app', { EXPO_BASE_URL: `${base}/app` });
run(`npx vite build --base=${base}/admin/ --outDir ../../${out}/admin --emptyOutDir`, 'apps/admin');
fs.cpSync('site', out, { recursive: true });
// The start page translates itself with the same dictionaries as the app and the panel.
fs.mkdirSync(`${out}/i18n`, { recursive: true });
for (const file of fs.readdirSync('packages/shared/src/i18n')) if (file.endsWith('.json')) fs.copyFileSync(`packages/shared/src/i18n/${file}`, `${out}/i18n/${file}`);
// The start page plays the same clips as the app.
fs.mkdirSync(`${out}/media`, { recursive: true });
for (const file of ['intro/intro-landscape.mp4', 'intro/poster-landscape.jpg', 'hero-hair.mp4', 'hero-hair.jpg', 'tryon-sample.jpg']) {
  fs.copyFileSync(`apps/app/assets/${file}`, `${out}/media/${file.split('/').pop()}`);
}

// The demo uses fictional clients, so the app stays out of search results; midnight blue from the very first moment.
// In a private folder the app first takes back the address the 404 page passed along as ?path=.
const restore =
  "<script>(function(){var p=new URLSearchParams(location.search).get('path');if(p!==null)history.replaceState(null,'',location.pathname+p+location.hash);})();</script>";
const page = `${out}/app/index.html`;
const html = fs
  .readFileSync(page, 'utf8')
  .replace('<head>', `<head><meta name="robots" content="noindex, nofollow" />${hidden ? restore : ''}`)
  .replace(
    '</head>',
    '<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><style>html,body{background:#FFFFFF}</style></head>',
  );
fs.writeFileSync(page, html);
if (hidden) fs.cpSync('cover', '_site', { recursive: true });
else fs.copyFileSync(page, '_site/404.html');
fs.writeFileSync('_site/.nojekyll', '');
console.log(hidden ? 'Built _site/ with the demo in its private folder' : `Built _site/ for ${base}/`);
