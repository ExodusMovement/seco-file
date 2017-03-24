import _aw from 'aw'
import fs from 'fs-extra'
import path from 'path'
import test from 'tape-promise/tape'
import { read as readFile, write as writeFile } from '../src'

const aw = _aw({ injectCallback: false })

test('readFile / writeFile', async (t) => {
  const testDir = path.join('/tmp', 'test', 'seco-file')
  const testFile = path.join(testDir, 'secret.bin')
  fs.emptyDirSync(testDir)

  let secretMessage = Buffer.from('Hello, lets meet at 10 PM to plan our secret mission!', 'utf8')
  const passphrase = Buffer.from('opensesame', 'utf8')

  const [writeFileErr] = await aw(writeFile)(testFile, secretMessage, { passphrase })
  t.ifError(writeFileErr, 'no write file error')

  const [readFileErr, readFileRes] = await aw(readFile)(testFile, passphrase)
  t.ifError(readFileErr, 'no error on read')

  t.is(readFileRes.toString('utf8'), secretMessage.toString('utf8'), 'verify content is the same')

  t.end()
})

test('readFile / writeFile (with blobkey)', async (t) => {
  const testDir = path.join('/tmp', 'test', 'seco-file')
  const testFile = path.join(testDir, 'secret.bin')
  fs.emptyDirSync(testDir)

  let secretMessage = Buffer.from('Hello, lets meet at 10 PM to plan our secret mission!', 'utf8')
  const passphrase = Buffer.from('opensesame', 'utf8')

  const [writeFileErr, { metadata, blobKey }] = await aw(writeFile)(testFile, secretMessage, { passphrase })
  t.ifError(writeFileErr, 'no write file error')

  fs.removeSync(testFile)

  const [writeFileErr2] = await aw(writeFile)(testFile, secretMessage, { metadata, blobKey })
  t.ifError(writeFileErr2, 'no write file error')

  const [readFileErr, readFileRes] = await aw(readFile)(testFile, passphrase)
  t.ifError(readFileErr, 'no error on read')

  t.is(readFileRes.toString('utf8'), secretMessage.toString('utf8'), 'verify content is the same')

  t.end()
})
