(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var debug, schema, public, strict, chunkSize, protected, collection, permissions, cacheControl, downloadRoute, onAfterUpload, onAfterRemove, disableUpload, onBeforeRemove, integrityCheck, collectionName, onBeforeUpload, namingFunction, responseHeaders, disableDownload, allowClientCode, downloadCallback, onInitiateUpload, interceptDownload, continueUploadTTL, parentDirPermissions, _preCollection, _preCollectionName, FilesCollection;

var require = meteorInstall({"node_modules":{"meteor":{"ostrio:files":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_files/server.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  FilesCollection: () => FilesCollection
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let WebApp;
module.watch(require("meteor/webapp"), {
  WebApp(v) {
    WebApp = v;
  }

}, 1);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 2);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 3);
let Cookies;
module.watch(require("meteor/ostrio:cookies"), {
  Cookies(v) {
    Cookies = v;
  }

}, 4);
let WriteStream;
module.watch(require("./write-stream.js"), {
  default(v) {
    WriteStream = v;
  }

}, 5);
let check, Match;
module.watch(require("meteor/check"), {
  check(v) {
    check = v;
  },

  Match(v) {
    Match = v;
  }

}, 6);
let FilesCollectionCore;
module.watch(require("./core.js"), {
  default(v) {
    FilesCollectionCore = v;
  }

}, 7);
let fixJSONParse, fixJSONStringify, helpers;
module.watch(require("./lib.js"), {
  fixJSONParse(v) {
    fixJSONParse = v;
  },

  fixJSONStringify(v) {
    fixJSONStringify = v;
  },

  helpers(v) {
    helpers = v;
  }

}, 8);
let fs;
module.watch(require("fs-extra"), {
  default(v) {
    fs = v;
  }

}, 9);
let nodeQs;
module.watch(require("querystring"), {
  default(v) {
    nodeQs = v;
  }

}, 10);
let request;
module.watch(require("request"), {
  default(v) {
    request = v;
  }

}, 11);
let fileType;
module.watch(require("file-type"), {
  default(v) {
    fileType = v;
  }

}, 12);
let nodePath;
module.watch(require("path"), {
  default(v) {
    nodePath = v;
  }

}, 13);

/*
 * @const {Object} bound  - Meteor.bindEnvironment (Fiber wrapper)
 * @const {Function} NOOP - No Operation function, placeholder for required callbacks
 */
const bound = Meteor.bindEnvironment(callback => callback());

const NOOP = () => {};
/*
 * @locus Anywhere
 * @class FilesCollection
 * @param config           {Object}   - [Both]   Configuration object with next properties:
 * @param config.debug     {Boolean}  - [Both]   Turn on/of debugging and extra logging
 * @param config.schema    {Object}   - [Both]   Collection Schema
 * @param config.public    {Boolean}  - [Both]   Store files in folder accessible for proxy servers, for limits, and more - read docs
 * @param config.strict    {Boolean}  - [Server] Strict mode for partial content, if is `true` server will return `416` response code, when `range` is not specified, otherwise server return `206`
 * @param config.protected {Function} - [Server] If `true` - files will be served only to authorized users, if `function()` - you're able to check visitor's permissions in your own way function's context has:
 *  - `request`
 *  - `response`
 *  - `user()`
 *  - `userId`
 * @param config.chunkSize      {Number}  - [Both] Upload chunk size, default: 524288 bytes (0,5 Mb)
 * @param config.permissions    {Number}  - [Server] Permissions which will be set to uploaded files (octal), like: `511` or `0o755`. Default: 0644
 * @param config.parentDirPermissions {Number}  - [Server] Permissions which will be set to parent directory of uploaded files (octal), like: `611` or `0o777`. Default: 0755
 * @param config.storagePath    {String|Function}  - [Server] Storage path on file system
 * @param config.cacheControl   {String}  - [Server] Default `Cache-Control` header
 * @param config.responseHeaders {Object|Function} - [Server] Custom response headers, if function is passed, must return Object
 * @param config.throttle       {Number}  - [Server] DEPRECATED bps throttle threshold
 * @param config.downloadRoute  {String}  - [Both]   Server Route used to retrieve files
 * @param config.collection     {Mongo.Collection} - [Both] Mongo Collection Instance
 * @param config.collectionName {String}  - [Both]   Collection name
 * @param config.namingFunction {Function}- [Both]   Function which returns `String`
 * @param config.integrityCheck {Boolean} - [Server] Check file's integrity before serving to users
 * @param config.onAfterUpload  {Function}- [Server] Called right after file is ready on FS. Use to transfer file somewhere else, or do other thing with file directly
 * @param config.onAfterRemove  {Function} - [Server] Called right after file is removed. Removed objects is passed to callback
 * @param config.continueUploadTTL {Number} - [Server] Time in seconds, during upload may be continued, default 3 hours (10800 seconds)
 * @param config.onBeforeUpload {Function}- [Both]   Function which executes on server after receiving each chunk and on client right before beginning upload. Function context is `File` - so you are able to check for extension, mime-type, size and etc.:
 *  - return `true` to continue
 *  - return `false` or `String` to abort upload
 * @param config.onInitiateUpload {Function} - [Server] Function which executes on server right before upload is begin and right after `onBeforeUpload` hook. This hook is fully asynchronous.
 * @param config.onBeforeRemove {Function} - [Server] Executes before removing file on server, so you can check permissions. Return `true` to allow action and `false` to deny.
 * @param config.allowClientCode  {Boolean}  - [Both]   Allow to run `remove` from client
 * @param config.downloadCallback {Function} - [Server] Callback triggered each time file is requested, return truthy value to continue download, or falsy to abort
 * @param config.interceptDownload {Function} - [Server] Intercept download request, so you can serve file from third-party resource, arguments {http: {request: {...}, response: {...}}, fileRef: {...}}
 * @param config.disableUpload {Boolean} - Disable file upload, useful for server only solutions
 * @param config.disableDownload {Boolean} - Disable file download (serving), useful for file management only solutions
 * @param config._preCollection  {Mongo.Collection} - [Server] Mongo preCollection Instance
 * @param config._preCollectionName {String}  - [Server]  preCollection name
 * @summary Create new instance of FilesCollection
 */


class FilesCollection extends FilesCollectionCore {
  constructor(config) {
    super();
    let storagePath;

    if (config) {
      ({
        storagePath,
        debug: this.debug,
        schema: this.schema,
        public: this.public,
        strict: this.strict,
        chunkSize: this.chunkSize,
        protected: this.protected,
        collection: this.collection,
        permissions: this.permissions,
        cacheControl: this.cacheControl,
        downloadRoute: this.downloadRoute,
        onAfterUpload: this.onAfterUpload,
        onAfterRemove: this.onAfterRemove,
        disableUpload: this.disableUpload,
        onBeforeRemove: this.onBeforeRemove,
        integrityCheck: this.integrityCheck,
        collectionName: this.collectionName,
        onBeforeUpload: this.onBeforeUpload,
        namingFunction: this.namingFunction,
        responseHeaders: this.responseHeaders,
        disableDownload: this.disableDownload,
        allowClientCode: this.allowClientCode,
        downloadCallback: this.downloadCallback,
        onInitiateUpload: this.onInitiateUpload,
        interceptDownload: this.interceptDownload,
        continueUploadTTL: this.continueUploadTTL,
        parentDirPermissions: this.parentDirPermissions,
        _preCollection: this._preCollection,
        _preCollectionName: this._preCollectionName
      } = config);
    }

    const self = this;
    new Cookies();

    if (!helpers.isBoolean(this.debug)) {
      this.debug = false;
    }

    if (!helpers.isBoolean(this.public)) {
      this.public = false;
    }

    if (!this.protected) {
      this.protected = false;
    }

    if (!this.chunkSize) {
      this.chunkSize = 1024 * 512;
    }

    this.chunkSize = Math.floor(this.chunkSize / 8) * 8;

    if (!helpers.isString(this.collectionName) && !this.collection) {
      this.collectionName = 'MeteorUploadFiles';
    }

    if (!this.collection) {
      this.collection = new Mongo.Collection(this.collectionName);
    } else {
      this.collectionName = this.collection._name;
    }

    this.collection.filesCollection = this;
    check(this.collectionName, String);

    if (this.public && !this.downloadRoute) {
      throw new Meteor.Error(500, `[FilesCollection.${this.collectionName}]: "downloadRoute" must be precisely provided on "public" collections! Note: "downloadRoute" must be equal or be inside of your web/proxy-server (relative) root.`);
    }

    if (!helpers.isString(this.downloadRoute)) {
      this.downloadRoute = '/cdn/storage';
    }

    this.downloadRoute = this.downloadRoute.replace(/\/$/, '');

    if (!helpers.isFunction(this.namingFunction)) {
      this.namingFunction = false;
    }

    if (!helpers.isFunction(this.onBeforeUpload)) {
      this.onBeforeUpload = false;
    }

    if (!helpers.isBoolean(this.allowClientCode)) {
      this.allowClientCode = true;
    }

    if (!helpers.isFunction(this.onInitiateUpload)) {
      this.onInitiateUpload = false;
    }

    if (!helpers.isFunction(this.interceptDownload)) {
      this.interceptDownload = false;
    }

    if (!helpers.isBoolean(this.strict)) {
      this.strict = true;
    }

    if (!helpers.isNumber(this.permissions)) {
      this.permissions = parseInt('644', 8);
    }

    if (!helpers.isNumber(this.parentDirPermissions)) {
      this.parentDirPermissions = parseInt('755', 8);
    }

    if (!helpers.isString(this.cacheControl)) {
      this.cacheControl = 'public, max-age=31536000, s-maxage=31536000';
    }

    if (!helpers.isFunction(this.onAfterUpload)) {
      this.onAfterUpload = false;
    }

    if (!helpers.isBoolean(this.disableUpload)) {
      this.disableUpload = false;
    }

    if (!helpers.isFunction(this.onAfterRemove)) {
      this.onAfterRemove = false;
    }

    if (!helpers.isFunction(this.onBeforeRemove)) {
      this.onBeforeRemove = false;
    }

    if (!helpers.isBoolean(this.integrityCheck)) {
      this.integrityCheck = true;
    }

    if (!helpers.isBoolean(this.disableDownload)) {
      this.disableDownload = false;
    }

    if (!helpers.isObject(this._currentUploads)) {
      this._currentUploads = {};
    }

    if (!helpers.isFunction(this.downloadCallback)) {
      this.downloadCallback = false;
    }

    if (!helpers.isNumber(this.continueUploadTTL)) {
      this.continueUploadTTL = 10800;
    }

    if (!helpers.isFunction(this.responseHeaders)) {
      this.responseHeaders = (responseCode, fileRef, versionRef) => {
        const headers = {};

        switch (responseCode) {
          case '206':
            headers.Pragma = 'private';
            headers.Trailer = 'expires';
            headers['Transfer-Encoding'] = 'chunked';
            break;

          case '400':
            headers['Cache-Control'] = 'no-cache';
            break;

          case '416':
            headers['Content-Range'] = `bytes */${versionRef.size}`;
            break;

          default:
            break;
        }

        headers.Connection = 'keep-alive';
        headers['Content-Type'] = versionRef.type || 'application/octet-stream';
        headers['Accept-Ranges'] = 'bytes';
        return headers;
      };
    }

    if (this.public && !storagePath) {
      throw new Meteor.Error(500, `[FilesCollection.${this.collectionName}] "storagePath" must be set on "public" collections! Note: "storagePath" must be equal on be inside of your web/proxy-server (absolute) root.`);
    }

    if (!storagePath) {
      storagePath = function () {
        return `assets${nodePath.sep}app${nodePath.sep}uploads${nodePath.sep}${self.collectionName}`;
      };
    }

    if (helpers.isString(storagePath)) {
      this.storagePath = () => storagePath;
    } else {
      this.storagePath = function () {
        let sp = storagePath.apply(self, arguments);

        if (!helpers.isString(sp)) {
          throw new Meteor.Error(400, `[FilesCollection.${self.collectionName}] "storagePath" function must return a String!`);
        }

        sp = sp.replace(/\/$/, '');
        return nodePath.normalize(sp);
      };
    }

    this._debug('[FilesCollection.storagePath] Set to:', this.storagePath({}));

    fs.mkdirs(this.storagePath({}), {
      mode: this.parentDirPermissions
    }, error => {
      if (error) {
        throw new Meteor.Error(401, `[FilesCollection.${self.collectionName}] Path "${this.storagePath({})}" is not writable! ${error}`);
      }
    });
    check(this.strict, Boolean);
    check(this.permissions, Number);
    check(this.storagePath, Function);
    check(this.cacheControl, String);
    check(this.onAfterRemove, Match.OneOf(false, Function));
    check(this.onAfterUpload, Match.OneOf(false, Function));
    check(this.disableUpload, Boolean);
    check(this.integrityCheck, Boolean);
    check(this.onBeforeRemove, Match.OneOf(false, Function));
    check(this.disableDownload, Boolean);
    check(this.downloadCallback, Match.OneOf(false, Function));
    check(this.interceptDownload, Match.OneOf(false, Function));
    check(this.continueUploadTTL, Number);
    check(this.responseHeaders, Match.OneOf(Object, Function));

    if (!this.disableUpload) {
      if (!helpers.isString(this._preCollectionName) && !this._preCollection) {
        this._preCollectionName = `__pre_${this.collectionName}`;
      }

      if (!this._preCollection) {
        this._preCollection = new Mongo.Collection(this._preCollectionName);
      } else {
        this._preCollectionName = this._preCollection._name;
      }

      check(this._preCollectionName, String);

      this._preCollection._ensureIndex({
        createdAt: 1
      }, {
        expireAfterSeconds: this.continueUploadTTL,
        background: true
      });

      const _preCollectionCursor = this._preCollection.find({}, {
        fields: {
          _id: 1,
          isFinished: 1
        }
      });

      _preCollectionCursor.observe({
        changed(doc) {
          if (doc.isFinished) {
            self._debug(`[FilesCollection] [_preCollectionCursor.observe] [changed]: ${doc._id}`);

            self._preCollection.remove({
              _id: doc._id
            }, NOOP);
          }
        },

        removed(doc) {
          // Free memory after upload is done
          // Or if upload is unfinished
          self._debug(`[FilesCollection] [_preCollectionCursor.observe] [removed]: ${doc._id}`);

          if (helpers.isObject(self._currentUploads[doc._id])) {
            self._currentUploads[doc._id].stop();

            self._currentUploads[doc._id].end();

            if (!doc.isFinished) {
              self._debug(`[FilesCollection] [_preCollectionCursor.observe] [removeUnfinishedUpload]: ${doc._id}`);

              self._currentUploads[doc._id].abort();
            }

            delete self._currentUploads[doc._id];
          }
        }

      });

      this._createStream = (_id, path, opts) => {
        this._currentUploads[_id] = new WriteStream(path, opts.fileLength, opts, this.permissions);
      }; // This little function allows to continue upload
      // even after server is restarted (*not on dev-stage*)


      this._continueUpload = _id => {
        if (this._currentUploads[_id] && this._currentUploads[_id].file) {
          if (!this._currentUploads[_id].aborted && !this._currentUploads[_id].ended) {
            return this._currentUploads[_id].file;
          }

          this._createStream(_id, this._currentUploads[_id].file.file.path, this._currentUploads[_id].file);

          return this._currentUploads[_id].file;
        }

        const contUpld = this._preCollection.findOne({
          _id
        });

        if (contUpld) {
          this._createStream(_id, contUpld.file.path, contUpld);

          return this._currentUploads[_id].file;
        }

        return false;
      };
    }

    if (!this.schema) {
      this.schema = FilesCollectionCore.schema;
    }

    check(this.debug, Boolean);
    check(this.schema, Object);
    check(this.public, Boolean);
    check(this.protected, Match.OneOf(Boolean, Function));
    check(this.chunkSize, Number);
    check(this.downloadRoute, String);
    check(this.namingFunction, Match.OneOf(false, Function));
    check(this.onBeforeUpload, Match.OneOf(false, Function));
    check(this.onInitiateUpload, Match.OneOf(false, Function));
    check(this.allowClientCode, Boolean);

    if (this.public && this.protected) {
      throw new Meteor.Error(500, `[FilesCollection.${this.collectionName}]: Files can not be public and protected at the same time!`);
    }

    this._checkAccess = http => {
      if (this.protected) {
        let result;

        const {
          user,
          userId
        } = this._getUser(http);

        if (helpers.isFunction(this.protected)) {
          let fileRef;

          if (helpers.isObject(http.params) && http.params._id) {
            fileRef = this.collection.findOne(http.params._id);
          }

          result = http ? this.protected.call(Object.assign(http, {
            user,
            userId
          }), fileRef || null) : this.protected.call({
            user,
            userId
          }, fileRef || null);
        } else {
          result = !!userId;
        }

        if (http && result === true || !http) {
          return true;
        }

        const rc = helpers.isNumber(result) ? result : 401;

        this._debug('[FilesCollection._checkAccess] WARN: Access denied!');

        if (http) {
          const text = 'Access denied!';

          if (!http.response.headersSent) {
            http.response.writeHead(rc, {
              'Content-Type': 'text/plain',
              'Content-Length': text.length
            });
          }

          if (!http.response.finished) {
            http.response.end(text);
          }
        }

        return false;
      }

      return true;
    };

    this._methodNames = {
      _Abort: `_FilesCollectionAbort_${this.collectionName}`,
      _Write: `_FilesCollectionWrite_${this.collectionName}`,
      _Start: `_FilesCollectionStart_${this.collectionName}`,
      _Remove: `_FilesCollectionRemove_${this.collectionName}`
    };
    this.on('_handleUpload', this._handleUpload);
    this.on('_finishUpload', this._finishUpload);
    this._handleUploadSync = Meteor.wrapAsync(this._handleUpload.bind(this));

    if (this.disableUpload && this.disableDownload) {
      return;
    }

    WebApp.connectHandlers.use((httpReq, httpResp, next) => {
      if (!this.disableUpload && !!~httpReq._parsedUrl.path.indexOf(`${this.downloadRoute}/${this.collectionName}/__upload`)) {
        if (httpReq.method === 'POST') {
          const handleError = _error => {
            let error = _error;
            console.warn('[FilesCollection] [Upload] [HTTP] Exception:', error);
            console.trace();

            if (!httpResp.headersSent) {
              httpResp.writeHead(500);
            }

            if (!httpResp.finished) {
              if (helpers.isObject(error) && helpers.isFunction(error.toString)) {
                error = error.toString();
              }

              if (!helpers.isString(error)) {
                error = 'Unexpected error!';
              }

              httpResp.end(JSON.stringify({
                error
              }));
            }
          };

          let body = '';
          httpReq.on('data', data => bound(() => {
            body += data;
          }));
          httpReq.on('end', () => bound(() => {
            try {
              let opts;
              let result;
              let user;

              if (httpReq.headers['x-mtok'] && helpers.isObject(Meteor.server.sessions) && helpers.has(Meteor.server.sessions[httpReq.headers['x-mtok']], 'userId')) {
                user = {
                  userId: Meteor.server.sessions[httpReq.headers['x-mtok']].userId
                };
              } else {
                user = this._getUser({
                  request: httpReq,
                  response: httpResp
                });
              }

              if (httpReq.headers['x-start'] !== '1') {
                opts = {
                  fileId: httpReq.headers['x-fileid']
                };

                if (httpReq.headers['x-eof'] === '1') {
                  opts.eof = true;
                } else {
                  if (typeof Buffer.from === 'function') {
                    try {
                      opts.binData = Buffer.from(body, 'base64');
                    } catch (buffErr) {
                      opts.binData = new Buffer(body, 'base64');
                    }
                  } else {
                    opts.binData = new Buffer(body, 'base64');
                  }

                  opts.chunkId = parseInt(httpReq.headers['x-chunkid']);
                }

                const _continueUpload = this._continueUpload(opts.fileId);

                if (!_continueUpload) {
                  throw new Meteor.Error(408, 'Can\'t continue upload, session expired. Start upload again.');
                }

                ({
                  result,
                  opts
                } = this._prepareUpload(Object.assign(opts, _continueUpload), user.userId, 'HTTP'));

                if (opts.eof) {
                  this._handleUpload(result, opts, _error => {
                    let error = _error;

                    if (error) {
                      if (!httpResp.headersSent) {
                        httpResp.writeHead(500);
                      }

                      if (!httpResp.finished) {
                        if (helpers.isObject(error) && helpers.isFunction(error.toString)) {
                          error = error.toString();
                        }

                        if (!helpers.isString(error)) {
                          error = 'Unexpected error!';
                        }

                        httpResp.end(JSON.stringify({
                          error
                        }));
                      }
                    }

                    if (!httpResp.headersSent) {
                      httpResp.writeHead(200);
                    }

                    if (helpers.isObject(result.file) && result.file.meta) {
                      result.file.meta = fixJSONStringify(result.file.meta);
                    }

                    if (!httpResp.finished) {
                      httpResp.end(JSON.stringify(result));
                    }
                  });

                  return;
                }

                this.emit('_handleUpload', result, opts, NOOP);

                if (!httpResp.headersSent) {
                  httpResp.writeHead(204);
                }

                if (!httpResp.finished) {
                  httpResp.end();
                }
              } else {
                try {
                  opts = JSON.parse(body);
                } catch (jsonErr) {
                  console.error('Can\'t parse incoming JSON from Client on [.insert() | upload], something went wrong!', jsonErr);
                  opts = {
                    file: {}
                  };
                }

                if (!helpers.isObject(opts.file)) {
                  opts.file = {};
                }

                opts.___s = true;

                this._debug(`[FilesCollection] [File Start HTTP] ${opts.file.name || '[no-name]'} - ${opts.fileId}`);

                if (helpers.isObject(opts.file) && opts.file.meta) {
                  opts.file.meta = fixJSONParse(opts.file.meta);
                }

                ({
                  result
                } = this._prepareUpload(helpers.clone(opts), user.userId, 'HTTP Start Method'));

                if (this.collection.findOne(result._id)) {
                  throw new Meteor.Error(400, 'Can\'t start upload, data substitution detected!');
                }

                opts._id = opts.fileId;
                opts.createdAt = new Date();
                opts.maxLength = opts.fileLength;

                this._preCollection.insert(helpers.omit(opts, '___s'));

                this._createStream(result._id, result.path, helpers.omit(opts, '___s'));

                if (opts.returnMeta) {
                  if (!httpResp.headersSent) {
                    httpResp.writeHead(200);
                  }

                  if (!httpResp.finished) {
                    httpResp.end(JSON.stringify({
                      uploadRoute: `${this.downloadRoute}/${this.collectionName}/__upload`,
                      file: result
                    }));
                  }
                } else {
                  if (!httpResp.headersSent) {
                    httpResp.writeHead(204);
                  }

                  if (!httpResp.finished) {
                    httpResp.end();
                  }
                }
              }
            } catch (httpRespErr) {
              handleError(httpRespErr);
            }
          }));
        } else {
          next();
        }

        return;
      }

      if (!this.disableDownload) {
        let http;
        let params;
        let uri;
        let uris;

        if (!this.public) {
          if (!!~httpReq._parsedUrl.path.indexOf(`${this.downloadRoute}/${this.collectionName}`)) {
            uri = httpReq._parsedUrl.path.replace(`${this.downloadRoute}/${this.collectionName}`, '');

            if (uri.indexOf('/') === 0) {
              uri = uri.substring(1);
            }

            uris = uri.split('/');

            if (uris.length === 3) {
              params = {
                _id: uris[0],
                query: httpReq._parsedUrl.query ? nodeQs.parse(httpReq._parsedUrl.query) : {},
                name: uris[2].split('?')[0],
                version: uris[1]
              };
              http = {
                request: httpReq,
                response: httpResp,
                params
              };

              if (this._checkAccess(http)) {
                this.download(http, uris[1], this.collection.findOne(uris[0]));
              }
            } else {
              next();
            }
          } else {
            next();
          }
        } else {
          if (!!~httpReq._parsedUrl.path.indexOf(`${this.downloadRoute}`)) {
            uri = httpReq._parsedUrl.path.replace(`${this.downloadRoute}`, '');

            if (uri.indexOf('/') === 0) {
              uri = uri.substring(1);
            }

            uris = uri.split('/');
            let _file = uris[uris.length - 1];

            if (_file) {
              let version;

              if (!!~_file.indexOf('-')) {
                version = _file.split('-')[0];
                _file = _file.split('-')[1].split('?')[0];
              } else {
                version = 'original';
                _file = _file.split('?')[0];
              }

              params = {
                query: httpReq._parsedUrl.query ? nodeQs.parse(httpReq._parsedUrl.query) : {},
                file: _file,
                _id: _file.split('.')[0],
                version,
                name: _file
              };
              http = {
                request: httpReq,
                response: httpResp,
                params
              };
              this.download(http, version, this.collection.findOne(params._id));
            } else {
              next();
            }
          } else {
            next();
          }
        }

        return;
      }

      next();
    });

    if (!this.disableUpload) {
      const _methods = {}; // Method used to remove file
      // from Client side

      _methods[this._methodNames._Remove] = function (selector) {
        check(selector, Match.OneOf(String, Object));

        self._debug(`[FilesCollection] [Unlink Method] [.remove(${selector})]`);

        if (self.allowClientCode) {
          if (self.onBeforeRemove && helpers.isFunction(self.onBeforeRemove)) {
            const userId = this.userId;
            const userFuncs = {
              userId: this.userId,

              user() {
                if (Meteor.users) {
                  return Meteor.users.findOne(userId);
                }

                return null;
              }

            };

            if (!self.onBeforeRemove.call(userFuncs, self.find(selector) || null)) {
              throw new Meteor.Error(403, '[FilesCollection] [remove] Not permitted!');
            }
          }

          const cursor = self.find(selector);

          if (cursor.count() > 0) {
            self.remove(selector);
            return true;
          }

          throw new Meteor.Error(404, 'Cursor is empty, no files is removed');
        } else {
          throw new Meteor.Error(401, '[FilesCollection] [remove] Run code from client is not allowed!');
        }
      }; // Method used to receive "first byte" of upload
      // and all file's meta-data, so
      // it won't be transferred with every chunk
      // Basically it prepares everything
      // So user can pause/disconnect and
      // continue upload later, during `continueUploadTTL`


      _methods[this._methodNames._Start] = function (opts, returnMeta) {
        check(opts, {
          file: Object,
          fileId: String,
          FSName: Match.Optional(String),
          chunkSize: Number,
          fileLength: Number
        });
        check(returnMeta, Match.Optional(Boolean));

        self._debug(`[FilesCollection] [File Start Method] ${opts.file.name} - ${opts.fileId}`);

        opts.___s = true;

        const {
          result
        } = self._prepareUpload(helpers.clone(opts), this.userId, 'DDP Start Method');

        if (self.collection.findOne(result._id)) {
          throw new Meteor.Error(400, 'Can\'t start upload, data substitution detected!');
        }

        opts._id = opts.fileId;
        opts.createdAt = new Date();
        opts.maxLength = opts.fileLength;

        try {
          self._preCollection.insert(helpers.omit(opts, '___s'));

          self._createStream(result._id, result.path, helpers.omit(opts, '___s'));
        } catch (e) {
          self._debug(`[FilesCollection] [File Start Method] [EXCEPTION:] ${opts.file.name} - ${opts.fileId}`, e);

          throw new Meteor.Error(500, 'Can\'t start');
        }

        if (returnMeta) {
          return {
            uploadRoute: `${self.downloadRoute}/${self.collectionName}/__upload`,
            file: result
          };
        }

        return true;
      }; // Method used to write file chunks
      // it receives very limited amount of meta-data
      // This method also responsible for EOF


      _methods[this._methodNames._Write] = function (_opts) {
        let opts = _opts;
        let result;
        check(opts, {
          eof: Match.Optional(Boolean),
          fileId: String,
          binData: Match.Optional(String),
          chunkId: Match.Optional(Number)
        });

        if (opts.binData) {
          if (typeof Buffer.from === 'function') {
            try {
              opts.binData = Buffer.from(opts.binData, 'base64');
            } catch (buffErr) {
              opts.binData = new Buffer(opts.binData, 'base64');
            }
          } else {
            opts.binData = new Buffer(opts.binData, 'base64');
          }
        }

        const _continueUpload = self._continueUpload(opts.fileId);

        if (!_continueUpload) {
          throw new Meteor.Error(408, 'Can\'t continue upload, session expired. Start upload again.');
        }

        this.unblock();
        ({
          result,
          opts
        } = self._prepareUpload(Object.assign(opts, _continueUpload), this.userId, 'DDP'));

        if (opts.eof) {
          try {
            return self._handleUploadSync(result, opts);
          } catch (handleUploadErr) {
            self._debug('[FilesCollection] [Write Method] [DDP] Exception:', handleUploadErr);

            throw handleUploadErr;
          }
        } else {
          self.emit('_handleUpload', result, opts, NOOP);
        }

        return true;
      }; // Method used to Abort upload
      // - Feeing memory by .end()ing writableStreams
      // - Removing temporary record from @_preCollection
      // - Removing record from @collection
      // - .unlink()ing chunks from FS


      _methods[this._methodNames._Abort] = function (_id) {
        check(_id, String);

        const _continueUpload = self._continueUpload(_id);

        self._debug(`[FilesCollection] [Abort Method]: ${_id} - ${helpers.isObject(_continueUpload.file) ? _continueUpload.file.path : ''}`);

        if (self._currentUploads && self._currentUploads[_id]) {
          self._currentUploads[_id].stop();

          self._currentUploads[_id].abort();
        }

        if (_continueUpload) {
          self._preCollection.remove({
            _id
          });

          self.remove({
            _id
          });

          if (helpers.isObject(_continueUpload.file) && _continueUpload.file.path) {
            self.unlink({
              _id,
              path: _continueUpload.file.path
            });
          }
        }

        return true;
      };

      Meteor.methods(_methods);
    }
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name _prepareUpload
   * @summary Internal method. Used to optimize received data and check upload permission
   * @returns {Object}
   */


  _prepareUpload(opts = {}, userId, transport) {
    let ctx;

    if (!helpers.isBoolean(opts.eof)) {
      opts.eof = false;
    }

    if (!opts.binData) {
      opts.binData = 'EOF';
    }

    if (!helpers.isNumber(opts.chunkId)) {
      opts.chunkId = -1;
    }

    if (!helpers.isString(opts.FSName)) {
      opts.FSName = opts.fileId;
    }

    this._debug(`[FilesCollection] [Upload] [${transport}] Got #${opts.chunkId}/${opts.fileLength} chunks, dst: ${opts.file.name || opts.file.fileName}`);

    const fileName = this._getFileName(opts.file);

    const {
      extension,
      extensionWithDot
    } = this._getExt(fileName);

    if (!helpers.isObject(opts.file.meta)) {
      opts.file.meta = {};
    }

    let result = opts.file;
    result.name = fileName;
    result.meta = opts.file.meta;
    result.extension = extension;
    result.ext = extension;
    result._id = opts.fileId;
    result.userId = userId || null;
    opts.FSName = opts.FSName.replace(/([^a-z0-9\-\_]+)/gi, '-');
    result.path = `${this.storagePath(result)}${nodePath.sep}${opts.FSName}${extensionWithDot}`;
    result = Object.assign(result, this._dataToSchema(result));

    if (this.onBeforeUpload && helpers.isFunction(this.onBeforeUpload)) {
      ctx = Object.assign({
        file: opts.file
      }, {
        chunkId: opts.chunkId,
        userId: result.userId,

        user() {
          if (Meteor.users && result.userId) {
            return Meteor.users.findOne(result.userId);
          }

          return null;
        },

        eof: opts.eof
      });
      const isUploadAllowed = this.onBeforeUpload.call(ctx, result);

      if (isUploadAllowed !== true) {
        throw new Meteor.Error(403, helpers.isString(isUploadAllowed) ? isUploadAllowed : '@onBeforeUpload() returned false');
      } else {
        if (opts.___s === true && this.onInitiateUpload && helpers.isFunction(this.onInitiateUpload)) {
          this.onInitiateUpload.call(ctx, result);
        }
      }
    } else if (opts.___s === true && this.onInitiateUpload && helpers.isFunction(this.onInitiateUpload)) {
      ctx = Object.assign({
        file: opts.file
      }, {
        chunkId: opts.chunkId,
        userId: result.userId,

        user() {
          if (Meteor.users && result.userId) {
            return Meteor.users.findOne(result.userId);
          }

          return null;
        },

        eof: opts.eof
      });
      this.onInitiateUpload.call(ctx, result);
    }

    return {
      result,
      opts
    };
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name _finishUpload
   * @summary Internal method. Finish upload, close Writable stream, add record to MongoDB and flush used memory
   * @returns {undefined}
   */


  _finishUpload(result, opts, cb) {
    this._debug(`[FilesCollection] [Upload] [finish(ing)Upload] -> ${result.path}`);

    fs.chmod(result.path, this.permissions, NOOP);
    result.type = this._getMimeType(opts.file);
    result.public = this.public;

    this._updateFileTypes(result);

    this.collection.insert(helpers.clone(result), (colInsert, _id) => {
      if (colInsert) {
        cb && cb(colInsert);

        this._debug('[FilesCollection] [Upload] [_finishUpload] [insert] Error:', colInsert);
      } else {
        this._preCollection.update({
          _id: opts.fileId
        }, {
          $set: {
            isFinished: true
          }
        }, preUpdateError => {
          if (preUpdateError) {
            cb && cb(preUpdateError);

            this._debug('[FilesCollection] [Upload] [_finishUpload] [update] Error:', preUpdateError);
          } else {
            result._id = _id;

            this._debug(`[FilesCollection] [Upload] [finish(ed)Upload] -> ${result.path}`);

            this.onAfterUpload && this.onAfterUpload.call(this, result);
            this.emit('afterUpload', result);
            cb && cb(null, result);
          }
        });
      }
    });
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name _handleUpload
   * @summary Internal method to handle upload process, pipe incoming data to Writable stream
   * @returns {undefined}
   */


  _handleUpload(result, opts, cb) {
    try {
      if (opts.eof) {
        this._currentUploads[result._id].end(() => {
          this.emit('_finishUpload', result, opts, cb);
        });
      } else {
        this._currentUploads[result._id].write(opts.chunkId, opts.binData, cb);
      }
    } catch (e) {
      this._debug('[_handleUpload] [EXCEPTION:]', e);

      cb && cb(e);
    }
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCollection
   * @name _getMimeType
   * @param {Object} fileData - File Object
   * @summary Returns file's mime-type
   * @returns {String}
   */


  _getMimeType(fileData) {
    let mime;
    check(fileData, Object);

    if (helpers.isObject(fileData) && fileData.type) {
      mime = fileData.type;
    }

    if (fileData.path && (!mime || !helpers.isString(mime))) {
      try {
        let buf = new Buffer(262);
        const fd = fs.openSync(fileData.path, 'r');
        const br = fs.readSync(fd, buf, 0, 262, 0);
        fs.close(fd, NOOP);

        if (br < 262) {
          buf = buf.slice(0, br);
        }

        ({
          mime
        } = fileType(buf));
      } catch (e) {// We're good
      }
    }

    if (!mime || !helpers.isString(mime)) {
      mime = 'application/octet-stream';
    }

    return mime;
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCollection
   * @name _getUser
   * @summary Returns object with `userId` and `user()` method which return user's object
   * @returns {Object}
   */


  _getUser(http) {
    const result = {
      user() {
        return null;
      },

      userId: null
    };

    if (http) {
      let mtok = null;

      if (http.request.headers['x-mtok']) {
        mtok = http.request.headers['x-mtok'];
      } else {
        const cookie = http.request.Cookies;

        if (cookie.has('x_mtok')) {
          mtok = cookie.get('x_mtok');
        }
      }

      if (mtok) {
        const userId = helpers.isObject(Meteor.server.sessions) && helpers.isObject(Meteor.server.sessions[mtok]) ? Meteor.server.sessions[mtok].userId : void 0;

        if (userId) {
          result.user = () => Meteor.users.findOne(userId);

          result.userId = userId;
        }
      }
    }

    return result;
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name write
   * @param {Buffer} buffer - Binary File's Buffer
   * @param {Object} opts - Object with file-data
   * @param {String} opts.name - File name, alias: `fileName`
   * @param {String} opts.type - File mime-type
   * @param {Object} opts.meta - File additional meta-data
   * @param {String} opts.userId - UserId, default *null*
   * @param {String} opts.fileId - _id, default *null*
   * @param {Function} callback - function(error, fileObj){...}
   * @param {Boolean} proceedAfterUpload - Proceed onAfterUpload hook
   * @summary Write buffer to FS and add to FilesCollection Collection
   * @returns {FilesCollection} Instance
   */


  write(buffer, _opts = {}, _callback, _proceedAfterUpload) {
    this._debug('[FilesCollection] [write()]');

    let opts = _opts;
    let callback = _callback;
    let proceedAfterUpload = _proceedAfterUpload;

    if (helpers.isFunction(opts)) {
      proceedAfterUpload = callback;
      callback = opts;
      opts = {};
    } else if (helpers.isBoolean(callback)) {
      proceedAfterUpload = callback;
    } else if (helpers.isBoolean(opts)) {
      proceedAfterUpload = opts;
    }

    check(opts, Match.Optional(Object));
    check(callback, Match.Optional(Function));
    check(proceedAfterUpload, Match.Optional(Boolean));
    const fileId = opts.fileId || Random.id();
    const FSName = this.namingFunction ? this.namingFunction(opts) : fileId;
    const fileName = opts.name || opts.fileName ? opts.name || opts.fileName : FSName;

    const {
      extension,
      extensionWithDot
    } = this._getExt(fileName);

    opts.path = `${this.storagePath(opts)}${nodePath.sep}${FSName}${extensionWithDot}`;
    opts.type = this._getMimeType(opts);

    if (!helpers.isObject(opts.meta)) {
      opts.meta = {};
    }

    if (!helpers.isNumber(opts.size)) {
      opts.size = buffer.length;
    }

    const result = this._dataToSchema({
      name: fileName,
      path: opts.path,
      meta: opts.meta,
      type: opts.type,
      size: opts.size,
      userId: opts.userId,
      extension
    });

    result._id = fileId;
    const stream = fs.createWriteStream(opts.path, {
      flags: 'w',
      mode: this.permissions
    });
    stream.end(buffer, streamErr => bound(() => {
      if (streamErr) {
        callback && callback(streamErr);
      } else {
        this.collection.insert(result, (insertErr, _id) => {
          if (insertErr) {
            callback && callback(insertErr);

            this._debug(`[FilesCollection] [write] [insert] Error: ${fileName} -> ${this.collectionName}`, insertErr);
          } else {
            const fileRef = this.collection.findOne(_id);
            callback && callback(null, fileRef);

            if (proceedAfterUpload === true) {
              this.onAfterUpload && this.onAfterUpload.call(this, fileRef);
              this.emit('afterUpload', fileRef);
            }

            this._debug(`[FilesCollection] [write]: ${fileName} -> ${this.collectionName}`);
          }
        });
      }
    }));
    return this;
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name load
   * @param {String} url - URL to file
   * @param {Object} opts - Object with file-data
   * @param {Object} opts.headers - HTTP headers to use when requesting the file
   * @param {String} opts.name - File name, alias: `fileName`
   * @param {String} opts.type - File mime-type
   * @param {Object} opts.meta - File additional meta-data
   * @param {String} opts.userId - UserId, default *null*
   * @param {String} opts.fileId - _id, default *null*
   * @param {Function} callback - function(error, fileObj){...}
   * @param {Boolean} proceedAfterUpload - Proceed onAfterUpload hook
   * @summary Download file, write stream to FS and add to FilesCollection Collection
   * @returns {FilesCollection} Instance
   */


  load(url, _opts = {}, _callback, _proceedAfterUpload) {
    this._debug(`[FilesCollection] [load(${url}, ${JSON.stringify(_opts)}, callback)]`);

    let opts = _opts;
    let callback = _callback;
    let proceedAfterUpload = _proceedAfterUpload;

    if (helpers.isFunction(opts)) {
      proceedAfterUpload = callback;
      callback = opts;
      opts = {};
    } else if (helpers.isBoolean(callback)) {
      proceedAfterUpload = callback;
    } else if (helpers.isBoolean(opts)) {
      proceedAfterUpload = opts;
    }

    check(url, String);
    check(opts, Match.Optional(Object));
    check(callback, Match.Optional(Function));
    check(proceedAfterUpload, Match.Optional(Boolean));

    if (!helpers.isObject(opts)) {
      opts = {};
    }

    const fileId = opts.fileId || Random.id();
    const FSName = this.namingFunction ? this.namingFunction(opts) : fileId;
    const pathParts = url.split('/');
    const fileName = opts.name || opts.fileName ? opts.name || opts.fileName : pathParts[pathParts.length - 1] || FSName;

    const {
      extension,
      extensionWithDot
    } = this._getExt(fileName);

    opts.path = `${this.storagePath(opts)}${nodePath.sep}${FSName}${extensionWithDot}`;

    const storeResult = (result, cb) => {
      result._id = fileId;
      this.collection.insert(result, (error, _id) => {
        if (error) {
          cb && cb(error);

          this._debug(`[FilesCollection] [load] [insert] Error: ${fileName} -> ${this.collectionName}`, error);
        } else {
          const fileRef = this.collection.findOne(_id);
          cb && cb(null, fileRef);

          if (proceedAfterUpload === true) {
            this.onAfterUpload && this.onAfterUpload.call(this, fileRef);
            this.emit('afterUpload', fileRef);
          }

          this._debug(`[FilesCollection] [load] [insert] ${fileName} -> ${this.collectionName}`);
        }
      });
    };

    request.get({
      url,
      headers: opts.headers || {}
    }).on('error', error => bound(() => {
      callback && callback(error);

      this._debug(`[FilesCollection] [load] [request.get(${url})] Error:`, error);
    })).on('response', response => bound(() => {
      response.on('end', () => bound(() => {
        this._debug(`[FilesCollection] [load] Received: ${url}`);

        const result = this._dataToSchema({
          name: fileName,
          path: opts.path,
          meta: opts.meta,
          type: opts.type || response.headers['content-type'] || this._getMimeType({
            path: opts.path
          }),
          size: opts.size || parseInt(response.headers['content-length'] || 0),
          userId: opts.userId,
          extension
        });

        if (!result.size) {
          fs.stat(opts.path, (error, stats) => bound(() => {
            if (error) {
              callback && callback(error);
            } else {
              result.versions.original.size = result.size = stats.size;
              storeResult(result, callback);
            }
          }));
        } else {
          storeResult(result, callback);
        }
      }));
    })).pipe(fs.createWriteStream(opts.path, {
      flags: 'w',
      mode: this.permissions
    }));
    return this;
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name addFile
   * @param {String} path          - Path to file
   * @param {String} opts          - [Optional] Object with file-data
   * @param {String} opts.type     - [Optional] File mime-type
   * @param {Object} opts.meta     - [Optional] File additional meta-data
   * @param {String} opts.fileId   - _id, default *null*
   * @param {Object} opts.fileName - [Optional] File name, if not specified file name and extension will be taken from path
   * @param {String} opts.userId   - [Optional] UserId, default *null*
   * @param {Function} callback    - [Optional] function(error, fileObj){...}
   * @param {Boolean} proceedAfterUpload - Proceed onAfterUpload hook
   * @summary Add file from FS to FilesCollection
   * @returns {FilesCollection} Instance
   */


  addFile(path, _opts = {}, _callback, _proceedAfterUpload) {
    this._debug(`[FilesCollection] [addFile(${path})]`);

    let opts = _opts;
    let callback = _callback;
    let proceedAfterUpload = _proceedAfterUpload;

    if (helpers.isFunction(opts)) {
      proceedAfterUpload = callback;
      callback = opts;
      opts = {};
    } else if (helpers.isBoolean(callback)) {
      proceedAfterUpload = callback;
    } else if (helpers.isBoolean(opts)) {
      proceedAfterUpload = opts;
    }

    if (this.public) {
      throw new Meteor.Error(403, 'Can not run [addFile] on public collection! Just Move file to root of your server, then add record to Collection');
    }

    check(path, String);
    check(opts, Match.Optional(Object));
    check(callback, Match.Optional(Function));
    check(proceedAfterUpload, Match.Optional(Boolean));
    fs.stat(path, (statErr, stats) => bound(() => {
      if (statErr) {
        callback && callback(statErr);
      } else if (stats.isFile()) {
        if (!helpers.isObject(opts)) {
          opts = {};
        }

        opts.path = path;

        if (!opts.fileName) {
          const pathParts = path.split(nodePath.sep);
          opts.fileName = path.split(nodePath.sep)[pathParts.length - 1];
        }

        const {
          extension
        } = this._getExt(opts.fileName);

        if (!helpers.isString(opts.type)) {
          opts.type = this._getMimeType(opts);
        }

        if (!helpers.isObject(opts.meta)) {
          opts.meta = {};
        }

        if (!helpers.isNumber(opts.size)) {
          opts.size = stats.size;
        }

        const result = this._dataToSchema({
          name: opts.fileName,
          path,
          meta: opts.meta,
          type: opts.type,
          size: opts.size,
          userId: opts.userId,
          extension,
          _storagePath: path.replace(`${nodePath.sep}${opts.fileName}`, ''),
          fileId: opts.fileId || null
        });

        this.collection.insert(result, (insertErr, _id) => {
          if (insertErr) {
            callback && callback(insertErr);

            this._debug(`[FilesCollection] [addFile] [insert] Error: ${result.name} -> ${this.collectionName}`, insertErr);
          } else {
            const fileRef = this.collection.findOne(_id);
            callback && callback(null, fileRef);

            if (proceedAfterUpload === true) {
              this.onAfterUpload && this.onAfterUpload.call(this, fileRef);
              this.emit('afterUpload', fileRef);
            }

            this._debug(`[FilesCollection] [addFile]: ${result.name} -> ${this.collectionName}`);
          }
        });
      } else {
        callback && callback(new Meteor.Error(400, `[FilesCollection] [addFile(${path})]: File does not exist`));
      }
    }));
    return this;
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCollection
   * @name remove
   * @param {String|Object} selector - Mongo-Style selector (http://docs.meteor.com/api/collections.html#selectors)
   * @param {Function} callback - Callback with one `error` argument
   * @summary Remove documents from the collection
   * @returns {FilesCollection} Instance
   */


  remove(selector, callback) {
    this._debug(`[FilesCollection] [remove(${JSON.stringify(selector)})]`);

    if (selector === void 0) {
      return 0;
    }

    check(callback, Match.Optional(Function));
    const files = this.collection.find(selector);

    if (files.count() > 0) {
      files.forEach(file => {
        this.unlink(file);
      });
    } else {
      callback && callback(new Meteor.Error(404, 'Cursor is empty, no files is removed'));
      return this;
    }

    if (this.onAfterRemove) {
      const docs = files.fetch();
      const self = this;
      this.collection.remove(selector, function () {
        callback && callback.apply(this, arguments);
        self.onAfterRemove(docs);
      });
    } else {
      this.collection.remove(selector, callback || NOOP);
    }

    return this;
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name deny
   * @param {Object} rules
   * @see  https://docs.meteor.com/api/collections.html#Mongo-Collection-deny
   * @summary link Mongo.Collection deny methods
   * @returns {Mongo.Collection} Instance
   */


  deny(rules) {
    this.collection.deny(rules);
    return this.collection;
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name allow
   * @param {Object} rules
   * @see https://docs.meteor.com/api/collections.html#Mongo-Collection-allow
   * @summary link Mongo.Collection allow methods
   * @returns {Mongo.Collection} Instance
   */


  allow(rules) {
    this.collection.allow(rules);
    return this.collection;
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name denyClient
   * @see https://docs.meteor.com/api/collections.html#Mongo-Collection-deny
   * @summary Shorthands for Mongo.Collection deny method
   * @returns {Mongo.Collection} Instance
   */


  denyClient() {
    this.collection.deny({
      insert() {
        return true;
      },

      update() {
        return true;
      },

      remove() {
        return true;
      }

    });
    return this.collection;
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name allowClient
   * @see https://docs.meteor.com/api/collections.html#Mongo-Collection-allow
   * @summary Shorthands for Mongo.Collection allow method
   * @returns {Mongo.Collection} Instance
   */


  allowClient() {
    this.collection.allow({
      insert() {
        return true;
      },

      update() {
        return true;
      },

      remove() {
        return true;
      }

    });
    return this.collection;
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name unlink
   * @param {Object} fileRef - fileObj
   * @param {String} version - [Optional] file's version
   * @param {Function} callback - [Optional] callback function
   * @summary Unlink files and it's versions from FS
   * @returns {FilesCollection} Instance
   */


  unlink(fileRef, version, callback) {
    this._debug(`[FilesCollection] [unlink(${fileRef._id}, ${version})]`);

    if (version) {
      if (helpers.isObject(fileRef.versions) && helpers.isObject(fileRef.versions[version]) && fileRef.versions[version].path) {
        fs.unlink(fileRef.versions[version].path, callback || NOOP);
      }
    } else {
      if (helpers.isObject(fileRef.versions)) {
        for (let vKey in fileRef.versions) {
          if (fileRef.versions[vKey] && fileRef.versions[vKey].path) {
            fs.unlink(fileRef.versions[vKey].path, callback || NOOP);
          }
        }
      } else {
        fs.unlink(fileRef.path, callback || NOOP);
      }
    }

    return this;
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name _404
   * @summary Internal method, used to return 404 error
   * @returns {undefined}
   */


  _404(http) {
    this._debug(`[FilesCollection] [download(${http.request.originalUrl})] [_404] File not found`);

    const text = 'File Not Found :(';

    if (!http.response.headersSent) {
      http.response.writeHead(404, {
        'Content-Type': 'text/plain',
        'Content-Length': text.length
      });
    }

    if (!http.response.finished) {
      http.response.end(text);
    }
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name download
   * @param {Object} http    - Server HTTP object
   * @param {String} version - Requested file version
   * @param {Object} fileRef - Requested file Object
   * @summary Initiates the HTTP response
   * @returns {undefined}
   */


  download(http, version = 'original', fileRef) {
    let vRef;

    this._debug(`[FilesCollection] [download(${http.request.originalUrl}, ${version})]`);

    if (fileRef) {
      if (helpers.has(fileRef, 'versions') && helpers.has(fileRef.versions, version)) {
        vRef = fileRef.versions[version];
        vRef._id = fileRef._id;
      } else {
        vRef = fileRef;
      }
    } else {
      vRef = false;
    }

    if (!vRef || !helpers.isObject(vRef)) {
      return this._404(http);
    } else if (fileRef) {
      if (this.downloadCallback) {
        if (!this.downloadCallback.call(Object.assign(http, this._getUser(http)), fileRef)) {
          return this._404(http);
        }
      }

      if (this.interceptDownload && helpers.isFunction(this.interceptDownload)) {
        if (this.interceptDownload(http, fileRef, version) === true) {
          return void 0;
        }
      }

      fs.stat(vRef.path, (statErr, stats) => bound(() => {
        let responseType;

        if (statErr || !stats.isFile()) {
          return this._404(http);
        }

        if (stats.size !== vRef.size && !this.integrityCheck) {
          vRef.size = stats.size;
        }

        if (stats.size !== vRef.size && this.integrityCheck) {
          responseType = '400';
        }

        return this.serve(http, fileRef, vRef, version, null, responseType || '200');
      }));
      return void 0;
    }

    return this._404(http);
  }
  /*
   * @locus Server
   * @memberOf FilesCollection
   * @name serve
   * @param {Object} http    - Server HTTP object
   * @param {Object} fileRef - Requested file Object
   * @param {Object} vRef    - Requested file version Object
   * @param {String} version - Requested file version
   * @param {stream.Readable|null} readableStream - Readable stream, which serves binary file data
   * @param {String} responseType - Response code
   * @param {Boolean} force200 - Force 200 response code over 206
   * @summary Handle and reply to incoming request
   * @returns {undefined}
   */


  serve(http, fileRef, vRef, version = 'original', readableStream = null, _responseType = '200', force200 = false) {
    let partiral = false;
    let reqRange = false;
    let dispositionType = '';
    let start;
    let end;
    let take;
    let responseType = _responseType;

    if (http.params.query.download && http.params.query.download === 'true') {
      dispositionType = 'attachment; ';
    } else {
      dispositionType = 'inline; ';
    }

    const dispositionName = `filename=\"${encodeURI(vRef.name || fileRef.name).replace(/\,/g, '%2C')}\"; filename*=UTF-8''${encodeURIComponent(vRef.name || fileRef.name)}; `;
    const dispositionEncoding = 'charset=UTF-8';

    if (!http.response.headersSent) {
      http.response.setHeader('Content-Disposition', dispositionType + dispositionName + dispositionEncoding);
    }

    if (http.request.headers.range && !force200) {
      partiral = true;
      const array = http.request.headers.range.split(/bytes=([0-9]*)-([0-9]*)/);
      start = parseInt(array[1]);
      end = parseInt(array[2]);

      if (isNaN(end)) {
        end = vRef.size - 1;
      }

      take = end - start;
    } else {
      start = 0;
      end = vRef.size - 1;
      take = vRef.size;
    }

    if (partiral || http.params.query.play && http.params.query.play === 'true') {
      reqRange = {
        start,
        end
      };

      if (isNaN(start) && !isNaN(end)) {
        reqRange.start = end - take;
        reqRange.end = end;
      }

      if (!isNaN(start) && isNaN(end)) {
        reqRange.start = start;
        reqRange.end = start + take;
      }

      if (start + take >= vRef.size) {
        reqRange.end = vRef.size - 1;
      }

      if (this.strict && (reqRange.start >= vRef.size - 1 || reqRange.end > vRef.size - 1)) {
        responseType = '416';
      } else {
        responseType = '206';
      }
    } else {
      responseType = '200';
    }

    const streamErrorHandler = error => {
      this._debug(`[FilesCollection] [serve(${vRef.path}, ${version})] [500]`, error);

      if (!http.response.finished) {
        http.response.end(error.toString());
      }
    };

    const headers = helpers.isFunction(this.responseHeaders) ? this.responseHeaders(responseType, fileRef, vRef, version) : this.responseHeaders;

    if (!headers['Cache-Control']) {
      if (!http.response.headersSent) {
        http.response.setHeader('Cache-Control', this.cacheControl);
      }
    }

    for (let key in headers) {
      if (!http.response.headersSent) {
        http.response.setHeader(key, headers[key]);
      }
    }

    const respond = (stream, code) => {
      if (!http.response.headersSent && readableStream) {
        http.response.writeHead(code);
      }

      http.response.on('close', () => {
        if (typeof stream.abort === 'function') {
          stream.abort();
        }

        if (typeof stream.end === 'function') {
          stream.end();
        }
      });
      http.request.on('aborted', () => {
        http.request.aborted = true;

        if (typeof stream.abort === 'function') {
          stream.abort();
        }

        if (typeof stream.end === 'function') {
          stream.end();
        }
      });
      stream.on('open', () => {
        if (!http.response.headersSent) {
          http.response.writeHead(code);
        }
      }).on('abort', () => {
        if (!http.response.finished) {
          http.response.end();
        }

        if (!http.request.aborted) {
          http.request.destroy();
        }
      }).on('error', streamErrorHandler).on('end', () => {
        if (!http.response.finished) {
          http.response.end();
        }
      }).pipe(http.response);
    };

    switch (responseType) {
      case '400':
        this._debug(`[FilesCollection] [serve(${vRef.path}, ${version})] [400] Content-Length mismatch!`);

        var text = 'Content-Length mismatch!';

        if (!http.response.headersSent) {
          http.response.writeHead(400, {
            'Content-Type': 'text/plain',
            'Content-Length': text.length
          });
        }

        if (!http.response.finished) {
          http.response.end(text);
        }

        break;

      case '404':
        this._404(http);

        break;

      case '416':
        this._debug(`[FilesCollection] [serve(${vRef.path}, ${version})] [416] Content-Range is not specified!`);

        if (!http.response.headersSent) {
          http.response.writeHead(416);
        }

        if (!http.response.finished) {
          http.response.end();
        }

        break;

      case '206':
        this._debug(`[FilesCollection] [serve(${vRef.path}, ${version})] [206]`);

        if (!http.response.headersSent) {
          http.response.setHeader('Content-Range', `bytes ${reqRange.start}-${reqRange.end}/${vRef.size}`);
        }

        respond(readableStream || fs.createReadStream(vRef.path, {
          start: reqRange.start,
          end: reqRange.end
        }), 206);
        break;

      default:
        this._debug(`[FilesCollection] [serve(${vRef.path}, ${version})] [200]`);

        respond(readableStream || fs.createReadStream(vRef.path), 200);
        break;
    }
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"core.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_files/core.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => FilesCollectionCore
});
let EventEmitter;
module.watch(require("eventemitter3"), {
  EventEmitter(v) {
    EventEmitter = v;
  }

}, 0);
let check, Match;
module.watch(require("meteor/check"), {
  check(v) {
    check = v;
  },

  Match(v) {
    Match = v;
  }

}, 1);
let formatFleURL, helpers;
module.watch(require("./lib.js"), {
  formatFleURL(v) {
    formatFleURL = v;
  },

  helpers(v) {
    helpers = v;
  }

}, 2);
let FilesCursor, FileCursor;
module.watch(require("./cursor.js"), {
  FilesCursor(v) {
    FilesCursor = v;
  },

  FileCursor(v) {
    FileCursor = v;
  }

}, 3);

class FilesCollectionCore extends EventEmitter {
  constructor() {
    super();
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name _debug
   * @summary Print logs in debug mode
   * @returns {void}
   */
  _debug() {
    if (this.debug) {
      (console.info || console.log || function () {}).apply(void 0, arguments);
    }
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name _getFileName
   * @param {Object} fileData - File Object
   * @summary Returns file's name
   * @returns {String}
   */


  _getFileName(fileData) {
    const fileName = fileData.name || fileData.fileName;

    if (helpers.isString(fileName) && fileName.length > 0) {
      return (fileData.name || fileData.fileName).replace(/^\.\.+/, '').replace(/\.{2,}/g, '.').replace(/\//g, '');
    }

    return '';
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name _getExt
   * @param {String} FileName - File name
   * @summary Get extension from FileName
   * @returns {Object}
   */


  _getExt(fileName) {
    if (!!~fileName.indexOf('.')) {
      const extension = (fileName.split('.').pop().split('?')[0] || '').toLowerCase();
      return {
        ext: extension,
        extension,
        extensionWithDot: `.${extension}`
      };
    }

    return {
      ext: '',
      extension: '',
      extensionWithDot: ''
    };
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name _updateFileTypes
   * @param {Object} data - File data
   * @summary Internal method. Classify file based on 'type' field
   */


  _updateFileTypes(data) {
    data.isVideo = /^video\//i.test(data.type);
    data.isAudio = /^audio\//i.test(data.type);
    data.isImage = /^image\//i.test(data.type);
    data.isText = /^text\//i.test(data.type);
    data.isJSON = /^application\/json$/i.test(data.type);
    data.isPDF = /^application\/(x-)?pdf$/i.test(data.type);
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name _dataToSchema
   * @param {Object} data - File data
   * @summary Internal method. Build object in accordance with default schema from File data
   * @returns {Object}
   */


  _dataToSchema(data) {
    const ds = {
      name: data.name,
      extension: data.extension,
      ext: data.extension,
      extensionWithDot: '.' + data.extension,
      path: data.path,
      meta: data.meta,
      type: data.type,
      mime: data.type,
      'mime-type': data.type,
      size: data.size,
      userId: data.userId || null,
      versions: {
        original: {
          path: data.path,
          size: data.size,
          type: data.type,
          extension: data.extension
        }
      },
      _downloadRoute: data._downloadRoute || this.downloadRoute,
      _collectionName: data._collectionName || this.collectionName
    }; //Optional fileId

    if (data.fileId) {
      ds._id = data.fileId;
    }

    this._updateFileTypes(ds);

    ds._storagePath = data._storagePath || this.storagePath(Object.assign({}, data, ds));
    return ds;
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name findOne
   * @param {String|Object} selector - Mongo-Style selector (http://docs.meteor.com/api/collections.html#selectors)
   * @param {Object} options - Mongo-Style selector Options (http://docs.meteor.com/api/collections.html#sortspecifiers)
   * @summary Find and return Cursor for matching document Object
   * @returns {FileCursor} Instance
   */


  findOne(selector = {}, options) {
    this._debug(`[FilesCollection] [findOne(${JSON.stringify(selector)}, ${JSON.stringify(options)})]`);

    check(selector, Match.Optional(Match.OneOf(Object, String, Boolean, Number, null)));
    check(options, Match.Optional(Object));
    const doc = this.collection.findOne(selector, options);

    if (doc) {
      return new FileCursor(doc, this);
    }

    return doc;
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name find
   * @param {String|Object} selector - Mongo-Style selector (http://docs.meteor.com/api/collections.html#selectors)
   * @param {Object}        options  - Mongo-Style selector Options (http://docs.meteor.com/api/collections.html#sortspecifiers)
   * @summary Find and return Cursor for matching documents
   * @returns {FilesCursor} Instance
   */


  find(selector = {}, options) {
    this._debug(`[FilesCollection] [find(${JSON.stringify(selector)}, ${JSON.stringify(options)})]`);

    check(selector, Match.Optional(Match.OneOf(Object, String, Boolean, Number, null)));
    check(options, Match.Optional(Object));
    return new FilesCursor(selector, options, this);
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name update
   * @see http://docs.meteor.com/#/full/update
   * @summary link Mongo.Collection update method
   * @returns {Mongo.Collection} Instance
   */


  update() {
    this.collection.update.apply(this.collection, arguments);
    return this.collection;
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name link
   * @param {Object} fileRef - File reference object
   * @param {String} version - Version of file you would like to request
   * @param {String} URIBase - [Optional] URI base, see - https://github.com/VeliovGroup/Meteor-Files/issues/626
   * @summary Returns downloadable URL
   * @returns {String} Empty string returned in case if file not found in DB
   */


  link(fileRef, version = 'original', URIBase) {
    this._debug(`[FilesCollection] [link(${helpers.isObject(fileRef) ? fileRef._id : void 0}, ${version})]`);

    check(fileRef, Object);

    if (!fileRef) {
      return '';
    }

    return formatFleURL(fileRef, version, URIBase);
  }

}

FilesCollectionCore.__helpers = helpers;
FilesCollectionCore.schema = {
  _id: {
    type: String
  },
  size: {
    type: Number
  },
  name: {
    type: String
  },
  type: {
    type: String
  },
  path: {
    type: String
  },
  isVideo: {
    type: Boolean
  },
  isAudio: {
    type: Boolean
  },
  isImage: {
    type: Boolean
  },
  isText: {
    type: Boolean
  },
  isJSON: {
    type: Boolean
  },
  isPDF: {
    type: Boolean
  },
  extension: {
    type: String,
    optional: true
  },
  ext: {
    type: String,
    optional: true
  },
  extensionWithDot: {
    type: String,
    optional: true
  },
  mime: {
    type: String,
    optional: true
  },
  'mime-type': {
    type: String,
    optional: true
  },
  _storagePath: {
    type: String
  },
  _downloadRoute: {
    type: String
  },
  _collectionName: {
    type: String
  },
  public: {
    type: Boolean,
    optional: true
  },
  meta: {
    type: Object,
    blackbox: true,
    optional: true
  },
  userId: {
    type: String,
    optional: true
  },
  updatedAt: {
    type: Date,
    optional: true
  },
  versions: {
    type: Object,
    blackbox: true
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cursor.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_files/cursor.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  FileCursor: () => FileCursor,
  FilesCursor: () => FilesCursor
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);

class FileCursor {
  constructor(_fileRef, _collection) {
    this._fileRef = _fileRef;
    this._collection = _collection;
    Object.assign(this, _fileRef);
  }
  /*
   * @locus Anywhere
   * @memberOf FileCursor
   * @name remove
   * @param callback {Function} - Triggered asynchronously after item is removed or failed to be removed
   * @summary Remove document
   * @returns {FileCursor}
   */


  remove(callback) {
    this._collection._debug('[FilesCollection] [FileCursor] [remove()]');

    if (this._fileRef) {
      this._collection.remove(this._fileRef._id, callback);
    } else {
      callback && callback(new Meteor.Error(404, 'No such file'));
    }

    return this;
  }
  /*
   * @locus Anywhere
   * @memberOf FileCursor
   * @name link
   * @param version {String} - Name of file's subversion
   * @param URIBase {String} - [Optional] URI base, see - https://github.com/VeliovGroup/Meteor-Files/issues/626
   * @summary Returns downloadable URL to File
   * @returns {String}
   */


  link(version = 'original', URIBase) {
    this._collection._debug(`[FilesCollection] [FileCursor] [link(${version})]`);

    if (this._fileRef) {
      return this._collection.link(this._fileRef, version, URIBase);
    }

    return '';
  }
  /*
   * @locus Anywhere
   * @memberOf FileCursor
   * @name get
   * @param property {String} - Name of sub-object property
   * @summary Returns current document as a plain Object, if `property` is specified - returns value of sub-object property
   * @returns {Object|mix}
   */


  get(property) {
    this._collection._debug(`[FilesCollection] [FileCursor] [get(${property})]`);

    if (property) {
      return this._fileRef[property];
    }

    return this._fileRef;
  }
  /*
   * @locus Anywhere
   * @memberOf FileCursor
   * @name fetch
   * @summary Returns document as plain Object in Array
   * @returns {[Object]}
   */


  fetch() {
    this._collection._debug('[FilesCollection] [FileCursor] [fetch()]');

    return [this._fileRef];
  }
  /*
   * @locus Anywhere
   * @memberOf FileCursor
   * @name with
   * @summary Returns reactive version of current FileCursor, useful to use with `{{#with}}...{{/with}}` block template helper
   * @returns {[Object]}
   */


  with() {
    this._collection._debug('[FilesCollection] [FileCursor] [with()]');

    return Object.assign(this, this._collection.collection.findOne(this._fileRef._id));
  }

}

class FilesCursor {
  constructor(_selector = {}, options, _collection) {
    this._collection = _collection;
    this._selector = _selector;
    this._current = -1;
    this.cursor = this._collection.collection.find(this._selector, options);
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name get
   * @summary Returns all matching document(s) as an Array. Alias of `.fetch()`
   * @returns {[Object]}
   */


  get() {
    this._collection._debug('[FilesCollection] [FilesCursor] [get()]');

    return this.cursor.fetch();
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name hasNext
   * @summary Returns `true` if there is next item available on Cursor
   * @returns {Boolean}
   */


  hasNext() {
    this._collection._debug('[FilesCollection] [FilesCursor] [hasNext()]');

    return this._current < this.cursor.count() - 1;
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name next
   * @summary Returns next item on Cursor, if available
   * @returns {Object|undefined}
   */


  next() {
    this._collection._debug('[FilesCollection] [FilesCursor] [next()]');

    this.cursor.fetch()[++this._current];
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name hasPrevious
   * @summary Returns `true` if there is previous item available on Cursor
   * @returns {Boolean}
   */


  hasPrevious() {
    this._collection._debug('[FilesCollection] [FilesCursor] [hasPrevious()]');

    return this._current !== -1;
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name previous
   * @summary Returns previous item on Cursor, if available
   * @returns {Object|undefined}
   */


  previous() {
    this._collection._debug('[FilesCollection] [FilesCursor] [previous()]');

    this.cursor.fetch()[--this._current];
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name fetch
   * @summary Returns all matching document(s) as an Array.
   * @returns {[Object]}
   */


  fetch() {
    this._collection._debug('[FilesCollection] [FilesCursor] [fetch()]');

    return this.cursor.fetch() || [];
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name first
   * @summary Returns first item on Cursor, if available
   * @returns {Object|undefined}
   */


  first() {
    this._collection._debug('[FilesCollection] [FilesCursor] [first()]');

    this._current = 0;
    return this.fetch()[this._current];
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name last
   * @summary Returns last item on Cursor, if available
   * @returns {Object|undefined}
   */


  last() {
    this._collection._debug('[FilesCollection] [FilesCursor] [last()]');

    this._current = this.count() - 1;
    return this.fetch()[this._current];
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name count
   * @summary Returns the number of documents that match a query
   * @returns {Number}
   */


  count() {
    this._collection._debug('[FilesCollection] [FilesCursor] [count()]');

    return this.cursor.count();
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name remove
   * @param callback {Function} - Triggered asynchronously after item is removed or failed to be removed
   * @summary Removes all documents that match a query
   * @returns {FilesCursor}
   */


  remove(callback) {
    this._collection._debug('[FilesCollection] [FilesCursor] [remove()]');

    this._collection.remove(this._selector, callback);

    return this;
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name forEach
   * @param callback {Function} - Function to call. It will be called with three arguments: the `file`, a 0-based index, and cursor itself
   * @param context {Object} - An object which will be the value of `this` inside `callback`
   * @summary Call `callback` once for each matching document, sequentially and synchronously.
   * @returns {undefined}
   */


  forEach(callback, context = {}) {
    this._collection._debug('[FilesCollection] [FilesCursor] [forEach()]');

    this.cursor.forEach(callback, context);
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name each
   * @summary Returns an Array of FileCursor made for each document on current cursor
   *          Useful when using in {{#each FilesCursor#each}}...{{/each}} block template helper
   * @returns {[FileCursor]}
   */


  each() {
    return this.map(file => {
      return new FileCursor(file, this._collection);
    });
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name map
   * @param callback {Function} - Function to call. It will be called with three arguments: the `file`, a 0-based index, and cursor itself
   * @param context {Object} - An object which will be the value of `this` inside `callback`
   * @summary Map `callback` over all matching documents. Returns an Array.
   * @returns {Array}
   */


  map(callback, context = {}) {
    this._collection._debug('[FilesCollection] [FilesCursor] [map()]');

    return this.cursor.map(callback, context);
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name current
   * @summary Returns current item on Cursor, if available
   * @returns {Object|undefined}
   */


  current() {
    this._collection._debug('[FilesCollection] [FilesCursor] [current()]');

    if (this._current < 0) {
      this._current = 0;
    }

    return this.fetch()[this._current];
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name observe
   * @param callbacks {Object} - Functions to call to deliver the result set as it changes
   * @summary Watch a query. Receive callbacks as the result set changes.
   * @url http://docs.meteor.com/api/collections.html#Mongo-Cursor-observe
   * @returns {Object} - live query handle
   */


  observe(callbacks) {
    this._collection._debug('[FilesCollection] [FilesCursor] [observe()]');

    return this.cursor.observe(callbacks);
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name observeChanges
   * @param callbacks {Object} - Functions to call to deliver the result set as it changes
   * @summary Watch a query. Receive callbacks as the result set changes. Only the differences between the old and new documents are passed to the callbacks.
   * @url http://docs.meteor.com/api/collections.html#Mongo-Cursor-observeChanges
   * @returns {Object} - live query handle
   */


  observeChanges(callbacks) {
    this._collection._debug('[FilesCollection] [FilesCursor] [observeChanges()]');

    return this.cursor.observeChanges(callbacks);
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_files/lib.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  fixJSONParse: () => fixJSONParse,
  fixJSONStringify: () => fixJSONStringify,
  formatFleURL: () => formatFleURL,
  helpers: () => helpers
});
let check;
module.watch(require("meteor/check"), {
  check(v) {
    check = v;
  }

}, 0);
const helpers = {
  isUndefined(obj) {
    return obj === void 0;
  },

  isObject(obj) {
    if (this.isArray(obj) || this.isFunction(obj)) {
      return false;
    }

    return obj === Object(obj);
  },

  isArray(obj) {
    return Array.isArray(obj);
  },

  isBoolean(obj) {
    return obj === true || obj === false || Object.prototype.toString.call(obj) === '[object Boolean]';
  },

  isFunction(obj) {
    return typeof obj === 'function' || false;
  },

  isEmpty(obj) {
    if (this.isDate(obj)) {
      return false;
    }

    if (this.isObject(obj)) {
      return !Object.keys(obj).length;
    }

    if (this.isArray(obj) || this.isString(obj)) {
      return !obj.length;
    }

    return false;
  },

  clone(obj) {
    if (!this.isObject(obj)) return obj;
    return this.isArray(obj) ? obj.slice() : Object.assign({}, obj);
  },

  has(_obj, path) {
    let obj = _obj;

    if (!this.isObject(obj)) {
      return false;
    }

    if (!this.isArray(path)) {
      return this.isObject(obj) && Object.prototype.hasOwnProperty.call(obj, path);
    }

    const length = path.length;

    for (let i = 0; i < length; i++) {
      if (!Object.prototype.hasOwnProperty.call(obj, path[i])) {
        return false;
      }

      obj = obj[path[i]];
    }

    return !!length;
  },

  omit(obj, ...keys) {
    const clear = Object.assign({}, obj);

    for (let i = keys.length - 1; i >= 0; i--) {
      delete clear[keys[i]];
    }

    return clear;
  },

  now: Date.now,

  throttle(func, wait, options = {}) {
    let previous = 0;
    let timeout = null;
    let result;
    const that = this;
    let self;
    let args;

    const later = () => {
      previous = options.leading === false ? 0 : that.now();
      timeout = null;
      result = func.apply(self, args);

      if (!timeout) {
        self = args = null;
      }
    };

    const throttled = function () {
      const now = that.now();
      if (!previous && options.leading === false) previous = now;
      const remaining = wait - (now - previous);
      self = this;
      args = arguments;

      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }

        previous = now;
        result = func.apply(self, args);

        if (!timeout) {
          self = args = null;
        }
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }

      return result;
    };

    throttled.cancel = () => {
      clearTimeout(timeout);
      previous = 0;
      timeout = self = args = null;
    };

    return throttled;
  }

};
const _helpers = ['String', 'Number', 'Date'];

for (let i = 0; i < _helpers.length; i++) {
  helpers['is' + _helpers[i]] = function (obj) {
    return Object.prototype.toString.call(obj) === '[object ' + _helpers[i] + ']';
  };
}
/*
 * @const {Function} fixJSONParse - Fix issue with Date parse
 */


const fixJSONParse = function (obj) {
  for (let key in obj) {
    if (helpers.isString(obj[key]) && !!~obj[key].indexOf('=--JSON-DATE--=')) {
      obj[key] = obj[key].replace('=--JSON-DATE--=', '');
      obj[key] = new Date(parseInt(obj[key]));
    } else if (helpers.isObject(obj[key])) {
      obj[key] = fixJSONParse(obj[key]);
    } else if (helpers.isArray(obj[key])) {
      let v;

      for (let i = 0; i < obj[key].length; i++) {
        v = obj[key][i];

        if (helpers.isObject(v)) {
          obj[key][i] = fixJSONParse(v);
        } else if (helpers.isString(v) && !!~v.indexOf('=--JSON-DATE--=')) {
          v = v.replace('=--JSON-DATE--=', '');
          obj[key][i] = new Date(parseInt(v));
        }
      }
    }
  }

  return obj;
};
/*
 * @const {Function} fixJSONStringify - Fix issue with Date stringify
 */


const fixJSONStringify = function (obj) {
  for (let key in obj) {
    if (helpers.isDate(obj[key])) {
      obj[key] = `=--JSON-DATE--=${+obj[key]}`;
    } else if (helpers.isObject(obj[key])) {
      obj[key] = fixJSONStringify(obj[key]);
    } else if (helpers.isArray(obj[key])) {
      let v;

      for (let i = 0; i < obj[key].length; i++) {
        v = obj[key][i];

        if (helpers.isObject(v)) {
          obj[key][i] = fixJSONStringify(v);
        } else if (helpers.isDate(v)) {
          obj[key][i] = `=--JSON-DATE--=${+v}`;
        }
      }
    }
  }

  return obj;
};
/*
 * @locus Anywhere
 * @private
 * @name formatFleURL
 * @param {Object} fileRef - File reference object
 * @param {String} version - [Optional] Version of file you would like build URL for
 * @param {String} URIBase - [Optional] URI base, see - https://github.com/VeliovGroup/Meteor-Files/issues/626
 * @summary Returns formatted URL for file
 * @returns {String} Downloadable link
 */


const formatFleURL = (fileRef, version = 'original', _URIBase = (__meteor_runtime_config__ || {}).ROOT_URL) => {
  check(fileRef, Object);
  check(version, String);
  let URIBase = _URIBase;

  if (!helpers.isString(URIBase)) {
    URIBase = (__meteor_runtime_config__ || {}).ROOT_URL || '/';
  }

  const _root = URIBase.replace(/\/+$/, '');

  const vRef = fileRef.versions && fileRef.versions[version] || fileRef || {};
  let ext;

  if (helpers.isString(vRef.extension)) {
    ext = `.${vRef.extension.replace(/^\./, '')}`;
  } else {
    ext = '';
  }

  if (fileRef.public === true) {
    return _root + (version === 'original' ? `${fileRef._downloadRoute}/${fileRef._id}${ext}` : `${fileRef._downloadRoute}/${version}-${fileRef._id}${ext}`);
  }

  return _root + `${fileRef._downloadRoute}/${fileRef._collectionName}/${fileRef._id}/${version}/${fileRef._id}${ext}`;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"write-stream.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_files/write-stream.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => WriteStream
});
let fs;
module.watch(require("fs-extra"), {
  default(v) {
    fs = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let helpers;
module.watch(require("./lib.js"), {
  helpers(v) {
    helpers = v;
  }

}, 2);

const NOOP = () => {};
/*
 * @const {Object} bound   - Meteor.bindEnvironment (Fiber wrapper)
 * @const {Object} fdCache - File Descriptors Cache
 */


const bound = Meteor.bindEnvironment(callback => callback());
const fdCache = {};
/*
 * @private
 * @locus Server
 * @class WriteStream
 * @param path      {String} - Path to file on FS
 * @param maxLength {Number} - Max amount of chunks in stream
 * @param file      {Object} - fileRef Object
 * @summary writableStream wrapper class, makes sure chunks is written in given order. Implementation of queue stream.
 */

class WriteStream {
  constructor(path, maxLength, file, permissions) {
    this.path = path;
    this.maxLength = maxLength;
    this.file = file;
    this.permissions = permissions;

    if (!this.path || !helpers.isString(this.path)) {
      return;
    }

    this.fd = null;
    this.writtenChunks = 0;
    this.ended = false;
    this.aborted = false;

    if (fdCache[this.path] && !fdCache[this.path].ended && !fdCache[this.path].aborted) {
      this.fd = fdCache[this.path].fd;
      this.writtenChunks = fdCache[this.path].writtenChunks;
    } else {
      fs.ensureFile(this.path, efError => {
        bound(() => {
          if (efError) {
            this.abort();
            throw new Meteor.Error(500, '[FilesCollection] [writeStream] [ensureFile] [Error:] ' + efError);
          } else {
            fs.open(this.path, 'r+', this.permissions, (oError, fd) => {
              bound(() => {
                if (oError) {
                  this.abort();
                  throw new Meteor.Error(500, '[FilesCollection] [writeStream] [ensureFile] [open] [Error:] ' + oError);
                } else {
                  this.fd = fd;
                  fdCache[this.path] = this;
                }
              });
            });
          }
        });
      });
    }
  }
  /*
   * @memberOf writeStream
   * @name write
   * @param {Number} num - Chunk position in a stream
   * @param {Buffer} chunk - Buffer (chunk binary data)
   * @param {Function} callback - Callback
   * @summary Write chunk in given order
   * @returns {Boolean} - True if chunk is sent to stream, false if chunk is set into queue
   */


  write(num, chunk, callback) {
    if (!this.aborted && !this.ended) {
      if (this.fd) {
        fs.write(this.fd, chunk, 0, chunk.length, (num - 1) * this.file.chunkSize, (error, written, buffer) => {
          bound(() => {
            callback && callback(error, written, buffer);

            if (error) {
              console.warn('[FilesCollection] [writeStream] [write] [Error:]', error);
              this.abort();
            } else {
              ++this.writtenChunks;
            }
          });
        });
      } else {
        Meteor.setTimeout(() => {
          this.write(num, chunk, callback);
        }, 25);
      }
    }

    return false;
  }
  /*
   * @memberOf writeStream
   * @name end
   * @param {Function} callback - Callback
   * @summary Finishes writing to writableStream, only after all chunks in queue is written
   * @returns {Boolean} - True if stream is fulfilled, false if queue is in progress
   */


  end(callback) {
    if (!this.aborted && !this.ended) {
      if (this.writtenChunks === this.maxLength) {
        fs.close(this.fd, () => {
          bound(() => {
            delete fdCache[this.path];
            this.ended = true;
            callback && callback(void 0, true);
          });
        });
        return true;
      }

      fs.stat(this.path, (error, stat) => {
        bound(() => {
          if (!error && stat) {
            this.writtenChunks = Math.ceil(stat.size / this.file.chunkSize);
          }

          return Meteor.setTimeout(() => {
            this.end(callback);
          }, 25);
        });
      });
    } else {
      callback && callback(void 0, this.ended);
    }

    return false;
  }
  /*
   * @memberOf writeStream
   * @name abort
   * @param {Function} callback - Callback
   * @summary Aborts writing to writableStream, removes created file
   * @returns {Boolean} - True
   */


  abort(callback) {
    this.aborted = true;
    delete fdCache[this.path];
    fs.unlink(this.path, callback || NOOP);
    return true;
  }
  /*
   * @memberOf writeStream
   * @name stop
   * @summary Stop writing to writableStream
   * @returns {Boolean} - True
   */


  stop() {
    this.aborted = true;
    delete fdCache[this.path];
    return true;
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"fs-extra":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/fs-extra/package.json                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "fs-extra";
exports.version = "7.0.0";
exports.main = "./lib/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/fs-extra/lib/index.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"eventemitter3":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/eventemitter3/package.json                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "eventemitter3";
exports.version = "3.1.0";
exports.main = "index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/eventemitter3/index.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"request":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/request/package.json                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "request";
exports.version = "2.88.0";
exports.main = "index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/request/index.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"file-type":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/file-type/package.json                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "file-type";
exports.version = "9.0.0";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/file-type/index.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/ostrio:files/server.js");

/* Exports */
Package._define("ostrio:files", exports, {
  FilesCollection: FilesCollection
});

})();

//# sourceURL=meteor://💻app/packages/ostrio_files.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmZpbGVzL3NlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmZpbGVzL2NvcmUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29zdHJpbzpmaWxlcy9jdXJzb3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29zdHJpbzpmaWxlcy9saWIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29zdHJpbzpmaWxlcy93cml0ZS1zdHJlYW0uanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiRmlsZXNDb2xsZWN0aW9uIiwiTW9uZ28iLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiV2ViQXBwIiwiTWV0ZW9yIiwiUmFuZG9tIiwiQ29va2llcyIsIldyaXRlU3RyZWFtIiwiZGVmYXVsdCIsImNoZWNrIiwiTWF0Y2giLCJGaWxlc0NvbGxlY3Rpb25Db3JlIiwiZml4SlNPTlBhcnNlIiwiZml4SlNPTlN0cmluZ2lmeSIsImhlbHBlcnMiLCJmcyIsIm5vZGVRcyIsInJlcXVlc3QiLCJmaWxlVHlwZSIsIm5vZGVQYXRoIiwiYm91bmQiLCJiaW5kRW52aXJvbm1lbnQiLCJjYWxsYmFjayIsIk5PT1AiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsInN0b3JhZ2VQYXRoIiwiZGVidWciLCJzY2hlbWEiLCJwdWJsaWMiLCJzdHJpY3QiLCJjaHVua1NpemUiLCJwcm90ZWN0ZWQiLCJjb2xsZWN0aW9uIiwicGVybWlzc2lvbnMiLCJjYWNoZUNvbnRyb2wiLCJkb3dubG9hZFJvdXRlIiwib25BZnRlclVwbG9hZCIsIm9uQWZ0ZXJSZW1vdmUiLCJkaXNhYmxlVXBsb2FkIiwib25CZWZvcmVSZW1vdmUiLCJpbnRlZ3JpdHlDaGVjayIsImNvbGxlY3Rpb25OYW1lIiwib25CZWZvcmVVcGxvYWQiLCJuYW1pbmdGdW5jdGlvbiIsInJlc3BvbnNlSGVhZGVycyIsImRpc2FibGVEb3dubG9hZCIsImFsbG93Q2xpZW50Q29kZSIsImRvd25sb2FkQ2FsbGJhY2siLCJvbkluaXRpYXRlVXBsb2FkIiwiaW50ZXJjZXB0RG93bmxvYWQiLCJjb250aW51ZVVwbG9hZFRUTCIsInBhcmVudERpclBlcm1pc3Npb25zIiwiX3ByZUNvbGxlY3Rpb24iLCJfcHJlQ29sbGVjdGlvbk5hbWUiLCJzZWxmIiwiaXNCb29sZWFuIiwiTWF0aCIsImZsb29yIiwiaXNTdHJpbmciLCJDb2xsZWN0aW9uIiwiX25hbWUiLCJmaWxlc0NvbGxlY3Rpb24iLCJTdHJpbmciLCJFcnJvciIsInJlcGxhY2UiLCJpc0Z1bmN0aW9uIiwiaXNOdW1iZXIiLCJwYXJzZUludCIsImlzT2JqZWN0IiwiX2N1cnJlbnRVcGxvYWRzIiwicmVzcG9uc2VDb2RlIiwiZmlsZVJlZiIsInZlcnNpb25SZWYiLCJoZWFkZXJzIiwiUHJhZ21hIiwiVHJhaWxlciIsInNpemUiLCJDb25uZWN0aW9uIiwidHlwZSIsInNlcCIsInNwIiwiYXBwbHkiLCJhcmd1bWVudHMiLCJub3JtYWxpemUiLCJfZGVidWciLCJta2RpcnMiLCJtb2RlIiwiZXJyb3IiLCJCb29sZWFuIiwiTnVtYmVyIiwiRnVuY3Rpb24iLCJPbmVPZiIsIk9iamVjdCIsIl9lbnN1cmVJbmRleCIsImNyZWF0ZWRBdCIsImV4cGlyZUFmdGVyU2Vjb25kcyIsImJhY2tncm91bmQiLCJfcHJlQ29sbGVjdGlvbkN1cnNvciIsImZpbmQiLCJmaWVsZHMiLCJfaWQiLCJpc0ZpbmlzaGVkIiwib2JzZXJ2ZSIsImNoYW5nZWQiLCJkb2MiLCJyZW1vdmUiLCJyZW1vdmVkIiwic3RvcCIsImVuZCIsImFib3J0IiwiX2NyZWF0ZVN0cmVhbSIsInBhdGgiLCJvcHRzIiwiZmlsZUxlbmd0aCIsIl9jb250aW51ZVVwbG9hZCIsImZpbGUiLCJhYm9ydGVkIiwiZW5kZWQiLCJjb250VXBsZCIsImZpbmRPbmUiLCJfY2hlY2tBY2Nlc3MiLCJodHRwIiwicmVzdWx0IiwidXNlciIsInVzZXJJZCIsIl9nZXRVc2VyIiwicGFyYW1zIiwiY2FsbCIsImFzc2lnbiIsInJjIiwidGV4dCIsInJlc3BvbnNlIiwiaGVhZGVyc1NlbnQiLCJ3cml0ZUhlYWQiLCJsZW5ndGgiLCJmaW5pc2hlZCIsIl9tZXRob2ROYW1lcyIsIl9BYm9ydCIsIl9Xcml0ZSIsIl9TdGFydCIsIl9SZW1vdmUiLCJvbiIsIl9oYW5kbGVVcGxvYWQiLCJfZmluaXNoVXBsb2FkIiwiX2hhbmRsZVVwbG9hZFN5bmMiLCJ3cmFwQXN5bmMiLCJiaW5kIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwiaHR0cFJlcSIsImh0dHBSZXNwIiwibmV4dCIsIl9wYXJzZWRVcmwiLCJpbmRleE9mIiwibWV0aG9kIiwiaGFuZGxlRXJyb3IiLCJfZXJyb3IiLCJjb25zb2xlIiwid2FybiIsInRyYWNlIiwidG9TdHJpbmciLCJKU09OIiwic3RyaW5naWZ5IiwiYm9keSIsImRhdGEiLCJzZXJ2ZXIiLCJzZXNzaW9ucyIsImhhcyIsImZpbGVJZCIsImVvZiIsIkJ1ZmZlciIsImZyb20iLCJiaW5EYXRhIiwiYnVmZkVyciIsImNodW5rSWQiLCJfcHJlcGFyZVVwbG9hZCIsIm1ldGEiLCJlbWl0IiwicGFyc2UiLCJqc29uRXJyIiwiX19fcyIsIm5hbWUiLCJjbG9uZSIsIkRhdGUiLCJtYXhMZW5ndGgiLCJpbnNlcnQiLCJvbWl0IiwicmV0dXJuTWV0YSIsInVwbG9hZFJvdXRlIiwiaHR0cFJlc3BFcnIiLCJ1cmkiLCJ1cmlzIiwic3Vic3RyaW5nIiwic3BsaXQiLCJxdWVyeSIsInZlcnNpb24iLCJkb3dubG9hZCIsIl9maWxlIiwiX21ldGhvZHMiLCJzZWxlY3RvciIsInVzZXJGdW5jcyIsInVzZXJzIiwiY3Vyc29yIiwiY291bnQiLCJGU05hbWUiLCJPcHRpb25hbCIsImUiLCJfb3B0cyIsInVuYmxvY2siLCJoYW5kbGVVcGxvYWRFcnIiLCJ1bmxpbmsiLCJtZXRob2RzIiwidHJhbnNwb3J0IiwiY3R4IiwiZmlsZU5hbWUiLCJfZ2V0RmlsZU5hbWUiLCJleHRlbnNpb24iLCJleHRlbnNpb25XaXRoRG90IiwiX2dldEV4dCIsImV4dCIsIl9kYXRhVG9TY2hlbWEiLCJpc1VwbG9hZEFsbG93ZWQiLCJjYiIsImNobW9kIiwiX2dldE1pbWVUeXBlIiwiX3VwZGF0ZUZpbGVUeXBlcyIsImNvbEluc2VydCIsInVwZGF0ZSIsIiRzZXQiLCJwcmVVcGRhdGVFcnJvciIsIndyaXRlIiwiZmlsZURhdGEiLCJtaW1lIiwiYnVmIiwiZmQiLCJvcGVuU3luYyIsImJyIiwicmVhZFN5bmMiLCJjbG9zZSIsInNsaWNlIiwibXRvayIsImNvb2tpZSIsImdldCIsImJ1ZmZlciIsIl9jYWxsYmFjayIsIl9wcm9jZWVkQWZ0ZXJVcGxvYWQiLCJwcm9jZWVkQWZ0ZXJVcGxvYWQiLCJpZCIsInN0cmVhbSIsImNyZWF0ZVdyaXRlU3RyZWFtIiwiZmxhZ3MiLCJzdHJlYW1FcnIiLCJpbnNlcnRFcnIiLCJsb2FkIiwidXJsIiwicGF0aFBhcnRzIiwic3RvcmVSZXN1bHQiLCJzdGF0Iiwic3RhdHMiLCJ2ZXJzaW9ucyIsIm9yaWdpbmFsIiwicGlwZSIsImFkZEZpbGUiLCJzdGF0RXJyIiwiaXNGaWxlIiwiX3N0b3JhZ2VQYXRoIiwiZmlsZXMiLCJmb3JFYWNoIiwiZG9jcyIsImZldGNoIiwiZGVueSIsInJ1bGVzIiwiYWxsb3ciLCJkZW55Q2xpZW50IiwiYWxsb3dDbGllbnQiLCJ2S2V5IiwiXzQwNCIsIm9yaWdpbmFsVXJsIiwidlJlZiIsInJlc3BvbnNlVHlwZSIsInNlcnZlIiwicmVhZGFibGVTdHJlYW0iLCJfcmVzcG9uc2VUeXBlIiwiZm9yY2UyMDAiLCJwYXJ0aXJhbCIsInJlcVJhbmdlIiwiZGlzcG9zaXRpb25UeXBlIiwic3RhcnQiLCJ0YWtlIiwiZGlzcG9zaXRpb25OYW1lIiwiZW5jb2RlVVJJIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiZGlzcG9zaXRpb25FbmNvZGluZyIsInNldEhlYWRlciIsInJhbmdlIiwiYXJyYXkiLCJpc05hTiIsInBsYXkiLCJzdHJlYW1FcnJvckhhbmRsZXIiLCJrZXkiLCJyZXNwb25kIiwiY29kZSIsImRlc3Ryb3kiLCJjcmVhdGVSZWFkU3RyZWFtIiwiRXZlbnRFbWl0dGVyIiwiZm9ybWF0RmxlVVJMIiwiRmlsZXNDdXJzb3IiLCJGaWxlQ3Vyc29yIiwiaW5mbyIsImxvZyIsInBvcCIsInRvTG93ZXJDYXNlIiwiaXNWaWRlbyIsInRlc3QiLCJpc0F1ZGlvIiwiaXNJbWFnZSIsImlzVGV4dCIsImlzSlNPTiIsImlzUERGIiwiZHMiLCJfZG93bmxvYWRSb3V0ZSIsIl9jb2xsZWN0aW9uTmFtZSIsIm9wdGlvbnMiLCJsaW5rIiwiVVJJQmFzZSIsIl9faGVscGVycyIsIm9wdGlvbmFsIiwiYmxhY2tib3giLCJ1cGRhdGVkQXQiLCJfZmlsZVJlZiIsIl9jb2xsZWN0aW9uIiwicHJvcGVydHkiLCJ3aXRoIiwiX3NlbGVjdG9yIiwiX2N1cnJlbnQiLCJoYXNOZXh0IiwiaGFzUHJldmlvdXMiLCJwcmV2aW91cyIsImZpcnN0IiwibGFzdCIsImNvbnRleHQiLCJlYWNoIiwibWFwIiwiY3VycmVudCIsImNhbGxiYWNrcyIsIm9ic2VydmVDaGFuZ2VzIiwiaXNVbmRlZmluZWQiLCJvYmoiLCJpc0FycmF5IiwiQXJyYXkiLCJwcm90b3R5cGUiLCJpc0VtcHR5IiwiaXNEYXRlIiwia2V5cyIsIl9vYmoiLCJoYXNPd25Qcm9wZXJ0eSIsImkiLCJjbGVhciIsIm5vdyIsInRocm90dGxlIiwiZnVuYyIsIndhaXQiLCJ0aW1lb3V0IiwidGhhdCIsImFyZ3MiLCJsYXRlciIsImxlYWRpbmciLCJ0aHJvdHRsZWQiLCJyZW1haW5pbmciLCJjbGVhclRpbWVvdXQiLCJ0cmFpbGluZyIsInNldFRpbWVvdXQiLCJjYW5jZWwiLCJfaGVscGVycyIsIl9VUklCYXNlIiwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyIsIlJPT1RfVVJMIiwiX3Jvb3QiLCJmZENhY2hlIiwid3JpdHRlbkNodW5rcyIsImVuc3VyZUZpbGUiLCJlZkVycm9yIiwib3BlbiIsIm9FcnJvciIsIm51bSIsImNo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QU8zQixPQUFPZ1gsVUFBUCxDQUFrQixNQUFNO0FBQzdCLGlCQUFLdlEsR0FBTCxDQUFTdkYsUUFBVDtBQUNELFdBRk0sRUFFSixFQUZJLENBQVA7QUFHRCxTQVJEO0FBU0QsT0FWRDtBQVdELEtBdkJELE1BdUJPO0FBQ0xBLGtCQUFZQSxTQUFTLEtBQUssQ0FBZCxFQUFpQixLQUFLZ0csS0FBdEIsQ0FBWjtBQUNEOztBQUNELFdBQU8sS0FBUDtBQUNEO0FBRUQ7Ozs7Ozs7OztBQU9BUixRQUFNeEYsUUFBTixFQUFnQjtBQUNkLFNBQUsrRixPQUFMLEdBQWUsSUFBZjtBQUNBLFdBQU9zUSxRQUFRLEtBQUszUSxJQUFiLENBQVA7QUFDQWpHLE9BQUdvTSxNQUFILENBQVUsS0FBS25HLElBQWYsRUFBc0IxRixZQUFZQyxJQUFsQztBQUNBLFdBQU8sSUFBUDtBQUNEO0FBRUQ7Ozs7Ozs7O0FBTUFxRixTQUFPO0FBQ0wsU0FBS1MsT0FBTCxHQUFlLElBQWY7QUFDQSxXQUFPc1EsUUFBUSxLQUFLM1EsSUFBYixDQUFQO0FBQ0EsV0FBTyxJQUFQO0FBQ0Q7O0FBdkk4QixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9vc3RyaW9fZmlsZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb25nbyB9ICAgICAgICAgICBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgV2ViQXBwIH0gICAgICAgICAgZnJvbSAnbWV0ZW9yL3dlYmFwcCc7XG5pbXBvcnQgeyBNZXRlb3IgfSAgICAgICAgICBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJhbmRvbSB9ICAgICAgICAgIGZyb20gJ21ldGVvci9yYW5kb20nO1xuaW1wb3J0IHsgQ29va2llcyB9ICAgICAgICAgZnJvbSAnbWV0ZW9yL29zdHJpbzpjb29raWVzJztcbmltcG9ydCBXcml0ZVN0cmVhbSAgICAgICAgIGZyb20gJy4vd3JpdGUtc3RyZWFtLmpzJztcbmltcG9ydCB7IGNoZWNrLCBNYXRjaCB9ICAgIGZyb20gJ21ldGVvci9jaGVjayc7XG5pbXBvcnQgRmlsZXNDb2xsZWN0aW9uQ29yZSBmcm9tICcuL2NvcmUuanMnO1xuaW1wb3J0IHsgZml4SlNPTlBhcnNlLCBmaXhKU09OU3RyaW5naWZ5LCBoZWxwZXJzIH0gZnJvbSAnLi9saWIuanMnO1xuXG5pbXBvcnQgZnMgICAgICAgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IG5vZGVRcyAgIGZyb20gJ3F1ZXJ5c3RyaW5nJztcbmltcG9ydCByZXF1ZXN0ICBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCBmaWxlVHlwZSBmcm9tICdmaWxlLXR5cGUnO1xuaW1wb3J0IG5vZGVQYXRoIGZyb20gJ3BhdGgnO1xuXG4vKlxuICogQGNvbnN0IHtPYmplY3R9IGJvdW5kICAtIE1ldGVvci5iaW5kRW52aXJvbm1lbnQgKEZpYmVyIHdyYXBwZXIpXG4gKiBAY29uc3Qge0Z1bmN0aW9ufSBOT09QIC0gTm8gT3BlcmF0aW9uIGZ1bmN0aW9uLCBwbGFjZWhvbGRlciBmb3IgcmVxdWlyZWQgY2FsbGJhY2tzXG4gKi9cbmNvbnN0IGJvdW5kID0gTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChjYWxsYmFjayA9PiBjYWxsYmFjaygpKTtcbmNvbnN0IE5PT1AgID0gKCkgPT4geyAgfTtcblxuLypcbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQGNsYXNzIEZpbGVzQ29sbGVjdGlvblxuICogQHBhcmFtIGNvbmZpZyAgICAgICAgICAge09iamVjdH0gICAtIFtCb3RoXSAgIENvbmZpZ3VyYXRpb24gb2JqZWN0IHdpdGggbmV4dCBwcm9wZXJ0aWVzOlxuICogQHBhcmFtIGNvbmZpZy5kZWJ1ZyAgICAge0Jvb2xlYW59ICAtIFtCb3RoXSAgIFR1cm4gb24vb2YgZGVidWdnaW5nIGFuZCBleHRyYSBsb2dnaW5nXG4gKiBAcGFyYW0gY29uZmlnLnNjaGVtYSAgICB7T2JqZWN0fSAgIC0gW0JvdGhdICAgQ29sbGVjdGlvbiBTY2hlbWFcbiAqIEBwYXJhbSBjb25maWcucHVibGljICAgIHtCb29sZWFufSAgLSBbQm90aF0gICBTdG9yZSBmaWxlcyBpbiBmb2xkZXIgYWNjZXNzaWJsZSBmb3IgcHJveHkgc2VydmVycywgZm9yIGxpbWl0cywgYW5kIG1vcmUgLSByZWFkIGRvY3NcbiAqIEBwYXJhbSBjb25maWcuc3RyaWN0ICAgIHtCb29sZWFufSAgLSBbU2VydmVyXSBTdHJpY3QgbW9kZSBmb3IgcGFydGlhbCBjb250ZW50LCBpZiBpcyBgdHJ1ZWAgc2VydmVyIHdpbGwgcmV0dXJuIGA0MTZgIHJlc3BvbnNlIGNvZGUsIHdoZW4gYHJhbmdlYCBpcyBub3Qgc3BlY2lmaWVkLCBvdGhlcndpc2Ugc2VydmVyIHJldHVybiBgMjA2YFxuICogQHBhcmFtIGNvbmZpZy5wcm90ZWN0ZWQge0Z1bmN0aW9ufSAtIFtTZXJ2ZXJdIElmIGB0cnVlYCAtIGZpbGVzIHdpbGwgYmUgc2VydmVkIG9ubHkgdG8gYXV0aG9yaXplZCB1c2VycywgaWYgYGZ1bmN0aW9uKClgIC0geW91J3JlIGFibGUgdG8gY2hlY2sgdmlzaXRvcidzIHBlcm1pc3Npb25zIGluIHlvdXIgb3duIHdheSBmdW5jdGlvbidzIGNvbnRleHQgaGFzOlxuICogIC0gYHJlcXVlc3RgXG4gKiAgLSBgcmVzcG9uc2VgXG4gKiAgLSBgdXNlcigpYFxuICogIC0gYHVzZXJJZGBcbiAqIEBwYXJhbSBjb25maWcuY2h1bmtTaXplICAgICAge051bWJlcn0gIC0gW0JvdGhdIFVwbG9hZCBjaHVuayBzaXplLCBkZWZhdWx0OiA1MjQyODggYnl0ZXMgKDAsNSBNYilcbiAqIEBwYXJhbSBjb25maWcucGVybWlzc2lvbnMgICAge051bWJlcn0gIC0gW1NlcnZlcl0gUGVybWlzc2lvbnMgd2hpY2ggd2lsbCBiZSBzZXQgdG8gdXBsb2FkZWQgZmlsZXMgKG9jdGFsKSwgbGlrZTogYDUxMWAgb3IgYDBvNzU1YC4gRGVmYXVsdDogMDY0NFxuICogQHBhcmFtIGNvbmZpZy5wYXJlbnREaXJQZXJtaXNzaW9ucyB7TnVtYmVyfSAgLSBbU2VydmVyXSBQZXJtaXNzaW9ucyB3aGljaCB3aWxsIGJlIHNldCB0byBwYXJlbnQgZGlyZWN0b3J5IG9mIHVwbG9hZGVkIGZpbGVzIChvY3RhbCksIGxpa2U6IGA2MTFgIG9yIGAwbzc3N2AuIERlZmF1bHQ6IDA3NTVcbiAqIEBwYXJhbSBjb25maWcuc3RvcmFnZVBhdGggICAge1N0cmluZ3xGdW5jdGlvbn0gIC0gW1NlcnZlcl0gU3RvcmFnZSBwYXRoIG9uIGZpbGUgc3lzdGVtXG4gKiBAcGFyYW0gY29uZmlnLmNhY2hlQ29udHJvbCAgIHtTdHJpbmd9ICAtIFtTZXJ2ZXJdIERlZmF1bHQgYENhY2hlLUNvbnRyb2xgIGhlYWRlclxuICogQHBhcmFtIGNvbmZpZy5yZXNwb25zZUhlYWRlcnMge09iamVjdHxGdW5jdGlvbn0gLSBbU2VydmVyXSBDdXN0b20gcmVzcG9uc2UgaGVhZGVycywgaWYgZnVuY3Rpb24gaXMgcGFzc2VkLCBtdXN0IHJldHVybiBPYmplY3RcbiAqIEBwYXJhbSBjb25maWcudGhyb3R0bGUgICAgICAge051bWJlcn0gIC0gW1NlcnZlcl0gREVQUkVDQVRFRCBicHMgdGhyb3R0bGUgdGhyZXNob2xkXG4gKiBAcGFyYW0gY29uZmlnLmRvd25sb2FkUm91dGUgIHtTdHJpbmd9ICAtIFtCb3RoXSAgIFNlcnZlciBSb3V0ZSB1c2VkIHRvIHJldHJpZXZlIGZpbGVzXG4gKiBAcGFyYW0gY29uZmlnLmNvbGxlY3Rpb24gICAgIHtNb25nby5Db2xsZWN0aW9ufSAtIFtCb3RoXSBNb25nbyBDb2xsZWN0aW9uIEluc3RhbmNlXG4gKiBAcGFyYW0gY29uZmlnLmNvbGxlY3Rpb25OYW1lIHtTdHJpbmd9ICAtIFtCb3RoXSAgIENvbGxlY3Rpb24gbmFtZVxuICogQHBhcmFtIGNvbmZpZy5uYW1pbmdGdW5jdGlvbiB7RnVuY3Rpb259LSBbQm90aF0gICBGdW5jdGlvbiB3aGljaCByZXR1cm5zIGBTdHJpbmdgXG4gKiBAcGFyYW0gY29uZmlnLmludGVncml0eUNoZWNrIHtCb29sZWFufSAtIFtTZXJ2ZXJdIENoZWNrIGZpbGUncyBpbnRlZ3JpdHkgYmVmb3JlIHNlcnZpbmcgdG8gdXNlcnNcbiAqIEBwYXJhbSBjb25maWcub25BZnRlclVwbG9hZCAge0Z1bmN0aW9ufS0gW1NlcnZlcl0gQ2FsbGVkIHJpZ2h0IGFmdGVyIGZpbGUgaXMgcmVhZHkgb24gRlMuIFVzZSB0byB0cmFuc2ZlciBmaWxlIHNvbWV3aGVyZSBlbHNlLCBvciBkbyBvdGhlciB0aGluZyB3aXRoIGZpbGUgZGlyZWN0bHlcbiAqIEBwYXJhbSBjb25maWcub25BZnRlclJlbW92ZSAge0Z1bmN0aW9ufSAtIFtTZXJ2ZXJdIENhbGxlZCByaWdodCBhZnRlciBmaWxlIGlzIHJlbW92ZWQuIFJlbW92ZWQgb2JqZWN0cyBpcyBwYXNzZWQgdG8gY2FsbGJhY2tcbiAqIEBwYXJhbSBjb25maWcuY29udGludWVVcGxvYWRUVEwge051bWJlcn0gLSBbU2VydmVyXSBUaW1lIGluIHNlY29uZHMsIGR1cmluZyB1cGxvYWQgbWF5IGJlIGNvbnRpbnVlZCwgZGVmYXVsdCAzIGhvdXJzICgxMDgwMCBzZWNvbmRzKVxuICogQHBhcmFtIGNvbmZpZy5vbkJlZm9yZVVwbG9hZCB7RnVuY3Rpb259LSBbQm90aF0gICBGdW5jdGlvbiB3aGljaCBleGVjdXRlcyBvbiBzZXJ2ZXIgYWZ0ZXIgcmVjZWl2aW5nIGVhY2ggY2h1bmsgYW5kIG9uIGNsaWVudCByaWdodCBiZWZvcmUgYmVnaW5uaW5nIHVwbG9hZC4gRnVuY3Rpb24gY29udGV4dCBpcyBgRmlsZWAgLSBzbyB5b3UgYXJlIGFibGUgdG8gY2hlY2sgZm9yIGV4dGVuc2lvbiwgbWltZS10eXBlLCBzaXplIGFuZCBldGMuOlxuICogIC0gcmV0dXJuIGB0cnVlYCB0byBjb250aW51ZVxuICogIC0gcmV0dXJuIGBmYWxzZWAgb3IgYFN0cmluZ2AgdG8gYWJvcnQgdXBsb2FkXG4gKiBAcGFyYW0gY29uZmlnLm9uSW5pdGlhdGVVcGxvYWQge0Z1bmN0aW9ufSAtIFtTZXJ2ZXJdIEZ1bmN0aW9uIHdoaWNoIGV4ZWN1dGVzIG9uIHNlcnZlciByaWdodCBiZWZvcmUgdXBsb2FkIGlzIGJlZ2luIGFuZCByaWdodCBhZnRlciBgb25CZWZvcmVVcGxvYWRgIGhvb2suIFRoaXMgaG9vayBpcyBmdWxseSBhc3luY2hyb25vdXMuXG4gKiBAcGFyYW0gY29uZmlnLm9uQmVmb3JlUmVtb3ZlIHtGdW5jdGlvbn0gLSBbU2VydmVyXSBFeGVjdXRlcyBiZWZvcmUgcmVtb3ZpbmcgZmlsZSBvbiBzZXJ2ZXIsIHNvIHlvdSBjYW4gY2hlY2sgcGVybWlzc2lvbnMuIFJldHVybiBgdHJ1ZWAgdG8gYWxsb3cgYWN0aW9uIGFuZCBgZmFsc2VgIHRvIGRlbnkuXG4gKiBAcGFyYW0gY29uZmlnLmFsbG93Q2xpZW50Q29kZSAge0Jvb2xlYW59ICAtIFtCb3RoXSAgIEFsbG93IHRvIHJ1biBgcmVtb3ZlYCBmcm9tIGNsaWVudFxuICogQHBhcmFtIGNvbmZpZy5kb3dubG9hZENhbGxiYWNrIHtGdW5jdGlvbn0gLSBbU2VydmVyXSBDYWxsYmFjayB0cmlnZ2VyZWQgZWFjaCB0aW1lIGZpbGUgaXMgcmVxdWVzdGVkLCByZXR1cm4gdHJ1dGh5IHZhbHVlIHRvIGNvbnRpbnVlIGRvd25sb2FkLCBvciBmYWxzeSB0byBhYm9ydFxuICogQHBhcmFtIGNvbmZpZy5pbnRlcmNlcHREb3dubG9hZCB7RnVuY3Rpb259IC0gW1NlcnZlcl0gSW50ZXJjZXB0IGRvd25sb2FkIHJlcXVlc3QsIHNvIHlvdSBjYW4gc2VydmUgZmlsZSBmcm9tIHRoaXJkLXBhcnR5IHJlc291cmNlLCBhcmd1bWVudHMge2h0dHA6IHtyZXF1ZXN0OiB7Li4ufSwgcmVzcG9uc2U6IHsuLi59fSwgZmlsZVJlZjogey4uLn19XG4gKiBAcGFyYW0gY29uZmlnLmRpc2FibGVVcGxvYWQge0Jvb2xlYW59IC0gRGlzYWJsZSBmaWxlIHVwbG9hZCwgdXNlZnVsIGZvciBzZXJ2ZXIgb25seSBzb2x1dGlvbnNcbiAqIEBwYXJhbSBjb25maWcuZGlzYWJsZURvd25sb2FkIHtCb29sZWFufSAtIERpc2FibGUgZmlsZSBkb3dubG9hZCAoc2VydmluZyksIHVzZWZ1bCBmb3IgZmlsZSBtYW5hZ2VtZW50IG9ubHkgc29sdXRpb25zXG4gKiBAcGFyYW0gY29uZmlnLl9wcmVDb2xsZWN0aW9uICB7TW9uZ28uQ29sbGVjdGlvbn0gLSBbU2VydmVyXSBNb25nbyBwcmVDb2xsZWN0aW9uIEluc3RhbmNlXG4gKiBAcGFyYW0gY29uZmlnLl9wcmVDb2xsZWN0aW9uTmFtZSB7U3RyaW5nfSAgLSBbU2VydmVyXSAgcHJlQ29sbGVjdGlvbiBuYW1lXG4gKiBAc3VtbWFyeSBDcmVhdGUgbmV3IGluc3RhbmNlIG9mIEZpbGVzQ29sbGVjdGlvblxuICovXG5leHBvcnQgY2xhc3MgRmlsZXNDb2xsZWN0aW9uIGV4dGVuZHMgRmlsZXNDb2xsZWN0aW9uQ29yZSB7XG4gIGNvbnN0cnVjdG9yKGNvbmZpZykge1xuICAgIHN1cGVyKCk7XG4gICAgbGV0IHN0b3JhZ2VQYXRoO1xuICAgIGlmIChjb25maWcpIHtcbiAgICAgICh7XG4gICAgICAgIHN0b3JhZ2VQYXRoLFxuICAgICAgICBkZWJ1ZzogdGhpcy5kZWJ1ZyxcbiAgICAgICAgc2NoZW1hOiB0aGlzLnNjaGVtYSxcbiAgICAgICAgcHVibGljOiB0aGlzLnB1YmxpYyxcbiAgICAgICAgc3RyaWN0OiB0aGlzLnN0cmljdCxcbiAgICAgICAgY2h1bmtTaXplOiB0aGlzLmNodW5rU2l6ZSxcbiAgICAgICAgcHJvdGVjdGVkOiB0aGlzLnByb3RlY3RlZCxcbiAgICAgICAgY29sbGVjdGlvbjogdGhpcy5jb2xsZWN0aW9uLFxuICAgICAgICBwZXJtaXNzaW9uczogdGhpcy5wZXJtaXNzaW9ucyxcbiAgICAgICAgY2FjaGVDb250cm9sOiB0aGlzLmNhY2hlQ29udHJvbCxcbiAgICAgICAgZG93bmxvYWRSb3V0ZTogdGhpcy5kb3dubG9hZFJvdXRlLFxuICAgICAgICBvbkFmdGVyVXBsb2FkOiB0aGlzLm9uQWZ0ZXJVcGxvYWQsXG4gICAgICAgIG9uQWZ0ZXJSZW1vdmU6IHRoaXMub25BZnRlclJlbW92ZSxcbiAgICAgICAgZGlzYWJsZVVwbG9hZDogdGhpcy5kaXNhYmxlVXBsb2FkLFxuICAgICAgICBvbkJlZm9yZVJlbW92ZTogdGhpcy5vbkJlZm9yZVJlbW92ZSxcbiAgICAgICAgaW50ZWdyaXR5Q2hlY2s6IHRoaXMuaW50ZWdyaXR5Q2hlY2ssXG4gICAgICAgIGNvbGxlY3Rpb25OYW1lOiB0aGlzLmNvbGxlY3Rpb25OYW1lLFxuICAgICAgICBvbkJlZm9yZVVwbG9hZDogdGhpcy5vbkJlZm9yZVVwbG9hZCxcbiAgICAgICAgbmFtaW5nRnVuY3Rpb246IHRoaXMubmFtaW5nRnVuY3Rpb24sXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczogdGhpcy5yZXNwb25zZUhlYWRlcnMsXG4gICAgICAgIGRpc2FibGVEb3dubG9hZDogdGhpcy5kaXNhYmxlRG93bmxvYWQsXG4gICAgICAgIGFsbG93Q2xpZW50Q29kZTogdGhpcy5hbGxvd0NsaWVudENvZGUsXG4gICAgICAgIGRvd25sb2FkQ2FsbGJhY2s6IHRoaXMuZG93bmxvYWRDYWxsYmFjayxcbiAgICAgICAgb25Jbml0aWF0ZVVwbG9hZDogdGhpcy5vbkluaXRpYXRlVXBsb2FkLFxuICAgICAgICBpbnRlcmNlcHREb3dubG9hZDogdGhpcy5pbnRlcmNlcHREb3dubG9hZCxcbiAgICAgICAgY29udGludWVVcGxvYWRUVEw6IHRoaXMuY29udGludWVVcGxvYWRUVEwsXG4gICAgICAgIHBhcmVudERpclBlcm1pc3Npb25zOiB0aGlzLnBhcmVudERpclBlcm1pc3Npb25zLFxuICAgICAgICBfcHJlQ29sbGVjdGlvbjogdGhpcy5fcHJlQ29sbGVjdGlvbixcbiAgICAgICAgX3ByZUNvbGxlY3Rpb25OYW1lOiB0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSxcbiAgICAgIH0gPSBjb25maWcpO1xuICAgIH1cblxuICAgIGNvbnN0IHNlbGYgICA9IHRoaXM7XG4gICAgbmV3IENvb2tpZXMoKTtcblxuICAgIGlmICghaGVscGVycy5pc0Jvb2xlYW4odGhpcy5kZWJ1ZykpIHtcbiAgICAgIHRoaXMuZGVidWcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNCb29sZWFuKHRoaXMucHVibGljKSkge1xuICAgICAgdGhpcy5wdWJsaWMgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMucHJvdGVjdGVkKSB7XG4gICAgICB0aGlzLnByb3RlY3RlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5jaHVua1NpemUpIHtcbiAgICAgIHRoaXMuY2h1bmtTaXplID0gMTAyNCAqIDUxMjtcbiAgICB9XG5cbiAgICB0aGlzLmNodW5rU2l6ZSA9IE1hdGguZmxvb3IodGhpcy5jaHVua1NpemUgLyA4KSAqIDg7XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNTdHJpbmcodGhpcy5jb2xsZWN0aW9uTmFtZSkgJiYgIXRoaXMuY29sbGVjdGlvbikge1xuICAgICAgdGhpcy5jb2xsZWN0aW9uTmFtZSA9ICdNZXRlb3JVcGxvYWRGaWxlcyc7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmNvbGxlY3Rpb24pIHtcbiAgICAgIHRoaXMuY29sbGVjdGlvbiA9IG5ldyBNb25nby5Db2xsZWN0aW9uKHRoaXMuY29sbGVjdGlvbk5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbGxlY3Rpb25OYW1lID0gdGhpcy5jb2xsZWN0aW9uLl9uYW1lO1xuICAgIH1cblxuICAgIHRoaXMuY29sbGVjdGlvbi5maWxlc0NvbGxlY3Rpb24gPSB0aGlzO1xuICAgIGNoZWNrKHRoaXMuY29sbGVjdGlvbk5hbWUsIFN0cmluZyk7XG5cbiAgICBpZiAodGhpcy5wdWJsaWMgJiYgIXRoaXMuZG93bmxvYWRSb3V0ZSkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIGBbRmlsZXNDb2xsZWN0aW9uLiR7dGhpcy5jb2xsZWN0aW9uTmFtZX1dOiBcImRvd25sb2FkUm91dGVcIiBtdXN0IGJlIHByZWNpc2VseSBwcm92aWRlZCBvbiBcInB1YmxpY1wiIGNvbGxlY3Rpb25zISBOb3RlOiBcImRvd25sb2FkUm91dGVcIiBtdXN0IGJlIGVxdWFsIG9yIGJlIGluc2lkZSBvZiB5b3VyIHdlYi9wcm94eS1zZXJ2ZXIgKHJlbGF0aXZlKSByb290LmApO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc1N0cmluZyh0aGlzLmRvd25sb2FkUm91dGUpKSB7XG4gICAgICB0aGlzLmRvd25sb2FkUm91dGUgPSAnL2Nkbi9zdG9yYWdlJztcbiAgICB9XG5cbiAgICB0aGlzLmRvd25sb2FkUm91dGUgPSB0aGlzLmRvd25sb2FkUm91dGUucmVwbGFjZSgvXFwvJC8sICcnKTtcblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMubmFtaW5nRnVuY3Rpb24pKSB7XG4gICAgICB0aGlzLm5hbWluZ0Z1bmN0aW9uID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5vbkJlZm9yZVVwbG9hZCkpIHtcbiAgICAgIHRoaXMub25CZWZvcmVVcGxvYWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNCb29sZWFuKHRoaXMuYWxsb3dDbGllbnRDb2RlKSkge1xuICAgICAgdGhpcy5hbGxvd0NsaWVudENvZGUgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMub25Jbml0aWF0ZVVwbG9hZCkpIHtcbiAgICAgIHRoaXMub25Jbml0aWF0ZVVwbG9hZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMuaW50ZXJjZXB0RG93bmxvYWQpKSB7XG4gICAgICB0aGlzLmludGVyY2VwdERvd25sb2FkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzQm9vbGVhbih0aGlzLnN0cmljdCkpIHtcbiAgICAgIHRoaXMuc3RyaWN0ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNOdW1iZXIodGhpcy5wZXJtaXNzaW9ucykpIHtcbiAgICAgIHRoaXMucGVybWlzc2lvbnMgPSBwYXJzZUludCgnNjQ0JywgOCk7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzTnVtYmVyKHRoaXMucGFyZW50RGlyUGVybWlzc2lvbnMpKSB7XG4gICAgICB0aGlzLnBhcmVudERpclBlcm1pc3Npb25zID0gcGFyc2VJbnQoJzc1NScsIDgpO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc1N0cmluZyh0aGlzLmNhY2hlQ29udHJvbCkpIHtcbiAgICAgIHRoaXMuY2FjaGVDb250cm9sID0gJ3B1YmxpYywgbWF4LWFnZT0zMTUzNjAwMCwgcy1tYXhhZ2U9MzE1MzYwMDAnO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMub25BZnRlclVwbG9hZCkpIHtcbiAgICAgIHRoaXMub25BZnRlclVwbG9hZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Jvb2xlYW4odGhpcy5kaXNhYmxlVXBsb2FkKSkge1xuICAgICAgdGhpcy5kaXNhYmxlVXBsb2FkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5vbkFmdGVyUmVtb3ZlKSkge1xuICAgICAgdGhpcy5vbkFmdGVyUmVtb3ZlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5vbkJlZm9yZVJlbW92ZSkpIHtcbiAgICAgIHRoaXMub25CZWZvcmVSZW1vdmUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNCb29sZWFuKHRoaXMuaW50ZWdyaXR5Q2hlY2spKSB7XG4gICAgICB0aGlzLmludGVncml0eUNoZWNrID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNCb29sZWFuKHRoaXMuZGlzYWJsZURvd25sb2FkKSkge1xuICAgICAgdGhpcy5kaXNhYmxlRG93bmxvYWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNPYmplY3QodGhpcy5fY3VycmVudFVwbG9hZHMpKSB7XG4gICAgICB0aGlzLl9jdXJyZW50VXBsb2FkcyA9IHt9O1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMuZG93bmxvYWRDYWxsYmFjaykpIHtcbiAgICAgIHRoaXMuZG93bmxvYWRDYWxsYmFjayA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc051bWJlcih0aGlzLmNvbnRpbnVlVXBsb2FkVFRMKSkge1xuICAgICAgdGhpcy5jb250aW51ZVVwbG9hZFRUTCA9IDEwODAwO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMucmVzcG9uc2VIZWFkZXJzKSkge1xuICAgICAgdGhpcy5yZXNwb25zZUhlYWRlcnMgPSAocmVzcG9uc2VDb2RlLCBmaWxlUmVmLCB2ZXJzaW9uUmVmKSA9PiB7XG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSB7fTtcblxuICAgICAgICBzd2l0Y2ggKHJlc3BvbnNlQ29kZSkge1xuICAgICAgICBjYXNlICcyMDYnOlxuICAgICAgICAgIGhlYWRlcnMuUHJhZ21hICAgICAgICAgICAgICAgPSAncHJpdmF0ZSc7XG4gICAgICAgICAgaGVhZGVycy5UcmFpbGVyICAgICAgICAgICAgICA9ICdleHBpcmVzJztcbiAgICAgICAgICBoZWFkZXJzWydUcmFuc2Zlci1FbmNvZGluZyddID0gJ2NodW5rZWQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc0MDAnOlxuICAgICAgICAgIGhlYWRlcnNbJ0NhY2hlLUNvbnRyb2wnXSAgICAgPSAnbm8tY2FjaGUnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc0MTYnOlxuICAgICAgICAgIGhlYWRlcnNbJ0NvbnRlbnQtUmFuZ2UnXSAgICAgPSBgYnl0ZXMgKi8ke3ZlcnNpb25SZWYuc2l6ZX1gO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaGVhZGVycy5Db25uZWN0aW9uICAgICAgID0gJ2tlZXAtYWxpdmUnO1xuICAgICAgICBoZWFkZXJzWydDb250ZW50LVR5cGUnXSAgPSB2ZXJzaW9uUmVmLnR5cGUgfHwgJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSc7XG4gICAgICAgIGhlYWRlcnNbJ0FjY2VwdC1SYW5nZXMnXSA9ICdieXRlcyc7XG4gICAgICAgIHJldHVybiBoZWFkZXJzO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wdWJsaWMgJiYgIXN0b3JhZ2VQYXRoKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgYFtGaWxlc0NvbGxlY3Rpb24uJHt0aGlzLmNvbGxlY3Rpb25OYW1lfV0gXCJzdG9yYWdlUGF0aFwiIG11c3QgYmUgc2V0IG9uIFwicHVibGljXCIgY29sbGVjdGlvbnMhIE5vdGU6IFwic3RvcmFnZVBhdGhcIiBtdXN0IGJlIGVxdWFsIG9uIGJlIGluc2lkZSBvZiB5b3VyIHdlYi9wcm94eS1zZXJ2ZXIgKGFic29sdXRlKSByb290LmApO1xuICAgIH1cblxuICAgIGlmICghc3RvcmFnZVBhdGgpIHtcbiAgICAgIHN0b3JhZ2VQYXRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYGFzc2V0cyR7bm9kZVBhdGguc2VwfWFwcCR7bm9kZVBhdGguc2VwfXVwbG9hZHMke25vZGVQYXRoLnNlcH0ke3NlbGYuY29sbGVjdGlvbk5hbWV9YDtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGhlbHBlcnMuaXNTdHJpbmcoc3RvcmFnZVBhdGgpKSB7XG4gICAgICB0aGlzLnN0b3JhZ2VQYXRoID0gKCkgPT4gc3RvcmFnZVBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RvcmFnZVBhdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBzcCA9IHN0b3JhZ2VQYXRoLmFwcGx5KHNlbGYsIGFyZ3VtZW50cyk7XG4gICAgICAgIGlmICghaGVscGVycy5pc1N0cmluZyhzcCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgYFtGaWxlc0NvbGxlY3Rpb24uJHtzZWxmLmNvbGxlY3Rpb25OYW1lfV0gXCJzdG9yYWdlUGF0aFwiIGZ1bmN0aW9uIG11c3QgcmV0dXJuIGEgU3RyaW5nIWApO1xuICAgICAgICB9XG4gICAgICAgIHNwID0gc3AucmVwbGFjZSgvXFwvJC8sICcnKTtcbiAgICAgICAgcmV0dXJuIG5vZGVQYXRoLm5vcm1hbGl6ZShzcCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMuX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uLnN0b3JhZ2VQYXRoXSBTZXQgdG86JywgdGhpcy5zdG9yYWdlUGF0aCh7fSkpO1xuXG4gICAgZnMubWtkaXJzKHRoaXMuc3RvcmFnZVBhdGgoe30pLCB7IG1vZGU6IHRoaXMucGFyZW50RGlyUGVybWlzc2lvbnMgfSwgKGVycm9yKSA9PiB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsIGBbRmlsZXNDb2xsZWN0aW9uLiR7c2VsZi5jb2xsZWN0aW9uTmFtZX1dIFBhdGggXCIke3RoaXMuc3RvcmFnZVBhdGgoe30pfVwiIGlzIG5vdCB3cml0YWJsZSEgJHtlcnJvcn1gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNoZWNrKHRoaXMuc3RyaWN0LCBCb29sZWFuKTtcbiAgICBjaGVjayh0aGlzLnBlcm1pc3Npb25zLCBOdW1iZXIpO1xuICAgIGNoZWNrKHRoaXMuc3RvcmFnZVBhdGgsIEZ1bmN0aW9uKTtcbiAgICBjaGVjayh0aGlzLmNhY2hlQ29udHJvbCwgU3RyaW5nKTtcbiAgICBjaGVjayh0aGlzLm9uQWZ0ZXJSZW1vdmUsIE1hdGNoLk9uZU9mKGZhbHNlLCBGdW5jdGlvbikpO1xuICAgIGNoZWNrKHRoaXMub25BZnRlclVwbG9hZCwgTWF0Y2guT25lT2YoZmFsc2UsIEZ1bmN0aW9uKSk7XG4gICAgY2hlY2sodGhpcy5kaXNhYmxlVXBsb2FkLCBCb29sZWFuKTtcbiAgICBjaGVjayh0aGlzLmludGVncml0eUNoZWNrLCBCb29sZWFuKTtcbiAgICBjaGVjayh0aGlzLm9uQmVmb3JlUmVtb3ZlLCBNYXRjaC5PbmVPZihmYWxzZSwgRnVuY3Rpb24pKTtcbiAgICBjaGVjayh0aGlzLmRpc2FibGVEb3dubG9hZCwgQm9vbGVhbik7XG4gICAgY2hlY2sodGhpcy5kb3dubG9hZENhbGxiYWNrLCBNYXRjaC5PbmVPZihmYWxzZSwgRnVuY3Rpb24pKTtcbiAgICBjaGVjayh0aGlzLmludGVyY2VwdERvd25sb2FkLCBNYXRjaC5PbmVPZihmYWxzZSwgRnVuY3Rpb24pKTtcbiAgICBjaGVjayh0aGlzLmNvbnRpbnVlVXBsb2FkVFRMLCBOdW1iZXIpO1xuICAgIGNoZWNrKHRoaXMucmVzcG9uc2VIZWFkZXJzLCBNYXRjaC5PbmVPZihPYmplY3QsIEZ1bmN0aW9uKSk7XG5cbiAgICBpZiAoIXRoaXMuZGlzYWJsZVVwbG9hZCkge1xuICAgICAgaWYgKCFoZWxwZXJzLmlzU3RyaW5nKHRoaXMuX3ByZUNvbGxlY3Rpb25OYW1lKSAmJiAhdGhpcy5fcHJlQ29sbGVjdGlvbikge1xuICAgICAgICB0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSA9IGBfX3ByZV8ke3RoaXMuY29sbGVjdGlvbk5hbWV9YDtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLl9wcmVDb2xsZWN0aW9uKSB7XG4gICAgICAgIHRoaXMuX3ByZUNvbGxlY3Rpb24gPSBuZXcgTW9uZ28uQ29sbGVjdGlvbih0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSA9IHRoaXMuX3ByZUNvbGxlY3Rpb24uX25hbWU7XG4gICAgICB9XG4gICAgICBjaGVjayh0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSwgU3RyaW5nKTtcblxuICAgICAgdGhpcy5fcHJlQ29sbGVjdGlvbi5fZW5zdXJlSW5kZXgoeyBjcmVhdGVkQXQ6IDEgfSwgeyBleHBpcmVBZnRlclNlY29uZHM6IHRoaXMuY29udGludWVVcGxvYWRUVEwsIGJhY2tncm91bmQ6IHRydWUgfSk7XG4gICAgICBjb25zdCBfcHJlQ29sbGVjdGlvbkN1cnNvciA9IHRoaXMuX3ByZUNvbGxlY3Rpb24uZmluZCh7fSwge1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBfaWQ6IDEsXG4gICAgICAgICAgaXNGaW5pc2hlZDogMVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgX3ByZUNvbGxlY3Rpb25DdXJzb3Iub2JzZXJ2ZSh7XG4gICAgICAgIGNoYW5nZWQoZG9jKSB7XG4gICAgICAgICAgaWYgKGRvYy5pc0ZpbmlzaGVkKSB7XG4gICAgICAgICAgICBzZWxmLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW19wcmVDb2xsZWN0aW9uQ3Vyc29yLm9ic2VydmVdIFtjaGFuZ2VkXTogJHtkb2MuX2lkfWApO1xuICAgICAgICAgICAgc2VsZi5fcHJlQ29sbGVjdGlvbi5yZW1vdmUoe19pZDogZG9jLl9pZH0sIE5PT1ApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlZChkb2MpIHtcbiAgICAgICAgICAvLyBGcmVlIG1lbW9yeSBhZnRlciB1cGxvYWQgaXMgZG9uZVxuICAgICAgICAgIC8vIE9yIGlmIHVwbG9hZCBpcyB1bmZpbmlzaGVkXG4gICAgICAgICAgc2VsZi5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtfcHJlQ29sbGVjdGlvbkN1cnNvci5vYnNlcnZlXSBbcmVtb3ZlZF06ICR7ZG9jLl9pZH1gKTtcbiAgICAgICAgICBpZiAoaGVscGVycy5pc09iamVjdChzZWxmLl9jdXJyZW50VXBsb2Fkc1tkb2MuX2lkXSkpIHtcbiAgICAgICAgICAgIHNlbGYuX2N1cnJlbnRVcGxvYWRzW2RvYy5faWRdLnN0b3AoKTtcbiAgICAgICAgICAgIHNlbGYuX2N1cnJlbnRVcGxvYWRzW2RvYy5faWRdLmVuZCgpO1xuXG4gICAgICAgICAgICBpZiAoIWRvYy5pc0ZpbmlzaGVkKSB7XG4gICAgICAgICAgICAgIHNlbGYuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbX3ByZUNvbGxlY3Rpb25DdXJzb3Iub2JzZXJ2ZV0gW3JlbW92ZVVuZmluaXNoZWRVcGxvYWRdOiAke2RvYy5faWR9YCk7XG4gICAgICAgICAgICAgIHNlbGYuX2N1cnJlbnRVcGxvYWRzW2RvYy5faWRdLmFib3J0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlbGV0ZSBzZWxmLl9jdXJyZW50VXBsb2Fkc1tkb2MuX2lkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9jcmVhdGVTdHJlYW0gPSAoX2lkLCBwYXRoLCBvcHRzKSA9PiB7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRVcGxvYWRzW19pZF0gPSBuZXcgV3JpdGVTdHJlYW0ocGF0aCwgb3B0cy5maWxlTGVuZ3RoLCBvcHRzLCB0aGlzLnBlcm1pc3Npb25zKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIFRoaXMgbGl0dGxlIGZ1bmN0aW9uIGFsbG93cyB0byBjb250aW51ZSB1cGxvYWRcbiAgICAgIC8vIGV2ZW4gYWZ0ZXIgc2VydmVyIGlzIHJlc3RhcnRlZCAoKm5vdCBvbiBkZXYtc3RhZ2UqKVxuICAgICAgdGhpcy5fY29udGludWVVcGxvYWQgPSAoX2lkKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50VXBsb2Fkc1tfaWRdICYmIHRoaXMuX2N1cnJlbnRVcGxvYWRzW19pZF0uZmlsZSkge1xuICAgICAgICAgIGlmICghdGhpcy5fY3VycmVudFVwbG9hZHNbX2lkXS5hYm9ydGVkICYmICF0aGlzLl9jdXJyZW50VXBsb2Fkc1tfaWRdLmVuZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY3VycmVudFVwbG9hZHNbX2lkXS5maWxlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9jcmVhdGVTdHJlYW0oX2lkLCB0aGlzLl9jdXJyZW50VXBsb2Fkc1tfaWRdLmZpbGUuZmlsZS5wYXRoLCB0aGlzLl9jdXJyZW50VXBsb2Fkc1tfaWRdLmZpbGUpO1xuICAgICAgICAgIHJldHVybiB0aGlzLl9jdXJyZW50VXBsb2Fkc1tfaWRdLmZpbGU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29udFVwbGQgPSB0aGlzLl9wcmVDb2xsZWN0aW9uLmZpbmRPbmUoe19pZH0pO1xuICAgICAgICBpZiAoY29udFVwbGQpIHtcbiAgICAgICAgICB0aGlzLl9jcmVhdGVTdHJlYW0oX2lkLCBjb250VXBsZC5maWxlLnBhdGgsIGNvbnRVcGxkKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fY3VycmVudFVwbG9hZHNbX2lkXS5maWxlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnNjaGVtYSkge1xuICAgICAgdGhpcy5zY2hlbWEgPSBGaWxlc0NvbGxlY3Rpb25Db3JlLnNjaGVtYTtcbiAgICB9XG5cbiAgICBjaGVjayh0aGlzLmRlYnVnLCBCb29sZWFuKTtcbiAgICBjaGVjayh0aGlzLnNjaGVtYSwgT2JqZWN0KTtcbiAgICBjaGVjayh0aGlzLnB1YmxpYywgQm9vbGVhbik7XG4gICAgY2hlY2sodGhpcy5wcm90ZWN0ZWQsIE1hdGNoLk9uZU9mKEJvb2xlYW4sIEZ1bmN0aW9uKSk7XG4gICAgY2hlY2sodGhpcy5jaHVua1NpemUsIE51bWJlcik7XG4gICAgY2hlY2sodGhpcy5kb3dubG9hZFJvdXRlLCBTdHJpbmcpO1xuICAgIGNoZWNrKHRoaXMubmFtaW5nRnVuY3Rpb24sIE1hdGNoLk9uZU9mKGZhbHNlLCBGdW5jdGlvbikpO1xuICAgIGNoZWNrKHRoaXMub25CZWZvcmVVcGxvYWQsIE1hdGNoLk9uZU9mKGZhbHNlLCBGdW5jdGlvbikpO1xuICAgIGNoZWNrKHRoaXMub25Jbml0aWF0ZVVwbG9hZCwgTWF0Y2guT25lT2YoZmFsc2UsIEZ1bmN0aW9uKSk7XG4gICAgY2hlY2sodGhpcy5hbGxvd0NsaWVudENvZGUsIEJvb2xlYW4pO1xuXG4gICAgaWYgKHRoaXMucHVibGljICYmIHRoaXMucHJvdGVjdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgYFtGaWxlc0NvbGxlY3Rpb24uJHt0aGlzLmNvbGxlY3Rpb25OYW1lfV06IEZpbGVzIGNhbiBub3QgYmUgcHVibGljIGFuZCBwcm90ZWN0ZWQgYXQgdGhlIHNhbWUgdGltZSFgKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jaGVja0FjY2VzcyA9IChodHRwKSA9PiB7XG4gICAgICBpZiAodGhpcy5wcm90ZWN0ZWQpIHtcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgY29uc3Qge3VzZXIsIHVzZXJJZH0gPSB0aGlzLl9nZXRVc2VyKGh0dHApO1xuXG4gICAgICAgIGlmIChoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5wcm90ZWN0ZWQpKSB7XG4gICAgICAgICAgbGV0IGZpbGVSZWY7XG4gICAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3QoaHR0cC5wYXJhbXMpICYmICBodHRwLnBhcmFtcy5faWQpIHtcbiAgICAgICAgICAgIGZpbGVSZWYgPSB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShodHRwLnBhcmFtcy5faWQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlc3VsdCA9IGh0dHAgPyB0aGlzLnByb3RlY3RlZC5jYWxsKE9iamVjdC5hc3NpZ24oaHR0cCwge3VzZXIsIHVzZXJJZH0pLCAoZmlsZVJlZiB8fCBudWxsKSkgOiB0aGlzLnByb3RlY3RlZC5jYWxsKHt1c2VyLCB1c2VySWR9LCAoZmlsZVJlZiB8fCBudWxsKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0ID0gISF1c2VySWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKGh0dHAgJiYgKHJlc3VsdCA9PT0gdHJ1ZSkpIHx8ICFodHRwKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByYyA9IGhlbHBlcnMuaXNOdW1iZXIocmVzdWx0KSA/IHJlc3VsdCA6IDQwMTtcbiAgICAgICAgdGhpcy5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb24uX2NoZWNrQWNjZXNzXSBXQVJOOiBBY2Nlc3MgZGVuaWVkIScpO1xuICAgICAgICBpZiAoaHR0cCkge1xuICAgICAgICAgIGNvbnN0IHRleHQgPSAnQWNjZXNzIGRlbmllZCEnO1xuICAgICAgICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgICAgICAgaHR0cC5yZXNwb25zZS53cml0ZUhlYWQocmMsIHtcbiAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICd0ZXh0L3BsYWluJyxcbiAgICAgICAgICAgICAgJ0NvbnRlbnQtTGVuZ3RoJzogdGV4dC5sZW5ndGhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaHR0cC5yZXNwb25zZS5maW5pc2hlZCkge1xuICAgICAgICAgICAgaHR0cC5yZXNwb25zZS5lbmQodGV4dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHRoaXMuX21ldGhvZE5hbWVzID0ge1xuICAgICAgX0Fib3J0OiBgX0ZpbGVzQ29sbGVjdGlvbkFib3J0XyR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gLFxuICAgICAgX1dyaXRlOiBgX0ZpbGVzQ29sbGVjdGlvbldyaXRlXyR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gLFxuICAgICAgX1N0YXJ0OiBgX0ZpbGVzQ29sbGVjdGlvblN0YXJ0XyR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gLFxuICAgICAgX1JlbW92ZTogYF9GaWxlc0NvbGxlY3Rpb25SZW1vdmVfJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWBcbiAgICB9O1xuXG4gICAgdGhpcy5vbignX2hhbmRsZVVwbG9hZCcsIHRoaXMuX2hhbmRsZVVwbG9hZCk7XG4gICAgdGhpcy5vbignX2ZpbmlzaFVwbG9hZCcsIHRoaXMuX2ZpbmlzaFVwbG9hZCk7XG4gICAgdGhpcy5faGFuZGxlVXBsb2FkU3luYyA9IE1ldGVvci53cmFwQXN5bmModGhpcy5faGFuZGxlVXBsb2FkLmJpbmQodGhpcykpO1xuXG4gICAgaWYgKHRoaXMuZGlzYWJsZVVwbG9hZCAmJiB0aGlzLmRpc2FibGVEb3dubG9hZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBXZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZSgoaHR0cFJlcSwgaHR0cFJlc3AsIG5leHQpID0+IHtcbiAgICAgIGlmICghdGhpcy5kaXNhYmxlVXBsb2FkICYmICEhfmh0dHBSZXEuX3BhcnNlZFVybC5wYXRoLmluZGV4T2YoYCR7dGhpcy5kb3dubG9hZFJvdXRlfS8ke3RoaXMuY29sbGVjdGlvbk5hbWV9L19fdXBsb2FkYCkpIHtcbiAgICAgICAgaWYgKGh0dHBSZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICBjb25zdCBoYW5kbGVFcnJvciA9IChfZXJyb3IpID0+IHtcbiAgICAgICAgICAgIGxldCBlcnJvciA9IF9lcnJvcjtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW0ZpbGVzQ29sbGVjdGlvbl0gW1VwbG9hZF0gW0hUVFBdIEV4Y2VwdGlvbjonLCBlcnJvcik7XG4gICAgICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG5cbiAgICAgICAgICAgIGlmICghaHR0cFJlc3AuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgaHR0cFJlc3Aud3JpdGVIZWFkKDUwMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaHR0cFJlc3AuZmluaXNoZWQpIHtcbiAgICAgICAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3QoZXJyb3IpICYmIGhlbHBlcnMuaXNGdW5jdGlvbihlcnJvci50b1N0cmluZykpIHtcbiAgICAgICAgICAgICAgICBlcnJvciA9IGVycm9yLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoIWhlbHBlcnMuaXNTdHJpbmcoZXJyb3IpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSAnVW5leHBlY3RlZCBlcnJvciEnO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaHR0cFJlc3AuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3IgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgICAgIGh0dHBSZXEub24oJ2RhdGEnLCAoZGF0YSkgPT4gYm91bmQoKCkgPT4ge1xuICAgICAgICAgICAgYm9keSArPSBkYXRhO1xuICAgICAgICAgIH0pKTtcblxuICAgICAgICAgIGh0dHBSZXEub24oJ2VuZCcsICgpID0+IGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGxldCBvcHRzO1xuICAgICAgICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICAgICAgICBsZXQgdXNlcjtcblxuICAgICAgICAgICAgICBpZiAoaHR0cFJlcS5oZWFkZXJzWyd4LW10b2snXSAmJiBoZWxwZXJzLmlzT2JqZWN0KE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnMpICYmIGhlbHBlcnMuaGFzKE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnNbaHR0cFJlcS5oZWFkZXJzWyd4LW10b2snXV0sICd1c2VySWQnKSkge1xuICAgICAgICAgICAgICAgIHVzZXIgPSB7XG4gICAgICAgICAgICAgICAgICB1c2VySWQ6IE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnNbaHR0cFJlcS5oZWFkZXJzWyd4LW10b2snXV0udXNlcklkXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1c2VyID0gdGhpcy5fZ2V0VXNlcih7cmVxdWVzdDogaHR0cFJlcSwgcmVzcG9uc2U6IGh0dHBSZXNwfSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoaHR0cFJlcS5oZWFkZXJzWyd4LXN0YXJ0J10gIT09ICcxJykge1xuICAgICAgICAgICAgICAgIG9wdHMgPSB7XG4gICAgICAgICAgICAgICAgICBmaWxlSWQ6IGh0dHBSZXEuaGVhZGVyc1sneC1maWxlaWQnXVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAoaHR0cFJlcS5oZWFkZXJzWyd4LWVvZiddID09PSAnMScpIHtcbiAgICAgICAgICAgICAgICAgIG9wdHMuZW9mID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBCdWZmZXIuZnJvbSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIG9wdHMuYmluRGF0YSA9IEJ1ZmZlci5mcm9tKGJvZHksICdiYXNlNjQnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoYnVmZkVycikge1xuICAgICAgICAgICAgICAgICAgICAgIG9wdHMuYmluRGF0YSA9IG5ldyBCdWZmZXIoYm9keSwgJ2Jhc2U2NCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvcHRzLmJpbkRhdGEgPSBuZXcgQnVmZmVyKGJvZHksICdiYXNlNjQnKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIG9wdHMuY2h1bmtJZCA9IHBhcnNlSW50KGh0dHBSZXEuaGVhZGVyc1sneC1jaHVua2lkJ10pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IF9jb250aW51ZVVwbG9hZCA9IHRoaXMuX2NvbnRpbnVlVXBsb2FkKG9wdHMuZmlsZUlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIV9jb250aW51ZVVwbG9hZCkge1xuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDgsICdDYW5cXCd0IGNvbnRpbnVlIHVwbG9hZCwgc2Vzc2lvbiBleHBpcmVkLiBTdGFydCB1cGxvYWQgYWdhaW4uJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgKHtyZXN1bHQsIG9wdHN9ICA9IHRoaXMuX3ByZXBhcmVVcGxvYWQoT2JqZWN0LmFzc2lnbihvcHRzLCBfY29udGludWVVcGxvYWQpLCB1c2VyLnVzZXJJZCwgJ0hUVFAnKSk7XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0cy5lb2YpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZVVwbG9hZChyZXN1bHQsIG9wdHMsIChfZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGVycm9yID0gX2Vycm9yO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmhlYWRlcnNTZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBodHRwUmVzcC53cml0ZUhlYWQoNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmZpbmlzaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGVscGVycy5pc09iamVjdChlcnJvcikgJiYgaGVscGVycy5pc0Z1bmN0aW9uKGVycm9yLnRvU3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvciA9IGVycm9yLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaGVscGVycy5pc1N0cmluZyhlcnJvcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IgPSAnVW5leHBlY3RlZCBlcnJvciEnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBodHRwUmVzcC5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvciB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFodHRwUmVzcC5oZWFkZXJzU2VudCkge1xuICAgICAgICAgICAgICAgICAgICAgIGh0dHBSZXNwLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3QocmVzdWx0LmZpbGUpICYmIHJlc3VsdC5maWxlLm1ldGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuZmlsZS5tZXRhID0gZml4SlNPTlN0cmluZ2lmeShyZXN1bHQuZmlsZS5tZXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghaHR0cFJlc3AuZmluaXNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBodHRwUmVzcC5lbmQoSlNPTi5zdHJpbmdpZnkocmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnX2hhbmRsZVVwbG9hZCcsIHJlc3VsdCwgb3B0cywgTk9PUCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmhlYWRlcnNTZW50KSB7XG4gICAgICAgICAgICAgICAgICBodHRwUmVzcC53cml0ZUhlYWQoMjA0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFodHRwUmVzcC5maW5pc2hlZCkge1xuICAgICAgICAgICAgICAgICAgaHR0cFJlc3AuZW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBvcHRzID0gSlNPTi5wYXJzZShib2R5KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChqc29uRXJyKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdDYW5cXCd0IHBhcnNlIGluY29taW5nIEpTT04gZnJvbSBDbGllbnQgb24gWy5pbnNlcnQoKSB8IHVwbG9hZF0sIHNvbWV0aGluZyB3ZW50IHdyb25nIScsIGpzb25FcnIpO1xuICAgICAgICAgICAgICAgICAgb3B0cyA9IHtmaWxlOiB7fX07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFoZWxwZXJzLmlzT2JqZWN0KG9wdHMuZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgIG9wdHMuZmlsZSA9IHt9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG9wdHMuX19fcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtGaWxlIFN0YXJ0IEhUVFBdICR7b3B0cy5maWxlLm5hbWUgfHwgJ1tuby1uYW1lXSd9IC0gJHtvcHRzLmZpbGVJZH1gKTtcbiAgICAgICAgICAgICAgICBpZiAoaGVscGVycy5pc09iamVjdChvcHRzLmZpbGUpICYmIG9wdHMuZmlsZS5tZXRhKSB7XG4gICAgICAgICAgICAgICAgICBvcHRzLmZpbGUubWV0YSA9IGZpeEpTT05QYXJzZShvcHRzLmZpbGUubWV0YSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgKHtyZXN1bHR9ID0gdGhpcy5fcHJlcGFyZVVwbG9hZChoZWxwZXJzLmNsb25lKG9wdHMpLCB1c2VyLnVzZXJJZCwgJ0hUVFAgU3RhcnQgTWV0aG9kJykpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29sbGVjdGlvbi5maW5kT25lKHJlc3VsdC5faWQpKSB7XG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgJ0NhblxcJ3Qgc3RhcnQgdXBsb2FkLCBkYXRhIHN1YnN0aXR1dGlvbiBkZXRlY3RlZCEnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvcHRzLl9pZCAgICAgICA9IG9wdHMuZmlsZUlkO1xuICAgICAgICAgICAgICAgIG9wdHMuY3JlYXRlZEF0ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICBvcHRzLm1heExlbmd0aCA9IG9wdHMuZmlsZUxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmVDb2xsZWN0aW9uLmluc2VydChoZWxwZXJzLm9taXQob3B0cywgJ19fX3MnKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3JlYXRlU3RyZWFtKHJlc3VsdC5faWQsIHJlc3VsdC5wYXRoLCBoZWxwZXJzLm9taXQob3B0cywgJ19fX3MnKSk7XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0cy5yZXR1cm5NZXRhKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmhlYWRlcnNTZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGh0dHBSZXNwLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmZpbmlzaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGh0dHBSZXNwLmVuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgICAgdXBsb2FkUm91dGU6IGAke3RoaXMuZG93bmxvYWRSb3V0ZX0vJHt0aGlzLmNvbGxlY3Rpb25OYW1lfS9fX3VwbG9hZGAsXG4gICAgICAgICAgICAgICAgICAgICAgZmlsZTogcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgaWYgKCFodHRwUmVzcC5oZWFkZXJzU2VudCkge1xuICAgICAgICAgICAgICAgICAgICBodHRwUmVzcC53cml0ZUhlYWQoMjA0KTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKCFodHRwUmVzcC5maW5pc2hlZCkge1xuICAgICAgICAgICAgICAgICAgICBodHRwUmVzcC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGh0dHBSZXNwRXJyKSB7XG4gICAgICAgICAgICAgIGhhbmRsZUVycm9yKGh0dHBSZXNwRXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmRpc2FibGVEb3dubG9hZCkge1xuICAgICAgICBsZXQgaHR0cDtcbiAgICAgICAgbGV0IHBhcmFtcztcbiAgICAgICAgbGV0IHVyaTtcbiAgICAgICAgbGV0IHVyaXM7XG5cbiAgICAgICAgaWYgKCF0aGlzLnB1YmxpYykge1xuICAgICAgICAgIGlmICghIX5odHRwUmVxLl9wYXJzZWRVcmwucGF0aC5pbmRleE9mKGAke3RoaXMuZG93bmxvYWRSb3V0ZX0vJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWApKSB7XG4gICAgICAgICAgICB1cmkgPSBodHRwUmVxLl9wYXJzZWRVcmwucGF0aC5yZXBsYWNlKGAke3RoaXMuZG93bmxvYWRSb3V0ZX0vJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWAsICcnKTtcbiAgICAgICAgICAgIGlmICh1cmkuaW5kZXhPZignLycpID09PSAwKSB7XG4gICAgICAgICAgICAgIHVyaSA9IHVyaS5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHVyaXMgPSB1cmkuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgIGlmICh1cmlzLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgICBwYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgX2lkOiB1cmlzWzBdLFxuICAgICAgICAgICAgICAgIHF1ZXJ5OiBodHRwUmVxLl9wYXJzZWRVcmwucXVlcnkgPyBub2RlUXMucGFyc2UoaHR0cFJlcS5fcGFyc2VkVXJsLnF1ZXJ5KSA6IHt9LFxuICAgICAgICAgICAgICAgIG5hbWU6IHVyaXNbMl0uc3BsaXQoJz8nKVswXSxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiB1cmlzWzFdXG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgaHR0cCA9IHtyZXF1ZXN0OiBodHRwUmVxLCByZXNwb25zZTogaHR0cFJlc3AsIHBhcmFtc307XG4gICAgICAgICAgICAgIGlmICh0aGlzLl9jaGVja0FjY2VzcyhodHRwKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZG93bmxvYWQoaHR0cCwgdXJpc1sxXSwgdGhpcy5jb2xsZWN0aW9uLmZpbmRPbmUodXJpc1swXSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCEhfmh0dHBSZXEuX3BhcnNlZFVybC5wYXRoLmluZGV4T2YoYCR7dGhpcy5kb3dubG9hZFJvdXRlfWApKSB7XG4gICAgICAgICAgICB1cmkgPSBodHRwUmVxLl9wYXJzZWRVcmwucGF0aC5yZXBsYWNlKGAke3RoaXMuZG93bmxvYWRSb3V0ZX1gLCAnJyk7XG4gICAgICAgICAgICBpZiAodXJpLmluZGV4T2YoJy8nKSA9PT0gMCkge1xuICAgICAgICAgICAgICB1cmkgPSB1cmkuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB1cmlzICA9IHVyaS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgbGV0IF9maWxlID0gdXJpc1t1cmlzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgaWYgKF9maWxlKSB7XG4gICAgICAgICAgICAgIGxldCB2ZXJzaW9uO1xuICAgICAgICAgICAgICBpZiAoISF+X2ZpbGUuaW5kZXhPZignLScpKSB7XG4gICAgICAgICAgICAgICAgdmVyc2lvbiA9IF9maWxlLnNwbGl0KCctJylbMF07XG4gICAgICAgICAgICAgICAgX2ZpbGUgICA9IF9maWxlLnNwbGl0KCctJylbMV0uc3BsaXQoJz8nKVswXTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uID0gJ29yaWdpbmFsJztcbiAgICAgICAgICAgICAgICBfZmlsZSAgID0gX2ZpbGUuc3BsaXQoJz8nKVswXTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHBhcmFtcyA9IHtcbiAgICAgICAgICAgICAgICBxdWVyeTogaHR0cFJlcS5fcGFyc2VkVXJsLnF1ZXJ5ID8gbm9kZVFzLnBhcnNlKGh0dHBSZXEuX3BhcnNlZFVybC5xdWVyeSkgOiB7fSxcbiAgICAgICAgICAgICAgICBmaWxlOiBfZmlsZSxcbiAgICAgICAgICAgICAgICBfaWQ6IF9maWxlLnNwbGl0KCcuJylbMF0sXG4gICAgICAgICAgICAgICAgdmVyc2lvbixcbiAgICAgICAgICAgICAgICBuYW1lOiBfZmlsZVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBodHRwID0ge3JlcXVlc3Q6IGh0dHBSZXEsIHJlc3BvbnNlOiBodHRwUmVzcCwgcGFyYW1zfTtcbiAgICAgICAgICAgICAgdGhpcy5kb3dubG9hZChodHRwLCB2ZXJzaW9uLCB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShwYXJhbXMuX2lkKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbmV4dCgpO1xuICAgIH0pO1xuXG4gICAgaWYgKCF0aGlzLmRpc2FibGVVcGxvYWQpIHtcbiAgICAgIGNvbnN0IF9tZXRob2RzID0ge307XG5cbiAgICAgIC8vIE1ldGhvZCB1c2VkIHRvIHJlbW92ZSBmaWxlXG4gICAgICAvLyBmcm9tIENsaWVudCBzaWRlXG4gICAgICBfbWV0aG9kc1t0aGlzLl9tZXRob2ROYW1lcy5fUmVtb3ZlXSA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICBjaGVjayhzZWxlY3RvciwgTWF0Y2guT25lT2YoU3RyaW5nLCBPYmplY3QpKTtcbiAgICAgICAgc2VsZi5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtVbmxpbmsgTWV0aG9kXSBbLnJlbW92ZSgke3NlbGVjdG9yfSldYCk7XG5cbiAgICAgICAgaWYgKHNlbGYuYWxsb3dDbGllbnRDb2RlKSB7XG4gICAgICAgICAgaWYgKHNlbGYub25CZWZvcmVSZW1vdmUgJiYgaGVscGVycy5pc0Z1bmN0aW9uKHNlbGYub25CZWZvcmVSZW1vdmUpKSB7XG4gICAgICAgICAgICBjb25zdCB1c2VySWQgPSB0aGlzLnVzZXJJZDtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJGdW5jcyA9IHtcbiAgICAgICAgICAgICAgdXNlcklkOiB0aGlzLnVzZXJJZCxcbiAgICAgICAgICAgICAgdXNlcigpIHtcbiAgICAgICAgICAgICAgICBpZiAoTWV0ZW9yLnVzZXJzKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodXNlcklkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICghc2VsZi5vbkJlZm9yZVJlbW92ZS5jYWxsKHVzZXJGdW5jcywgKHNlbGYuZmluZChzZWxlY3RvcikgfHwgbnVsbCkpKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCAnW0ZpbGVzQ29sbGVjdGlvbl0gW3JlbW92ZV0gTm90IHBlcm1pdHRlZCEnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBjdXJzb3IgPSBzZWxmLmZpbmQoc2VsZWN0b3IpO1xuICAgICAgICAgIGlmIChjdXJzb3IuY291bnQoKSA+IDApIHtcbiAgICAgICAgICAgIHNlbGYucmVtb3ZlKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwNCwgJ0N1cnNvciBpcyBlbXB0eSwgbm8gZmlsZXMgaXMgcmVtb3ZlZCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAxLCAnW0ZpbGVzQ29sbGVjdGlvbl0gW3JlbW92ZV0gUnVuIGNvZGUgZnJvbSBjbGllbnQgaXMgbm90IGFsbG93ZWQhJyk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cblxuICAgICAgLy8gTWV0aG9kIHVzZWQgdG8gcmVjZWl2ZSBcImZpcnN0IGJ5dGVcIiBvZiB1cGxvYWRcbiAgICAgIC8vIGFuZCBhbGwgZmlsZSdzIG1ldGEtZGF0YSwgc29cbiAgICAgIC8vIGl0IHdvbid0IGJlIHRyYW5zZmVycmVkIHdpdGggZXZlcnkgY2h1bmtcbiAgICAgIC8vIEJhc2ljYWxseSBpdCBwcmVwYXJlcyBldmVyeXRoaW5nXG4gICAgICAvLyBTbyB1c2VyIGNhbiBwYXVzZS9kaXNjb25uZWN0IGFuZFxuICAgICAgLy8gY29udGludWUgdXBsb2FkIGxhdGVyLCBkdXJpbmcgYGNvbnRpbnVlVXBsb2FkVFRMYFxuICAgICAgX21ldGhvZHNbdGhpcy5fbWV0aG9kTmFtZXMuX1N0YXJ0XSA9IGZ1bmN0aW9uIChvcHRzLCByZXR1cm5NZXRhKSB7XG4gICAgICAgIGNoZWNrKG9wdHMsIHtcbiAgICAgICAgICBmaWxlOiBPYmplY3QsXG4gICAgICAgICAgZmlsZUlkOiBTdHJpbmcsXG4gICAgICAgICAgRlNOYW1lOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICAgICAgICAgIGNodW5rU2l6ZTogTnVtYmVyLFxuICAgICAgICAgIGZpbGVMZW5ndGg6IE51bWJlclxuICAgICAgICB9KTtcblxuICAgICAgICBjaGVjayhyZXR1cm5NZXRhLCBNYXRjaC5PcHRpb25hbChCb29sZWFuKSk7XG5cbiAgICAgICAgc2VsZi5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtGaWxlIFN0YXJ0IE1ldGhvZF0gJHtvcHRzLmZpbGUubmFtZX0gLSAke29wdHMuZmlsZUlkfWApO1xuICAgICAgICBvcHRzLl9fX3MgPSB0cnVlO1xuICAgICAgICBjb25zdCB7IHJlc3VsdCB9ID0gc2VsZi5fcHJlcGFyZVVwbG9hZChoZWxwZXJzLmNsb25lKG9wdHMpLCB0aGlzLnVzZXJJZCwgJ0REUCBTdGFydCBNZXRob2QnKTtcblxuICAgICAgICBpZiAoc2VsZi5jb2xsZWN0aW9uLmZpbmRPbmUocmVzdWx0Ll9pZCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgJ0NhblxcJ3Qgc3RhcnQgdXBsb2FkLCBkYXRhIHN1YnN0aXR1dGlvbiBkZXRlY3RlZCEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9wdHMuX2lkICAgICAgID0gb3B0cy5maWxlSWQ7XG4gICAgICAgIG9wdHMuY3JlYXRlZEF0ID0gbmV3IERhdGUoKTtcbiAgICAgICAgb3B0cy5tYXhMZW5ndGggPSBvcHRzLmZpbGVMZW5ndGg7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgc2VsZi5fcHJlQ29sbGVjdGlvbi5pbnNlcnQoaGVscGVycy5vbWl0KG9wdHMsICdfX19zJykpO1xuICAgICAgICAgIHNlbGYuX2NyZWF0ZVN0cmVhbShyZXN1bHQuX2lkLCByZXN1bHQucGF0aCwgaGVscGVycy5vbWl0KG9wdHMsICdfX19zJykpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgc2VsZi5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtGaWxlIFN0YXJ0IE1ldGhvZF0gW0VYQ0VQVElPTjpdICR7b3B0cy5maWxlLm5hbWV9IC0gJHtvcHRzLmZpbGVJZH1gLCBlKTtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgJ0NhblxcJ3Qgc3RhcnQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXR1cm5NZXRhKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHVwbG9hZFJvdXRlOiBgJHtzZWxmLmRvd25sb2FkUm91dGV9LyR7c2VsZi5jb2xsZWN0aW9uTmFtZX0vX191cGxvYWRgLFxuICAgICAgICAgICAgZmlsZTogcmVzdWx0XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH07XG5cblxuICAgICAgLy8gTWV0aG9kIHVzZWQgdG8gd3JpdGUgZmlsZSBjaHVua3NcbiAgICAgIC8vIGl0IHJlY2VpdmVzIHZlcnkgbGltaXRlZCBhbW91bnQgb2YgbWV0YS1kYXRhXG4gICAgICAvLyBUaGlzIG1ldGhvZCBhbHNvIHJlc3BvbnNpYmxlIGZvciBFT0ZcbiAgICAgIF9tZXRob2RzW3RoaXMuX21ldGhvZE5hbWVzLl9Xcml0ZV0gPSBmdW5jdGlvbiAoX29wdHMpIHtcbiAgICAgICAgbGV0IG9wdHMgPSBfb3B0cztcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgY2hlY2sob3B0cywge1xuICAgICAgICAgIGVvZjogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gICAgICAgICAgZmlsZUlkOiBTdHJpbmcsXG4gICAgICAgICAgYmluRGF0YTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgICAgICAgICBjaHVua0lkOiBNYXRjaC5PcHRpb25hbChOdW1iZXIpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChvcHRzLmJpbkRhdGEpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIEJ1ZmZlci5mcm9tID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBvcHRzLmJpbkRhdGEgPSBCdWZmZXIuZnJvbShvcHRzLmJpbkRhdGEsICdiYXNlNjQnKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGJ1ZmZFcnIpIHtcbiAgICAgICAgICAgICAgb3B0cy5iaW5EYXRhID0gbmV3IEJ1ZmZlcihvcHRzLmJpbkRhdGEsICdiYXNlNjQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3B0cy5iaW5EYXRhID0gbmV3IEJ1ZmZlcihvcHRzLmJpbkRhdGEsICdiYXNlNjQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBfY29udGludWVVcGxvYWQgPSBzZWxmLl9jb250aW51ZVVwbG9hZChvcHRzLmZpbGVJZCk7XG4gICAgICAgIGlmICghX2NvbnRpbnVlVXBsb2FkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDgsICdDYW5cXCd0IGNvbnRpbnVlIHVwbG9hZCwgc2Vzc2lvbiBleHBpcmVkLiBTdGFydCB1cGxvYWQgYWdhaW4uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnVuYmxvY2soKTtcbiAgICAgICAgKHtyZXN1bHQsIG9wdHN9ID0gc2VsZi5fcHJlcGFyZVVwbG9hZChPYmplY3QuYXNzaWduKG9wdHMsIF9jb250aW51ZVVwbG9hZCksIHRoaXMudXNlcklkLCAnRERQJykpO1xuXG4gICAgICAgIGlmIChvcHRzLmVvZikge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZi5faGFuZGxlVXBsb2FkU3luYyhyZXN1bHQsIG9wdHMpO1xuICAgICAgICAgIH0gY2F0Y2ggKGhhbmRsZVVwbG9hZEVycikge1xuICAgICAgICAgICAgc2VsZi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtXcml0ZSBNZXRob2RdIFtERFBdIEV4Y2VwdGlvbjonLCBoYW5kbGVVcGxvYWRFcnIpO1xuICAgICAgICAgICAgdGhyb3cgaGFuZGxlVXBsb2FkRXJyO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLmVtaXQoJ19oYW5kbGVVcGxvYWQnLCByZXN1bHQsIG9wdHMsIE5PT1ApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcblxuICAgICAgLy8gTWV0aG9kIHVzZWQgdG8gQWJvcnQgdXBsb2FkXG4gICAgICAvLyAtIEZlZWluZyBtZW1vcnkgYnkgLmVuZCgpaW5nIHdyaXRhYmxlU3RyZWFtc1xuICAgICAgLy8gLSBSZW1vdmluZyB0ZW1wb3JhcnkgcmVjb3JkIGZyb20gQF9wcmVDb2xsZWN0aW9uXG4gICAgICAvLyAtIFJlbW92aW5nIHJlY29yZCBmcm9tIEBjb2xsZWN0aW9uXG4gICAgICAvLyAtIC51bmxpbmsoKWluZyBjaHVua3MgZnJvbSBGU1xuICAgICAgX21ldGhvZHNbdGhpcy5fbWV0aG9kTmFtZXMuX0Fib3J0XSA9IGZ1bmN0aW9uIChfaWQpIHtcbiAgICAgICAgY2hlY2soX2lkLCBTdHJpbmcpO1xuXG4gICAgICAgIGNvbnN0IF9jb250aW51ZVVwbG9hZCA9IHNlbGYuX2NvbnRpbnVlVXBsb2FkKF9pZCk7XG4gICAgICAgIHNlbGYuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbQWJvcnQgTWV0aG9kXTogJHtfaWR9IC0gJHsoaGVscGVycy5pc09iamVjdChfY29udGludWVVcGxvYWQuZmlsZSkgPyBfY29udGludWVVcGxvYWQuZmlsZS5wYXRoIDogJycpfWApO1xuXG4gICAgICAgIGlmIChzZWxmLl9jdXJyZW50VXBsb2FkcyAmJiBzZWxmLl9jdXJyZW50VXBsb2Fkc1tfaWRdKSB7XG4gICAgICAgICAgc2VsZi5fY3VycmVudFVwbG9hZHNbX2lkXS5zdG9wKCk7XG4gICAgICAgICAgc2VsZi5fY3VycmVudFVwbG9hZHNbX2lkXS5hYm9ydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF9jb250aW51ZVVwbG9hZCkge1xuICAgICAgICAgIHNlbGYuX3ByZUNvbGxlY3Rpb24ucmVtb3ZlKHtfaWR9KTtcbiAgICAgICAgICBzZWxmLnJlbW92ZSh7X2lkfSk7XG4gICAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3QoX2NvbnRpbnVlVXBsb2FkLmZpbGUpICYmIF9jb250aW51ZVVwbG9hZC5maWxlLnBhdGgpIHtcbiAgICAgICAgICAgIHNlbGYudW5saW5rKHtfaWQsIHBhdGg6IF9jb250aW51ZVVwbG9hZC5maWxlLnBhdGh9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9O1xuXG4gICAgICBNZXRlb3IubWV0aG9kcyhfbWV0aG9kcyk7XG4gICAgfVxuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIF9wcmVwYXJlVXBsb2FkXG4gICAqIEBzdW1tYXJ5IEludGVybmFsIG1ldGhvZC4gVXNlZCB0byBvcHRpbWl6ZSByZWNlaXZlZCBkYXRhIGFuZCBjaGVjayB1cGxvYWQgcGVybWlzc2lvblxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgX3ByZXBhcmVVcGxvYWQob3B0cyA9IHt9LCB1c2VySWQsIHRyYW5zcG9ydCkge1xuICAgIGxldCBjdHg7XG4gICAgaWYgKCFoZWxwZXJzLmlzQm9vbGVhbihvcHRzLmVvZikpIHtcbiAgICAgIG9wdHMuZW9mID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFvcHRzLmJpbkRhdGEpIHtcbiAgICAgIG9wdHMuYmluRGF0YSA9ICdFT0YnO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc051bWJlcihvcHRzLmNodW5rSWQpKSB7XG4gICAgICBvcHRzLmNodW5rSWQgPSAtMTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNTdHJpbmcob3B0cy5GU05hbWUpKSB7XG4gICAgICBvcHRzLkZTTmFtZSA9IG9wdHMuZmlsZUlkO1xuICAgIH1cblxuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbVXBsb2FkXSBbJHt0cmFuc3BvcnR9XSBHb3QgIyR7b3B0cy5jaHVua0lkfS8ke29wdHMuZmlsZUxlbmd0aH0gY2h1bmtzLCBkc3Q6ICR7b3B0cy5maWxlLm5hbWUgfHwgb3B0cy5maWxlLmZpbGVOYW1lfWApO1xuXG4gICAgY29uc3QgZmlsZU5hbWUgPSB0aGlzLl9nZXRGaWxlTmFtZShvcHRzLmZpbGUpO1xuICAgIGNvbnN0IHtleHRlbnNpb24sIGV4dGVuc2lvbldpdGhEb3R9ID0gdGhpcy5fZ2V0RXh0KGZpbGVOYW1lKTtcblxuICAgIGlmICghaGVscGVycy5pc09iamVjdChvcHRzLmZpbGUubWV0YSkpIHtcbiAgICAgIG9wdHMuZmlsZS5tZXRhID0ge307XG4gICAgfVxuXG4gICAgbGV0IHJlc3VsdCAgICAgICA9IG9wdHMuZmlsZTtcbiAgICByZXN1bHQubmFtZSAgICAgID0gZmlsZU5hbWU7XG4gICAgcmVzdWx0Lm1ldGEgICAgICA9IG9wdHMuZmlsZS5tZXRhO1xuICAgIHJlc3VsdC5leHRlbnNpb24gPSBleHRlbnNpb247XG4gICAgcmVzdWx0LmV4dCAgICAgICA9IGV4dGVuc2lvbjtcbiAgICByZXN1bHQuX2lkICAgICAgID0gb3B0cy5maWxlSWQ7XG4gICAgcmVzdWx0LnVzZXJJZCAgICA9IHVzZXJJZCB8fCBudWxsO1xuICAgIG9wdHMuRlNOYW1lICAgICAgPSBvcHRzLkZTTmFtZS5yZXBsYWNlKC8oW15hLXowLTlcXC1cXF9dKykvZ2ksICctJyk7XG4gICAgcmVzdWx0LnBhdGggICAgICA9IGAke3RoaXMuc3RvcmFnZVBhdGgocmVzdWx0KX0ke25vZGVQYXRoLnNlcH0ke29wdHMuRlNOYW1lfSR7ZXh0ZW5zaW9uV2l0aERvdH1gO1xuICAgIHJlc3VsdCAgICAgICAgICAgPSBPYmplY3QuYXNzaWduKHJlc3VsdCwgdGhpcy5fZGF0YVRvU2NoZW1hKHJlc3VsdCkpO1xuXG4gICAgaWYgKHRoaXMub25CZWZvcmVVcGxvYWQgJiYgaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMub25CZWZvcmVVcGxvYWQpKSB7XG4gICAgICBjdHggPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgZmlsZTogb3B0cy5maWxlXG4gICAgICB9LCB7XG4gICAgICAgIGNodW5rSWQ6IG9wdHMuY2h1bmtJZCxcbiAgICAgICAgdXNlcklkOiByZXN1bHQudXNlcklkLFxuICAgICAgICB1c2VyKCkge1xuICAgICAgICAgIGlmIChNZXRlb3IudXNlcnMgJiYgcmVzdWx0LnVzZXJJZCkge1xuICAgICAgICAgICAgcmV0dXJuIE1ldGVvci51c2Vycy5maW5kT25lKHJlc3VsdC51c2VySWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgZW9mOiBvcHRzLmVvZlxuICAgICAgfSk7XG4gICAgICBjb25zdCBpc1VwbG9hZEFsbG93ZWQgPSB0aGlzLm9uQmVmb3JlVXBsb2FkLmNhbGwoY3R4LCByZXN1bHQpO1xuXG4gICAgICBpZiAoaXNVcGxvYWRBbGxvd2VkICE9PSB0cnVlKSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBoZWxwZXJzLmlzU3RyaW5nKGlzVXBsb2FkQWxsb3dlZCkgPyBpc1VwbG9hZEFsbG93ZWQgOiAnQG9uQmVmb3JlVXBsb2FkKCkgcmV0dXJuZWQgZmFsc2UnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICgob3B0cy5fX19zID09PSB0cnVlKSAmJiB0aGlzLm9uSW5pdGlhdGVVcGxvYWQgJiYgaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMub25Jbml0aWF0ZVVwbG9hZCkpIHtcbiAgICAgICAgICB0aGlzLm9uSW5pdGlhdGVVcGxvYWQuY2FsbChjdHgsIHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKChvcHRzLl9fX3MgPT09IHRydWUpICYmIHRoaXMub25Jbml0aWF0ZVVwbG9hZCAmJiBoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5vbkluaXRpYXRlVXBsb2FkKSkge1xuICAgICAgY3R4ID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIGZpbGU6IG9wdHMuZmlsZVxuICAgICAgfSwge1xuICAgICAgICBjaHVua0lkOiBvcHRzLmNodW5rSWQsXG4gICAgICAgIHVzZXJJZDogcmVzdWx0LnVzZXJJZCxcbiAgICAgICAgdXNlcigpIHtcbiAgICAgICAgICBpZiAoTWV0ZW9yLnVzZXJzICYmIHJlc3VsdC51c2VySWQpIHtcbiAgICAgICAgICAgIHJldHVybiBNZXRlb3IudXNlcnMuZmluZE9uZShyZXN1bHQudXNlcklkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIGVvZjogb3B0cy5lb2ZcbiAgICAgIH0pO1xuICAgICAgdGhpcy5vbkluaXRpYXRlVXBsb2FkLmNhbGwoY3R4LCByZXN1bHQpO1xuICAgIH1cblxuICAgIHJldHVybiB7cmVzdWx0LCBvcHRzfTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBfZmluaXNoVXBsb2FkXG4gICAqIEBzdW1tYXJ5IEludGVybmFsIG1ldGhvZC4gRmluaXNoIHVwbG9hZCwgY2xvc2UgV3JpdGFibGUgc3RyZWFtLCBhZGQgcmVjb3JkIHRvIE1vbmdvREIgYW5kIGZsdXNoIHVzZWQgbWVtb3J5XG4gICAqIEByZXR1cm5zIHt1bmRlZmluZWR9XG4gICAqL1xuICBfZmluaXNoVXBsb2FkKHJlc3VsdCwgb3B0cywgY2IpIHtcbiAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW1VwbG9hZF0gW2ZpbmlzaChpbmcpVXBsb2FkXSAtPiAke3Jlc3VsdC5wYXRofWApO1xuICAgIGZzLmNobW9kKHJlc3VsdC5wYXRoLCB0aGlzLnBlcm1pc3Npb25zLCBOT09QKTtcbiAgICByZXN1bHQudHlwZSAgID0gdGhpcy5fZ2V0TWltZVR5cGUob3B0cy5maWxlKTtcbiAgICByZXN1bHQucHVibGljID0gdGhpcy5wdWJsaWM7XG4gICAgdGhpcy5fdXBkYXRlRmlsZVR5cGVzKHJlc3VsdCk7XG5cbiAgICB0aGlzLmNvbGxlY3Rpb24uaW5zZXJ0KGhlbHBlcnMuY2xvbmUocmVzdWx0KSwgKGNvbEluc2VydCwgX2lkKSA9PiB7XG4gICAgICBpZiAoY29sSW5zZXJ0KSB7XG4gICAgICAgIGNiICYmIGNiKGNvbEluc2VydCk7XG4gICAgICAgIHRoaXMuX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbVXBsb2FkXSBbX2ZpbmlzaFVwbG9hZF0gW2luc2VydF0gRXJyb3I6JywgY29sSW5zZXJ0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3ByZUNvbGxlY3Rpb24udXBkYXRlKHtfaWQ6IG9wdHMuZmlsZUlkfSwgeyRzZXQ6IHtpc0ZpbmlzaGVkOiB0cnVlfX0sIChwcmVVcGRhdGVFcnJvcikgPT4ge1xuICAgICAgICAgIGlmIChwcmVVcGRhdGVFcnJvcikge1xuICAgICAgICAgICAgY2IgJiYgY2IocHJlVXBkYXRlRXJyb3IpO1xuICAgICAgICAgICAgdGhpcy5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtVcGxvYWRdIFtfZmluaXNoVXBsb2FkXSBbdXBkYXRlXSBFcnJvcjonLCBwcmVVcGRhdGVFcnJvcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5faWQgPSBfaWQ7XG4gICAgICAgICAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW1VwbG9hZF0gW2ZpbmlzaChlZClVcGxvYWRdIC0+ICR7cmVzdWx0LnBhdGh9YCk7XG4gICAgICAgICAgICB0aGlzLm9uQWZ0ZXJVcGxvYWQgJiYgdGhpcy5vbkFmdGVyVXBsb2FkLmNhbGwodGhpcywgcmVzdWx0KTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYWZ0ZXJVcGxvYWQnLCByZXN1bHQpO1xuICAgICAgICAgICAgY2IgJiYgY2IobnVsbCwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIF9oYW5kbGVVcGxvYWRcbiAgICogQHN1bW1hcnkgSW50ZXJuYWwgbWV0aG9kIHRvIGhhbmRsZSB1cGxvYWQgcHJvY2VzcywgcGlwZSBpbmNvbWluZyBkYXRhIHRvIFdyaXRhYmxlIHN0cmVhbVxuICAgKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxuICAgKi9cbiAgX2hhbmRsZVVwbG9hZChyZXN1bHQsIG9wdHMsIGNiKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChvcHRzLmVvZikge1xuICAgICAgICB0aGlzLl9jdXJyZW50VXBsb2Fkc1tyZXN1bHQuX2lkXS5lbmQoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZW1pdCgnX2ZpbmlzaFVwbG9hZCcsIHJlc3VsdCwgb3B0cywgY2IpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRVcGxvYWRzW3Jlc3VsdC5faWRdLndyaXRlKG9wdHMuY2h1bmtJZCwgb3B0cy5iaW5EYXRhLCBjYik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5fZGVidWcoJ1tfaGFuZGxlVXBsb2FkXSBbRVhDRVBUSU9OOl0nLCBlKTtcbiAgICAgIGNiICYmIGNiKGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIF9nZXRNaW1lVHlwZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZmlsZURhdGEgLSBGaWxlIE9iamVjdFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGZpbGUncyBtaW1lLXR5cGVcbiAgICogQHJldHVybnMge1N0cmluZ31cbiAgICovXG4gIF9nZXRNaW1lVHlwZShmaWxlRGF0YSkge1xuICAgIGxldCBtaW1lO1xuICAgIGNoZWNrKGZpbGVEYXRhLCBPYmplY3QpO1xuICAgIGlmIChoZWxwZXJzLmlzT2JqZWN0KGZpbGVEYXRhKSAmJiBmaWxlRGF0YS50eXBlKSB7XG4gICAgICBtaW1lID0gZmlsZURhdGEudHlwZTtcbiAgICB9XG5cbiAgICBpZiAoZmlsZURhdGEucGF0aCAmJiAoIW1pbWUgfHwgIWhlbHBlcnMuaXNTdHJpbmcobWltZSkpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgYnVmICAgPSBuZXcgQnVmZmVyKDI2Mik7XG4gICAgICAgIGNvbnN0IGZkICA9IGZzLm9wZW5TeW5jKGZpbGVEYXRhLnBhdGgsICdyJyk7XG4gICAgICAgIGNvbnN0IGJyICA9IGZzLnJlYWRTeW5jKGZkLCBidWYsIDAsIDI2MiwgMCk7XG4gICAgICAgIGZzLmNsb3NlKGZkLCBOT09QKTtcbiAgICAgICAgaWYgKGJyIDwgMjYyKSB7XG4gICAgICAgICAgYnVmID0gYnVmLnNsaWNlKDAsIGJyKTtcbiAgICAgICAgfVxuICAgICAgICAoe21pbWV9ID0gZmlsZVR5cGUoYnVmKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIFdlJ3JlIGdvb2RcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIW1pbWUgfHwgIWhlbHBlcnMuaXNTdHJpbmcobWltZSkpIHtcbiAgICAgIG1pbWUgPSAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJztcbiAgICB9XG4gICAgcmV0dXJuIG1pbWU7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBfZ2V0VXNlclxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIG9iamVjdCB3aXRoIGB1c2VySWRgIGFuZCBgdXNlcigpYCBtZXRob2Qgd2hpY2ggcmV0dXJuIHVzZXIncyBvYmplY3RcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIF9nZXRVc2VyKGh0dHApIHtcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICB1c2VyKCkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgIHVzZXJJZDogbnVsbFxuICAgIH07XG5cbiAgICBpZiAoaHR0cCkge1xuICAgICAgbGV0IG10b2sgPSBudWxsO1xuICAgICAgaWYgKGh0dHAucmVxdWVzdC5oZWFkZXJzWyd4LW10b2snXSkge1xuICAgICAgICBtdG9rID0gaHR0cC5yZXF1ZXN0LmhlYWRlcnNbJ3gtbXRvayddO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY29va2llID0gaHR0cC5yZXF1ZXN0LkNvb2tpZXM7XG4gICAgICAgIGlmIChjb29raWUuaGFzKCd4X210b2snKSkge1xuICAgICAgICAgIG10b2sgPSBjb29raWUuZ2V0KCd4X210b2snKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobXRvaykge1xuICAgICAgICBjb25zdCB1c2VySWQgPSAoaGVscGVycy5pc09iamVjdChNZXRlb3Iuc2VydmVyLnNlc3Npb25zKSAmJiBoZWxwZXJzLmlzT2JqZWN0KE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnNbbXRva10pKSA/IE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnNbbXRva10udXNlcklkIDogdm9pZCAwO1xuXG4gICAgICAgIGlmICh1c2VySWQpIHtcbiAgICAgICAgICByZXN1bHQudXNlciAgID0gKCkgPT4gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodXNlcklkKTtcbiAgICAgICAgICByZXN1bHQudXNlcklkID0gdXNlcklkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSB3cml0ZVxuICAgKiBAcGFyYW0ge0J1ZmZlcn0gYnVmZmVyIC0gQmluYXJ5IEZpbGUncyBCdWZmZXJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBPYmplY3Qgd2l0aCBmaWxlLWRhdGFcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMubmFtZSAtIEZpbGUgbmFtZSwgYWxpYXM6IGBmaWxlTmFtZWBcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMudHlwZSAtIEZpbGUgbWltZS10eXBlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzLm1ldGEgLSBGaWxlIGFkZGl0aW9uYWwgbWV0YS1kYXRhXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnVzZXJJZCAtIFVzZXJJZCwgZGVmYXVsdCAqbnVsbCpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuZmlsZUlkIC0gX2lkLCBkZWZhdWx0ICpudWxsKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIGZ1bmN0aW9uKGVycm9yLCBmaWxlT2JqKXsuLi59XG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gcHJvY2VlZEFmdGVyVXBsb2FkIC0gUHJvY2VlZCBvbkFmdGVyVXBsb2FkIGhvb2tcbiAgICogQHN1bW1hcnkgV3JpdGUgYnVmZmVyIHRvIEZTIGFuZCBhZGQgdG8gRmlsZXNDb2xsZWN0aW9uIENvbGxlY3Rpb25cbiAgICogQHJldHVybnMge0ZpbGVzQ29sbGVjdGlvbn0gSW5zdGFuY2VcbiAgICovXG4gIHdyaXRlKGJ1ZmZlciwgX29wdHMgPSB7fSwgX2NhbGxiYWNrLCBfcHJvY2VlZEFmdGVyVXBsb2FkKSB7XG4gICAgdGhpcy5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFt3cml0ZSgpXScpO1xuICAgIGxldCBvcHRzID0gX29wdHM7XG4gICAgbGV0IGNhbGxiYWNrID0gX2NhbGxiYWNrO1xuICAgIGxldCBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBfcHJvY2VlZEFmdGVyVXBsb2FkO1xuXG4gICAgaWYgKGhlbHBlcnMuaXNGdW5jdGlvbihvcHRzKSkge1xuICAgICAgcHJvY2VlZEFmdGVyVXBsb2FkID0gY2FsbGJhY2s7XG4gICAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgICBvcHRzICAgICA9IHt9O1xuICAgIH0gZWxzZSBpZiAoaGVscGVycy5pc0Jvb2xlYW4oY2FsbGJhY2spKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBjYWxsYmFjaztcbiAgICB9IGVsc2UgaWYgKGhlbHBlcnMuaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBvcHRzO1xuICAgIH1cblxuICAgIGNoZWNrKG9wdHMsIE1hdGNoLk9wdGlvbmFsKE9iamVjdCkpO1xuICAgIGNoZWNrKGNhbGxiYWNrLCBNYXRjaC5PcHRpb25hbChGdW5jdGlvbikpO1xuICAgIGNoZWNrKHByb2NlZWRBZnRlclVwbG9hZCwgTWF0Y2guT3B0aW9uYWwoQm9vbGVhbikpO1xuXG4gICAgY29uc3QgZmlsZUlkICAgPSBvcHRzLmZpbGVJZCB8fCBSYW5kb20uaWQoKTtcbiAgICBjb25zdCBGU05hbWUgICA9IHRoaXMubmFtaW5nRnVuY3Rpb24gPyB0aGlzLm5hbWluZ0Z1bmN0aW9uKG9wdHMpIDogZmlsZUlkO1xuICAgIGNvbnN0IGZpbGVOYW1lID0gKG9wdHMubmFtZSB8fCBvcHRzLmZpbGVOYW1lKSA/IChvcHRzLm5hbWUgfHwgb3B0cy5maWxlTmFtZSkgOiBGU05hbWU7XG5cbiAgICBjb25zdCB7ZXh0ZW5zaW9uLCBleHRlbnNpb25XaXRoRG90fSA9IHRoaXMuX2dldEV4dChmaWxlTmFtZSk7XG5cbiAgICBvcHRzLnBhdGggPSBgJHt0aGlzLnN0b3JhZ2VQYXRoKG9wdHMpfSR7bm9kZVBhdGguc2VwfSR7RlNOYW1lfSR7ZXh0ZW5zaW9uV2l0aERvdH1gO1xuICAgIG9wdHMudHlwZSA9IHRoaXMuX2dldE1pbWVUeXBlKG9wdHMpO1xuICAgIGlmICghaGVscGVycy5pc09iamVjdChvcHRzLm1ldGEpKSB7XG4gICAgICBvcHRzLm1ldGEgPSB7fTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNOdW1iZXIob3B0cy5zaXplKSkge1xuICAgICAgb3B0cy5zaXplID0gYnVmZmVyLmxlbmd0aDtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9kYXRhVG9TY2hlbWEoe1xuICAgICAgbmFtZTogZmlsZU5hbWUsXG4gICAgICBwYXRoOiBvcHRzLnBhdGgsXG4gICAgICBtZXRhOiBvcHRzLm1ldGEsXG4gICAgICB0eXBlOiBvcHRzLnR5cGUsXG4gICAgICBzaXplOiBvcHRzLnNpemUsXG4gICAgICB1c2VySWQ6IG9wdHMudXNlcklkLFxuICAgICAgZXh0ZW5zaW9uXG4gICAgfSk7XG5cbiAgICByZXN1bHQuX2lkID0gZmlsZUlkO1xuXG4gICAgY29uc3Qgc3RyZWFtID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0ob3B0cy5wYXRoLCB7ZmxhZ3M6ICd3JywgbW9kZTogdGhpcy5wZXJtaXNzaW9uc30pO1xuICAgIHN0cmVhbS5lbmQoYnVmZmVyLCAoc3RyZWFtRXJyKSA9PiBib3VuZCgoKSA9PiB7XG4gICAgICBpZiAoc3RyZWFtRXJyKSB7XG4gICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHN0cmVhbUVycik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb24uaW5zZXJ0KHJlc3VsdCwgKGluc2VydEVyciwgX2lkKSA9PiB7XG4gICAgICAgICAgaWYgKGluc2VydEVycikge1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soaW5zZXJ0RXJyKTtcbiAgICAgICAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbd3JpdGVdIFtpbnNlcnRdIEVycm9yOiAke2ZpbGVOYW1lfSAtPiAke3RoaXMuY29sbGVjdGlvbk5hbWV9YCwgaW5zZXJ0RXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZmlsZVJlZiA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKF9pZCk7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhudWxsLCBmaWxlUmVmKTtcbiAgICAgICAgICAgIGlmIChwcm9jZWVkQWZ0ZXJVcGxvYWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkFmdGVyVXBsb2FkICYmIHRoaXMub25BZnRlclVwbG9hZC5jYWxsKHRoaXMsIGZpbGVSZWYpO1xuICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2FmdGVyVXBsb2FkJywgZmlsZVJlZik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW3dyaXRlXTogJHtmaWxlTmFtZX0gLT4gJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIGxvYWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHVybCAtIFVSTCB0byBmaWxlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gT2JqZWN0IHdpdGggZmlsZS1kYXRhXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzLmhlYWRlcnMgLSBIVFRQIGhlYWRlcnMgdG8gdXNlIHdoZW4gcmVxdWVzdGluZyB0aGUgZmlsZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5uYW1lIC0gRmlsZSBuYW1lLCBhbGlhczogYGZpbGVOYW1lYFxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy50eXBlIC0gRmlsZSBtaW1lLXR5cGVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMubWV0YSAtIEZpbGUgYWRkaXRpb25hbCBtZXRhLWRhdGFcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMudXNlcklkIC0gVXNlcklkLCBkZWZhdWx0ICpudWxsKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5maWxlSWQgLSBfaWQsIGRlZmF1bHQgKm51bGwqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gZnVuY3Rpb24oZXJyb3IsIGZpbGVPYmopey4uLn1cbiAgICogQHBhcmFtIHtCb29sZWFufSBwcm9jZWVkQWZ0ZXJVcGxvYWQgLSBQcm9jZWVkIG9uQWZ0ZXJVcGxvYWQgaG9va1xuICAgKiBAc3VtbWFyeSBEb3dubG9hZCBmaWxlLCB3cml0ZSBzdHJlYW0gdG8gRlMgYW5kIGFkZCB0byBGaWxlc0NvbGxlY3Rpb24gQ29sbGVjdGlvblxuICAgKiBAcmV0dXJucyB7RmlsZXNDb2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgbG9hZCh1cmwsIF9vcHRzID0ge30sIF9jYWxsYmFjaywgX3Byb2NlZWRBZnRlclVwbG9hZCkge1xuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbbG9hZCgke3VybH0sICR7SlNPTi5zdHJpbmdpZnkoX29wdHMpfSwgY2FsbGJhY2spXWApO1xuICAgIGxldCBvcHRzID0gX29wdHM7XG4gICAgbGV0IGNhbGxiYWNrID0gX2NhbGxiYWNrO1xuICAgIGxldCBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBfcHJvY2VlZEFmdGVyVXBsb2FkO1xuXG4gICAgaWYgKGhlbHBlcnMuaXNGdW5jdGlvbihvcHRzKSkge1xuICAgICAgcHJvY2VlZEFmdGVyVXBsb2FkID0gY2FsbGJhY2s7XG4gICAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgICBvcHRzICAgICA9IHt9O1xuICAgIH0gZWxzZSBpZiAoaGVscGVycy5pc0Jvb2xlYW4oY2FsbGJhY2spKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBjYWxsYmFjaztcbiAgICB9IGVsc2UgaWYgKGhlbHBlcnMuaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBvcHRzO1xuICAgIH1cblxuICAgIGNoZWNrKHVybCwgU3RyaW5nKTtcbiAgICBjaGVjayhvcHRzLCBNYXRjaC5PcHRpb25hbChPYmplY3QpKTtcbiAgICBjaGVjayhjYWxsYmFjaywgTWF0Y2guT3B0aW9uYWwoRnVuY3Rpb24pKTtcbiAgICBjaGVjayhwcm9jZWVkQWZ0ZXJVcGxvYWQsIE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pKTtcblxuICAgIGlmICghaGVscGVycy5pc09iamVjdChvcHRzKSkge1xuICAgICAgb3B0cyA9IHt9O1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGVJZCAgICA9IG9wdHMuZmlsZUlkIHx8IFJhbmRvbS5pZCgpO1xuICAgIGNvbnN0IEZTTmFtZSAgICA9IHRoaXMubmFtaW5nRnVuY3Rpb24gPyB0aGlzLm5hbWluZ0Z1bmN0aW9uKG9wdHMpIDogZmlsZUlkO1xuICAgIGNvbnN0IHBhdGhQYXJ0cyA9IHVybC5zcGxpdCgnLycpO1xuICAgIGNvbnN0IGZpbGVOYW1lICA9IChvcHRzLm5hbWUgfHwgb3B0cy5maWxlTmFtZSkgPyAob3B0cy5uYW1lIHx8IG9wdHMuZmlsZU5hbWUpIDogcGF0aFBhcnRzW3BhdGhQYXJ0cy5sZW5ndGggLSAxXSB8fCBGU05hbWU7XG5cbiAgICBjb25zdCB7ZXh0ZW5zaW9uLCBleHRlbnNpb25XaXRoRG90fSA9IHRoaXMuX2dldEV4dChmaWxlTmFtZSk7XG4gICAgb3B0cy5wYXRoICA9IGAke3RoaXMuc3RvcmFnZVBhdGgob3B0cyl9JHtub2RlUGF0aC5zZXB9JHtGU05hbWV9JHtleHRlbnNpb25XaXRoRG90fWA7XG5cbiAgICBjb25zdCBzdG9yZVJlc3VsdCA9IChyZXN1bHQsIGNiKSA9PiB7XG4gICAgICByZXN1bHQuX2lkID0gZmlsZUlkO1xuXG4gICAgICB0aGlzLmNvbGxlY3Rpb24uaW5zZXJ0KHJlc3VsdCwgKGVycm9yLCBfaWQpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgY2IgJiYgY2IoZXJyb3IpO1xuICAgICAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbbG9hZF0gW2luc2VydF0gRXJyb3I6ICR7ZmlsZU5hbWV9IC0+ICR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gLCBlcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgZmlsZVJlZiA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKF9pZCk7XG4gICAgICAgICAgY2IgJiYgY2IobnVsbCwgZmlsZVJlZik7XG4gICAgICAgICAgaWYgKHByb2NlZWRBZnRlclVwbG9hZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgdGhpcy5vbkFmdGVyVXBsb2FkICYmIHRoaXMub25BZnRlclVwbG9hZC5jYWxsKHRoaXMsIGZpbGVSZWYpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdhZnRlclVwbG9hZCcsIGZpbGVSZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW2xvYWRdIFtpbnNlcnRdICR7ZmlsZU5hbWV9IC0+ICR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJlcXVlc3QuZ2V0KHtcbiAgICAgIHVybCxcbiAgICAgIGhlYWRlcnM6IG9wdHMuaGVhZGVycyB8fCB7fVxuICAgIH0pLm9uKCdlcnJvcicsIChlcnJvcikgPT4gYm91bmQoKCkgPT4ge1xuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyb3IpO1xuICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtsb2FkXSBbcmVxdWVzdC5nZXQoJHt1cmx9KV0gRXJyb3I6YCwgZXJyb3IpO1xuICAgIH0pKS5vbigncmVzcG9uc2UnLCAocmVzcG9uc2UpID0+IGJvdW5kKCgpID0+IHtcbiAgICAgIHJlc3BvbnNlLm9uKCdlbmQnLCAoKSA9PiBib3VuZCgoKSA9PiB7XG4gICAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbbG9hZF0gUmVjZWl2ZWQ6ICR7dXJsfWApO1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9kYXRhVG9TY2hlbWEoe1xuICAgICAgICAgIG5hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgIHBhdGg6IG9wdHMucGF0aCxcbiAgICAgICAgICBtZXRhOiBvcHRzLm1ldGEsXG4gICAgICAgICAgdHlwZTogb3B0cy50eXBlIHx8IHJlc3BvbnNlLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddIHx8IHRoaXMuX2dldE1pbWVUeXBlKHtwYXRoOiBvcHRzLnBhdGh9KSxcbiAgICAgICAgICBzaXplOiBvcHRzLnNpemUgfHwgcGFyc2VJbnQocmVzcG9uc2UuaGVhZGVyc1snY29udGVudC1sZW5ndGgnXSB8fCAwKSxcbiAgICAgICAgICB1c2VySWQ6IG9wdHMudXNlcklkLFxuICAgICAgICAgIGV4dGVuc2lvblxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIXJlc3VsdC5zaXplKSB7XG4gICAgICAgICAgZnMuc3RhdChvcHRzLnBhdGgsIChlcnJvciwgc3RhdHMpID0+IGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXN1bHQudmVyc2lvbnMub3JpZ2luYWwuc2l6ZSA9IChyZXN1bHQuc2l6ZSA9IHN0YXRzLnNpemUpO1xuICAgICAgICAgICAgICBzdG9yZVJlc3VsdChyZXN1bHQsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RvcmVSZXN1bHQocmVzdWx0LCBjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9KSkucGlwZShmcy5jcmVhdGVXcml0ZVN0cmVhbShvcHRzLnBhdGgsIHtmbGFnczogJ3cnLCBtb2RlOiB0aGlzLnBlcm1pc3Npb25zfSkpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgYWRkRmlsZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCAgICAgICAgICAtIFBhdGggdG8gZmlsZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cyAgICAgICAgICAtIFtPcHRpb25hbF0gT2JqZWN0IHdpdGggZmlsZS1kYXRhXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnR5cGUgICAgIC0gW09wdGlvbmFsXSBGaWxlIG1pbWUtdHlwZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cy5tZXRhICAgICAtIFtPcHRpb25hbF0gRmlsZSBhZGRpdGlvbmFsIG1ldGEtZGF0YVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5maWxlSWQgICAtIF9pZCwgZGVmYXVsdCAqbnVsbCpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMuZmlsZU5hbWUgLSBbT3B0aW9uYWxdIEZpbGUgbmFtZSwgaWYgbm90IHNwZWNpZmllZCBmaWxlIG5hbWUgYW5kIGV4dGVuc2lvbiB3aWxsIGJlIHRha2VuIGZyb20gcGF0aFxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy51c2VySWQgICAtIFtPcHRpb25hbF0gVXNlcklkLCBkZWZhdWx0ICpudWxsKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAgICAtIFtPcHRpb25hbF0gZnVuY3Rpb24oZXJyb3IsIGZpbGVPYmopey4uLn1cbiAgICogQHBhcmFtIHtCb29sZWFufSBwcm9jZWVkQWZ0ZXJVcGxvYWQgLSBQcm9jZWVkIG9uQWZ0ZXJVcGxvYWQgaG9va1xuICAgKiBAc3VtbWFyeSBBZGQgZmlsZSBmcm9tIEZTIHRvIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAcmV0dXJucyB7RmlsZXNDb2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgYWRkRmlsZShwYXRoLCBfb3B0cyA9IHt9LCBfY2FsbGJhY2ssIF9wcm9jZWVkQWZ0ZXJVcGxvYWQpIHtcbiAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW2FkZEZpbGUoJHtwYXRofSldYCk7XG4gICAgbGV0IG9wdHMgPSBfb3B0cztcbiAgICBsZXQgY2FsbGJhY2sgPSBfY2FsbGJhY2s7XG4gICAgbGV0IHByb2NlZWRBZnRlclVwbG9hZCA9IF9wcm9jZWVkQWZ0ZXJVcGxvYWQ7XG5cbiAgICBpZiAoaGVscGVycy5pc0Z1bmN0aW9uKG9wdHMpKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBjYWxsYmFjaztcbiAgICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICAgIG9wdHMgICAgID0ge307XG4gICAgfSBlbHNlIGlmIChoZWxwZXJzLmlzQm9vbGVhbihjYWxsYmFjaykpIHtcbiAgICAgIHByb2NlZWRBZnRlclVwbG9hZCA9IGNhbGxiYWNrO1xuICAgIH0gZWxzZSBpZiAoaGVscGVycy5pc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAgIHByb2NlZWRBZnRlclVwbG9hZCA9IG9wdHM7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHVibGljKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgJ0NhbiBub3QgcnVuIFthZGRGaWxlXSBvbiBwdWJsaWMgY29sbGVjdGlvbiEgSnVzdCBNb3ZlIGZpbGUgdG8gcm9vdCBvZiB5b3VyIHNlcnZlciwgdGhlbiBhZGQgcmVjb3JkIHRvIENvbGxlY3Rpb24nKTtcbiAgICB9XG5cbiAgICBjaGVjayhwYXRoLCBTdHJpbmcpO1xuICAgIGNoZWNrKG9wdHMsIE1hdGNoLk9wdGlvbmFsKE9iamVjdCkpO1xuICAgIGNoZWNrKGNhbGxiYWNrLCBNYXRjaC5PcHRpb25hbChGdW5jdGlvbikpO1xuICAgIGNoZWNrKHByb2NlZWRBZnRlclVwbG9hZCwgTWF0Y2guT3B0aW9uYWwoQm9vbGVhbikpO1xuXG4gICAgZnMuc3RhdChwYXRoLCAoc3RhdEVyciwgc3RhdHMpID0+IGJvdW5kKCgpID0+IHtcbiAgICAgIGlmIChzdGF0RXJyKSB7XG4gICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHN0YXRFcnIpO1xuICAgICAgfSBlbHNlIGlmIChzdGF0cy5pc0ZpbGUoKSkge1xuICAgICAgICBpZiAoIWhlbHBlcnMuaXNPYmplY3Qob3B0cykpIHtcbiAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgIH1cbiAgICAgICAgb3B0cy5wYXRoICA9IHBhdGg7XG5cbiAgICAgICAgaWYgKCFvcHRzLmZpbGVOYW1lKSB7XG4gICAgICAgICAgY29uc3QgcGF0aFBhcnRzID0gcGF0aC5zcGxpdChub2RlUGF0aC5zZXApO1xuICAgICAgICAgIG9wdHMuZmlsZU5hbWUgICA9IHBhdGguc3BsaXQobm9kZVBhdGguc2VwKVtwYXRoUGFydHMubGVuZ3RoIC0gMV07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7ZXh0ZW5zaW9ufSA9IHRoaXMuX2dldEV4dChvcHRzLmZpbGVOYW1lKTtcblxuICAgICAgICBpZiAoIWhlbHBlcnMuaXNTdHJpbmcob3B0cy50eXBlKSkge1xuICAgICAgICAgIG9wdHMudHlwZSA9IHRoaXMuX2dldE1pbWVUeXBlKG9wdHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFoZWxwZXJzLmlzT2JqZWN0KG9wdHMubWV0YSkpIHtcbiAgICAgICAgICBvcHRzLm1ldGEgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaGVscGVycy5pc051bWJlcihvcHRzLnNpemUpKSB7XG4gICAgICAgICAgb3B0cy5zaXplID0gc3RhdHMuc2l6ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2RhdGFUb1NjaGVtYSh7XG4gICAgICAgICAgbmFtZTogb3B0cy5maWxlTmFtZSxcbiAgICAgICAgICBwYXRoLFxuICAgICAgICAgIG1ldGE6IG9wdHMubWV0YSxcbiAgICAgICAgICB0eXBlOiBvcHRzLnR5cGUsXG4gICAgICAgICAgc2l6ZTogb3B0cy5zaXplLFxuICAgICAgICAgIHVzZXJJZDogb3B0cy51c2VySWQsXG4gICAgICAgICAgZXh0ZW5zaW9uLFxuICAgICAgICAgIF9zdG9yYWdlUGF0aDogcGF0aC5yZXBsYWNlKGAke25vZGVQYXRoLnNlcH0ke29wdHMuZmlsZU5hbWV9YCwgJycpLFxuICAgICAgICAgIGZpbGVJZDogb3B0cy5maWxlSWQgfHwgbnVsbFxuICAgICAgICB9KTtcblxuXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbi5pbnNlcnQocmVzdWx0LCAoaW5zZXJ0RXJyLCBfaWQpID0+IHtcbiAgICAgICAgICBpZiAoaW5zZXJ0RXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhpbnNlcnRFcnIpO1xuICAgICAgICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFthZGRGaWxlXSBbaW5zZXJ0XSBFcnJvcjogJHtyZXN1bHQubmFtZX0gLT4gJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWAsIGluc2VydEVycik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVSZWYgPSB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShfaWQpO1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobnVsbCwgZmlsZVJlZik7XG4gICAgICAgICAgICBpZiAocHJvY2VlZEFmdGVyVXBsb2FkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgIHRoaXMub25BZnRlclVwbG9hZCAmJiB0aGlzLm9uQWZ0ZXJVcGxvYWQuY2FsbCh0aGlzLCBmaWxlUmVmKTtcbiAgICAgICAgICAgICAgdGhpcy5lbWl0KCdhZnRlclVwbG9hZCcsIGZpbGVSZWYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFthZGRGaWxlXTogJHtyZXN1bHQubmFtZX0gLT4gJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKDQwMCwgYFtGaWxlc0NvbGxlY3Rpb25dIFthZGRGaWxlKCR7cGF0aH0pXTogRmlsZSBkb2VzIG5vdCBleGlzdGApKTtcbiAgICAgIH1cbiAgICB9KSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSByZW1vdmVcbiAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBzZWxlY3RvciAtIE1vbmdvLVN0eWxlIHNlbGVjdG9yIChodHRwOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI3NlbGVjdG9ycylcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayB3aXRoIG9uZSBgZXJyb3JgIGFyZ3VtZW50XG4gICAqIEBzdW1tYXJ5IFJlbW92ZSBkb2N1bWVudHMgZnJvbSB0aGUgY29sbGVjdGlvblxuICAgKiBAcmV0dXJucyB7RmlsZXNDb2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgcmVtb3ZlKHNlbGVjdG9yLCBjYWxsYmFjaykge1xuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbcmVtb3ZlKCR7SlNPTi5zdHJpbmdpZnkoc2VsZWN0b3IpfSldYCk7XG4gICAgaWYgKHNlbGVjdG9yID09PSB2b2lkIDApIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBjaGVjayhjYWxsYmFjaywgTWF0Y2guT3B0aW9uYWwoRnVuY3Rpb24pKTtcblxuICAgIGNvbnN0IGZpbGVzID0gdGhpcy5jb2xsZWN0aW9uLmZpbmQoc2VsZWN0b3IpO1xuICAgIGlmIChmaWxlcy5jb3VudCgpID4gMCkge1xuICAgICAgZmlsZXMuZm9yRWFjaCgoZmlsZSkgPT4ge1xuICAgICAgICB0aGlzLnVubGluayhmaWxlKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKDQwNCwgJ0N1cnNvciBpcyBlbXB0eSwgbm8gZmlsZXMgaXMgcmVtb3ZlZCcpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9uQWZ0ZXJSZW1vdmUpIHtcbiAgICAgIGNvbnN0IGRvY3MgPSBmaWxlcy5mZXRjaCgpO1xuICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICB0aGlzLmNvbGxlY3Rpb24ucmVtb3ZlKHNlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHNlbGYub25BZnRlclJlbW92ZShkb2NzKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbGxlY3Rpb24ucmVtb3ZlKHNlbGVjdG9yLCAoY2FsbGJhY2sgfHwgTk9PUCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBkZW55XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBydWxlc1xuICAgKiBAc2VlICBodHRwczovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNNb25nby1Db2xsZWN0aW9uLWRlbnlcbiAgICogQHN1bW1hcnkgbGluayBNb25nby5Db2xsZWN0aW9uIGRlbnkgbWV0aG9kc1xuICAgKiBAcmV0dXJucyB7TW9uZ28uQ29sbGVjdGlvbn0gSW5zdGFuY2VcbiAgICovXG4gIGRlbnkocnVsZXMpIHtcbiAgICB0aGlzLmNvbGxlY3Rpb24uZGVueShydWxlcyk7XG4gICAgcmV0dXJuIHRoaXMuY29sbGVjdGlvbjtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBhbGxvd1xuICAgKiBAcGFyYW0ge09iamVjdH0gcnVsZXNcbiAgICogQHNlZSBodHRwczovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNNb25nby1Db2xsZWN0aW9uLWFsbG93XG4gICAqIEBzdW1tYXJ5IGxpbmsgTW9uZ28uQ29sbGVjdGlvbiBhbGxvdyBtZXRob2RzXG4gICAqIEByZXR1cm5zIHtNb25nby5Db2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgYWxsb3cocnVsZXMpIHtcbiAgICB0aGlzLmNvbGxlY3Rpb24uYWxsb3cocnVsZXMpO1xuICAgIHJldHVybiB0aGlzLmNvbGxlY3Rpb247XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgZGVueUNsaWVudFxuICAgKiBAc2VlIGh0dHBzOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI01vbmdvLUNvbGxlY3Rpb24tZGVueVxuICAgKiBAc3VtbWFyeSBTaG9ydGhhbmRzIGZvciBNb25nby5Db2xsZWN0aW9uIGRlbnkgbWV0aG9kXG4gICAqIEByZXR1cm5zIHtNb25nby5Db2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgZGVueUNsaWVudCgpIHtcbiAgICB0aGlzLmNvbGxlY3Rpb24uZGVueSh7XG4gICAgICBpbnNlcnQoKSB7IHJldHVybiB0cnVlOyB9LFxuICAgICAgdXBkYXRlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgICAgIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH1cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5jb2xsZWN0aW9uO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIGFsbG93Q2xpZW50XG4gICAqIEBzZWUgaHR0cHM6Ly9kb2NzLm1ldGVvci5jb20vYXBpL2NvbGxlY3Rpb25zLmh0bWwjTW9uZ28tQ29sbGVjdGlvbi1hbGxvd1xuICAgKiBAc3VtbWFyeSBTaG9ydGhhbmRzIGZvciBNb25nby5Db2xsZWN0aW9uIGFsbG93IG1ldGhvZFxuICAgKiBAcmV0dXJucyB7TW9uZ28uQ29sbGVjdGlvbn0gSW5zdGFuY2VcbiAgICovXG4gIGFsbG93Q2xpZW50KCkge1xuICAgIHRoaXMuY29sbGVjdGlvbi5hbGxvdyh7XG4gICAgICBpbnNlcnQoKSB7IHJldHVybiB0cnVlOyB9LFxuICAgICAgdXBkYXRlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgICAgIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH1cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5jb2xsZWN0aW9uO1xuICB9XG5cblxuICAvKlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgdW5saW5rXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlUmVmIC0gZmlsZU9ialxuICAgKiBAcGFyYW0ge1N0cmluZ30gdmVyc2lvbiAtIFtPcHRpb25hbF0gZmlsZSdzIHZlcnNpb25cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBbT3B0aW9uYWxdIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqIEBzdW1tYXJ5IFVubGluayBmaWxlcyBhbmQgaXQncyB2ZXJzaW9ucyBmcm9tIEZTXG4gICAqIEByZXR1cm5zIHtGaWxlc0NvbGxlY3Rpb259IEluc3RhbmNlXG4gICAqL1xuICB1bmxpbmsoZmlsZVJlZiwgdmVyc2lvbiwgY2FsbGJhY2spIHtcbiAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW3VubGluaygke2ZpbGVSZWYuX2lkfSwgJHt2ZXJzaW9ufSldYCk7XG4gICAgaWYgKHZlcnNpb24pIHtcbiAgICAgIGlmIChoZWxwZXJzLmlzT2JqZWN0KGZpbGVSZWYudmVyc2lvbnMpICYmIGhlbHBlcnMuaXNPYmplY3QoZmlsZVJlZi52ZXJzaW9uc1t2ZXJzaW9uXSkgJiYgZmlsZVJlZi52ZXJzaW9uc1t2ZXJzaW9uXS5wYXRoKSB7XG4gICAgICAgIGZzLnVubGluayhmaWxlUmVmLnZlcnNpb25zW3ZlcnNpb25dLnBhdGgsIChjYWxsYmFjayB8fCBOT09QKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChoZWxwZXJzLmlzT2JqZWN0KGZpbGVSZWYudmVyc2lvbnMpKSB7XG4gICAgICAgIGZvcihsZXQgdktleSBpbiBmaWxlUmVmLnZlcnNpb25zKSB7XG4gICAgICAgICAgaWYgKGZpbGVSZWYudmVyc2lvbnNbdktleV0gJiYgZmlsZVJlZi52ZXJzaW9uc1t2S2V5XS5wYXRoKSB7XG4gICAgICAgICAgICBmcy51bmxpbmsoZmlsZVJlZi52ZXJzaW9uc1t2S2V5XS5wYXRoLCAoY2FsbGJhY2sgfHwgTk9PUCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnMudW5saW5rKGZpbGVSZWYucGF0aCwgKGNhbGxiYWNrIHx8IE5PT1ApKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgXzQwNFxuICAgKiBAc3VtbWFyeSBJbnRlcm5hbCBtZXRob2QsIHVzZWQgdG8gcmV0dXJuIDQwNCBlcnJvclxuICAgKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxuICAgKi9cbiAgXzQwNChodHRwKSB7XG4gICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtkb3dubG9hZCgke2h0dHAucmVxdWVzdC5vcmlnaW5hbFVybH0pXSBbXzQwNF0gRmlsZSBub3QgZm91bmRgKTtcbiAgICBjb25zdCB0ZXh0ID0gJ0ZpbGUgTm90IEZvdW5kIDooJztcblxuICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgaHR0cC5yZXNwb25zZS53cml0ZUhlYWQoNDA0LCB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAndGV4dC9wbGFpbicsXG4gICAgICAgICdDb250ZW50LUxlbmd0aCc6IHRleHQubGVuZ3RoXG4gICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoIWh0dHAucmVzcG9uc2UuZmluaXNoZWQpIHtcbiAgICAgIGh0dHAucmVzcG9uc2UuZW5kKHRleHQpO1xuICAgIH1cbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBkb3dubG9hZFxuICAgKiBAcGFyYW0ge09iamVjdH0gaHR0cCAgICAtIFNlcnZlciBIVFRQIG9iamVjdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdmVyc2lvbiAtIFJlcXVlc3RlZCBmaWxlIHZlcnNpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGZpbGVSZWYgLSBSZXF1ZXN0ZWQgZmlsZSBPYmplY3RcbiAgICogQHN1bW1hcnkgSW5pdGlhdGVzIHRoZSBIVFRQIHJlc3BvbnNlXG4gICAqIEByZXR1cm5zIHt1bmRlZmluZWR9XG4gICAqL1xuICBkb3dubG9hZChodHRwLCB2ZXJzaW9uID0gJ29yaWdpbmFsJywgZmlsZVJlZikge1xuICAgIGxldCB2UmVmO1xuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbZG93bmxvYWQoJHtodHRwLnJlcXVlc3Qub3JpZ2luYWxVcmx9LCAke3ZlcnNpb259KV1gKTtcblxuICAgIGlmIChmaWxlUmVmKSB7XG4gICAgICBpZiAoaGVscGVycy5oYXMoZmlsZVJlZiwgJ3ZlcnNpb25zJykgJiYgaGVscGVycy5oYXMoZmlsZVJlZi52ZXJzaW9ucywgdmVyc2lvbikpIHtcbiAgICAgICAgdlJlZiA9IGZpbGVSZWYudmVyc2lvbnNbdmVyc2lvbl07XG4gICAgICAgIHZSZWYuX2lkID0gZmlsZVJlZi5faWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2UmVmID0gZmlsZVJlZjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdlJlZiA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghdlJlZiB8fCAhaGVscGVycy5pc09iamVjdCh2UmVmKSkge1xuICAgICAgcmV0dXJuIHRoaXMuXzQwNChodHRwKTtcbiAgICB9IGVsc2UgaWYgKGZpbGVSZWYpIHtcbiAgICAgIGlmICh0aGlzLmRvd25sb2FkQ2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCF0aGlzLmRvd25sb2FkQ2FsbGJhY2suY2FsbChPYmplY3QuYXNzaWduKGh0dHAsIHRoaXMuX2dldFVzZXIoaHR0cCkpLCBmaWxlUmVmKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl80MDQoaHR0cCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuaW50ZXJjZXB0RG93bmxvYWQgJiYgaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMuaW50ZXJjZXB0RG93bmxvYWQpKSB7XG4gICAgICAgIGlmICh0aGlzLmludGVyY2VwdERvd25sb2FkKGh0dHAsIGZpbGVSZWYsIHZlcnNpb24pID09PSB0cnVlKSB7XG4gICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmcy5zdGF0KHZSZWYucGF0aCwgKHN0YXRFcnIsIHN0YXRzKSA9PiBib3VuZCgoKSA9PiB7XG4gICAgICAgIGxldCByZXNwb25zZVR5cGU7XG4gICAgICAgIGlmIChzdGF0RXJyIHx8ICFzdGF0cy5pc0ZpbGUoKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl80MDQoaHR0cCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKHN0YXRzLnNpemUgIT09IHZSZWYuc2l6ZSkgJiYgIXRoaXMuaW50ZWdyaXR5Q2hlY2spIHtcbiAgICAgICAgICB2UmVmLnNpemUgICAgPSBzdGF0cy5zaXplO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKChzdGF0cy5zaXplICE9PSB2UmVmLnNpemUpICYmIHRoaXMuaW50ZWdyaXR5Q2hlY2spIHtcbiAgICAgICAgICByZXNwb25zZVR5cGUgPSAnNDAwJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLnNlcnZlKGh0dHAsIGZpbGVSZWYsIHZSZWYsIHZlcnNpb24sIG51bGwsIChyZXNwb25zZVR5cGUgfHwgJzIwMCcpKTtcbiAgICAgIH0pKTtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl80MDQoaHR0cCk7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgc2VydmVcbiAgICogQHBhcmFtIHtPYmplY3R9IGh0dHAgICAgLSBTZXJ2ZXIgSFRUUCBvYmplY3RcbiAgICogQHBhcmFtIHtPYmplY3R9IGZpbGVSZWYgLSBSZXF1ZXN0ZWQgZmlsZSBPYmplY3RcbiAgICogQHBhcmFtIHtPYmplY3R9IHZSZWYgICAgLSBSZXF1ZXN0ZWQgZmlsZSB2ZXJzaW9uIE9iamVjdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdmVyc2lvbiAtIFJlcXVlc3RlZCBmaWxlIHZlcnNpb25cbiAgICogQHBhcmFtIHtzdHJlYW0uUmVhZGFibGV8bnVsbH0gcmVhZGFibGVTdHJlYW0gLSBSZWFkYWJsZSBzdHJlYW0sIHdoaWNoIHNlcnZlcyBiaW5hcnkgZmlsZSBkYXRhXG4gICAqIEBwYXJhbSB7U3RyaW5nfSByZXNwb25zZVR5cGUgLSBSZXNwb25zZSBjb2RlXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gZm9yY2UyMDAgLSBGb3JjZSAyMDAgcmVzcG9uc2UgY29kZSBvdmVyIDIwNlxuICAgKiBAc3VtbWFyeSBIYW5kbGUgYW5kIHJlcGx5IHRvIGluY29taW5nIHJlcXVlc3RcbiAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICovXG4gIHNlcnZlKGh0dHAsIGZpbGVSZWYsIHZSZWYsIHZlcnNpb24gPSAnb3JpZ2luYWwnLCByZWFkYWJsZVN0cmVhbSA9IG51bGwsIF9yZXNwb25zZVR5cGUgPSAnMjAwJywgZm9yY2UyMDAgPSBmYWxzZSkge1xuICAgIGxldCBwYXJ0aXJhbCA9IGZhbHNlO1xuICAgIGxldCByZXFSYW5nZSA9IGZhbHNlO1xuICAgIGxldCBkaXNwb3NpdGlvblR5cGUgPSAnJztcbiAgICBsZXQgc3RhcnQ7XG4gICAgbGV0IGVuZDtcbiAgICBsZXQgdGFrZTtcbiAgICBsZXQgcmVzcG9uc2VUeXBlID0gX3Jlc3BvbnNlVHlwZTtcblxuICAgIGlmIChodHRwLnBhcmFtcy5xdWVyeS5kb3dubG9hZCAmJiAoaHR0cC5wYXJhbXMucXVlcnkuZG93bmxvYWQgPT09ICd0cnVlJykpIHtcbiAgICAgIGRpc3Bvc2l0aW9uVHlwZSA9ICdhdHRhY2htZW50OyAnO1xuICAgIH0gZWxzZSB7XG4gICAgICBkaXNwb3NpdGlvblR5cGUgPSAnaW5saW5lOyAnO1xuICAgIH1cblxuICAgIGNvbnN0IGRpc3Bvc2l0aW9uTmFtZSAgICAgPSBgZmlsZW5hbWU9XFxcIiR7ZW5jb2RlVVJJKHZSZWYubmFtZSB8fCBmaWxlUmVmLm5hbWUpLnJlcGxhY2UoL1xcLC9nLCAnJTJDJyl9XFxcIjsgZmlsZW5hbWUqPVVURi04Jycke2VuY29kZVVSSUNvbXBvbmVudCh2UmVmLm5hbWUgfHwgZmlsZVJlZi5uYW1lKX07IGA7XG4gICAgY29uc3QgZGlzcG9zaXRpb25FbmNvZGluZyA9ICdjaGFyc2V0PVVURi04JztcblxuICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgaHR0cC5yZXNwb25zZS5zZXRIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nLCBkaXNwb3NpdGlvblR5cGUgKyBkaXNwb3NpdGlvbk5hbWUgKyBkaXNwb3NpdGlvbkVuY29kaW5nKTtcbiAgICB9XG5cbiAgICBpZiAoaHR0cC5yZXF1ZXN0LmhlYWRlcnMucmFuZ2UgJiYgIWZvcmNlMjAwKSB7XG4gICAgICBwYXJ0aXJhbCAgICA9IHRydWU7XG4gICAgICBjb25zdCBhcnJheSA9IGh0dHAucmVxdWVzdC5oZWFkZXJzLnJhbmdlLnNwbGl0KC9ieXRlcz0oWzAtOV0qKS0oWzAtOV0qKS8pO1xuICAgICAgc3RhcnQgICAgICAgPSBwYXJzZUludChhcnJheVsxXSk7XG4gICAgICBlbmQgICAgICAgICA9IHBhcnNlSW50KGFycmF5WzJdKTtcbiAgICAgIGlmIChpc05hTihlbmQpKSB7XG4gICAgICAgIGVuZCAgICAgICA9IHZSZWYuc2l6ZSAtIDE7XG4gICAgICB9XG4gICAgICB0YWtlICAgICAgICA9IGVuZCAtIHN0YXJ0O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydCA9IDA7XG4gICAgICBlbmQgICA9IHZSZWYuc2l6ZSAtIDE7XG4gICAgICB0YWtlICA9IHZSZWYuc2l6ZTtcbiAgICB9XG5cbiAgICBpZiAocGFydGlyYWwgfHwgKGh0dHAucGFyYW1zLnF1ZXJ5LnBsYXkgJiYgKGh0dHAucGFyYW1zLnF1ZXJ5LnBsYXkgPT09ICd0cnVlJykpKSB7XG4gICAgICByZXFSYW5nZSA9IHtzdGFydCwgZW5kfTtcbiAgICAgIGlmIChpc05hTihzdGFydCkgJiYgIWlzTmFOKGVuZCkpIHtcbiAgICAgICAgcmVxUmFuZ2Uuc3RhcnQgPSBlbmQgLSB0YWtlO1xuICAgICAgICByZXFSYW5nZS5lbmQgICA9IGVuZDtcbiAgICAgIH1cbiAgICAgIGlmICghaXNOYU4oc3RhcnQpICYmIGlzTmFOKGVuZCkpIHtcbiAgICAgICAgcmVxUmFuZ2Uuc3RhcnQgPSBzdGFydDtcbiAgICAgICAgcmVxUmFuZ2UuZW5kICAgPSBzdGFydCArIHRha2U7XG4gICAgICB9XG5cbiAgICAgIGlmICgoc3RhcnQgKyB0YWtlKSA+PSB2UmVmLnNpemUpIHsgcmVxUmFuZ2UuZW5kID0gdlJlZi5zaXplIC0gMTsgfVxuXG4gICAgICBpZiAodGhpcy5zdHJpY3QgJiYgKChyZXFSYW5nZS5zdGFydCA+PSAodlJlZi5zaXplIC0gMSkpIHx8IChyZXFSYW5nZS5lbmQgPiAodlJlZi5zaXplIC0gMSkpKSkge1xuICAgICAgICByZXNwb25zZVR5cGUgPSAnNDE2JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3BvbnNlVHlwZSA9ICcyMDYnO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXNwb25zZVR5cGUgPSAnMjAwJztcbiAgICB9XG5cbiAgICBjb25zdCBzdHJlYW1FcnJvckhhbmRsZXIgPSAoZXJyb3IpID0+IHtcbiAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbc2VydmUoJHt2UmVmLnBhdGh9LCAke3ZlcnNpb259KV0gWzUwMF1gLCBlcnJvcik7XG4gICAgICBpZiAoIWh0dHAucmVzcG9uc2UuZmluaXNoZWQpIHtcbiAgICAgICAgaHR0cC5yZXNwb25zZS5lbmQoZXJyb3IudG9TdHJpbmcoKSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IGhlYWRlcnMgPSBoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5yZXNwb25zZUhlYWRlcnMpID8gdGhpcy5yZXNwb25zZUhlYWRlcnMocmVzcG9uc2VUeXBlLCBmaWxlUmVmLCB2UmVmLCB2ZXJzaW9uKSA6IHRoaXMucmVzcG9uc2VIZWFkZXJzO1xuXG4gICAgaWYgKCFoZWFkZXJzWydDYWNoZS1Db250cm9sJ10pIHtcbiAgICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgICBodHRwLnJlc3BvbnNlLnNldEhlYWRlcignQ2FjaGUtQ29udHJvbCcsIHRoaXMuY2FjaGVDb250cm9sKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gaGVhZGVycykge1xuICAgICAgaWYgKCFodHRwLnJlc3BvbnNlLmhlYWRlcnNTZW50KSB7XG4gICAgICAgIGh0dHAucmVzcG9uc2Uuc2V0SGVhZGVyKGtleSwgaGVhZGVyc1trZXldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25kID0gKHN0cmVhbSwgY29kZSkgPT4ge1xuICAgICAgaWYgKCFodHRwLnJlc3BvbnNlLmhlYWRlcnNTZW50ICYmIHJlYWRhYmxlU3RyZWFtKSB7XG4gICAgICAgIGh0dHAucmVzcG9uc2Uud3JpdGVIZWFkKGNvZGUpO1xuICAgICAgfVxuXG4gICAgICBodHRwLnJlc3BvbnNlLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHJlYW0uYWJvcnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBzdHJlYW0uYWJvcnQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHN0cmVhbS5lbmQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBzdHJlYW0uZW5kKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBodHRwLnJlcXVlc3Qub24oJ2Fib3J0ZWQnLCAoKSA9PiB7XG4gICAgICAgIGh0dHAucmVxdWVzdC5hYm9ydGVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHJlYW0uYWJvcnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBzdHJlYW0uYWJvcnQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHN0cmVhbS5lbmQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBzdHJlYW0uZW5kKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBzdHJlYW0ub24oJ29wZW4nLCAoKSA9PiB7XG4gICAgICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgICAgIGh0dHAucmVzcG9uc2Uud3JpdGVIZWFkKGNvZGUpO1xuICAgICAgICB9XG4gICAgICB9KS5vbignYWJvcnQnLCAoKSA9PiB7XG4gICAgICAgIGlmICghaHR0cC5yZXNwb25zZS5maW5pc2hlZCkge1xuICAgICAgICAgIGh0dHAucmVzcG9uc2UuZW5kKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFodHRwLnJlcXVlc3QuYWJvcnRlZCkge1xuICAgICAgICAgIGh0dHAucmVxdWVzdC5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgIH0pLm9uKCdlcnJvcicsIHN0cmVhbUVycm9ySGFuZGxlclxuICAgICAgKS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICBpZiAoIWh0dHAucmVzcG9uc2UuZmluaXNoZWQpIHtcbiAgICAgICAgICBodHRwLnJlc3BvbnNlLmVuZCgpO1xuICAgICAgICB9XG4gICAgICB9KS5waXBlKGh0dHAucmVzcG9uc2UpO1xuICAgIH07XG5cbiAgICBzd2l0Y2ggKHJlc3BvbnNlVHlwZSkge1xuICAgIGNhc2UgJzQwMCc6XG4gICAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW3NlcnZlKCR7dlJlZi5wYXRofSwgJHt2ZXJzaW9ufSldIFs0MDBdIENvbnRlbnQtTGVuZ3RoIG1pc21hdGNoIWApO1xuICAgICAgdmFyIHRleHQgPSAnQ29udGVudC1MZW5ndGggbWlzbWF0Y2ghJztcblxuICAgICAgaWYgKCFodHRwLnJlc3BvbnNlLmhlYWRlcnNTZW50KSB7XG4gICAgICAgIGh0dHAucmVzcG9uc2Uud3JpdGVIZWFkKDQwMCwge1xuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAndGV4dC9wbGFpbicsXG4gICAgICAgICAgJ0NvbnRlbnQtTGVuZ3RoJzogdGV4dC5sZW5ndGhcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghaHR0cC5yZXNwb25zZS5maW5pc2hlZCkge1xuICAgICAgICBodHRwLnJlc3BvbnNlLmVuZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJzQwNCc6XG4gICAgICB0aGlzLl80MDQoaHR0cCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICc0MTYnOlxuICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtzZXJ2ZSgke3ZSZWYucGF0aH0sICR7dmVyc2lvbn0pXSBbNDE2XSBDb250ZW50LVJhbmdlIGlzIG5vdCBzcGVjaWZpZWQhYCk7XG4gICAgICBpZiAoIWh0dHAucmVzcG9uc2UuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgaHR0cC5yZXNwb25zZS53cml0ZUhlYWQoNDE2KTtcbiAgICAgIH1cbiAgICAgIGlmICghaHR0cC5yZXNwb25zZS5maW5pc2hlZCkge1xuICAgICAgICBodHRwLnJlc3BvbnNlLmVuZCgpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnMjA2JzpcbiAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbc2VydmUoJHt2UmVmLnBhdGh9LCAke3ZlcnNpb259KV0gWzIwNl1gKTtcbiAgICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgICBodHRwLnJlc3BvbnNlLnNldEhlYWRlcignQ29udGVudC1SYW5nZScsIGBieXRlcyAke3JlcVJhbmdlLnN0YXJ0fS0ke3JlcVJhbmdlLmVuZH0vJHt2UmVmLnNpemV9YCk7XG4gICAgICB9XG4gICAgICByZXNwb25kKHJlYWRhYmxlU3RyZWFtIHx8IGZzLmNyZWF0ZVJlYWRTdHJlYW0odlJlZi5wYXRoLCB7c3RhcnQ6IHJlcVJhbmdlLnN0YXJ0LCBlbmQ6IHJlcVJhbmdlLmVuZH0pLCAyMDYpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbc2VydmUoJHt2UmVmLnBhdGh9LCAke3ZlcnNpb259KV0gWzIwMF1gKTtcbiAgICAgIHJlc3BvbmQocmVhZGFibGVTdHJlYW0gfHwgZnMuY3JlYXRlUmVhZFN0cmVhbSh2UmVmLnBhdGgpLCAyMDApO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSAgICAgICAgICAgIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuaW1wb3J0IHsgY2hlY2ssIE1hdGNoIH0gICAgICAgICAgICBmcm9tICdtZXRlb3IvY2hlY2snO1xuaW1wb3J0IHsgZm9ybWF0RmxlVVJMLCBoZWxwZXJzIH0gICBmcm9tICcuL2xpYi5qcyc7XG5pbXBvcnQgeyBGaWxlc0N1cnNvciwgRmlsZUN1cnNvciB9IGZyb20gJy4vY3Vyc29yLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmlsZXNDb2xsZWN0aW9uQ29yZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBzdGF0aWMgX19oZWxwZXJzID0gaGVscGVycztcblxuICBzdGF0aWMgc2NoZW1hID0ge1xuICAgIF9pZDoge1xuICAgICAgdHlwZTogU3RyaW5nXG4gICAgfSxcbiAgICBzaXplOiB7XG4gICAgICB0eXBlOiBOdW1iZXJcbiAgICB9LFxuICAgIG5hbWU6IHtcbiAgICAgIHR5cGU6IFN0cmluZ1xuICAgIH0sXG4gICAgdHlwZToge1xuICAgICAgdHlwZTogU3RyaW5nXG4gICAgfSxcbiAgICBwYXRoOiB7XG4gICAgICB0eXBlOiBTdHJpbmdcbiAgICB9LFxuICAgIGlzVmlkZW86IHtcbiAgICAgIHR5cGU6IEJvb2xlYW5cbiAgICB9LFxuICAgIGlzQXVkaW86IHtcbiAgICAgIHR5cGU6IEJvb2xlYW5cbiAgICB9LFxuICAgIGlzSW1hZ2U6IHtcbiAgICAgIHR5cGU6IEJvb2xlYW5cbiAgICB9LFxuICAgIGlzVGV4dDoge1xuICAgICAgdHlwZTogQm9vbGVhblxuICAgIH0sXG4gICAgaXNKU09OOiB7XG4gICAgICB0eXBlOiBCb29sZWFuXG4gICAgfSxcbiAgICBpc1BERjoge1xuICAgICAgdHlwZTogQm9vbGVhblxuICAgIH0sXG4gICAgZXh0ZW5zaW9uOiB7XG4gICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG4gICAgZXh0OiB7XG4gICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG4gICAgZXh0ZW5zaW9uV2l0aERvdDoge1xuICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIG1pbWU6IHtcbiAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICAnbWltZS10eXBlJzoge1xuICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIF9zdG9yYWdlUGF0aDoge1xuICAgICAgdHlwZTogU3RyaW5nXG4gICAgfSxcbiAgICBfZG93bmxvYWRSb3V0ZToge1xuICAgICAgdHlwZTogU3RyaW5nXG4gICAgfSxcbiAgICBfY29sbGVjdGlvbk5hbWU6IHtcbiAgICAgIHR5cGU6IFN0cmluZ1xuICAgIH0sXG4gICAgcHVibGljOiB7XG4gICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIG1ldGE6IHtcbiAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgIGJsYWNrYm94OiB0cnVlLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIHVzZXJJZDoge1xuICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIHVwZGF0ZWRBdDoge1xuICAgICAgdHlwZTogRGF0ZSxcbiAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICB2ZXJzaW9uczoge1xuICAgICAgdHlwZTogT2JqZWN0LFxuICAgICAgYmxhY2tib3g6IHRydWVcbiAgICB9XG4gIH07XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25Db3JlXG4gICAqIEBuYW1lIF9kZWJ1Z1xuICAgKiBAc3VtbWFyeSBQcmludCBsb2dzIGluIGRlYnVnIG1vZGVcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBfZGVidWcoKSB7XG4gICAgaWYgKHRoaXMuZGVidWcpIHtcbiAgICAgIChjb25zb2xlLmluZm8gfHwgY29uc29sZS5sb2cgfHwgZnVuY3Rpb24gKCkgeyB9KS5hcHBseSh2b2lkIDAsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25Db3JlXG4gICAqIEBuYW1lIF9nZXRGaWxlTmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZmlsZURhdGEgLSBGaWxlIE9iamVjdFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGZpbGUncyBuYW1lXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAqL1xuICBfZ2V0RmlsZU5hbWUoZmlsZURhdGEpIHtcbiAgICBjb25zdCBmaWxlTmFtZSA9IGZpbGVEYXRhLm5hbWUgfHwgZmlsZURhdGEuZmlsZU5hbWU7XG4gICAgaWYgKGhlbHBlcnMuaXNTdHJpbmcoZmlsZU5hbWUpICYmIChmaWxlTmFtZS5sZW5ndGggPiAwKSkge1xuICAgICAgcmV0dXJuIChmaWxlRGF0YS5uYW1lIHx8IGZpbGVEYXRhLmZpbGVOYW1lKS5yZXBsYWNlKC9eXFwuXFwuKy8sICcnKS5yZXBsYWNlKC9cXC57Mix9L2csICcuJykucmVwbGFjZSgvXFwvL2csICcnKTtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25Db3JlXG4gICAqIEBuYW1lIF9nZXRFeHRcbiAgICogQHBhcmFtIHtTdHJpbmd9IEZpbGVOYW1lIC0gRmlsZSBuYW1lXG4gICAqIEBzdW1tYXJ5IEdldCBleHRlbnNpb24gZnJvbSBGaWxlTmFtZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgX2dldEV4dChmaWxlTmFtZSkge1xuICAgIGlmICghIX5maWxlTmFtZS5pbmRleE9mKCcuJykpIHtcbiAgICAgIGNvbnN0IGV4dGVuc2lvbiA9IChmaWxlTmFtZS5zcGxpdCgnLicpLnBvcCgpLnNwbGl0KCc/JylbMF0gfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gICAgICByZXR1cm4geyBleHQ6IGV4dGVuc2lvbiwgZXh0ZW5zaW9uLCBleHRlbnNpb25XaXRoRG90OiBgLiR7ZXh0ZW5zaW9ufWAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgZXh0OiAnJywgZXh0ZW5zaW9uOiAnJywgZXh0ZW5zaW9uV2l0aERvdDogJycgfTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uQ29yZVxuICAgKiBAbmFtZSBfdXBkYXRlRmlsZVR5cGVzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gRmlsZSBkYXRhXG4gICAqIEBzdW1tYXJ5IEludGVybmFsIG1ldGhvZC4gQ2xhc3NpZnkgZmlsZSBiYXNlZCBvbiAndHlwZScgZmllbGRcbiAgICovXG4gIF91cGRhdGVGaWxlVHlwZXMoZGF0YSkge1xuICAgIGRhdGEuaXNWaWRlbyAgPSAvXnZpZGVvXFwvL2kudGVzdChkYXRhLnR5cGUpO1xuICAgIGRhdGEuaXNBdWRpbyAgPSAvXmF1ZGlvXFwvL2kudGVzdChkYXRhLnR5cGUpO1xuICAgIGRhdGEuaXNJbWFnZSAgPSAvXmltYWdlXFwvL2kudGVzdChkYXRhLnR5cGUpO1xuICAgIGRhdGEuaXNUZXh0ICAgPSAvXnRleHRcXC8vaS50ZXN0KGRhdGEudHlwZSk7XG4gICAgZGF0YS5pc0pTT04gICA9IC9eYXBwbGljYXRpb25cXC9qc29uJC9pLnRlc3QoZGF0YS50eXBlKTtcbiAgICBkYXRhLmlzUERGICAgID0gL15hcHBsaWNhdGlvblxcLyh4LSk/cGRmJC9pLnRlc3QoZGF0YS50eXBlKTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uQ29yZVxuICAgKiBAbmFtZSBfZGF0YVRvU2NoZW1hXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gRmlsZSBkYXRhXG4gICAqIEBzdW1tYXJ5IEludGVybmFsIG1ldGhvZC4gQnVpbGQgb2JqZWN0IGluIGFjY29yZGFuY2Ugd2l0aCBkZWZhdWx0IHNjaGVtYSBmcm9tIEZpbGUgZGF0YVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgX2RhdGFUb1NjaGVtYShkYXRhKSB7XG4gICAgY29uc3QgZHMgPSB7XG4gICAgICBuYW1lOiBkYXRhLm5hbWUsXG4gICAgICBleHRlbnNpb246IGRhdGEuZXh0ZW5zaW9uLFxuICAgICAgZXh0OiBkYXRhLmV4dGVuc2lvbixcbiAgICAgIGV4dGVuc2lvbldpdGhEb3Q6ICcuJyArIGRhdGEuZXh0ZW5zaW9uLFxuICAgICAgcGF0aDogZGF0YS5wYXRoLFxuICAgICAgbWV0YTogZGF0YS5tZXRhLFxuICAgICAgdHlwZTogZGF0YS50eXBlLFxuICAgICAgbWltZTogZGF0YS50eXBlLFxuICAgICAgJ21pbWUtdHlwZSc6IGRhdGEudHlwZSxcbiAgICAgIHNpemU6IGRhdGEuc2l6ZSxcbiAgICAgIHVzZXJJZDogZGF0YS51c2VySWQgfHwgbnVsbCxcbiAgICAgIHZlcnNpb25zOiB7XG4gICAgICAgIG9yaWdpbmFsOiB7XG4gICAgICAgICAgcGF0aDogZGF0YS5wYXRoLFxuICAgICAgICAgIHNpemU6IGRhdGEuc2l6ZSxcbiAgICAgICAgICB0eXBlOiBkYXRhLnR5cGUsXG4gICAgICAgICAgZXh0ZW5zaW9uOiBkYXRhLmV4dGVuc2lvblxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgX2Rvd25sb2FkUm91dGU6IGRhdGEuX2Rvd25sb2FkUm91dGUgfHwgdGhpcy5kb3dubG9hZFJvdXRlLFxuICAgICAgX2NvbGxlY3Rpb25OYW1lOiBkYXRhLl9jb2xsZWN0aW9uTmFtZSB8fCB0aGlzLmNvbGxlY3Rpb25OYW1lXG4gICAgfTtcblxuICAgIC8vT3B0aW9uYWwgZmlsZUlkXG4gICAgaWYgKGRhdGEuZmlsZUlkKSB7XG4gICAgICBkcy5faWQgPSBkYXRhLmZpbGVJZDtcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVGaWxlVHlwZXMoZHMpO1xuICAgIGRzLl9zdG9yYWdlUGF0aCA9IGRhdGEuX3N0b3JhZ2VQYXRoIHx8IHRoaXMuc3RvcmFnZVBhdGgoT2JqZWN0LmFzc2lnbih7fSwgZGF0YSwgZHMpKTtcbiAgICByZXR1cm4gZHM7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvbkNvcmVcbiAgICogQG5hbWUgZmluZE9uZVxuICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHNlbGVjdG9yIC0gTW9uZ28tU3R5bGUgc2VsZWN0b3IgKGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vYXBpL2NvbGxlY3Rpb25zLmh0bWwjc2VsZWN0b3JzKVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE1vbmdvLVN0eWxlIHNlbGVjdG9yIE9wdGlvbnMgKGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vYXBpL2NvbGxlY3Rpb25zLmh0bWwjc29ydHNwZWNpZmllcnMpXG4gICAqIEBzdW1tYXJ5IEZpbmQgYW5kIHJldHVybiBDdXJzb3IgZm9yIG1hdGNoaW5nIGRvY3VtZW50IE9iamVjdFxuICAgKiBAcmV0dXJucyB7RmlsZUN1cnNvcn0gSW5zdGFuY2VcbiAgICovXG4gIGZpbmRPbmUoc2VsZWN0b3IgPSB7fSwgb3B0aW9ucykge1xuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbZmluZE9uZSgke0pTT04uc3RyaW5naWZ5KHNlbGVjdG9yKX0sICR7SlNPTi5zdHJpbmdpZnkob3B0aW9ucyl9KV1gKTtcbiAgICBjaGVjayhzZWxlY3RvciwgTWF0Y2guT3B0aW9uYWwoTWF0Y2guT25lT2YoT2JqZWN0LCBTdHJpbmcsIEJvb2xlYW4sIE51bWJlciwgbnVsbCkpKTtcbiAgICBjaGVjayhvcHRpb25zLCBNYXRjaC5PcHRpb25hbChPYmplY3QpKTtcblxuICAgIGNvbnN0IGRvYyA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKHNlbGVjdG9yLCBvcHRpb25zKTtcbiAgICBpZiAoZG9jKSB7XG4gICAgICByZXR1cm4gbmV3IEZpbGVDdXJzb3IoZG9jLCB0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIGRvYztcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uQ29yZVxuICAgKiBAbmFtZSBmaW5kXG4gICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gc2VsZWN0b3IgLSBNb25nby1TdHlsZSBzZWxlY3RvciAoaHR0cDovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNzZWxlY3RvcnMpXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgb3B0aW9ucyAgLSBNb25nby1TdHlsZSBzZWxlY3RvciBPcHRpb25zIChodHRwOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI3NvcnRzcGVjaWZpZXJzKVxuICAgKiBAc3VtbWFyeSBGaW5kIGFuZCByZXR1cm4gQ3Vyc29yIGZvciBtYXRjaGluZyBkb2N1bWVudHNcbiAgICogQHJldHVybnMge0ZpbGVzQ3Vyc29yfSBJbnN0YW5jZVxuICAgKi9cbiAgZmluZChzZWxlY3RvciA9IHt9LCBvcHRpb25zKSB7XG4gICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtmaW5kKCR7SlNPTi5zdHJpbmdpZnkoc2VsZWN0b3IpfSwgJHtKU09OLnN0cmluZ2lmeShvcHRpb25zKX0pXWApO1xuICAgIGNoZWNrKHNlbGVjdG9yLCBNYXRjaC5PcHRpb25hbChNYXRjaC5PbmVPZihPYmplY3QsIFN0cmluZywgQm9vbGVhbiwgTnVtYmVyLCBudWxsKSkpO1xuICAgIGNoZWNrKG9wdGlvbnMsIE1hdGNoLk9wdGlvbmFsKE9iamVjdCkpO1xuXG4gICAgcmV0dXJuIG5ldyBGaWxlc0N1cnNvcihzZWxlY3Rvciwgb3B0aW9ucywgdGhpcyk7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvbkNvcmVcbiAgICogQG5hbWUgdXBkYXRlXG4gICAqIEBzZWUgaHR0cDovL2RvY3MubWV0ZW9yLmNvbS8jL2Z1bGwvdXBkYXRlXG4gICAqIEBzdW1tYXJ5IGxpbmsgTW9uZ28uQ29sbGVjdGlvbiB1cGRhdGUgbWV0aG9kXG4gICAqIEByZXR1cm5zIHtNb25nby5Db2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgdXBkYXRlKCkge1xuICAgIHRoaXMuY29sbGVjdGlvbi51cGRhdGUuYXBwbHkodGhpcy5jb2xsZWN0aW9uLCBhcmd1bWVudHMpO1xuICAgIHJldHVybiB0aGlzLmNvbGxlY3Rpb247XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvbkNvcmVcbiAgICogQG5hbWUgbGlua1xuICAgKiBAcGFyYW0ge09iamVjdH0gZmlsZVJlZiAtIEZpbGUgcmVmZXJlbmNlIG9iamVjdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdmVyc2lvbiAtIFZlcnNpb24gb2YgZmlsZSB5b3Ugd291bGQgbGlrZSB0byByZXF1ZXN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBVUklCYXNlIC0gW09wdGlvbmFsXSBVUkkgYmFzZSwgc2VlIC0gaHR0cHM6Ly9naXRodWIuY29tL1ZlbGlvdkdyb3VwL01ldGVvci1GaWxlcy9pc3N1ZXMvNjI2XG4gICAqIEBzdW1tYXJ5IFJldHVybnMgZG93bmxvYWRhYmxlIFVSTFxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBFbXB0eSBzdHJpbmcgcmV0dXJuZWQgaW4gY2FzZSBpZiBmaWxlIG5vdCBmb3VuZCBpbiBEQlxuICAgKi9cbiAgbGluayhmaWxlUmVmLCB2ZXJzaW9uID0gJ29yaWdpbmFsJywgVVJJQmFzZSkge1xuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbbGluaygkeyhoZWxwZXJzLmlzT2JqZWN0KGZpbGVSZWYpID8gZmlsZVJlZi5faWQgOiB2b2lkIDApfSwgJHt2ZXJzaW9ufSldYCk7XG4gICAgY2hlY2soZmlsZVJlZiwgT2JqZWN0KTtcblxuICAgIGlmICghZmlsZVJlZikge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICByZXR1cm4gZm9ybWF0RmxlVVJMKGZpbGVSZWYsIHZlcnNpb24sIFVSSUJhc2UpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcblxuLypcbiAqIEBwcml2YXRlXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBjbGFzcyBGaWxlQ3Vyc29yXG4gKiBAcGFyYW0gX2ZpbGVSZWYgICAge09iamVjdH0gLSBNb25nby1TdHlsZSBzZWxlY3RvciAoaHR0cDovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNzZWxlY3RvcnMpXG4gKiBAcGFyYW0gX2NvbGxlY3Rpb24ge0ZpbGVzQ29sbGVjdGlvbn0gLSBGaWxlc0NvbGxlY3Rpb24gSW5zdGFuY2VcbiAqIEBzdW1tYXJ5IEludGVybmFsIGNsYXNzLCByZXByZXNlbnRzIGVhY2ggcmVjb3JkIGluIGBGaWxlc0N1cnNvci5lYWNoKClgIG9yIGRvY3VtZW50IHJldHVybmVkIGZyb20gYC5maW5kT25lKClgIG1ldGhvZFxuICovXG5leHBvcnQgY2xhc3MgRmlsZUN1cnNvciB7XG4gIGNvbnN0cnVjdG9yKF9maWxlUmVmLCBfY29sbGVjdGlvbikge1xuICAgIHRoaXMuX2ZpbGVSZWYgICAgPSBfZmlsZVJlZjtcbiAgICB0aGlzLl9jb2xsZWN0aW9uID0gX2NvbGxlY3Rpb247XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCBfZmlsZVJlZik7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVDdXJzb3JcbiAgICogQG5hbWUgcmVtb3ZlXG4gICAqIEBwYXJhbSBjYWxsYmFjayB7RnVuY3Rpb259IC0gVHJpZ2dlcmVkIGFzeW5jaHJvbm91c2x5IGFmdGVyIGl0ZW0gaXMgcmVtb3ZlZCBvciBmYWlsZWQgdG8gYmUgcmVtb3ZlZFxuICAgKiBAc3VtbWFyeSBSZW1vdmUgZG9jdW1lbnRcbiAgICogQHJldHVybnMge0ZpbGVDdXJzb3J9XG4gICAqL1xuICByZW1vdmUoY2FsbGJhY2spIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW0ZpbGVDdXJzb3JdIFtyZW1vdmUoKV0nKTtcbiAgICBpZiAodGhpcy5fZmlsZVJlZikge1xuICAgICAgdGhpcy5fY29sbGVjdGlvbi5yZW1vdmUodGhpcy5fZmlsZVJlZi5faWQsIGNhbGxiYWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobmV3IE1ldGVvci5FcnJvcig0MDQsICdObyBzdWNoIGZpbGUnKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlQ3Vyc29yXG4gICAqIEBuYW1lIGxpbmtcbiAgICogQHBhcmFtIHZlcnNpb24ge1N0cmluZ30gLSBOYW1lIG9mIGZpbGUncyBzdWJ2ZXJzaW9uXG4gICAqIEBwYXJhbSBVUklCYXNlIHtTdHJpbmd9IC0gW09wdGlvbmFsXSBVUkkgYmFzZSwgc2VlIC0gaHR0cHM6Ly9naXRodWIuY29tL1ZlbGlvdkdyb3VwL01ldGVvci1GaWxlcy9pc3N1ZXMvNjI2XG4gICAqIEBzdW1tYXJ5IFJldHVybnMgZG93bmxvYWRhYmxlIFVSTCB0byBGaWxlXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAqL1xuICBsaW5rKHZlcnNpb24gPSAnb3JpZ2luYWwnLCBVUklCYXNlKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtGaWxlQ3Vyc29yXSBbbGluaygke3ZlcnNpb259KV1gKTtcbiAgICBpZiAodGhpcy5fZmlsZVJlZikge1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbGxlY3Rpb24ubGluayh0aGlzLl9maWxlUmVmLCB2ZXJzaW9uLCBVUklCYXNlKTtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlQ3Vyc29yXG4gICAqIEBuYW1lIGdldFxuICAgKiBAcGFyYW0gcHJvcGVydHkge1N0cmluZ30gLSBOYW1lIG9mIHN1Yi1vYmplY3QgcHJvcGVydHlcbiAgICogQHN1bW1hcnkgUmV0dXJucyBjdXJyZW50IGRvY3VtZW50IGFzIGEgcGxhaW4gT2JqZWN0LCBpZiBgcHJvcGVydHlgIGlzIHNwZWNpZmllZCAtIHJldHVybnMgdmFsdWUgb2Ygc3ViLW9iamVjdCBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fG1peH1cbiAgICovXG4gIGdldChwcm9wZXJ0eSkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZUN1cnNvcl0gW2dldCgke3Byb3BlcnR5fSldYCk7XG4gICAgaWYgKHByb3BlcnR5KSB7XG4gICAgICByZXR1cm4gdGhpcy5fZmlsZVJlZltwcm9wZXJ0eV07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9maWxlUmVmO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlQ3Vyc29yXG4gICAqIEBuYW1lIGZldGNoXG4gICAqIEBzdW1tYXJ5IFJldHVybnMgZG9jdW1lbnQgYXMgcGxhaW4gT2JqZWN0IGluIEFycmF5XG4gICAqIEByZXR1cm5zIHtbT2JqZWN0XX1cbiAgICovXG4gIGZldGNoKCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZUN1cnNvcl0gW2ZldGNoKCldJyk7XG4gICAgcmV0dXJuIFt0aGlzLl9maWxlUmVmXTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZUN1cnNvclxuICAgKiBAbmFtZSB3aXRoXG4gICAqIEBzdW1tYXJ5IFJldHVybnMgcmVhY3RpdmUgdmVyc2lvbiBvZiBjdXJyZW50IEZpbGVDdXJzb3IsIHVzZWZ1bCB0byB1c2Ugd2l0aCBge3sjd2l0aH19Li4ue3svd2l0aH19YCBibG9jayB0ZW1wbGF0ZSBoZWxwZXJcbiAgICogQHJldHVybnMge1tPYmplY3RdfVxuICAgKi9cbiAgd2l0aCgpIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW0ZpbGVDdXJzb3JdIFt3aXRoKCldJyk7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24odGhpcywgdGhpcy5fY29sbGVjdGlvbi5jb2xsZWN0aW9uLmZpbmRPbmUodGhpcy5fZmlsZVJlZi5faWQpKTtcbiAgfVxufVxuXG4vKlxuICogQHByaXZhdGVcbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQGNsYXNzIEZpbGVzQ3Vyc29yXG4gKiBAcGFyYW0gX3NlbGVjdG9yICAge1N0cmluZ3xPYmplY3R9ICAgLSBNb25nby1TdHlsZSBzZWxlY3RvciAoaHR0cDovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNzZWxlY3RvcnMpXG4gKiBAcGFyYW0gb3B0aW9ucyAgICAge09iamVjdH0gICAgICAgICAgLSBNb25nby1TdHlsZSBzZWxlY3RvciBPcHRpb25zIChodHRwOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI3NlbGVjdG9ycylcbiAqIEBwYXJhbSBfY29sbGVjdGlvbiB7RmlsZXNDb2xsZWN0aW9ufSAtIEZpbGVzQ29sbGVjdGlvbiBJbnN0YW5jZVxuICogQHN1bW1hcnkgSW1wbGVtZW50YXRpb24gb2YgQ3Vyc29yIGZvciBGaWxlc0NvbGxlY3Rpb25cbiAqL1xuZXhwb3J0IGNsYXNzIEZpbGVzQ3Vyc29yIHtcbiAgY29uc3RydWN0b3IoX3NlbGVjdG9yID0ge30sIG9wdGlvbnMsIF9jb2xsZWN0aW9uKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbiA9IF9jb2xsZWN0aW9uO1xuICAgIHRoaXMuX3NlbGVjdG9yICAgPSBfc2VsZWN0b3I7XG4gICAgdGhpcy5fY3VycmVudCAgICA9IC0xO1xuICAgIHRoaXMuY3Vyc29yICAgICAgPSB0aGlzLl9jb2xsZWN0aW9uLmNvbGxlY3Rpb24uZmluZCh0aGlzLl9zZWxlY3Rvciwgb3B0aW9ucyk7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGdldFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGFsbCBtYXRjaGluZyBkb2N1bWVudChzKSBhcyBhbiBBcnJheS4gQWxpYXMgb2YgYC5mZXRjaCgpYFxuICAgKiBAcmV0dXJucyB7W09iamVjdF19XG4gICAqL1xuICBnZXQoKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW2dldCgpXScpO1xuICAgIHJldHVybiB0aGlzLmN1cnNvci5mZXRjaCgpO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBoYXNOZXh0XG4gICAqIEBzdW1tYXJ5IFJldHVybnMgYHRydWVgIGlmIHRoZXJlIGlzIG5leHQgaXRlbSBhdmFpbGFibGUgb24gQ3Vyc29yXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgaGFzTmV4dCgpIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW0ZpbGVzQ3Vyc29yXSBbaGFzTmV4dCgpXScpO1xuICAgIHJldHVybiB0aGlzLl9jdXJyZW50IDwgKHRoaXMuY3Vyc29yLmNvdW50KCkgLSAxKTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgbmV4dFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIG5leHQgaXRlbSBvbiBDdXJzb3IsIGlmIGF2YWlsYWJsZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fHVuZGVmaW5lZH1cbiAgICovXG4gIG5leHQoKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW25leHQoKV0nKTtcbiAgICB0aGlzLmN1cnNvci5mZXRjaCgpWysrdGhpcy5fY3VycmVudF07XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGhhc1ByZXZpb3VzXG4gICAqIEBzdW1tYXJ5IFJldHVybnMgYHRydWVgIGlmIHRoZXJlIGlzIHByZXZpb3VzIGl0ZW0gYXZhaWxhYmxlIG9uIEN1cnNvclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGhhc1ByZXZpb3VzKCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtoYXNQcmV2aW91cygpXScpO1xuICAgIHJldHVybiB0aGlzLl9jdXJyZW50ICE9PSAtMTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgcHJldmlvdXNcbiAgICogQHN1bW1hcnkgUmV0dXJucyBwcmV2aW91cyBpdGVtIG9uIEN1cnNvciwgaWYgYXZhaWxhYmxlXG4gICAqIEByZXR1cm5zIHtPYmplY3R8dW5kZWZpbmVkfVxuICAgKi9cbiAgcHJldmlvdXMoKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW3ByZXZpb3VzKCldJyk7XG4gICAgdGhpcy5jdXJzb3IuZmV0Y2goKVstLXRoaXMuX2N1cnJlbnRdO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBmZXRjaFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGFsbCBtYXRjaGluZyBkb2N1bWVudChzKSBhcyBhbiBBcnJheS5cbiAgICogQHJldHVybnMge1tPYmplY3RdfVxuICAgKi9cbiAgZmV0Y2goKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW2ZldGNoKCldJyk7XG4gICAgcmV0dXJuIHRoaXMuY3Vyc29yLmZldGNoKCkgfHwgW107XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGZpcnN0XG4gICAqIEBzdW1tYXJ5IFJldHVybnMgZmlyc3QgaXRlbSBvbiBDdXJzb3IsIGlmIGF2YWlsYWJsZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fHVuZGVmaW5lZH1cbiAgICovXG4gIGZpcnN0KCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtmaXJzdCgpXScpO1xuICAgIHRoaXMuX2N1cnJlbnQgPSAwO1xuICAgIHJldHVybiB0aGlzLmZldGNoKClbdGhpcy5fY3VycmVudF07XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGxhc3RcbiAgICogQHN1bW1hcnkgUmV0dXJucyBsYXN0IGl0ZW0gb24gQ3Vyc29yLCBpZiBhdmFpbGFibGVcbiAgICogQHJldHVybnMge09iamVjdHx1bmRlZmluZWR9XG4gICAqL1xuICBsYXN0KCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtsYXN0KCldJyk7XG4gICAgdGhpcy5fY3VycmVudCA9IHRoaXMuY291bnQoKSAtIDE7XG4gICAgcmV0dXJuIHRoaXMuZmV0Y2goKVt0aGlzLl9jdXJyZW50XTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgY291bnRcbiAgICogQHN1bW1hcnkgUmV0dXJucyB0aGUgbnVtYmVyIG9mIGRvY3VtZW50cyB0aGF0IG1hdGNoIGEgcXVlcnlcbiAgICogQHJldHVybnMge051bWJlcn1cbiAgICovXG4gIGNvdW50KCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtjb3VudCgpXScpO1xuICAgIHJldHVybiB0aGlzLmN1cnNvci5jb3VudCgpO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSByZW1vdmVcbiAgICogQHBhcmFtIGNhbGxiYWNrIHtGdW5jdGlvbn0gLSBUcmlnZ2VyZWQgYXN5bmNocm9ub3VzbHkgYWZ0ZXIgaXRlbSBpcyByZW1vdmVkIG9yIGZhaWxlZCB0byBiZSByZW1vdmVkXG4gICAqIEBzdW1tYXJ5IFJlbW92ZXMgYWxsIGRvY3VtZW50cyB0aGF0IG1hdGNoIGEgcXVlcnlcbiAgICogQHJldHVybnMge0ZpbGVzQ3Vyc29yfVxuICAgKi9cbiAgcmVtb3ZlKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW3JlbW92ZSgpXScpO1xuICAgIHRoaXMuX2NvbGxlY3Rpb24ucmVtb3ZlKHRoaXMuX3NlbGVjdG9yLCBjYWxsYmFjayk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGZvckVhY2hcbiAgICogQHBhcmFtIGNhbGxiYWNrIHtGdW5jdGlvbn0gLSBGdW5jdGlvbiB0byBjYWxsLiBJdCB3aWxsIGJlIGNhbGxlZCB3aXRoIHRocmVlIGFyZ3VtZW50czogdGhlIGBmaWxlYCwgYSAwLWJhc2VkIGluZGV4LCBhbmQgY3Vyc29yIGl0c2VsZlxuICAgKiBAcGFyYW0gY29udGV4dCB7T2JqZWN0fSAtIEFuIG9iamVjdCB3aGljaCB3aWxsIGJlIHRoZSB2YWx1ZSBvZiBgdGhpc2AgaW5zaWRlIGBjYWxsYmFja2BcbiAgICogQHN1bW1hcnkgQ2FsbCBgY2FsbGJhY2tgIG9uY2UgZm9yIGVhY2ggbWF0Y2hpbmcgZG9jdW1lbnQsIHNlcXVlbnRpYWxseSBhbmQgc3luY2hyb25vdXNseS5cbiAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICovXG4gIGZvckVhY2goY2FsbGJhY2ssIGNvbnRleHQgPSB7fSkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtmb3JFYWNoKCldJyk7XG4gICAgdGhpcy5jdXJzb3IuZm9yRWFjaChjYWxsYmFjaywgY29udGV4dCk7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGVhY2hcbiAgICogQHN1bW1hcnkgUmV0dXJucyBhbiBBcnJheSBvZiBGaWxlQ3Vyc29yIG1hZGUgZm9yIGVhY2ggZG9jdW1lbnQgb24gY3VycmVudCBjdXJzb3JcbiAgICogICAgICAgICAgVXNlZnVsIHdoZW4gdXNpbmcgaW4ge3sjZWFjaCBGaWxlc0N1cnNvciNlYWNofX0uLi57ey9lYWNofX0gYmxvY2sgdGVtcGxhdGUgaGVscGVyXG4gICAqIEByZXR1cm5zIHtbRmlsZUN1cnNvcl19XG4gICAqL1xuICBlYWNoKCkge1xuICAgIHJldHVybiB0aGlzLm1hcCgoZmlsZSkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBGaWxlQ3Vyc29yKGZpbGUsIHRoaXMuX2NvbGxlY3Rpb24pO1xuICAgIH0pO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBtYXBcbiAgICogQHBhcmFtIGNhbGxiYWNrIHtGdW5jdGlvbn0gLSBGdW5jdGlvbiB0byBjYWxsLiBJdCB3aWxsIGJlIGNhbGxlZCB3aXRoIHRocmVlIGFyZ3VtZW50czogdGhlIGBmaWxlYCwgYSAwLWJhc2VkIGluZGV4LCBhbmQgY3Vyc29yIGl0c2VsZlxuICAgKiBAcGFyYW0gY29udGV4dCB7T2JqZWN0fSAtIEFuIG9iamVjdCB3aGljaCB3aWxsIGJlIHRoZSB2YWx1ZSBvZiBgdGhpc2AgaW5zaWRlIGBjYWxsYmFja2BcbiAgICogQHN1bW1hcnkgTWFwIGBjYWxsYmFja2Agb3ZlciBhbGwgbWF0Y2hpbmcgZG9jdW1lbnRzLiBSZXR1cm5zIGFuIEFycmF5LlxuICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAqL1xuICBtYXAoY2FsbGJhY2ssIGNvbnRleHQgPSB7fSkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFttYXAoKV0nKTtcbiAgICByZXR1cm4gdGhpcy5jdXJzb3IubWFwKGNhbGxiYWNrLCBjb250ZXh0KTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgY3VycmVudFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGN1cnJlbnQgaXRlbSBvbiBDdXJzb3IsIGlmIGF2YWlsYWJsZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fHVuZGVmaW5lZH1cbiAgICovXG4gIGN1cnJlbnQoKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW2N1cnJlbnQoKV0nKTtcbiAgICBpZiAodGhpcy5fY3VycmVudCA8IDApIHtcbiAgICAgIHRoaXMuX2N1cnJlbnQgPSAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mZXRjaCgpW3RoaXMuX2N1cnJlbnRdO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBvYnNlcnZlXG4gICAqIEBwYXJhbSBjYWxsYmFja3Mge09iamVjdH0gLSBGdW5jdGlvbnMgdG8gY2FsbCB0byBkZWxpdmVyIHRoZSByZXN1bHQgc2V0IGFzIGl0IGNoYW5nZXNcbiAgICogQHN1bW1hcnkgV2F0Y2ggYSBxdWVyeS4gUmVjZWl2ZSBjYWxsYmFja3MgYXMgdGhlIHJlc3VsdCBzZXQgY2hhbmdlcy5cbiAgICogQHVybCBodHRwOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI01vbmdvLUN1cnNvci1vYnNlcnZlXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IC0gbGl2ZSBxdWVyeSBoYW5kbGVcbiAgICovXG4gIG9ic2VydmUoY2FsbGJhY2tzKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW29ic2VydmUoKV0nKTtcbiAgICByZXR1cm4gdGhpcy5jdXJzb3Iub2JzZXJ2ZShjYWxsYmFja3MpO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBvYnNlcnZlQ2hhbmdlc1xuICAgKiBAcGFyYW0gY2FsbGJhY2tzIHtPYmplY3R9IC0gRnVuY3Rpb25zIHRvIGNhbGwgdG8gZGVsaXZlciB0aGUgcmVzdWx0IHNldCBhcyBpdCBjaGFuZ2VzXG4gICAqIEBzdW1tYXJ5IFdhdGNoIGEgcXVlcnkuIFJlY2VpdmUgY2FsbGJhY2tzIGFzIHRoZSByZXN1bHQgc2V0IGNoYW5nZXMuIE9ubHkgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gdGhlIG9sZCBhbmQgbmV3IGRvY3VtZW50cyBhcmUgcGFzc2VkIHRvIHRoZSBjYWxsYmFja3MuXG4gICAqIEB1cmwgaHR0cDovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNNb25nby1DdXJzb3Itb2JzZXJ2ZUNoYW5nZXNcbiAgICogQHJldHVybnMge09iamVjdH0gLSBsaXZlIHF1ZXJ5IGhhbmRsZVxuICAgKi9cbiAgb2JzZXJ2ZUNoYW5nZXMoY2FsbGJhY2tzKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW29ic2VydmVDaGFuZ2VzKCldJyk7XG4gICAgcmV0dXJuIHRoaXMuY3Vyc29yLm9ic2VydmVDaGFuZ2VzKGNhbGxiYWNrcyk7XG4gIH1cbn1cbiIsImltcG9ydCB7IGNoZWNrIH0gZnJvbSAnbWV0ZW9yL2NoZWNrJztcblxuY29uc3QgaGVscGVycyA9IHtcbiAgaXNVbmRlZmluZWQob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdm9pZCAwO1xuICB9LFxuICBpc09iamVjdChvYmopIHtcbiAgICBpZiAodGhpcy5pc0FycmF5KG9iaikgfHwgdGhpcy5pc0Z1bmN0aW9uKG9iaikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gIH0sXG4gIGlzQXJyYXkob2JqKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkob2JqKTtcbiAgfSxcbiAgaXNCb29sZWFuKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHRydWUgfHwgb2JqID09PSBmYWxzZSB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xuICB9LFxuICBpc0Z1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nIHx8IGZhbHNlO1xuICB9LFxuICBpc0VtcHR5KG9iaikge1xuICAgIGlmICh0aGlzLmlzRGF0ZShvYmopKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLmlzT2JqZWN0KG9iaikpIHtcbiAgICAgIHJldHVybiAhT2JqZWN0LmtleXMob2JqKS5sZW5ndGg7XG4gICAgfVxuICAgIGlmICh0aGlzLmlzQXJyYXkob2JqKSB8fCB0aGlzLmlzU3RyaW5nKG9iaikpIHtcbiAgICAgIHJldHVybiAhb2JqLmxlbmd0aDtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuICBjbG9uZShvYmopIHtcbiAgICBpZiAoIXRoaXMuaXNPYmplY3Qob2JqKSkgcmV0dXJuIG9iajtcbiAgICByZXR1cm4gdGhpcy5pc0FycmF5KG9iaikgPyBvYmouc2xpY2UoKSA6IE9iamVjdC5hc3NpZ24oe30sIG9iaik7XG4gIH0sXG4gIGhhcyhfb2JqLCBwYXRoKSB7XG4gICAgbGV0IG9iaiA9IF9vYmo7XG4gICAgaWYgKCF0aGlzLmlzT2JqZWN0KG9iaikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkocGF0aCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmlzT2JqZWN0KG9iaikgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgbGVuZ3RoID0gcGF0aC5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwYXRoW2ldKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBvYmogPSBvYmpbcGF0aFtpXV07XG4gICAgfVxuICAgIHJldHVybiAhIWxlbmd0aDtcbiAgfSxcbiAgb21pdChvYmosIC4uLmtleXMpIHtcbiAgICBjb25zdCBjbGVhciA9IE9iamVjdC5hc3NpZ24oe30sIG9iaik7XG4gICAgZm9yIChsZXQgaSA9IGtleXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGRlbGV0ZSBjbGVhcltrZXlzW2ldXTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xlYXI7XG4gIH0sXG4gIG5vdzogRGF0ZS5ub3csXG4gIHRocm90dGxlKGZ1bmMsIHdhaXQsIG9wdGlvbnMgPSB7fSkge1xuICAgIGxldCBwcmV2aW91cyA9IDA7XG4gICAgbGV0IHRpbWVvdXQgPSBudWxsO1xuICAgIGxldCByZXN1bHQ7XG4gICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgbGV0IHNlbGY7XG4gICAgbGV0IGFyZ3M7XG5cbiAgICBjb25zdCBsYXRlciA9ICgpID0+IHtcbiAgICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiB0aGF0Lm5vdygpO1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgaWYgKCF0aW1lb3V0KSB7XG4gICAgICAgIHNlbGYgPSBhcmdzID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgdGhyb3R0bGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3Qgbm93ID0gdGhhdC5ub3coKTtcbiAgICAgIGlmICghcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSkgcHJldmlvdXMgPSBub3c7XG4gICAgICBjb25zdCByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICAgIHNlbGYgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGlmIChyZW1haW5pbmcgPD0gMCB8fCByZW1haW5pbmcgPiB3YWl0KSB7XG4gICAgICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHByZXZpb3VzID0gbm93O1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgICBzZWxmID0gYXJncyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICB0aHJvdHRsZWQuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgcHJldmlvdXMgPSAwO1xuICAgICAgdGltZW91dCA9IHNlbGYgPSBhcmdzID0gbnVsbDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRocm90dGxlZDtcbiAgfVxufTtcblxuY29uc3QgX2hlbHBlcnMgPSBbJ1N0cmluZycsICdOdW1iZXInLCAnRGF0ZSddO1xuZm9yIChsZXQgaSA9IDA7IGkgPCBfaGVscGVycy5sZW5ndGg7IGkrKykge1xuICBoZWxwZXJzWydpcycgKyBfaGVscGVyc1tpXV0gPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCAnICsgX2hlbHBlcnNbaV0gKyAnXSc7XG4gIH07XG59XG5cbi8qXG4gKiBAY29uc3Qge0Z1bmN0aW9ufSBmaXhKU09OUGFyc2UgLSBGaXggaXNzdWUgd2l0aCBEYXRlIHBhcnNlXG4gKi9cbmNvbnN0IGZpeEpTT05QYXJzZSA9IGZ1bmN0aW9uKG9iaikge1xuICBmb3IgKGxldCBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhlbHBlcnMuaXNTdHJpbmcob2JqW2tleV0pICYmICEhfm9ialtrZXldLmluZGV4T2YoJz0tLUpTT04tREFURS0tPScpKSB7XG4gICAgICBvYmpba2V5XSA9IG9ialtrZXldLnJlcGxhY2UoJz0tLUpTT04tREFURS0tPScsICcnKTtcbiAgICAgIG9ialtrZXldID0gbmV3IERhdGUocGFyc2VJbnQob2JqW2tleV0pKTtcbiAgICB9IGVsc2UgaWYgKGhlbHBlcnMuaXNPYmplY3Qob2JqW2tleV0pKSB7XG4gICAgICBvYmpba2V5XSA9IGZpeEpTT05QYXJzZShvYmpba2V5XSk7XG4gICAgfSBlbHNlIGlmIChoZWxwZXJzLmlzQXJyYXkob2JqW2tleV0pKSB7XG4gICAgICBsZXQgdjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqW2tleV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdiA9IG9ialtrZXldW2ldO1xuICAgICAgICBpZiAoaGVscGVycy5pc09iamVjdCh2KSkge1xuICAgICAgICAgIG9ialtrZXldW2ldID0gZml4SlNPTlBhcnNlKHYpO1xuICAgICAgICB9IGVsc2UgaWYgKGhlbHBlcnMuaXNTdHJpbmcodikgJiYgISF+di5pbmRleE9mKCc9LS1KU09OLURBVEUtLT0nKSkge1xuICAgICAgICAgIHYgPSB2LnJlcGxhY2UoJz0tLUpTT04tREFURS0tPScsICcnKTtcbiAgICAgICAgICBvYmpba2V5XVtpXSA9IG5ldyBEYXRlKHBhcnNlSW50KHYpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gb2JqO1xufTtcblxuLypcbiAqIEBjb25zdCB7RnVuY3Rpb259IGZpeEpTT05TdHJpbmdpZnkgLSBGaXggaXNzdWUgd2l0aCBEYXRlIHN0cmluZ2lmeVxuICovXG5jb25zdCBmaXhKU09OU3RyaW5naWZ5ID0gZnVuY3Rpb24ob2JqKSB7XG4gIGZvciAobGV0IGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGVscGVycy5pc0RhdGUob2JqW2tleV0pKSB7XG4gICAgICBvYmpba2V5XSA9IGA9LS1KU09OLURBVEUtLT0keytvYmpba2V5XX1gO1xuICAgIH0gZWxzZSBpZiAoaGVscGVycy5pc09iamVjdChvYmpba2V5XSkpIHtcbiAgICAgIG9ialtrZXldID0gZml4SlNPTlN0cmluZ2lmeShvYmpba2V5XSk7XG4gICAgfSBlbHNlIGlmIChoZWxwZXJzLmlzQXJyYXkob2JqW2tleV0pKSB7XG4gICAgICBsZXQgdjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqW2tleV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdiA9IG9ialtrZXldW2ldO1xuICAgICAgICBpZiAoaGVscGVycy5pc09iamVjdCh2KSkge1xuICAgICAgICAgIG9ialtrZXldW2ldID0gZml4SlNPTlN0cmluZ2lmeSh2KTtcbiAgICAgICAgfSBlbHNlIGlmIChoZWxwZXJzLmlzRGF0ZSh2KSkge1xuICAgICAgICAgIG9ialtrZXldW2ldID0gYD0tLUpTT04tREFURS0tPSR7K3Z9YDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gb2JqO1xufTtcblxuLypcbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQHByaXZhdGVcbiAqIEBuYW1lIGZvcm1hdEZsZVVSTFxuICogQHBhcmFtIHtPYmplY3R9IGZpbGVSZWYgLSBGaWxlIHJlZmVyZW5jZSBvYmplY3RcbiAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJzaW9uIC0gW09wdGlvbmFsXSBWZXJzaW9uIG9mIGZpbGUgeW91IHdvdWxkIGxpa2UgYnVpbGQgVVJMIGZvclxuICogQHBhcmFtIHtTdHJpbmd9IFVSSUJhc2UgLSBbT3B0aW9uYWxdIFVSSSBiYXNlLCBzZWUgLSBodHRwczovL2dpdGh1Yi5jb20vVmVsaW92R3JvdXAvTWV0ZW9yLUZpbGVzL2lzc3Vlcy82MjZcbiAqIEBzdW1tYXJ5IFJldHVybnMgZm9ybWF0dGVkIFVSTCBmb3IgZmlsZVxuICogQHJldHVybnMge1N0cmluZ30gRG93bmxvYWRhYmxlIGxpbmtcbiAqL1xuY29uc3QgZm9ybWF0RmxlVVJMID0gKGZpbGVSZWYsIHZlcnNpb24gPSAnb3JpZ2luYWwnLCBfVVJJQmFzZSA9IChfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fIHx8IHt9KS5ST09UX1VSTCkgPT4ge1xuICBjaGVjayhmaWxlUmVmLCBPYmplY3QpO1xuICBjaGVjayh2ZXJzaW9uLCBTdHJpbmcpO1xuICBsZXQgVVJJQmFzZSA9IF9VUklCYXNlO1xuXG4gIGlmICghaGVscGVycy5pc1N0cmluZyhVUklCYXNlKSkge1xuICAgIFVSSUJhc2UgPSAoX19tZXRlb3JfcnVudGltZV9jb25maWdfXyB8fCB7fSkuUk9PVF9VUkwgfHwgJy8nO1xuICB9XG5cbiAgY29uc3QgX3Jvb3QgPSBVUklCYXNlLnJlcGxhY2UoL1xcLyskLywgJycpO1xuICBjb25zdCB2UmVmID0gKGZpbGVSZWYudmVyc2lvbnMgJiYgZmlsZVJlZi52ZXJzaW9uc1t2ZXJzaW9uXSkgfHwgZmlsZVJlZiB8fCB7fTtcblxuICBsZXQgZXh0O1xuICBpZiAoaGVscGVycy5pc1N0cmluZyh2UmVmLmV4dGVuc2lvbikpIHtcbiAgICBleHQgPSBgLiR7dlJlZi5leHRlbnNpb24ucmVwbGFjZSgvXlxcLi8sICcnKX1gO1xuICB9IGVsc2Uge1xuICAgIGV4dCA9ICcnO1xuICB9XG5cbiAgaWYgKGZpbGVSZWYucHVibGljID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIF9yb290ICsgKHZlcnNpb24gPT09ICdvcmlnaW5hbCcgPyBgJHtmaWxlUmVmLl9kb3dubG9hZFJvdXRlfS8ke2ZpbGVSZWYuX2lkfSR7ZXh0fWAgOiBgJHtmaWxlUmVmLl9kb3dubG9hZFJvdXRlfS8ke3ZlcnNpb259LSR7ZmlsZVJlZi5faWR9JHtleHR9YCk7XG4gIH1cbiAgcmV0dXJuIF9yb290ICsgYCR7ZmlsZVJlZi5fZG93bmxvYWRSb3V0ZX0vJHtmaWxlUmVmLl9jb2xsZWN0aW9uTmFtZX0vJHtmaWxlUmVmLl9pZH0vJHt2ZXJzaW9ufS8ke2ZpbGVSZWYuX2lkfSR7ZXh0fWA7XG59O1xuXG5leHBvcnQgeyBmaXhKU09OUGFyc2UsIGZpeEpTT05TdHJpbmdpZnksIGZvcm1hdEZsZVVSTCwgaGVscGVycyB9O1xuIiwiaW1wb3J0IGZzICAgICAgICAgIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IE1ldGVvciB9ICBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IGhlbHBlcnMgfSBmcm9tICcuL2xpYi5qcyc7XG5jb25zdCBOT09QID0gKCkgPT4ge307XG5cbi8qXG4gKiBAY29uc3Qge09iamVjdH0gYm91bmQgICAtIE1ldGVvci5iaW5kRW52aXJvbm1lbnQgKEZpYmVyIHdyYXBwZXIpXG4gKiBAY29uc3Qge09iamVjdH0gZmRDYWNoZSAtIEZpbGUgRGVzY3JpcHRvcnMgQ2FjaGVcbiAqL1xuY29uc3QgYm91bmQgICA9IE1ldGVvci5iaW5kRW52aXJvbm1lbnQoY2FsbGJhY2sgPT4gY2FsbGJhY2soKSk7XG5jb25zdCBmZENhY2hlID0ge307XG5cbi8qXG4gKiBAcHJpdmF0ZVxuICogQGxvY3VzIFNlcnZlclxuICogQGNsYXNzIFdyaXRlU3RyZWFtXG4gKiBAcGFyYW0gcGF0aCAgICAgIHtTdHJpbmd9IC0gUGF0aCB0byBmaWxlIG9uIEZTXG4gKiBAcGFyYW0gbWF4TGVuZ3RoIHtOdW1iZXJ9IC0gTWF4IGFtb3VudCBvZiBjaHVua3MgaW4gc3RyZWFtXG4gKiBAcGFyYW0gZmlsZSAgICAgIHtPYmplY3R9IC0gZmlsZVJlZiBPYmplY3RcbiAqIEBzdW1tYXJ5IHdyaXRhYmxlU3RyZWFtIHdyYXBwZXIgY2xhc3MsIG1ha2VzIHN1cmUgY2h1bmtzIGlzIHdyaXR0ZW4gaW4gZ2l2ZW4gb3JkZXIuIEltcGxlbWVudGF0aW9uIG9mIHF1ZXVlIHN0cmVhbS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV3JpdGVTdHJlYW0ge1xuICBjb25zdHJ1Y3RvcihwYXRoLCBtYXhMZW5ndGgsIGZpbGUsIHBlcm1pc3Npb25zKSB7XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLm1heExlbmd0aCA9IG1heExlbmd0aDtcbiAgICB0aGlzLmZpbGUgPSBmaWxlO1xuICAgIHRoaXMucGVybWlzc2lvbnMgPSBwZXJtaXNzaW9ucztcbiAgICBpZiAoIXRoaXMucGF0aCB8fCAhaGVscGVycy5pc1N0cmluZyh0aGlzLnBhdGgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5mZCAgICAgICAgICAgID0gbnVsbDtcbiAgICB0aGlzLndyaXR0ZW5DaHVua3MgPSAwO1xuICAgIHRoaXMuZW5kZWQgICAgICAgICA9IGZhbHNlO1xuICAgIHRoaXMuYWJvcnRlZCAgICAgICA9IGZhbHNlO1xuXG4gICAgaWYgKGZkQ2FjaGVbdGhpcy5wYXRoXSAmJiAhZmRDYWNoZVt0aGlzLnBhdGhdLmVuZGVkICYmICFmZENhY2hlW3RoaXMucGF0aF0uYWJvcnRlZCkge1xuICAgICAgdGhpcy5mZCA9IGZkQ2FjaGVbdGhpcy5wYXRoXS5mZDtcbiAgICAgIHRoaXMud3JpdHRlbkNodW5rcyA9IGZkQ2FjaGVbdGhpcy5wYXRoXS53cml0dGVuQ2h1bmtzO1xuICAgIH0gZWxzZSB7XG4gICAgICBmcy5lbnN1cmVGaWxlKHRoaXMucGF0aCwgKGVmRXJyb3IpID0+IHtcbiAgICAgICAgYm91bmQoKCkgPT4ge1xuICAgICAgICAgIGlmIChlZkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLmFib3J0KCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgJ1tGaWxlc0NvbGxlY3Rpb25dIFt3cml0ZVN0cmVhbV0gW2Vuc3VyZUZpbGVdIFtFcnJvcjpdICcgKyBlZkVycm9yKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZnMub3Blbih0aGlzLnBhdGgsICdyKycsIHRoaXMucGVybWlzc2lvbnMsIChvRXJyb3IsIGZkKSA9PiB7XG4gICAgICAgICAgICAgIGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAob0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgJ1tGaWxlc0NvbGxlY3Rpb25dIFt3cml0ZVN0cmVhbV0gW2Vuc3VyZUZpbGVdIFtvcGVuXSBbRXJyb3I6XSAnICsgb0Vycm9yKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdGhpcy5mZCA9IGZkO1xuICAgICAgICAgICAgICAgICAgZmRDYWNoZVt0aGlzLnBhdGhdID0gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qXG4gICAqIEBtZW1iZXJPZiB3cml0ZVN0cmVhbVxuICAgKiBAbmFtZSB3cml0ZVxuICAgKiBAcGFyYW0ge051bWJlcn0gbnVtIC0gQ2h1bmsgcG9zaXRpb24gaW4gYSBzdHJlYW1cbiAgICogQHBhcmFtIHtCdWZmZXJ9IGNodW5rIC0gQnVmZmVyIChjaHVuayBiaW5hcnkgZGF0YSlcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFja1xuICAgKiBAc3VtbWFyeSBXcml0ZSBjaHVuayBpbiBnaXZlbiBvcmRlclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSBUcnVlIGlmIGNodW5rIGlzIHNlbnQgdG8gc3RyZWFtLCBmYWxzZSBpZiBjaHVuayBpcyBzZXQgaW50byBxdWV1ZVxuICAgKi9cbiAgd3JpdGUobnVtLCBjaHVuaywgY2FsbGJhY2spIHtcbiAgICBpZiAoIXRoaXMuYWJvcnRlZCAmJiAhdGhpcy5lbmRlZCkge1xuICAgICAgaWYgKHRoaXMuZmQpIHtcbiAgICAgICAgZnMud3JpdGUodGhpcy5mZCwgY2h1bmssIDAsIGNodW5rLmxlbmd0aCwgKG51bSAtIDEpICogdGhpcy5maWxlLmNodW5rU2l6ZSwgKGVycm9yLCB3cml0dGVuLCBidWZmZXIpID0+IHtcbiAgICAgICAgICBib3VuZCgoKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhlcnJvciwgd3JpdHRlbiwgYnVmZmVyKTtcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tGaWxlc0NvbGxlY3Rpb25dIFt3cml0ZVN0cmVhbV0gW3dyaXRlXSBbRXJyb3I6XScsIGVycm9yKTtcbiAgICAgICAgICAgICAgdGhpcy5hYm9ydCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgKyt0aGlzLndyaXR0ZW5DaHVua3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgTWV0ZW9yLnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHRoaXMud3JpdGUobnVtLCBjaHVuaywgY2FsbGJhY2spO1xuICAgICAgICB9LCAyNSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qXG4gICAqIEBtZW1iZXJPZiB3cml0ZVN0cmVhbVxuICAgKiBAbmFtZSBlbmRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFja1xuICAgKiBAc3VtbWFyeSBGaW5pc2hlcyB3cml0aW5nIHRvIHdyaXRhYmxlU3RyZWFtLCBvbmx5IGFmdGVyIGFsbCBjaHVua3MgaW4gcXVldWUgaXMgd3JpdHRlblxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSBUcnVlIGlmIHN0cmVhbSBpcyBmdWxmaWxsZWQsIGZhbHNlIGlmIHF1ZXVlIGlzIGluIHByb2dyZXNzXG4gICAqL1xuICBlbmQoY2FsbGJhY2spIHtcbiAgICBpZiAoIXRoaXMuYWJvcnRlZCAmJiAhdGhpcy5lbmRlZCkge1xuICAgICAgaWYgKHRoaXMud3JpdHRlbkNodW5rcyA9PT0gdGhpcy5tYXhMZW5ndGgpIHtcbiAgICAgICAgZnMuY2xvc2UodGhpcy5mZCwgKCkgPT4ge1xuICAgICAgICAgIGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSBmZENhY2hlW3RoaXMucGF0aF07XG4gICAgICAgICAgICB0aGlzLmVuZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHZvaWQgMCwgdHJ1ZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgZnMuc3RhdCh0aGlzLnBhdGgsIChlcnJvciwgc3RhdCkgPT4ge1xuICAgICAgICBib3VuZCgoKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnJvciAmJiBzdGF0KSB7XG4gICAgICAgICAgICB0aGlzLndyaXR0ZW5DaHVua3MgPSBNYXRoLmNlaWwoc3RhdC5zaXplIC8gdGhpcy5maWxlLmNodW5rU2l6ZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIE1ldGVvci5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW5kKGNhbGxiYWNrKTtcbiAgICAgICAgICB9LCAyNSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHZvaWQgMCwgdGhpcy5lbmRlZCk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qXG4gICAqIEBtZW1iZXJPZiB3cml0ZVN0cmVhbVxuICAgKiBAbmFtZSBhYm9ydFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIENhbGxiYWNrXG4gICAqIEBzdW1tYXJ5IEFib3J0cyB3cml0aW5nIHRvIHdyaXRhYmxlU3RyZWFtLCByZW1vdmVzIGNyZWF0ZWQgZmlsZVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSBUcnVlXG4gICAqL1xuICBhYm9ydChjYWxsYmFjaykge1xuICAgIHRoaXMuYWJvcnRlZCA9IHRydWU7XG4gICAgZGVsZXRlIGZkQ2FjaGVbdGhpcy5wYXRoXTtcbiAgICBmcy51bmxpbmsodGhpcy5wYXRoLCAoY2FsbGJhY2sgfHwgTk9PUCkpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLypcbiAgICogQG1lbWJlck9mIHdyaXRlU3RyZWFtXG4gICAqIEBuYW1lIHN0b3BcbiAgICogQHN1bW1hcnkgU3RvcCB3cml0aW5nIHRvIHdyaXRhYmxlU3RyZWFtXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSAtIFRydWVcbiAgICovXG4gIHN0b3AoKSB7XG4gICAgdGhpcy5hYm9ydGVkID0gdHJ1ZTtcbiAgICBkZWxldGUgZmRDYWNoZVt0aGlzLnBhdGhdO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG4iXX0=
