import { build } from 'esbuild'
import sharp from 'sharp'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
await mkdir(path.join(root, 'lib'), { recursive: true })

// Encoding and transparent-margin optimization only: the source artwork is kept intact.
async function encode(file, width, trim = false) {
  let pipeline = sharp(path.join(root, 'assets/source', file))
  if (trim) pipeline = pipeline.trim({ threshold: 12 })
  const { data, info } = await pipeline.resize({ width, withoutEnlargement: true }).webp({ quality: 85, alphaQuality: 100, effort: 5 }).toBuffer({ resolveWithObject: true })
  return { uri: `data:image/webp;base64,${data.toString('base64')}`, aspect: info.width / info.height, bytes: data.length }
}
const [welcome, study, portrait, day, night, ribbon] = await Promise.all([
  encode('asuka-luminous-left.png', 720, true),
  encode('asuka-luminous-right.png', 720, true),
  encode('asuka-luminous-portrait.png', 360, true),
  encode('atrium-day.png', 1920),
  encode('atrium-night.png', 1920),
  encode('ribbon-crest.png', 640, true),
])
const artwork = { portrait: portrait.uri, day: day.uri, night: night.uri,
  welcome: welcome.uri, study: study.uri, welcomeAspect: welcome.aspect, studyAspect: study.aspect, ribbon: ribbon.uri }
const shared = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis', '@deepseek-ai/dsh-client-store', '@deepseek-ai/dsh-client-ui-slots', '@deepseek-ai/dsh-client-ui-primitives']
await build({ absWorkingDir: root, entryPoints: ['src/index.ts'], outfile: 'lib/index.js', bundle: true, format: 'esm', platform: 'node', target: 'node22', packages: 'external', sourcemap: false })
const result = await build({
  absWorkingDir: root, entryPoints: ['src/client/index.tsx'], bundle: true, write: false,
  format: 'cjs', platform: 'browser', target: 'es2022', jsx: 'automatic', external: shared,
  loader: { '.css': 'text' }, minify: false, sourcemap: false,
  plugins: [{ name: 'asuka-artwork', setup(b) {
    b.onResolve({ filter: /^asuka:art$/ }, () => ({ path: 'artwork', namespace: 'asuka' }))
    // The new narrow pose works in both layouts; share its bytes and keep the
    // adapter's existing aliases without embedding a second copy of the image.
    b.onLoad({ filter: /.*/, namespace: 'asuka' }, () => ({ contents: `const art=${JSON.stringify(artwork)};export const artwork={...art,front:art.welcome,frontAspect:art.welcomeAspect};`, loader: 'js' }))
  } }],
})
const cjs = result.outputFiles[0].text
const client = `/* ${pkg.name} ${pkg.version} — artwork is excluded from the code license. */\nwindow.__ModuleLoader__.load({id:${JSON.stringify(pkg.name)},factory:(require)=>{\nvar module={exports:{}};var exports=module.exports;\n${cjs}\nreturn module.exports;\n}});\n`
await writeFile(path.join(root, 'lib/client.js'), client)
console.log(`Built ${pkg.name}@${pkg.version}; client ${(Buffer.byteLength(client) / 1024).toFixed(0)} KiB; artwork ${[welcome, study, portrait, day, night, ribbon].reduce((n, a) => n + a.bytes, 0)} bytes.`)
