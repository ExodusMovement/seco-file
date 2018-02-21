import test from 'tape-promise/tape'
import fs from 'fs-extra'
import { encryptData, decryptData } from '../src'

test('encryptData / decryptData', (t) => {
  let secretMessage = Buffer.from('Hello, lets meet at 10 PM to plan our secret mission!', 'utf8')
  const passphrase = Buffer.from('opensesame', 'utf8')

  const { encryptedData } = encryptData(secretMessage, { passphrase })

  const { data } = decryptData(encryptedData, passphrase)

  t.is(data.toString('utf8'), secretMessage.toString('utf8'), 'verify content is the same')

  t.end()
})

test('encryptData / decryptData (with blobkey)', (t) => {
  let secretMessage = Buffer.from('Hello, lets meet at 10 PM to plan our secret mission!', 'utf8')
  const passphrase = Buffer.from('opensesame', 'utf8')

  const { metadata, blobKey } = encryptData(secretMessage, { passphrase })

  const { encryptedData } = encryptData(secretMessage, { metadata, blobKey })

  const { data } = decryptData(encryptedData, passphrase)

  t.is(data.toString('utf8'), secretMessage.toString('utf8'), 'verify content is the same')

  t.end()
})

test('decryptData returns valid blobKey and metadata', (t) => {
  let secretMessage = Buffer.from('Hello, lets meet at 10 PM to plan our secret mission!', 'utf8')
  let secretMessage2 = Buffer.from('Hello, lets meet at 10 AM to plan our secret mission!', 'utf8')
  const passphrase = Buffer.from('opensesame', 'utf8')

  const { encryptedData } = encryptData(secretMessage, { passphrase })

  const { data, metadata, blobKey } = decryptData(encryptedData, passphrase)
  t.is(data.toString('utf8'), secretMessage.toString('utf8'), 'verify content is the same')

  const { encryptedData: encryptedData2 } = encryptData(secretMessage2, { metadata, blobKey })

  const { data: data2 } = decryptData(encryptedData2, passphrase)
  t.is(data2.toString('utf8'), secretMessage2.toString('utf8'), 'verify content is the same')

  t.end()
})

test('decryptData verifies checksum', async (t) => {
  const testFile = 'tests/fixtures/corrupted.seco'
  const buf = await fs.readFile(testFile)

  try {
    decryptData(buf, 'opensesame')
  } catch (err) {
    t.assert(err)
    t.ok(err.message.match(/seco checksum does not match; data may be corrupted/))
    t.end()
  }
})

test('decryptData returns header', (t) => {
  let secretMessage = Buffer.from('Hi, lets meet at 10 PM to plan our secret mission!', 'utf8')
  const passphrase = Buffer.from('opensesame')
  const header = {
    appName: 'test',
    appVersion: '1.0.0'
  }

  const { encryptedData } = encryptData(secretMessage, { passphrase, header })

  const result = decryptData(encryptedData, passphrase)

  t.is(result.header.appName, header.appName, 'appName is returned')
  t.is(result.header.appVersion, header.appVersion, 'appVersion is returned')

  t.end()
})
