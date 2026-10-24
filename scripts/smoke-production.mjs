import assert from 'node:assert/strict'

// Read-only smoke checks. Start `npm run start -- --port 3100` first.
const base = new URL(process.argv[2] || 'http://localhost:3100')
const passed = []
async function request(path, options = {}) {
  return fetch(new URL(path, base), { signal: AbortSignal.timeout(20000), redirect: 'manual', ...options })
}
async function page(path) {
  const response = await request(path)
  assert.equal(response.status, 200, `${path} must return 200`)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN')
  return response.text()
}
await Promise.all([
  (async () => {
    const html = await page('/train-program')
    assert.match(html, /نساء على الفطرة/)
    assert.match(html, /rel="canonical" href="https:\/\/www\.fittrahmoms\.com\/train-program"/)
    assert.match(html, /بيانات تجريبية للمعاينة/)
    assert.match(html, /<button[^>]*disabled=""[^>]*[^]*?أنضمّ إلى فطرة Women/)
    assert.match(html, /id="phase-panel-1"/)
    passed.push('Training: static HTML, metadata, both phase panels and safe preview enrollment')
  })(),
  (async () => {
    const html = await page('/marriage-workshop')
    assert.match(html, /ورشة زواج على الفطرة مع مريم بوزير/)
    assert.match(html, /rel="canonical" href="https:\/\/www\.fittrahmoms\.com\/marriage-workshop"/)
    assert.match(html, /\[التاريخ والتوقيت\]/)
    assert.match(html, /<button[^>]*disabled=""[^>]*[^]*?أحجز مكان/)
    passed.push('Workshop: static HTML, metadata and safe preview enrollment')
  })(),
  (async () => {
    const html = await page('/products')
    assert.match(html, /<aside class="library-sticky-cta"/)
    assert.equal((html.match(/class="chatbot-widget"/g) || []).length, 1)
    passed.push('Library: in-page CTA and a single chat widget')
  })(),
  (async () => {
    const html = await page('/')
    assert.match(html, /href="\/marriage-workshop"/)
    const script = html.match(/<script src="([^\"]*\/_next\/static\/[^\"]+)"/)
    assert.ok(script, 'Production scripts must be emitted')
    const asset = await request(script[1], { method: 'HEAD' })
    assert.equal(asset.status, 200)
    assert.match(asset.headers.get('cache-control') || '', /immutable/)
    passed.push('Home: workshop navigation and immutable hashed production assets')
  })(),
  (async () => {
    const xml = await page('/sitemap.xml')
    assert.match(xml, /https:\/\/www\.fittrahmoms\.com\/marriage-workshop/)
    assert.match(xml, /https:\/\/www\.fittrahmoms\.com\/train-program/)
    passed.push('Sitemap: both landing pages included')
  })(),
  (async () => {
    const image = await request('/_next/image?url=%2FMeriem.png&w=640&q=75', { headers: { accept: 'image/webp' } })
    assert.equal(image.status, 200)
    assert.match(image.headers.get('content-type') || '', /^image\//)
    const publicAsset = await request('/Meriem.jpeg', { method: 'HEAD' })
    assert.equal(publicAsset.status, 200)
    assert.match(publicAsset.headers.get('cache-control') || '', /max-age=86400/)
    assert.doesNotMatch(publicAsset.headers.get('cache-control') || '', /immutable/)
    passed.push('Images: Next optimization and refreshable public asset caching')
  })(),
  (async () => {
    const response = await request('/دخول')
    assert.ok([307, 308].includes(response.status))
    assert.equal(new URL(response.headers.get('location'), base).pathname, '/login')
    passed.push('Proxy: Arabic login redirect')
  })(),
  (async () => {
    assert.equal((await request('/production-smoke-missing-page')).status, 404)
    passed.push('Missing routes: correct 404 status')
  })(),
])
console.log(JSON.stringify({ base: base.origin, passed: passed.length, checks: passed.sort() }, null, 2))
