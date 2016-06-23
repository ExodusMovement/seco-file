'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.read = exports.write = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// options: passphrase, blobKey, metdata, overwrite

let write = exports.write = (() => {
  var ref = _asyncToGenerator(function* (file, data, options = {}) {
    if (!(typeof file === 'string')) {
      throw new TypeError('Value of argument "file" violates contract.\n\nExpected:\nstring\n\nGot:\n' + _inspect(file));
    }

    if (!BufOrStr(data)) {
      throw new TypeError('Value of argument "data" violates contract.\n\nExpected:\nBufOrStr\n\nGot:\n' + _inspect(data));
    }

    options = _extends({ overwrite: false }, options);
    let header = conHeader.create(_extends({ appName: parentPkg.name, appVersion: parentPkg.version }, options.header));

    let fileExists = yield new Promise(function (resolve) {
      return _fsExtra2.default.access(file, function (err) {
        return resolve(!err);
      });
    });
    if (!options.overwrite && fileExists) throw new Error(`${ file } exists. Set 'overwrite' to true.`);

    let blobKey;
    let metadata;
    if (options.passphrase) {
      blobKey = crypto.randomBytes(32);
      metadata = conMetadata.create();
      conMetadata.encryptBlobKey(metadata, options.passphrase, blobKey);
    } else if (options.metadata && options.blobKey) {
      blobKey = options.blobKey;
      metadata = options.metadata;
    } else {
      throw new Error('Must set either passphrase or (metadata and blobKey)');
    }

    data = Buffer.isBuffer(data) ? data : new Buffer(data, 'utf8');
    let { blob: encBlob } = conBlob.encrypt(data, metadata, blobKey);

    const headerBuf = conHeader.serialize(header);
    const mdBuf = conMetadata.serialize(metadata);

    let fileObj = {
      header: headerBuf,
      checksum: conFile.computeChecksum(mdBuf, encBlob),
      metadata: mdBuf,
      blob: encBlob
    };
    const fileData = conFile.encode(fileObj);

    yield new Promise(function (resolve, reject) {
      _fsExtra2.default.outputFile(file, fileData, function (err) {
        return err ? reject(err) : resolve();
      });
    });

    return { blobKey, metadata };
  });

  return function write(_x, _x2, _x3) {
    return ref.apply(this, arguments);
  };
})();

let read = exports.read = (() => {
  var ref = _asyncToGenerator(function* (file, passphrase) {
    if (!(typeof file === 'string')) {
      throw new TypeError('Value of argument "file" violates contract.\n\nExpected:\nstring\n\nGot:\n' + _inspect(file));
    }

    if (!BufOrStr(passphrase)) {
      throw new TypeError('Value of argument "passphrase" violates contract.\n\nExpected:\nBufOrStr\n\nGot:\n' + _inspect(passphrase));
    }

    let fileData = yield new Promise(function (resolve, reject) {
      _fsExtra2.default.readFile(file, function (err, fileData) {
        return err ? reject(err) : resolve(fileData);
      });
    });

    const fileObj = conFile.decode(fileData);

    let md = conMetadata.decode(fileObj.metadata);
    let blobKey = conMetadata.decryptBlobKey(md, passphrase);
    let data = conBlob.decrypt(fileObj.blob, md, blobKey);

    return data;
  });

  return function read(_x4, _x5) {
    return ref.apply(this, arguments);
  };
})();

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _crypto = require('crypto');

var crypto = _interopRequireWildcard(_crypto);

var _blob = require('secure-container/lib/blob');

var conBlob = _interopRequireWildcard(_blob);

var _header = require('secure-container/lib/header');

var conHeader = _interopRequireWildcard(_header);

var _metadata = require('secure-container/lib/metadata');

var conMetadata = _interopRequireWildcard(_metadata);

var _file = require('secure-container/lib/file');

var conFile = _interopRequireWildcard(_file);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; } /* flow */


var parentPkg;
var paths = (module.parent || module).paths;
for (var i = 0; i < paths.length; ++i) {
  var dir = _path2.default.dirname(paths[i]);
  var pkgFile = _path2.default.join(dir, 'package.json');
  if (_fsExtra2.default.existsSync(pkgFile)) parentPkg = require(pkgFile);
}

const BufOrStr = function () {
  function BufOrStr(input) {
    return input instanceof Buffer || typeof input === 'string';
  }

  ;
  Object.defineProperty(BufOrStr, Symbol.hasInstance, {
    value: function (input) {
      return BufOrStr(input);
    }
  });
  return BufOrStr;
}();

function _inspect(input, depth) {
  const maxDepth = 4;
  const maxKeys = 15;

  if (depth === undefined) {
    depth = 0;
  }

  depth += 1;

  if (input === null) {
    return 'null';
  } else if (input === undefined) {
    return 'void';
  } else if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    return typeof input;
  } else if (Array.isArray(input)) {
    if (input.length > 0) {
      if (depth > maxDepth) return '[...]';

      const first = _inspect(input[0], depth);

      if (input.every(item => _inspect(item, depth) === first)) {
        return first.trim() + '[]';
      } else {
        return '[' + input.slice(0, maxKeys).map(item => _inspect(item, depth)).join(', ') + (input.length >= maxKeys ? ', ...' : '') + ']';
      }
    } else {
      return 'Array';
    }
  } else {
    const keys = Object.keys(input);

    if (!keys.length) {
      if (input.constructor && input.constructor.name && input.constructor.name !== 'Object') {
        return input.constructor.name;
      } else {
        return 'Object';
      }
    }

    if (depth > maxDepth) return '{...}';
    const indent = '  '.repeat(depth - 1);
    let entries = keys.slice(0, maxKeys).map(key => {
      return (/^([A-Z_$][A-Z0-9_$]*)$/i.test(key) ? key : JSON.stringify(key)) + ': ' + _inspect(input[key], depth) + ';';
    }).join('\n  ' + indent);

    if (keys.length >= maxKeys) {
      entries += '\n  ' + indent + '...';
    }

    if (input.constructor && input.constructor.name && input.constructor.name !== 'Object') {
      return input.constructor.name + ' {\n  ' + indent + entries + '\n' + indent + '}';
    } else {
      return '{\n  ' + indent + entries + '\n' + indent + '}';
    }
  }
}