import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { rateLimit } from '../src/middlewares/rateLimit.js'
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
    let ok = false
    csrfProtect(
      fakeReq({ method: 'POST', cookies: { token: 'x', csrfToken: 'abc' }, headers: { 'x-csrf-token': 'abc' } }),
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
  test('menghasilkan 64 karakter hex dan unik', () => {
    const a = generateCsrfToken()
    const b = generateCsrfToken()
    assert.match(a, /^[0-9a-f]{64}$/)
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