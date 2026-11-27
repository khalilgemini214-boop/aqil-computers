/* Generates the GitHub Pages build (dist/) and the Capacitor bundle (www/)
   from the single-file app. Run: node sync.js */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8');
const app = read('aqil-computers.html');
const rel = JSON.parse(read('release.json'));

const found = /const APP_VERSION = '([^']+)'/.exec(app);
if (!found) throw new Error('APP_VERSION not found in aqil-computers.html');
const version = found[1];
if (rel.version && rel.version !== version) {
  throw new Error('release.json says ' + rel.version + ' but the app says ' + version + '. Bump both.');
}

/* Every run gets a fresh stamp, so any pushed change is picked up as an update. */
const build = process.env.AQIL_BUILD || (new Date().toISOString().slice(0, 19) + 'Z');
const appBuilt = app.replace(/const APP_BUILD = '[^']*';/, "const APP_BUILD = '" + build + "';");
if (appBuilt === app) throw new Error('APP_BUILD not found in aqil-computers.html');

const [owner, name] = String(rel.repo || '').split('/');
if (!owner || !name) throw new Error('release.json needs "repo": "owner/name"');

const repoUrl = 'https://github.com/' + owner + '/' + name;
const pagesUrl = 'https://' + owner + '.github.io/' + name + '/';
const bundleUrl = pagesUrl + 'index.html';
const manifestUrl = pagesUrl + 'version.json';
const apkUrl = rel.apk || repoUrl + '/releases/latest/download/aqil-computers.apk';
const shell = rel.shell || version;
const released = rel.released || new Date().toISOString().slice(0, 10);

const manifest = {
  version,
  build,
  shell,
  released,
  notes: rel.notes || '',
  bundleUrl,
  apk: apkUrl,
  repo: repoUrl
};
const manifestJson = JSON.stringify(manifest, null, 2) + '\n';

function write(dir, file, content) {
  const target = path.join(dir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

const dist = path.join(root, 'dist');
const www = path.join(root, 'www');
fs.rmSync(dist, { recursive: true, force: true });
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.mkdirSync(www, { recursive: true });

/* ---- GitHub Pages ---- */
write(dist, 'index.html', appBuilt);
write(dist, 'aqil-computers.html', appBuilt);
write(dist, 'version.json', manifestJson);
write(dist, 'sw.js', read('static', 'sw.js').replace(/__VERSION__/g, version));
write(dist, 'manifest.webmanifest', read('static', 'manifest.webmanifest'));
write(dist, 'icon.svg', read('static', 'icon.svg'));
write(dist, 'icon-192.png', fs.readFileSync(path.join(root, 'static', 'icon-192.png')));
write(dist, 'icon-512.png', fs.readFileSync(path.join(root, 'static', 'icon-512.png')));
write(dist, '.nojekyll', '');

/* ---- Capacitor ---- */
const loader = read('native', 'loader.html')
  .replace(/__SHELL_VERSION__/g, shell)
  .replace(/__APP_VERSION__/g, version)
  .replace(/__APP_BUILD__/g, build)
  .replace(/__BUNDLE_URL__/g, bundleUrl)
  .replace(/__MANIFEST_URL__/g, manifestUrl)
  .replace(/__APK_URL__/g, apkUrl)
  .replace(/__REPO_URL__/g, repoUrl);
write(www, 'index.html', loader);
write(www, 'app.html', appBuilt);
write(www, 'version.json', manifestJson);
write(www, 'manifest.webmanifest', read('static', 'manifest.webmanifest'));
write(www, 'icon.svg', read('static', 'icon.svg'));
write(www, 'icon-192.png', fs.readFileSync(path.join(root, 'static', 'icon-192.png')));
write(www, 'icon-512.png', fs.readFileSync(path.join(root, 'static', 'icon-512.png')));

/* ---- Android version numbers ---- */
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
if (fs.existsSync(gradlePath)) {
  const parts = version.split('.').map((n) => parseInt(n, 10) || 0);
  const code = (parts[0] || 0) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
  let gradle = fs.readFileSync(gradlePath, 'utf8');
  gradle = gradle
    .replace(/versionCode\s+\d+/, 'versionCode ' + code)
    .replace(/versionName\s+"[^"]*"/, 'versionName "' + version + '"');
  fs.writeFileSync(gradlePath, gradle, 'utf8');
  console.log('Android versionCode ' + code + ' · versionName ' + version);
}

console.log('Web build   dist/  · version ' + version + ' · build ' + build);
console.log('Native build www/  · shell ' + shell);
console.log('Bundle      ' + bundleUrl);
console.log('APK         ' + apkUrl);
