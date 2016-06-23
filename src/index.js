/* flow */
import fs from 'fs-extra'
import * as crypto from 'crypto'
import * as conBlob from 'secure-container/lib/blob'
import * as conHeader from 'secure-container/lib/header'
import * as conMetadata from 'secure-container/lib/metadata'
import * as conFile from 'secure-container/lib/file'

type BufOrStr = Buffer | string

// options: passphrase, blobKey, metdata, overwrite
export async function write (file: string, data: BufOrStr, options = {}) {
  options = { overwrite: false, ...options }
  if (!options.header) console.warn('seco-file: should pass options.header.')
  let header = conHeader.create(options.header)

  let fileExists = await new Promise(resolve => fs.access(file, err => resolve(!err)))
  if (!options.overwrite && fileExists) throw new Error(`${file} exists. Set 'overwrite' to true.`)

  let blobKey
  let metadata
  if (options.passphrase) {
    blobKey = crypto.randomBytes(32)
    metadata = conMetadata.create()
    conMetadata.encryptBlobKey(metadata, options.passphrase, blobKey)
  } else if (options.metadata && options.blobKey) {
    blobKey = options.blobKey
    metadata = options.metadata
  } else {
    throw new Error('Must set either passphrase or (metadata and blobKey)')
  }

  data = Buffer.isBuffer(data) ? data : new Buffer(data, 'utf8')
  let { blob: encBlob } = conBlob.encrypt(data, metadata, blobKey)

  const headerBuf = conHeader.serialize(header)
  const mdBuf = conMetadata.serialize(metadata)

  let fileObj = {
    header: headerBuf,
    checksum: conFile.computeChecksum(mdBuf, encBlob),
    metadata: mdBuf,
    blob: encBlob
  }
  const fileData = conFile.encode(fileObj)

  await new Promise((resolve, reject) => {
    fs.outputFile(file, fileData, err => err ? reject(err) : resolve())
  })

  return { blobKey, metadata }
}

export async function read (file: string, passphrase: BufOrStr) {
  let fileData = await new Promise((resolve, reject) => {
    fs.readFile(file, (err, fileData) => err ? reject(err) : resolve(fileData))
  })

  const fileObj = conFile.decode(fileData)

  let md = conMetadata.decode(fileObj.metadata)
  let blobKey = conMetadata.decryptBlobKey(md, passphrase)
  let data = conBlob.decrypt(fileObj.blob, md, blobKey)

  return data
}
