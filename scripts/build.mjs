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
const [front, portrait, day, night] = await Promise.all([
  encode('asuka-front.png', 520, true),
  encode('asuka-portrait.png', 320, true),
  encode('park-day.png', 1440),
  encode('park-dusk.png', 1440),
])
const artwork = { front: front.uri, portrait: portrait.uri, day: day.uri, night: night.uri, frontAspect: front.aspect }
const shared = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis', '@deepseek-ai/dsh-client-store', '@deepseek-ai/dsh-client-ui-slots', '@deepseek-ai/dsh-client-ui-primitives']
await build({ absWorkingDir: root, entryPoints: ['src/index.ts'], outfile: 'lib/index.js', bundle: true, format: 'esm', platform: 'node', target: 'node22', packages: 'external', sourcemap: false })
const result = await build({
  absWorkingDir: root, entryPoints: ['src/client/index.tsx'], bundle: true, write: false,
  format: 'cjs', platform: 'browser', target: 'es2022', jsx: 'automatic', external: shared,
  loader: { '.css': 'text' }, minify: false, sourcemap: false,
  plugins: [{ name: 'asuka-artwork', setup(b) {
    b.onResolve({ filter: /^asuka:art$/ }, () => ({ path: 'artwork', namespace: 'asuka' }))
    b.onLoad({ filter: /.*/, namespace: 'asuka' }, () => ({ contents: `export const artwork=${JSON.stringify(artwork)};`, loader: 'js' }))
  } }],
})
const cjs = result.outputFiles[0].text
const client = `/* ${pkg.name} ${pkg.version} — artwork is excluded from the code license. */\nwindow.__ModuleLoader__.load({id:${JSON.stringify(pkg.name)},factory:(require)=>{\nvar module={exports:{}};var exports=module.exports;\n${cjs}\nreturn module.exports;\n}});\n`
await writeFile(path.join(root, 'lib/client.js'), client)
console.log(`Built ${pkg.name}@${pkg.version}; client ${(Buffer.byteLength(client) / 1024).toFixed(0)} KiB; artwork ${[front, portrait, day, night].reduce((n, a) => n + a.bytes, 0)} bytes.`)
