/* flow */
import fs from 'fs-extra'
import path from 'path'
import * as crypto from 'crypto'
import * as conBlob from 'secure-container/lib/blob'
import * as conHeader from 'secure-container/lib/header'
import * as conMetadata from 'secure-container/lib/metadata'
import * as conFile from 'secure-container/lib/file'

var parentPkg
var paths = (module.parent || module).paths
for (var i = 0; i < paths.length; ++i) {
  var dir = path.dirname(paths[i])
  var pkgFile = path.join(dir, 'package.json')
  if (fs.existsSync(pkgFile)) parentPkg = require(pkgFile)
}

type BufOrStr = Buffer | String

export async function write (file: string, data: BufOrStr, options = {}) {
  let header = conHeader.create({ appName: parentPkg.name, appVersion: parentPkg.version, ...options.header })

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
