/* flow */
import fs from 'fs-extra'
import { encrypt, decrypt } from 'secure-container'

type BufOrStr = Buffer | string

// options: passphrase, blobKey, metdata, overwrite
export async function write (file: string, data: BufOrStr, options = {}) {
  options = { overwrite: false, ...options }

  if (!options.overwrite && await fs.pathExists(file)) throw new Error(`${file} exists. Set 'overwrite' to true.`)

  const { encryptedData, blobKey, metadata } = encrypt(data, options)

  await fs.outputFile(file, encryptedData)

  return { blobKey, metadata }
}

export async function read (file: string, passphrase: BufOrStr) {
  let fileData = await fs.readFile(file)

  let result
  try {
    result = decrypt(fileData, passphrase)
  } catch (e) {
    if (e.message.match(/seco checksum does not match; data may be corrupted/)) {
      throw new Error(`${file}: seco checksum does not match; file may be corrupted`)
    }
    throw e
  }

  return result
}
