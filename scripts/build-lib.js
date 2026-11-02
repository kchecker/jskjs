/* Concatenates src/parts/*.js → src/jskjs.js (one readable file), then minifies to dist/.
 * Add-ons in src/plugins/ are copied + minified to dist/plugins/. Run: node scripts/build-lib.js */
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const parts = fs.readdirSync(path.join(ROOT, 'src/parts')).filter(f => f.endsWith('.js')).sort();
const out = parts.map(f => fs.readFileSync(path.join(ROOT, 'src/parts', f), 'utf8').replace(/\s+$/, '') + '\n').join('\n');
fs.writeFileSync(path.join(ROOT, 'src/jskjs.js'), out);
fs.mkdirSync(path.join(ROOT, 'dist/plugins'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src/jskjs.js'), path.join(ROOT, 'dist/jskjs.js'));
const terser = (src, dst) => execSync(`npx terser "${src}" -c passes=2 -m --comments "/^!/" -o "${dst}"`, { cwd: ROOT, stdio: 'inherit' });
terser('src/jskjs.js', 'dist/jskjs.min.js');
const pdir = path.join(ROOT, 'src/plugins');
for (const f of fs.existsSync(pdir) ? fs.readdirSync(pdir).filter(f => f.endsWith('.js')) : []) {
  fs.copyFileSync(path.join(pdir, f), path.join(ROOT, 'dist/plugins', f));
  terser('src/plugins/' + f, 'dist/plugins/' + f.replace(/\.js$/, '.min.js'));
}
const zlib = require('zlib');
const size = f => { const b = fs.readFileSync(path.join(ROOT, f)); return `${(b.length / 1024).toFixed(1)} KB, ${(zlib.gzipSync(b, { level: 9 }).length / 1024).toFixed(1)} KB gz`; };
console.log('jskjs.js', size('dist/jskjs.js'), '| min', size('dist/jskjs.min.js'));
