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

export async function write (file: string, data: BufOrStr, passphrase: BufOrStr, options = {}) {
  let header = conHeader.create({ appName: parentPkg.name, appVersion: parentPkg.version, ...options.header })
  console.dir(header)
  let blobKey = crypto.randomBytes(32)
  let metadata = conMetadata.create()

  conMetadata.encryptBlobKey(metadata, passphrase, blobKey)

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
