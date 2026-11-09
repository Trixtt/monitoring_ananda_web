import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { rateLimit, loginRateLimit } from '../src/middlewares/rateLimit.js'
import { csrfProtect, generateCsrfToken, setCsrfCookie } from '../src/middlewares/csrf.js'

function fakeReq(over = {}) {
  return { ip: '9.9.9.9', method: 'GET', headers: {}, cookies: {}, body: {}, ...over }
}

function fakeRes() {
  return {
    statusCode: null,
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
    cookie(name, value, options) {
      this.cookieLast = { name, value, options }
      return this
    },
    set(name, value) {
      this.headers = { ...this.headers, [name]: value }
      return this
    }
  }
}

describe('rateLimit', () => {
  test('menghalau permintaan setelah melebihi max', () => {
    const limit = rateLimit({ windowMs: 60_000, max: 2 })
    const res = fakeRes()
    let ok = 0
    const next = () => {
      ok += 1
    }
    limit(fakeReq(), fakeRes(), next)
    limit(fakeReq(), fakeRes(), next)
    limit(fakeReq(), res, next)
    assert.equal(ok, 2)
    assert.equal(res.statusCode, 429)
  })

  test('respons 429 menyertakan Retry-After', () => {
    const limit = rateLimit({ windowMs: 60_000, max: 1 })
    const next = () => {}
    limit(fakeReq(), fakeRes(), next)
    const res = fakeRes()
    limit(fakeReq(), res, next)
    assert.equal(res.statusCode, 429)
    assert.ok(Number(res.headers['Retry-After']) > 0)
  })

  test('kuota login dipisah per IP dan username', () => {
    const next = () => {}
    for (let i = 0; i < 10; i += 1) {
      loginRateLimit(fakeReq({ body: { username: 'budi' } }), fakeRes(), next)
    }
    const res = fakeRes()
    loginRateLimit(fakeReq({ body: { username: 'budi' } }), res, next)
    assert.equal(res.statusCode, 429)

    const resLain = fakeRes()
    loginRateLimit(fakeReq({ body: { username: 'sari' } }), resLain, next)
    assert.equal(resLain.statusCode, null)

    const resIpLain = fakeRes()
    loginRateLimit(fakeReq({ ip: '8.8.8.8', body: { username: 'budi' } }), resIpLain, next)
    assert.equal(resIpLain.statusCode, null)
  })

  test('kuota bersifat per-IP', () => {
    const limit = rateLimit({ windowMs: 60_000, max: 2 })
    const next = () => {}
    limit(fakeReq({ ip: '1.1.1.1' }), fakeRes(), next)
    limit(fakeReq({ ip: '2.2.2.2' }), fakeRes(), next)
    limit(fakeReq({ ip: '2.2.2.2' }), fakeRes(), next)
    const res = fakeRes()
    limit(fakeReq({ ip: '2.2.2.2' }), res, next)
    assert.equal(res.statusCode, 429)
    const resLain = fakeRes()
    limit(fakeReq({ ip: '1.1.1.1' }), resLain, next)
    assert.equal(resLain.statusCode, null)
  })
})

describe('csrfProtect', () => {
  test('GET selalu lolos', () => {
    let ok = false
    csrfProtect(fakeReq({ method: 'GET', cookies: { token: 'x', csrfToken: 'abc' } }), fakeRes(), () => {
      ok = true
    })
    assert.equal(ok, true)
  })

  test('POST tanpa sesi cookie (Bearer) lolos', () => {
    let ok = false
    csrfProtect(fakeReq({ method: 'POST', cookies: {} }), fakeRes(), () => {
      ok = true
    })
    assert.equal(ok, true)
  })

  test('sesi cookie tanpa header X-CSRF-TOKEN ditolak', () => {
    const res = fakeRes()
    csrfProtect(
      fakeReq({ method: 'POST', cookies: { token: 'x', csrfToken: 'abc' }, headers: {} }),
      res,
      () => {
        throw new Error('tidak boleh lanjut')
      }
    )
    assert.equal(res.statusCode, 403)
  })

  test('header yang cocok lolos', () => {
    const token = generateCsrfToken()
    let ok = false
    csrfProtect(
      fakeReq({ method: 'POST', cookies: { token: 'x', csrfToken: token }, headers: { 'x-csrf-token': token } }),
      fakeRes(),
      () => {
        ok = true
      }
    )
    assert.equal(ok, true)
  })

  test('header yang salah ditolak', () => {
    const res = fakeRes()
    csrfProtect(
      fakeReq({ method: 'POST', cookies: { token: 'x', csrfToken: 'abc' }, headers: { 'x-csrf-token': 'zzz' } }),
      res,
      () => {
        throw new Error('tidak boleh lanjut')
      }
    )
    assert.equal(res.statusCode, 403)
  })
})

describe('generateCsrfToken', () => {
  test('menghasilkan token bertanda tangan dan unik', () => {
    const a = generateCsrfToken()
    const b = generateCsrfToken()
    assert.match(a, /^[0-9a-f]{64}\.[0-9a-f]{64}$/)
    assert.notEqual(a, b)
  })
})

describe('setCsrfCookie', () => {
  test('menyimpan token dan mengembalikannya', () => {
    const res = fakeRes()
    const token = generateCsrfToken()
    const hasil = setCsrfCookie(res, token)
    assert.equal(hasil, token)
    assert.equal(res.cookieLast.name, 'csrfToken')
    assert.equal(res.cookieLast.value, token)
    assert.equal(res.cookieLast.options.sameSite, 'lax')
    assert.equal(res.cookieLast.options.httpOnly, false)
  })
})