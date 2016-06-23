import _aw from 'aw'
import fs from 'fs-extra'
import path from 'path'
import test from 'tape-promise/tape'
import { write as writeFile } from '../src'

const aw = _aw({ injectCallback: false })

test('writeFile (overwrite == default)', async (t) => {
  const testDir = path.join('/tmp', 'test', 'seco-file')
  const testFile = path.join(testDir, 'secret.bin')
  fs.emptyDirSync(testDir)

  let secretMessage = Buffer.from('Hello, lets meet at 10 PM to plan our secret mission!', 'utf8')
  const passphrase = Buffer.from('opensesame', 'utf8')

  // ensure file exists
  fs.outputFileSync(testFile, 'does not matter')

  const [writeFileErr] = await aw(writeFile)(testFile, secretMessage, { passphrase })
  t.true(writeFileErr.message.match(/exists/))

  t.end()
})

test('writeFile (overwrite == false)', async (t) => {
  const testDir = path.join('/tmp', 'test', 'seco-file')
  const testFile = path.join(testDir, 'secret.bin')
  fs.emptyDirSync(testDir)

  let secretMessage = Buffer.from('Hello, lets meet at 10 PM to plan our secret mission!', 'utf8')
  const passphrase = Buffer.from('opensesame', 'utf8')

  // ensure file exists
  fs.outputFileSync(testFile, 'does not matter')

  const [writeFileErr] = await aw(writeFile)(testFile, secretMessage, { passphrase, overwrite: false })
  t.true(writeFileErr.message.match(/exists/))

  t.end()
})

test('writeFile (overwrite == true)', async (t) => {
  const testDir = path.join('/tmp', 'test', 'seco-file')
  const testFile = path.join(testDir, 'secret.bin')
  fs.emptyDirSync(testDir)

  let secretMessage = Buffer.from('Hello, lets meet at 10 PM to plan our secret mission!', 'utf8')
  const passphrase = Buffer.from('opensesame', 'utf8')

  // ensure file exists
  fs.outputFileSync(testFile, 'does not matter')

  const [writeFileErr] = await aw(writeFile)(testFile, secretMessage, { passphrase, overwrite: true })
  t.ifError(writeFileErr, 'no error')

  t.end()
})
