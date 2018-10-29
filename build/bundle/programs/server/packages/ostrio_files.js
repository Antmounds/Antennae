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
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let WebApp;
module.link("meteor/webapp", {
  WebApp(v) {
    WebApp = v;
  }

}, 1);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 2);
let Random;
module.link("meteor/random", {
  Random(v) {
    Random = v;
  }

}, 3);
let Cookies;
module.link("meteor/ostrio:cookies", {
  Cookies(v) {
    Cookies = v;
  }

}, 4);
let WriteStream;
module.link("./write-stream.js", {
  default(v) {
    WriteStream = v;
  }

}, 5);
let check, Match;
module.link("meteor/check", {
  check(v) {
    check = v;
  },

  Match(v) {
    Match = v;
  }

}, 6);
let FilesCollectionCore;
module.link("./core.js", {
  default(v) {
    FilesCollectionCore = v;
  }

}, 7);
let fixJSONParse, fixJSONStringify, helpers;
module.link("./lib.js", {
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
module.link("fs-extra", {
  default(v) {
    fs = v;
  }

}, 9);
let nodeQs;
module.link("querystring", {
  default(v) {
    nodeQs = v;
  }

}, 10);
let request;
module.link("request", {
  default(v) {
    request = v;
  }

}, 11);
let fileType;
module.link("file-type", {
  default(v) {
    fileType = v;
  }

}, 12);
let nodePath;
module.link("path", {
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
module.link("eventemitter3", {
  EventEmitter(v) {
    EventEmitter = v;
  }

}, 0);
let check, Match;
module.link("meteor/check", {
  check(v) {
    check = v;
  },

  Match(v) {
    Match = v;
  }

}, 1);
let formatFleURL, helpers;
module.link("./lib.js", {
  formatFleURL(v) {
    formatFleURL = v;
  },

  helpers(v) {
    helpers = v;
  }

}, 2);
let FilesCursor, FileCursor;
module.link("./cursor.js", {
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
module.link("meteor/meteor", {
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
module.link("meteor/check", {
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
module.link("fs-extra", {
  default(v) {
    fs = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let helpers;
module.link("./lib.js", {
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

},"node_modules":{"fs-extra":{"package.json":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/fs-extra/package.json                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "fs-extra",
  "version": "7.0.0",
  "main": "./lib/index.js"
};

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

}}},"eventemitter3":{"package.json":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/eventemitter3/package.json                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "eventemitter3",
  "version": "3.1.0",
  "main": "index.js"
};

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

}},"request":{"package.json":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/request/package.json                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "request",
  "version": "2.88.0",
  "main": "index.js"
};

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

}},"file-type":{"package.json":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/file-type/package.json                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "file-type",
  "version": "9.0.0"
};

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmZpbGVzL3NlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmZpbGVzL2NvcmUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29zdHJpbzpmaWxlcy9jdXJzb3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29zdHJpbzpmaWxlcy9saWIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29zdHJpbzpmaWxlcy93cml0ZS1zdHJlYW0uanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiRmlsZXNDb2xsZWN0aW9uIiwiTW9uZ28iLCJsaW5rIiwidiIsIldlYkFwcCIsIk1ldGVvciIsIlJhbmRvbSIsIkNvb2tpZXMiLCJXcml0ZVN0cmVhbSIsImRlZmF1bHQiLCJjaGVjayIsIk1hdGNoIiwiRmlsZXNDb2xsZWN0aW9uQ29yZSIsImZpeEpTT05QYXJzZSIsImZpeEpTT05TdHJpbmdpZnkiLCJoZWxwZXJzIiwiZnMiLCJub2RlUXMiLCJyZXF1ZXN0IiwiZmlsZVR5cGUiLCJub2RlUGF0aCIsImJvdW5kIiwiYmluZEVudmlyb25tZW50IiwiY2FsbGJhY2siLCJOT09QIiwiY29uc3RydWN0b3IiLCJjb25maWciLCJzdG9yYWdlUGF0aCIsImRlYnVnIiwic2NoZW1hIiwicHVibGljIiwic3RyaWN0IiwiY2h1bmtTaXplIiwicHJvdGVjdGVkIiwiY29sbGVjdGlvbiIsInBlcm1pc3Npb25zIiwiY2FjaGVDb250cm9sIiwiZG93bmxvYWRSb3V0ZSIsIm9uQWZ0ZXJVcGxvYWQiLCJvbkFmdGVyUmVtb3ZlIiwiZGlzYWJsZVVwbG9hZCIsIm9uQmVmb3JlUmVtb3ZlIiwiaW50ZWdyaXR5Q2hlY2siLCJjb2xsZWN0aW9uTmFtZSIsIm9uQmVmb3JlVXBsb2FkIiwibmFtaW5nRnVuY3Rpb24iLCJyZXNwb25zZUhlYWRlcnMiLCJkaXNhYmxlRG93bmxvYWQiLCJhbGxvd0NsaWVudENvZGUiLCJkb3dubG9hZENhbGxiYWNrIiwib25Jbml0aWF0ZVVwbG9hZCIsImludGVyY2VwdERvd25sb2FkIiwiY29udGludWVVcGxvYWRUVEwiLCJwYXJlbnREaXJQZXJtaXNzaW9ucyIsIl9wcmVDb2xsZWN0aW9uIiwiX3ByZUNvbGxlY3Rpb25OYW1lIiwic2VsZiIsImlzQm9vbGVhbiIsIk1hdGgiLCJmbG9vciIsImlzU3RyaW5nIiwiQ29sbGVjdGlvbiIsIl9uYW1lIiwiZmlsZXNDb2xsZWN0aW9uIiwiU3RyaW5nIiwiRXJyb3IiLCJyZXBsYWNlIiwiaXNGdW5jdGlvbiIsImlzTnVtYmVyIiwicGFyc2VJbnQiLCJpc09iamVjdCIsIl9jdXJyZW50VXBsb2FkcyIsInJlc3BvbnNlQ29kZSIsImZpbGVSZWYiLCJ2ZXJzaW9uUmVmIiwiaGVhZGVycyIsIlByYWdtYSIsIlRyYWlsZXIiLCJzaXplIiwiQ29ubmVjdGlvbiIsInR5cGUiLCJzZXAiLCJzcCIsImFwcGx5IiwiYXJndW1lbnRzIiwibm9ybWFsaXplIiwiX2RlYnVnIiwibWtkaXJzIiwibW9kZSIsImVycm9yIiwiQm9vbGVhbiIsIk51bWJlciIsIkZ1bmN0aW9uIiwiT25lT2YiLCJPYmplY3QiLCJfZW5zdXJlSW5kZXgiLCJjcmVhdGVkQXQiLCJleHBpcmVBZnRlclNlY29uZHMiLCJiYWNrZ3JvdW5kIiwiX3ByZUNvbGxlY3Rpb25DdXJzb3IiLCJmaW5kIiwiZmllbGRzIiwiX2lkIiwiaXNGaW5pc2hlZCIsIm9ic2VydmUiLCJjaGFuZ2VkIiwiZG9jIiwicmVtb3ZlIiwicmVtb3ZlZCIsInN0b3AiLCJlbmQiLCJhYm9ydCIsIl9jcmVhdGVTdHJlYW0iLCJwYXRoIiwib3B0cyIsImZpbGVMZW5ndGgiLCJfY29udGludWVVcGxvYWQiLCJmaWxlIiwiYWJvcnRlZCIsImVuZGVkIiwiY29udFVwbGQiLCJmaW5kT25lIiwiX2NoZWNrQWNjZXNzIiwiaHR0cCIsInJlc3VsdCIsInVzZXIiLCJ1c2VySWQiLCJfZ2V0VXNlciIsInBhcmFtcyIsImNhbGwiLCJhc3NpZ24iLCJyYyIsInRleHQiLCJyZXNwb25zZSIsImhlYWRlcnNTZW50Iiwid3JpdGVIZWFkIiwibGVuZ3RoIiwiZmluaXNoZWQiLCJfbWV0aG9kTmFtZXMiLCJfQWJvcnQiLCJfV3JpdGUiLCJfU3RhcnQiLCJfUmVtb3ZlIiwib24iLCJfaGFuZGxlVXBsb2FkIiwiX2ZpbmlzaFVwbG9hZCIsIl9oYW5kbGVVcGxvYWRTeW5jIiwid3JhcEFzeW5jIiwiYmluZCIsImNvbm5lY3RIYW5kbGVycyIsInVzZSIsImh0dHBSZXEiLCJodHRwUmVzcCIsIm5leHQiLCJfcGFyc2VkVXJsIiwiaW5kZXhPZiIsIm1ldGhvZCIsImhhbmRsZUVycm9yIiwiX2Vycm9yIiwiY29uc29sZSIsIndhcm4iLCJ0cmFjZSIsInRvU3RyaW5nIiwiSlNPTiIsInN0cmluZ2lmeSIsImJvZHkiLCJkYXRhIiwic2VydmVyIiwic2Vzc2lvbnMiLCJoYXMiLCJmaWxlSWQiLCJlb2YiLCJCdWZmZXIiLCJmcm9tIiwiYmluRGF0YSIsImJ1ZmZFcnIiLCJjaHVua0lkIiwiX3ByZXBhcmVVcGxvYWQiLCJtZXRhIiwiZW1pdCIsInBhcnNlIiwianNvbkVyciIsIl9fX3MiLCJuYW1lIiwiY2xvbmUiLCJEYXRlIiwibWF4TGVuZ3RoIiwiaW5zZXJ0Iiwib21pdCIsInJldHVybk1ldGEiLCJ1cGxvYWRSb3V0ZSIsImh0dHBSZXNwRXJyIiwidXJpIiwidXJpcyIsInN1YnN0cmluZyIsInNwbGl0IiwicXVlcnkiLCJ2ZXJzaW9uIiwiZG93bmxvYWQiLCJfZmlsZSIsIl9tZXRob2RzIiwic2VsZWN0b3IiLCJ1c2VyRnVuY3MiLCJ1c2VycyIsImN1cnNvciIsImNvdW50IiwiRlNOYW1lIiwiT3B0aW9uYWwiLCJlIiwiX29wdHMiLCJ1bmJsb2NrIiwiaGFuZGxlVXBsb2FkRXJyIiwidW5saW5rIiwibWV0aG9kcyIsInRyYW5zcG9ydCIsImN0eCIsImZpbGVOYW1lIiwiX2dldEZpbGVOYW1lIiwiZXh0ZW5zaW9uIiwiZXh0ZW5zaW9uV2l0aERvdCIsIl9nZXRFeHQiLCJleHQiLCJfZGF0YVRvU2NoZW1hIiwiaXNVcGxvYWRBbGxvd2VkIiwiY2IiLCJjaG1vZCIsIl9nZXRNaW1lVHlwZSIsIl91cGRhdGVGaWxlVHlwZXMiLCJjb2xJbnNlcnQiLCJ1cGRhdGUiLCIkc2V0IiwicHJlVXBkYXRlRXJyb3IiLCJ3cml0ZSIsImZpbGVEYXRhIiwibWltZSIsImJ1ZiIsImZkIiwib3BlblN5bmMiLCJiciIsInJlYWRTeW5jIiwiY2xvc2UiLCJzbGljZSIsIm10b2siLCJjb29raWUiLCJnZXQiLCJidWZmZXIiLCJfY2FsbGJhY2siLCJfcHJvY2VlZEFmdGVyVXBsb2FkIiwicHJvY2VlZEFmdGVyVXBsb2FkIiwiaWQiLCJzdHJlYW0iLCJjcmVhdGVXcml0ZVN0cmVhbSIsImZsYWdzIiwic3RyZWFtRXJyIiwiaW5zZXJ0RXJyIiwibG9hZCIsInVybCIsInBhdGhQYXJ0cyIsInN0b3JlUmVzdWx0Iiwic3RhdCIsInN0YXRzIiwidmVyc2lvbnMiLCJvcmlnaW5hbCIsInBpcGUiLCJhZGRGaWxlIiwic3RhdEVyciIsImlzRmlsZSIsIl9zdG9yYWdlUGF0aCIsImZpbGVzIiwiZm9yRWFjaCIsImRvY3MiLCJmZXRjaCIsImRlbnkiLCJydWxlcyIsImFsbG93IiwiZGVueUNsaWVudCIsImFsbG93Q2xpZW50IiwidktleSIsIl80MDQiLCJvcmlnaW5hbFVybCIsInZSZWYiLCJyZXNwb25zZVR5cGUiLCJzZXJ2ZSIsInJlYWRhYmxlU3RyZWFtIiwiX3Jlc3BvbnNlVHlwZSIsImZvcmNlMjAwIiwicGFydGlyYWwiLCJyZXFSYW5nZSIsImRpc3Bvc2l0aW9uVHlwZSIsInN0YXJ0IiwidGFrZSIsImRpc3Bvc2l0aW9uTmFtZSIsImVuY29kZVVSSSIsImVuY29kZVVSSUNvbXBvbmVudCIsImRpc3Bvc2l0aW9uRW5jb2RpbmciLCJzZXRIZWFkZXIiLCJyYW5nZSIsImFycmF5IiwiaXNOYU4iLCJwbGF5Iiwic3RyZWFtRXJyb3JIYW5kbGVyIiwia2V5IiwicmVzcG9uZCIsImNvZGUiLCJkZXN0cm95IiwiY3JlYXRlUmVhZFN0cmVhbSIsIkV2ZW50RW1pdHRlciIsImZvcm1hdEZsZVVSTCIsIkZpbGVzQ3Vyc29yIiwiRmlsZUN1cnNvciIsImluZm8iLCJsb2ciLCJwb3AiLCJ0b0xvd2VyQ2FzZSIsImlzVmlkZW8iLCJ0ZXN0IiwiaXNBdWRpbyIsImlzSW1hZ2UiLCJpc1RleHQiLCJpc0pTT04iLCJpc1BERiIsImRzIiwiX2Rvd25sb2FkUm91dGUiLCJfY29sbGVjdGlvbk5hbWUiLCJvcHRpb25zIiwiVVJJQmFzZSIsIl9faGVscGVycyIsIm9wdGlvbmFsIiwiYmxhY2tib3giLCJ1cGRhdGVkQXQiLCJfZmlsZVJlZiIsIl9jb2xsZWN0aW9uIiwicHJvcGVydHkiLCJ3aXRoIiwiX3NlbGVjdG9yIiwiX2N1cnJlbnQiLCJoYXNOZXh0IiwiaGFzUHJldmlvdXMiLCJwcmV2aW91cyIsImZpcnN0IiwibGFzdCIsImNvbnRleHQiLCJlYWNoIiwibWFwIiwiY3VycmVudCIsImNhbGxiYWNrcyIsIm9ic2VydmVDaGFuZ2VzIiwiaXNVbmRlZmluZWQiLCJvYmoiLCJpc0FycmF5IiwiQXJyYXkiLCJwcm90b3R5cGUiLCJpc0VtcHR5IiwiaXNEYXRlIiwia2V5cyIsIl9vYmoiLCJoYXNPd25Qcm9wZXJ0eSIsImkiLCJjbGVhciIsIm5vdyIsInRocm90dGxlIiwiZnVuYyIsIndhaXQiLCJ0aW1lb3V0IiwidGhhdCIsImFyZ3MiLCJsYXRlciIsImxlYWRpbmciLCJ0aHJvdHRsZWQiLCJyZW1haW5pbmciLCJjbGVhclRpbWVvdXQiLCJ0cmFpbGluZyIsInNldFRpbWVvdXQiLCJjYW5jZWwiLCJfaGVscGVycyIsIl9VUklCYXNlIiwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyIsIlJPT1RfVVJMIiwiX3Jvb3QiLCJmZENhY2hlIiwid3JpdHRlbkNodW5rcyIsImVuc3VyZUZpbGUiLCJlZkVycm9yIiwib3BlbiIsIm9FcnJvciIsIm51bSIsImNodW5rIiwid3JpdHRlbiIsImNl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QixNQUFNO0FBQzdCLGlCQUFLdFEsR0FBTCxDQUFTdkYsUUFBVDtBQUNELFdBRk0sRUFFSixFQUZJLENBQVA7QUFHRCxTQVJJLENBQUw7QUFTRCxPQVZEO0FBV0QsS0F2QkQsTUF1Qk87QUFDTEEsY0FBUSxJQUFJQSxRQUFRLENBQUMsS0FBSyxDQUFOLEVBQVMsS0FBS2dHLEtBQWQsQ0FBcEI7QUFDRDs7QUFDRCxXQUFPLEtBQVA7QUFDRDtBQUVEOzs7Ozs7Ozs7QUFPQVIsT0FBSyxDQUFDeEYsUUFBRCxFQUFXO0FBQ2QsU0FBSytGLE9BQUwsR0FBZSxJQUFmO0FBQ0EsV0FBT3FRLE9BQU8sQ0FBQyxLQUFLMVEsSUFBTixDQUFkO0FBQ0FqRyxNQUFFLENBQUNvTSxNQUFILENBQVUsS0FBS25HLElBQWYsRUFBc0IxRixRQUFRLElBQUlDLElBQWxDO0FBQ0EsV0FBTyxJQUFQO0FBQ0Q7QUFFRDs7Ozs7Ozs7QUFNQXFGLE1BQUksR0FBRztBQUNMLFNBQUtTLE9BQUwsR0FBZSxJQUFmO0FBQ0EsV0FBT3FRLE9BQU8sQ0FBQyxLQUFLMVEsSUFBTixDQUFkO0FBQ0EsV0FBTyxJQUFQO0FBQ0Q7O0FBdkk4QixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9vc3RyaW9fZmlsZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb25nbyB9ICAgICAgICAgICBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgV2ViQXBwIH0gICAgICAgICAgZnJvbSAnbWV0ZW9yL3dlYmFwcCc7XG5pbXBvcnQgeyBNZXRlb3IgfSAgICAgICAgICBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJhbmRvbSB9ICAgICAgICAgIGZyb20gJ21ldGVvci9yYW5kb20nO1xuaW1wb3J0IHsgQ29va2llcyB9ICAgICAgICAgZnJvbSAnbWV0ZW9yL29zdHJpbzpjb29raWVzJztcbmltcG9ydCBXcml0ZVN0cmVhbSAgICAgICAgIGZyb20gJy4vd3JpdGUtc3RyZWFtLmpzJztcbmltcG9ydCB7IGNoZWNrLCBNYXRjaCB9ICAgIGZyb20gJ21ldGVvci9jaGVjayc7XG5pbXBvcnQgRmlsZXNDb2xsZWN0aW9uQ29yZSBmcm9tICcuL2NvcmUuanMnO1xuaW1wb3J0IHsgZml4SlNPTlBhcnNlLCBmaXhKU09OU3RyaW5naWZ5LCBoZWxwZXJzIH0gZnJvbSAnLi9saWIuanMnO1xuXG5pbXBvcnQgZnMgICAgICAgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IG5vZGVRcyAgIGZyb20gJ3F1ZXJ5c3RyaW5nJztcbmltcG9ydCByZXF1ZXN0ICBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCBmaWxlVHlwZSBmcm9tICdmaWxlLXR5cGUnO1xuaW1wb3J0IG5vZGVQYXRoIGZyb20gJ3BhdGgnO1xuXG4vKlxuICogQGNvbnN0IHtPYmplY3R9IGJvdW5kICAtIE1ldGVvci5iaW5kRW52aXJvbm1lbnQgKEZpYmVyIHdyYXBwZXIpXG4gKiBAY29uc3Qge0Z1bmN0aW9ufSBOT09QIC0gTm8gT3BlcmF0aW9uIGZ1bmN0aW9uLCBwbGFjZWhvbGRlciBmb3IgcmVxdWlyZWQgY2FsbGJhY2tzXG4gKi9cbmNvbnN0IGJvdW5kID0gTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChjYWxsYmFjayA9PiBjYWxsYmFjaygpKTtcbmNvbnN0IE5PT1AgID0gKCkgPT4geyAgfTtcblxuLypcbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQGNsYXNzIEZpbGVzQ29sbGVjdGlvblxuICogQHBhcmFtIGNvbmZpZyAgICAgICAgICAge09iamVjdH0gICAtIFtCb3RoXSAgIENvbmZpZ3VyYXRpb24gb2JqZWN0IHdpdGggbmV4dCBwcm9wZXJ0aWVzOlxuICogQHBhcmFtIGNvbmZpZy5kZWJ1ZyAgICAge0Jvb2xlYW59ICAtIFtCb3RoXSAgIFR1cm4gb24vb2YgZGVidWdnaW5nIGFuZCBleHRyYSBsb2dnaW5nXG4gKiBAcGFyYW0gY29uZmlnLnNjaGVtYSAgICB7T2JqZWN0fSAgIC0gW0JvdGhdICAgQ29sbGVjdGlvbiBTY2hlbWFcbiAqIEBwYXJhbSBjb25maWcucHVibGljICAgIHtCb29sZWFufSAgLSBbQm90aF0gICBTdG9yZSBmaWxlcyBpbiBmb2xkZXIgYWNjZXNzaWJsZSBmb3IgcHJveHkgc2VydmVycywgZm9yIGxpbWl0cywgYW5kIG1vcmUgLSByZWFkIGRvY3NcbiAqIEBwYXJhbSBjb25maWcuc3RyaWN0ICAgIHtCb29sZWFufSAgLSBbU2VydmVyXSBTdHJpY3QgbW9kZSBmb3IgcGFydGlhbCBjb250ZW50LCBpZiBpcyBgdHJ1ZWAgc2VydmVyIHdpbGwgcmV0dXJuIGA0MTZgIHJlc3BvbnNlIGNvZGUsIHdoZW4gYHJhbmdlYCBpcyBub3Qgc3BlY2lmaWVkLCBvdGhlcndpc2Ugc2VydmVyIHJldHVybiBgMjA2YFxuICogQHBhcmFtIGNvbmZpZy5wcm90ZWN0ZWQge0Z1bmN0aW9ufSAtIFtTZXJ2ZXJdIElmIGB0cnVlYCAtIGZpbGVzIHdpbGwgYmUgc2VydmVkIG9ubHkgdG8gYXV0aG9yaXplZCB1c2VycywgaWYgYGZ1bmN0aW9uKClgIC0geW91J3JlIGFibGUgdG8gY2hlY2sgdmlzaXRvcidzIHBlcm1pc3Npb25zIGluIHlvdXIgb3duIHdheSBmdW5jdGlvbidzIGNvbnRleHQgaGFzOlxuICogIC0gYHJlcXVlc3RgXG4gKiAgLSBgcmVzcG9uc2VgXG4gKiAgLSBgdXNlcigpYFxuICogIC0gYHVzZXJJZGBcbiAqIEBwYXJhbSBjb25maWcuY2h1bmtTaXplICAgICAge051bWJlcn0gIC0gW0JvdGhdIFVwbG9hZCBjaHVuayBzaXplLCBkZWZhdWx0OiA1MjQyODggYnl0ZXMgKDAsNSBNYilcbiAqIEBwYXJhbSBjb25maWcucGVybWlzc2lvbnMgICAge051bWJlcn0gIC0gW1NlcnZlcl0gUGVybWlzc2lvbnMgd2hpY2ggd2lsbCBiZSBzZXQgdG8gdXBsb2FkZWQgZmlsZXMgKG9jdGFsKSwgbGlrZTogYDUxMWAgb3IgYDBvNzU1YC4gRGVmYXVsdDogMDY0NFxuICogQHBhcmFtIGNvbmZpZy5wYXJlbnREaXJQZXJtaXNzaW9ucyB7TnVtYmVyfSAgLSBbU2VydmVyXSBQZXJtaXNzaW9ucyB3aGljaCB3aWxsIGJlIHNldCB0byBwYXJlbnQgZGlyZWN0b3J5IG9mIHVwbG9hZGVkIGZpbGVzIChvY3RhbCksIGxpa2U6IGA2MTFgIG9yIGAwbzc3N2AuIERlZmF1bHQ6IDA3NTVcbiAqIEBwYXJhbSBjb25maWcuc3RvcmFnZVBhdGggICAge1N0cmluZ3xGdW5jdGlvbn0gIC0gW1NlcnZlcl0gU3RvcmFnZSBwYXRoIG9uIGZpbGUgc3lzdGVtXG4gKiBAcGFyYW0gY29uZmlnLmNhY2hlQ29udHJvbCAgIHtTdHJpbmd9ICAtIFtTZXJ2ZXJdIERlZmF1bHQgYENhY2hlLUNvbnRyb2xgIGhlYWRlclxuICogQHBhcmFtIGNvbmZpZy5yZXNwb25zZUhlYWRlcnMge09iamVjdHxGdW5jdGlvbn0gLSBbU2VydmVyXSBDdXN0b20gcmVzcG9uc2UgaGVhZGVycywgaWYgZnVuY3Rpb24gaXMgcGFzc2VkLCBtdXN0IHJldHVybiBPYmplY3RcbiAqIEBwYXJhbSBjb25maWcudGhyb3R0bGUgICAgICAge051bWJlcn0gIC0gW1NlcnZlcl0gREVQUkVDQVRFRCBicHMgdGhyb3R0bGUgdGhyZXNob2xkXG4gKiBAcGFyYW0gY29uZmlnLmRvd25sb2FkUm91dGUgIHtTdHJpbmd9ICAtIFtCb3RoXSAgIFNlcnZlciBSb3V0ZSB1c2VkIHRvIHJldHJpZXZlIGZpbGVzXG4gKiBAcGFyYW0gY29uZmlnLmNvbGxlY3Rpb24gICAgIHtNb25nby5Db2xsZWN0aW9ufSAtIFtCb3RoXSBNb25nbyBDb2xsZWN0aW9uIEluc3RhbmNlXG4gKiBAcGFyYW0gY29uZmlnLmNvbGxlY3Rpb25OYW1lIHtTdHJpbmd9ICAtIFtCb3RoXSAgIENvbGxlY3Rpb24gbmFtZVxuICogQHBhcmFtIGNvbmZpZy5uYW1pbmdGdW5jdGlvbiB7RnVuY3Rpb259LSBbQm90aF0gICBGdW5jdGlvbiB3aGljaCByZXR1cm5zIGBTdHJpbmdgXG4gKiBAcGFyYW0gY29uZmlnLmludGVncml0eUNoZWNrIHtCb29sZWFufSAtIFtTZXJ2ZXJdIENoZWNrIGZpbGUncyBpbnRlZ3JpdHkgYmVmb3JlIHNlcnZpbmcgdG8gdXNlcnNcbiAqIEBwYXJhbSBjb25maWcub25BZnRlclVwbG9hZCAge0Z1bmN0aW9ufS0gW1NlcnZlcl0gQ2FsbGVkIHJpZ2h0IGFmdGVyIGZpbGUgaXMgcmVhZHkgb24gRlMuIFVzZSB0byB0cmFuc2ZlciBmaWxlIHNvbWV3aGVyZSBlbHNlLCBvciBkbyBvdGhlciB0aGluZyB3aXRoIGZpbGUgZGlyZWN0bHlcbiAqIEBwYXJhbSBjb25maWcub25BZnRlclJlbW92ZSAge0Z1bmN0aW9ufSAtIFtTZXJ2ZXJdIENhbGxlZCByaWdodCBhZnRlciBmaWxlIGlzIHJlbW92ZWQuIFJlbW92ZWQgb2JqZWN0cyBpcyBwYXNzZWQgdG8gY2FsbGJhY2tcbiAqIEBwYXJhbSBjb25maWcuY29udGludWVVcGxvYWRUVEwge051bWJlcn0gLSBbU2VydmVyXSBUaW1lIGluIHNlY29uZHMsIGR1cmluZyB1cGxvYWQgbWF5IGJlIGNvbnRpbnVlZCwgZGVmYXVsdCAzIGhvdXJzICgxMDgwMCBzZWNvbmRzKVxuICogQHBhcmFtIGNvbmZpZy5vbkJlZm9yZVVwbG9hZCB7RnVuY3Rpb259LSBbQm90aF0gICBGdW5jdGlvbiB3aGljaCBleGVjdXRlcyBvbiBzZXJ2ZXIgYWZ0ZXIgcmVjZWl2aW5nIGVhY2ggY2h1bmsgYW5kIG9uIGNsaWVudCByaWdodCBiZWZvcmUgYmVnaW5uaW5nIHVwbG9hZC4gRnVuY3Rpb24gY29udGV4dCBpcyBgRmlsZWAgLSBzbyB5b3UgYXJlIGFibGUgdG8gY2hlY2sgZm9yIGV4dGVuc2lvbiwgbWltZS10eXBlLCBzaXplIGFuZCBldGMuOlxuICogIC0gcmV0dXJuIGB0cnVlYCB0byBjb250aW51ZVxuICogIC0gcmV0dXJuIGBmYWxzZWAgb3IgYFN0cmluZ2AgdG8gYWJvcnQgdXBsb2FkXG4gKiBAcGFyYW0gY29uZmlnLm9uSW5pdGlhdGVVcGxvYWQge0Z1bmN0aW9ufSAtIFtTZXJ2ZXJdIEZ1bmN0aW9uIHdoaWNoIGV4ZWN1dGVzIG9uIHNlcnZlciByaWdodCBiZWZvcmUgdXBsb2FkIGlzIGJlZ2luIGFuZCByaWdodCBhZnRlciBgb25CZWZvcmVVcGxvYWRgIGhvb2suIFRoaXMgaG9vayBpcyBmdWxseSBhc3luY2hyb25vdXMuXG4gKiBAcGFyYW0gY29uZmlnLm9uQmVmb3JlUmVtb3ZlIHtGdW5jdGlvbn0gLSBbU2VydmVyXSBFeGVjdXRlcyBiZWZvcmUgcmVtb3ZpbmcgZmlsZSBvbiBzZXJ2ZXIsIHNvIHlvdSBjYW4gY2hlY2sgcGVybWlzc2lvbnMuIFJldHVybiBgdHJ1ZWAgdG8gYWxsb3cgYWN0aW9uIGFuZCBgZmFsc2VgIHRvIGRlbnkuXG4gKiBAcGFyYW0gY29uZmlnLmFsbG93Q2xpZW50Q29kZSAge0Jvb2xlYW59ICAtIFtCb3RoXSAgIEFsbG93IHRvIHJ1biBgcmVtb3ZlYCBmcm9tIGNsaWVudFxuICogQHBhcmFtIGNvbmZpZy5kb3dubG9hZENhbGxiYWNrIHtGdW5jdGlvbn0gLSBbU2VydmVyXSBDYWxsYmFjayB0cmlnZ2VyZWQgZWFjaCB0aW1lIGZpbGUgaXMgcmVxdWVzdGVkLCByZXR1cm4gdHJ1dGh5IHZhbHVlIHRvIGNvbnRpbnVlIGRvd25sb2FkLCBvciBmYWxzeSB0byBhYm9ydFxuICogQHBhcmFtIGNvbmZpZy5pbnRlcmNlcHREb3dubG9hZCB7RnVuY3Rpb259IC0gW1NlcnZlcl0gSW50ZXJjZXB0IGRvd25sb2FkIHJlcXVlc3QsIHNvIHlvdSBjYW4gc2VydmUgZmlsZSBmcm9tIHRoaXJkLXBhcnR5IHJlc291cmNlLCBhcmd1bWVudHMge2h0dHA6IHtyZXF1ZXN0OiB7Li4ufSwgcmVzcG9uc2U6IHsuLi59fSwgZmlsZVJlZjogey4uLn19XG4gKiBAcGFyYW0gY29uZmlnLmRpc2FibGVVcGxvYWQge0Jvb2xlYW59IC0gRGlzYWJsZSBmaWxlIHVwbG9hZCwgdXNlZnVsIGZvciBzZXJ2ZXIgb25seSBzb2x1dGlvbnNcbiAqIEBwYXJhbSBjb25maWcuZGlzYWJsZURvd25sb2FkIHtCb29sZWFufSAtIERpc2FibGUgZmlsZSBkb3dubG9hZCAoc2VydmluZyksIHVzZWZ1bCBmb3IgZmlsZSBtYW5hZ2VtZW50IG9ubHkgc29sdXRpb25zXG4gKiBAcGFyYW0gY29uZmlnLl9wcmVDb2xsZWN0aW9uICB7TW9uZ28uQ29sbGVjdGlvbn0gLSBbU2VydmVyXSBNb25nbyBwcmVDb2xsZWN0aW9uIEluc3RhbmNlXG4gKiBAcGFyYW0gY29uZmlnLl9wcmVDb2xsZWN0aW9uTmFtZSB7U3RyaW5nfSAgLSBbU2VydmVyXSAgcHJlQ29sbGVjdGlvbiBuYW1lXG4gKiBAc3VtbWFyeSBDcmVhdGUgbmV3IGluc3RhbmNlIG9mIEZpbGVzQ29sbGVjdGlvblxuICovXG5leHBvcnQgY2xhc3MgRmlsZXNDb2xsZWN0aW9uIGV4dGVuZHMgRmlsZXNDb2xsZWN0aW9uQ29yZSB7XG4gIGNvbnN0cnVjdG9yKGNvbmZpZykge1xuICAgIHN1cGVyKCk7XG4gICAgbGV0IHN0b3JhZ2VQYXRoO1xuICAgIGlmIChjb25maWcpIHtcbiAgICAgICh7XG4gICAgICAgIHN0b3JhZ2VQYXRoLFxuICAgICAgICBkZWJ1ZzogdGhpcy5kZWJ1ZyxcbiAgICAgICAgc2NoZW1hOiB0aGlzLnNjaGVtYSxcbiAgICAgICAgcHVibGljOiB0aGlzLnB1YmxpYyxcbiAgICAgICAgc3RyaWN0OiB0aGlzLnN0cmljdCxcbiAgICAgICAgY2h1bmtTaXplOiB0aGlzLmNodW5rU2l6ZSxcbiAgICAgICAgcHJvdGVjdGVkOiB0aGlzLnByb3RlY3RlZCxcbiAgICAgICAgY29sbGVjdGlvbjogdGhpcy5jb2xsZWN0aW9uLFxuICAgICAgICBwZXJtaXNzaW9uczogdGhpcy5wZXJtaXNzaW9ucyxcbiAgICAgICAgY2FjaGVDb250cm9sOiB0aGlzLmNhY2hlQ29udHJvbCxcbiAgICAgICAgZG93bmxvYWRSb3V0ZTogdGhpcy5kb3dubG9hZFJvdXRlLFxuICAgICAgICBvbkFmdGVyVXBsb2FkOiB0aGlzLm9uQWZ0ZXJVcGxvYWQsXG4gICAgICAgIG9uQWZ0ZXJSZW1vdmU6IHRoaXMub25BZnRlclJlbW92ZSxcbiAgICAgICAgZGlzYWJsZVVwbG9hZDogdGhpcy5kaXNhYmxlVXBsb2FkLFxuICAgICAgICBvbkJlZm9yZVJlbW92ZTogdGhpcy5vbkJlZm9yZVJlbW92ZSxcbiAgICAgICAgaW50ZWdyaXR5Q2hlY2s6IHRoaXMuaW50ZWdyaXR5Q2hlY2ssXG4gICAgICAgIGNvbGxlY3Rpb25OYW1lOiB0aGlzLmNvbGxlY3Rpb25OYW1lLFxuICAgICAgICBvbkJlZm9yZVVwbG9hZDogdGhpcy5vbkJlZm9yZVVwbG9hZCxcbiAgICAgICAgbmFtaW5nRnVuY3Rpb246IHRoaXMubmFtaW5nRnVuY3Rpb24sXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczogdGhpcy5yZXNwb25zZUhlYWRlcnMsXG4gICAgICAgIGRpc2FibGVEb3dubG9hZDogdGhpcy5kaXNhYmxlRG93bmxvYWQsXG4gICAgICAgIGFsbG93Q2xpZW50Q29kZTogdGhpcy5hbGxvd0NsaWVudENvZGUsXG4gICAgICAgIGRvd25sb2FkQ2FsbGJhY2s6IHRoaXMuZG93bmxvYWRDYWxsYmFjayxcbiAgICAgICAgb25Jbml0aWF0ZVVwbG9hZDogdGhpcy5vbkluaXRpYXRlVXBsb2FkLFxuICAgICAgICBpbnRlcmNlcHREb3dubG9hZDogdGhpcy5pbnRlcmNlcHREb3dubG9hZCxcbiAgICAgICAgY29udGludWVVcGxvYWRUVEw6IHRoaXMuY29udGludWVVcGxvYWRUVEwsXG4gICAgICAgIHBhcmVudERpclBlcm1pc3Npb25zOiB0aGlzLnBhcmVudERpclBlcm1pc3Npb25zLFxuICAgICAgICBfcHJlQ29sbGVjdGlvbjogdGhpcy5fcHJlQ29sbGVjdGlvbixcbiAgICAgICAgX3ByZUNvbGxlY3Rpb25OYW1lOiB0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSxcbiAgICAgIH0gPSBjb25maWcpO1xuICAgIH1cblxuICAgIGNvbnN0IHNlbGYgICA9IHRoaXM7XG4gICAgbmV3IENvb2tpZXMoKTtcblxuICAgIGlmICghaGVscGVycy5pc0Jvb2xlYW4odGhpcy5kZWJ1ZykpIHtcbiAgICAgIHRoaXMuZGVidWcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNCb29sZWFuKHRoaXMucHVibGljKSkge1xuICAgICAgdGhpcy5wdWJsaWMgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMucHJvdGVjdGVkKSB7XG4gICAgICB0aGlzLnByb3RlY3RlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5jaHVua1NpemUpIHtcbiAgICAgIHRoaXMuY2h1bmtTaXplID0gMTAyNCAqIDUxMjtcbiAgICB9XG5cbiAgICB0aGlzLmNodW5rU2l6ZSA9IE1hdGguZmxvb3IodGhpcy5jaHVua1NpemUgLyA4KSAqIDg7XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNTdHJpbmcodGhpcy5jb2xsZWN0aW9uTmFtZSkgJiYgIXRoaXMuY29sbGVjdGlvbikge1xuICAgICAgdGhpcy5jb2xsZWN0aW9uTmFtZSA9ICdNZXRlb3JVcGxvYWRGaWxlcyc7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmNvbGxlY3Rpb24pIHtcbiAgICAgIHRoaXMuY29sbGVjdGlvbiA9IG5ldyBNb25nby5Db2xsZWN0aW9uKHRoaXMuY29sbGVjdGlvbk5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbGxlY3Rpb25OYW1lID0gdGhpcy5jb2xsZWN0aW9uLl9uYW1lO1xuICAgIH1cblxuICAgIHRoaXMuY29sbGVjdGlvbi5maWxlc0NvbGxlY3Rpb24gPSB0aGlzO1xuICAgIGNoZWNrKHRoaXMuY29sbGVjdGlvbk5hbWUsIFN0cmluZyk7XG5cbiAgICBpZiAodGhpcy5wdWJsaWMgJiYgIXRoaXMuZG93bmxvYWRSb3V0ZSkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIGBbRmlsZXNDb2xsZWN0aW9uLiR7dGhpcy5jb2xsZWN0aW9uTmFtZX1dOiBcImRvd25sb2FkUm91dGVcIiBtdXN0IGJlIHByZWNpc2VseSBwcm92aWRlZCBvbiBcInB1YmxpY1wiIGNvbGxlY3Rpb25zISBOb3RlOiBcImRvd25sb2FkUm91dGVcIiBtdXN0IGJlIGVxdWFsIG9yIGJlIGluc2lkZSBvZiB5b3VyIHdlYi9wcm94eS1zZXJ2ZXIgKHJlbGF0aXZlKSByb290LmApO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc1N0cmluZyh0aGlzLmRvd25sb2FkUm91dGUpKSB7XG4gICAgICB0aGlzLmRvd25sb2FkUm91dGUgPSAnL2Nkbi9zdG9yYWdlJztcbiAgICB9XG5cbiAgICB0aGlzLmRvd25sb2FkUm91dGUgPSB0aGlzLmRvd25sb2FkUm91dGUucmVwbGFjZSgvXFwvJC8sICcnKTtcblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMubmFtaW5nRnVuY3Rpb24pKSB7XG4gICAgICB0aGlzLm5hbWluZ0Z1bmN0aW9uID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5vbkJlZm9yZVVwbG9hZCkpIHtcbiAgICAgIHRoaXMub25CZWZvcmVVcGxvYWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNCb29sZWFuKHRoaXMuYWxsb3dDbGllbnRDb2RlKSkge1xuICAgICAgdGhpcy5hbGxvd0NsaWVudENvZGUgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMub25Jbml0aWF0ZVVwbG9hZCkpIHtcbiAgICAgIHRoaXMub25Jbml0aWF0ZVVwbG9hZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMuaW50ZXJjZXB0RG93bmxvYWQpKSB7XG4gICAgICB0aGlzLmludGVyY2VwdERvd25sb2FkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzQm9vbGVhbih0aGlzLnN0cmljdCkpIHtcbiAgICAgIHRoaXMuc3RyaWN0ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNOdW1iZXIodGhpcy5wZXJtaXNzaW9ucykpIHtcbiAgICAgIHRoaXMucGVybWlzc2lvbnMgPSBwYXJzZUludCgnNjQ0JywgOCk7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzTnVtYmVyKHRoaXMucGFyZW50RGlyUGVybWlzc2lvbnMpKSB7XG4gICAgICB0aGlzLnBhcmVudERpclBlcm1pc3Npb25zID0gcGFyc2VJbnQoJzc1NScsIDgpO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc1N0cmluZyh0aGlzLmNhY2hlQ29udHJvbCkpIHtcbiAgICAgIHRoaXMuY2FjaGVDb250cm9sID0gJ3B1YmxpYywgbWF4LWFnZT0zMTUzNjAwMCwgcy1tYXhhZ2U9MzE1MzYwMDAnO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMub25BZnRlclVwbG9hZCkpIHtcbiAgICAgIHRoaXMub25BZnRlclVwbG9hZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Jvb2xlYW4odGhpcy5kaXNhYmxlVXBsb2FkKSkge1xuICAgICAgdGhpcy5kaXNhYmxlVXBsb2FkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5vbkFmdGVyUmVtb3ZlKSkge1xuICAgICAgdGhpcy5vbkFmdGVyUmVtb3ZlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5vbkJlZm9yZVJlbW92ZSkpIHtcbiAgICAgIHRoaXMub25CZWZvcmVSZW1vdmUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNCb29sZWFuKHRoaXMuaW50ZWdyaXR5Q2hlY2spKSB7XG4gICAgICB0aGlzLmludGVncml0eUNoZWNrID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNCb29sZWFuKHRoaXMuZGlzYWJsZURvd25sb2FkKSkge1xuICAgICAgdGhpcy5kaXNhYmxlRG93bmxvYWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNPYmplY3QodGhpcy5fY3VycmVudFVwbG9hZHMpKSB7XG4gICAgICB0aGlzLl9jdXJyZW50VXBsb2FkcyA9IHt9O1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMuZG93bmxvYWRDYWxsYmFjaykpIHtcbiAgICAgIHRoaXMuZG93bmxvYWRDYWxsYmFjayA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc051bWJlcih0aGlzLmNvbnRpbnVlVXBsb2FkVFRMKSkge1xuICAgICAgdGhpcy5jb250aW51ZVVwbG9hZFRUTCA9IDEwODAwO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMucmVzcG9uc2VIZWFkZXJzKSkge1xuICAgICAgdGhpcy5yZXNwb25zZUhlYWRlcnMgPSAocmVzcG9uc2VDb2RlLCBmaWxlUmVmLCB2ZXJzaW9uUmVmKSA9PiB7XG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSB7fTtcblxuICAgICAgICBzd2l0Y2ggKHJlc3BvbnNlQ29kZSkge1xuICAgICAgICBjYXNlICcyMDYnOlxuICAgICAgICAgIGhlYWRlcnMuUHJhZ21hICAgICAgICAgICAgICAgPSAncHJpdmF0ZSc7XG4gICAgICAgICAgaGVhZGVycy5UcmFpbGVyICAgICAgICAgICAgICA9ICdleHBpcmVzJztcbiAgICAgICAgICBoZWFkZXJzWydUcmFuc2Zlci1FbmNvZGluZyddID0gJ2NodW5rZWQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc0MDAnOlxuICAgICAgICAgIGhlYWRlcnNbJ0NhY2hlLUNvbnRyb2wnXSAgICAgPSAnbm8tY2FjaGUnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc0MTYnOlxuICAgICAgICAgIGhlYWRlcnNbJ0NvbnRlbnQtUmFuZ2UnXSAgICAgPSBgYnl0ZXMgKi8ke3ZlcnNpb25SZWYuc2l6ZX1gO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaGVhZGVycy5Db25uZWN0aW9uICAgICAgID0gJ2tlZXAtYWxpdmUnO1xuICAgICAgICBoZWFkZXJzWydDb250ZW50LVR5cGUnXSAgPSB2ZXJzaW9uUmVmLnR5cGUgfHwgJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSc7XG4gICAgICAgIGhlYWRlcnNbJ0FjY2VwdC1SYW5nZXMnXSA9ICdieXRlcyc7XG4gICAgICAgIHJldHVybiBoZWFkZXJzO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wdWJsaWMgJiYgIXN0b3JhZ2VQYXRoKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgYFtGaWxlc0NvbGxlY3Rpb24uJHt0aGlzLmNvbGxlY3Rpb25OYW1lfV0gXCJzdG9yYWdlUGF0aFwiIG11c3QgYmUgc2V0IG9uIFwicHVibGljXCIgY29sbGVjdGlvbnMhIE5vdGU6IFwic3RvcmFnZVBhdGhcIiBtdXN0IGJlIGVxdWFsIG9uIGJlIGluc2lkZSBvZiB5b3VyIHdlYi9wcm94eS1zZXJ2ZXIgKGFic29sdXRlKSByb290LmApO1xuICAgIH1cblxuICAgIGlmICghc3RvcmFnZVBhdGgpIHtcbiAgICAgIHN0b3JhZ2VQYXRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYGFzc2V0cyR7bm9kZVBhdGguc2VwfWFwcCR7bm9kZVBhdGguc2VwfXVwbG9hZHMke25vZGVQYXRoLnNlcH0ke3NlbGYuY29sbGVjdGlvbk5hbWV9YDtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGhlbHBlcnMuaXNTdHJpbmcoc3RvcmFnZVBhdGgpKSB7XG4gICAgICB0aGlzLnN0b3JhZ2VQYXRoID0gKCkgPT4gc3RvcmFnZVBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RvcmFnZVBhdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBzcCA9IHN0b3JhZ2VQYXRoLmFwcGx5KHNlbGYsIGFyZ3VtZW50cyk7XG4gICAgICAgIGlmICghaGVscGVycy5pc1N0cmluZyhzcCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgYFtGaWxlc0NvbGxlY3Rpb24uJHtzZWxmLmNvbGxlY3Rpb25OYW1lfV0gXCJzdG9yYWdlUGF0aFwiIGZ1bmN0aW9uIG11c3QgcmV0dXJuIGEgU3RyaW5nIWApO1xuICAgICAgICB9XG4gICAgICAgIHNwID0gc3AucmVwbGFjZSgvXFwvJC8sICcnKTtcbiAgICAgICAgcmV0dXJuIG5vZGVQYXRoLm5vcm1hbGl6ZShzcCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMuX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uLnN0b3JhZ2VQYXRoXSBTZXQgdG86JywgdGhpcy5zdG9yYWdlUGF0aCh7fSkpO1xuXG4gICAgZnMubWtkaXJzKHRoaXMuc3RvcmFnZVBhdGgoe30pLCB7IG1vZGU6IHRoaXMucGFyZW50RGlyUGVybWlzc2lvbnMgfSwgKGVycm9yKSA9PiB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsIGBbRmlsZXNDb2xsZWN0aW9uLiR7c2VsZi5jb2xsZWN0aW9uTmFtZX1dIFBhdGggXCIke3RoaXMuc3RvcmFnZVBhdGgoe30pfVwiIGlzIG5vdCB3cml0YWJsZSEgJHtlcnJvcn1gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNoZWNrKHRoaXMuc3RyaWN0LCBCb29sZWFuKTtcbiAgICBjaGVjayh0aGlzLnBlcm1pc3Npb25zLCBOdW1iZXIpO1xuICAgIGNoZWNrKHRoaXMuc3RvcmFnZVBhdGgsIEZ1bmN0aW9uKTtcbiAgICBjaGVjayh0aGlzLmNhY2hlQ29udHJvbCwgU3RyaW5nKTtcbiAgICBjaGVjayh0aGlzLm9uQWZ0ZXJSZW1vdmUsIE1hdGNoLk9uZU9mKGZhbHNlLCBGdW5jdGlvbikpO1xuICAgIGNoZWNrKHRoaXMub25BZnRlclVwbG9hZCwgTWF0Y2guT25lT2YoZmFsc2UsIEZ1bmN0aW9uKSk7XG4gICAgY2hlY2sodGhpcy5kaXNhYmxlVXBsb2FkLCBCb29sZWFuKTtcbiAgICBjaGVjayh0aGlzLmludGVncml0eUNoZWNrLCBCb29sZWFuKTtcbiAgICBjaGVjayh0aGlzLm9uQmVmb3JlUmVtb3ZlLCBNYXRjaC5PbmVPZihmYWxzZSwgRnVuY3Rpb24pKTtcbiAgICBjaGVjayh0aGlzLmRpc2FibGVEb3dubG9hZCwgQm9vbGVhbik7XG4gICAgY2hlY2sodGhpcy5kb3dubG9hZENhbGxiYWNrLCBNYXRjaC5PbmVPZihmYWxzZSwgRnVuY3Rpb24pKTtcbiAgICBjaGVjayh0aGlzLmludGVyY2VwdERvd25sb2FkLCBNYXRjaC5PbmVPZihmYWxzZSwgRnVuY3Rpb24pKTtcbiAgICBjaGVjayh0aGlzLmNvbnRpbnVlVXBsb2FkVFRMLCBOdW1iZXIpO1xuICAgIGNoZWNrKHRoaXMucmVzcG9uc2VIZWFkZXJzLCBNYXRjaC5PbmVPZihPYmplY3QsIEZ1bmN0aW9uKSk7XG5cbiAgICBpZiAoIXRoaXMuZGlzYWJsZVVwbG9hZCkge1xuICAgICAgaWYgKCFoZWxwZXJzLmlzU3RyaW5nKHRoaXMuX3ByZUNvbGxlY3Rpb25OYW1lKSAmJiAhdGhpcy5fcHJlQ29sbGVjdGlvbikge1xuICAgICAgICB0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSA9IGBfX3ByZV8ke3RoaXMuY29sbGVjdGlvbk5hbWV9YDtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLl9wcmVDb2xsZWN0aW9uKSB7XG4gICAgICAgIHRoaXMuX3ByZUNvbGxlY3Rpb24gPSBuZXcgTW9uZ28uQ29sbGVjdGlvbih0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSA9IHRoaXMuX3ByZUNvbGxlY3Rpb24uX25hbWU7XG4gICAgICB9XG4gICAgICBjaGVjayh0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSwgU3RyaW5nKTtcblxuICAgICAgdGhpcy5fcHJlQ29sbGVjdGlvbi5fZW5zdXJlSW5kZXgoeyBjcmVhdGVkQXQ6IDEgfSwgeyBleHBpcmVBZnRlclNlY29uZHM6IHRoaXMuY29udGludWVVcGxvYWRUVEwsIGJhY2tncm91bmQ6IHRydWUgfSk7XG4gICAgICBjb25zdCBfcHJlQ29sbGVjdGlvbkN1cnNvciA9IHRoaXMuX3ByZUNvbGxlY3Rpb24uZmluZCh7fSwge1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBfaWQ6IDEsXG4gICAgICAgICAgaXNGaW5pc2hlZDogMVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgX3ByZUNvbGxlY3Rpb25DdXJzb3Iub2JzZXJ2ZSh7XG4gICAgICAgIGNoYW5nZWQoZG9jKSB7XG4gICAgICAgICAgaWYgKGRvYy5pc0ZpbmlzaGVkKSB7XG4gICAgICAgICAgICBzZWxmLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW19wcmVDb2xsZWN0aW9uQ3Vyc29yLm9ic2VydmVdIFtjaGFuZ2VkXTogJHtkb2MuX2lkfWApO1xuICAgICAgICAgICAgc2VsZi5fcHJlQ29sbGVjdGlvbi5yZW1vdmUoe19pZDogZG9jLl9pZH0sIE5PT1ApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlZChkb2MpIHtcbiAgICAgICAgICAvLyBGcmVlIG1lbW9yeSBhZnRlciB1cGxvYWQgaXMgZG9uZVxuICAgICAgICAgIC8vIE9yIGlmIHVwbG9hZCBpcyB1bmZpbmlzaGVkXG4gICAgICAgICAgc2VsZi5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtfcHJlQ29sbGVjdGlvbkN1cnNvci5vYnNlcnZlXSBbcmVtb3ZlZF06ICR7ZG9jLl9pZH1gKTtcbiAgICAgICAgICBpZiAoaGVscGVycy5pc09iamVjdChzZWxmLl9jdXJyZW50VXBsb2Fkc1tkb2MuX2lkXSkpIHtcbiAgICAgICAgICAgIHNlbGYuX2N1cnJlbnRVcGxvYWRzW2RvYy5faWRdLnN0b3AoKTtcbiAgICAgICAgICAgIHNlbGYuX2N1cnJlbnRVcGxvYWRzW2RvYy5faWRdLmVuZCgpO1xuXG4gICAgICAgICAgICBpZiAoIWRvYy5pc0ZpbmlzaGVkKSB7XG4gICAgICAgICAgICAgIHNlbGYuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbX3ByZUNvbGxlY3Rpb25DdXJzb3Iub2JzZXJ2ZV0gW3JlbW92ZVVuZmluaXNoZWRVcGxvYWRdOiAke2RvYy5faWR9YCk7XG4gICAgICAgICAgICAgIHNlbGYuX2N1cnJlbnRVcGxvYWRzW2RvYy5faWRdLmFib3J0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlbGV0ZSBzZWxmLl9jdXJyZW50VXBsb2Fkc1tkb2MuX2lkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9jcmVhdGVTdHJlYW0gPSAoX2lkLCBwYXRoLCBvcHRzKSA9PiB7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRVcGxvYWRzW19pZF0gPSBuZXcgV3JpdGVTdHJlYW0ocGF0aCwgb3B0cy5maWxlTGVuZ3RoLCBvcHRzLCB0aGlzLnBlcm1pc3Npb25zKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIFRoaXMgbGl0dGxlIGZ1bmN0aW9uIGFsbG93cyB0byBjb250aW51ZSB1cGxvYWRcbiAgICAgIC8vIGV2ZW4gYWZ0ZXIgc2VydmVyIGlzIHJlc3RhcnRlZCAoKm5vdCBvbiBkZXYtc3RhZ2UqKVxuICAgICAgdGhpcy5fY29udGludWVVcGxvYWQgPSAoX2lkKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50VXBsb2Fkc1tfaWRdICYmIHRoaXMuX2N1cnJlbnRVcGxvYWRzW19pZF0uZmlsZSkge1xuICAgICAgICAgIGlmICghdGhpcy5fY3VycmVudFVwbG9hZHNbX2lkXS5hYm9ydGVkICYmICF0aGlzLl9jdXJyZW50VXBsb2Fkc1tfaWRdLmVuZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY3VycmVudFVwbG9hZHNbX2lkXS5maWxlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9jcmVhdGVTdHJlYW0oX2lkLCB0aGlzLl9jdXJyZW50VXBsb2Fkc1tfaWRdLmZpbGUuZmlsZS5wYXRoLCB0aGlzLl9jdXJyZW50VXBsb2Fkc1tfaWRdLmZpbGUpO1xuICAgICAgICAgIHJldHVybiB0aGlzLl9jdXJyZW50VXBsb2Fkc1tfaWRdLmZpbGU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29udFVwbGQgPSB0aGlzLl9wcmVDb2xsZWN0aW9uLmZpbmRPbmUoe19pZH0pO1xuICAgICAgICBpZiAoY29udFVwbGQpIHtcbiAgICAgICAgICB0aGlzLl9jcmVhdGVTdHJlYW0oX2lkLCBjb250VXBsZC5maWxlLnBhdGgsIGNvbnRVcGxkKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fY3VycmVudFVwbG9hZHNbX2lkXS5maWxlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnNjaGVtYSkge1xuICAgICAgdGhpcy5zY2hlbWEgPSBGaWxlc0NvbGxlY3Rpb25Db3JlLnNjaGVtYTtcbiAgICB9XG5cbiAgICBjaGVjayh0aGlzLmRlYnVnLCBCb29sZWFuKTtcbiAgICBjaGVjayh0aGlzLnNjaGVtYSwgT2JqZWN0KTtcbiAgICBjaGVjayh0aGlzLnB1YmxpYywgQm9vbGVhbik7XG4gICAgY2hlY2sodGhpcy5wcm90ZWN0ZWQsIE1hdGNoLk9uZU9mKEJvb2xlYW4sIEZ1bmN0aW9uKSk7XG4gICAgY2hlY2sodGhpcy5jaHVua1NpemUsIE51bWJlcik7XG4gICAgY2hlY2sodGhpcy5kb3dubG9hZFJvdXRlLCBTdHJpbmcpO1xuICAgIGNoZWNrKHRoaXMubmFtaW5nRnVuY3Rpb24sIE1hdGNoLk9uZU9mKGZhbHNlLCBGdW5jdGlvbikpO1xuICAgIGNoZWNrKHRoaXMub25CZWZvcmVVcGxvYWQsIE1hdGNoLk9uZU9mKGZhbHNlLCBGdW5jdGlvbikpO1xuICAgIGNoZWNrKHRoaXMub25Jbml0aWF0ZVVwbG9hZCwgTWF0Y2guT25lT2YoZmFsc2UsIEZ1bmN0aW9uKSk7XG4gICAgY2hlY2sodGhpcy5hbGxvd0NsaWVudENvZGUsIEJvb2xlYW4pO1xuXG4gICAgaWYgKHRoaXMucHVibGljICYmIHRoaXMucHJvdGVjdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgYFtGaWxlc0NvbGxlY3Rpb24uJHt0aGlzLmNvbGxlY3Rpb25OYW1lfV06IEZpbGVzIGNhbiBub3QgYmUgcHVibGljIGFuZCBwcm90ZWN0ZWQgYXQgdGhlIHNhbWUgdGltZSFgKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jaGVja0FjY2VzcyA9IChodHRwKSA9PiB7XG4gICAgICBpZiAodGhpcy5wcm90ZWN0ZWQpIHtcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgY29uc3Qge3VzZXIsIHVzZXJJZH0gPSB0aGlzLl9nZXRVc2VyKGh0dHApO1xuXG4gICAgICAgIGlmIChoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5wcm90ZWN0ZWQpKSB7XG4gICAgICAgICAgbGV0IGZpbGVSZWY7XG4gICAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3QoaHR0cC5wYXJhbXMpICYmICBodHRwLnBhcmFtcy5faWQpIHtcbiAgICAgICAgICAgIGZpbGVSZWYgPSB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShodHRwLnBhcmFtcy5faWQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlc3VsdCA9IGh0dHAgPyB0aGlzLnByb3RlY3RlZC5jYWxsKE9iamVjdC5hc3NpZ24oaHR0cCwge3VzZXIsIHVzZXJJZH0pLCAoZmlsZVJlZiB8fCBudWxsKSkgOiB0aGlzLnByb3RlY3RlZC5jYWxsKHt1c2VyLCB1c2VySWR9LCAoZmlsZVJlZiB8fCBudWxsKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0ID0gISF1c2VySWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKGh0dHAgJiYgKHJlc3VsdCA9PT0gdHJ1ZSkpIHx8ICFodHRwKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByYyA9IGhlbHBlcnMuaXNOdW1iZXIocmVzdWx0KSA/IHJlc3VsdCA6IDQwMTtcbiAgICAgICAgdGhpcy5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb24uX2NoZWNrQWNjZXNzXSBXQVJOOiBBY2Nlc3MgZGVuaWVkIScpO1xuICAgICAgICBpZiAoaHR0cCkge1xuICAgICAgICAgIGNvbnN0IHRleHQgPSAnQWNjZXNzIGRlbmllZCEnO1xuICAgICAgICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgICAgICAgaHR0cC5yZXNwb25zZS53cml0ZUhlYWQocmMsIHtcbiAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICd0ZXh0L3BsYWluJyxcbiAgICAgICAgICAgICAgJ0NvbnRlbnQtTGVuZ3RoJzogdGV4dC5sZW5ndGhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaHR0cC5yZXNwb25zZS5maW5pc2hlZCkge1xuICAgICAgICAgICAgaHR0cC5yZXNwb25zZS5lbmQodGV4dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHRoaXMuX21ldGhvZE5hbWVzID0ge1xuICAgICAgX0Fib3J0OiBgX0ZpbGVzQ29sbGVjdGlvbkFib3J0XyR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gLFxuICAgICAgX1dyaXRlOiBgX0ZpbGVzQ29sbGVjdGlvbldyaXRlXyR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gLFxuICAgICAgX1N0YXJ0OiBgX0ZpbGVzQ29sbGVjdGlvblN0YXJ0XyR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gLFxuICAgICAgX1JlbW92ZTogYF9GaWxlc0NvbGxlY3Rpb25SZW1vdmVfJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWBcbiAgICB9O1xuXG4gICAgdGhpcy5vbignX2hhbmRsZVVwbG9hZCcsIHRoaXMuX2hhbmRsZVVwbG9hZCk7XG4gICAgdGhpcy5vbignX2ZpbmlzaFVwbG9hZCcsIHRoaXMuX2ZpbmlzaFVwbG9hZCk7XG4gICAgdGhpcy5faGFuZGxlVXBsb2FkU3luYyA9IE1ldGVvci53cmFwQXN5bmModGhpcy5faGFuZGxlVXBsb2FkLmJpbmQodGhpcykpO1xuXG4gICAgaWYgKHRoaXMuZGlzYWJsZVVwbG9hZCAmJiB0aGlzLmRpc2FibGVEb3dubG9hZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBXZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZSgoaHR0cFJlcSwgaHR0cFJlc3AsIG5leHQpID0+IHtcbiAgICAgIGlmICghdGhpcy5kaXNhYmxlVXBsb2FkICYmICEhfmh0dHBSZXEuX3BhcnNlZFVybC5wYXRoLmluZGV4T2YoYCR7dGhpcy5kb3dubG9hZFJvdXRlfS8ke3RoaXMuY29sbGVjdGlvbk5hbWV9L19fdXBsb2FkYCkpIHtcbiAgICAgICAgaWYgKGh0dHBSZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICBjb25zdCBoYW5kbGVFcnJvciA9IChfZXJyb3IpID0+IHtcbiAgICAgICAgICAgIGxldCBlcnJvciA9IF9lcnJvcjtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW0ZpbGVzQ29sbGVjdGlvbl0gW1VwbG9hZF0gW0hUVFBdIEV4Y2VwdGlvbjonLCBlcnJvcik7XG4gICAgICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG5cbiAgICAgICAgICAgIGlmICghaHR0cFJlc3AuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgaHR0cFJlc3Aud3JpdGVIZWFkKDUwMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaHR0cFJlc3AuZmluaXNoZWQpIHtcbiAgICAgICAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3QoZXJyb3IpICYmIGhlbHBlcnMuaXNGdW5jdGlvbihlcnJvci50b1N0cmluZykpIHtcbiAgICAgICAgICAgICAgICBlcnJvciA9IGVycm9yLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoIWhlbHBlcnMuaXNTdHJpbmcoZXJyb3IpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSAnVW5leHBlY3RlZCBlcnJvciEnO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaHR0cFJlc3AuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3IgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgICAgIGh0dHBSZXEub24oJ2RhdGEnLCAoZGF0YSkgPT4gYm91bmQoKCkgPT4ge1xuICAgICAgICAgICAgYm9keSArPSBkYXRhO1xuICAgICAgICAgIH0pKTtcblxuICAgICAgICAgIGh0dHBSZXEub24oJ2VuZCcsICgpID0+IGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGxldCBvcHRzO1xuICAgICAgICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICAgICAgICBsZXQgdXNlcjtcblxuICAgICAgICAgICAgICBpZiAoaHR0cFJlcS5oZWFkZXJzWyd4LW10b2snXSAmJiBoZWxwZXJzLmlzT2JqZWN0KE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnMpICYmIGhlbHBlcnMuaGFzKE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnNbaHR0cFJlcS5oZWFkZXJzWyd4LW10b2snXV0sICd1c2VySWQnKSkge1xuICAgICAgICAgICAgICAgIHVzZXIgPSB7XG4gICAgICAgICAgICAgICAgICB1c2VySWQ6IE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnNbaHR0cFJlcS5oZWFkZXJzWyd4LW10b2snXV0udXNlcklkXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1c2VyID0gdGhpcy5fZ2V0VXNlcih7cmVxdWVzdDogaHR0cFJlcSwgcmVzcG9uc2U6IGh0dHBSZXNwfSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoaHR0cFJlcS5oZWFkZXJzWyd4LXN0YXJ0J10gIT09ICcxJykge1xuICAgICAgICAgICAgICAgIG9wdHMgPSB7XG4gICAgICAgICAgICAgICAgICBmaWxlSWQ6IGh0dHBSZXEuaGVhZGVyc1sneC1maWxlaWQnXVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAoaHR0cFJlcS5oZWFkZXJzWyd4LWVvZiddID09PSAnMScpIHtcbiAgICAgICAgICAgICAgICAgIG9wdHMuZW9mID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBCdWZmZXIuZnJvbSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIG9wdHMuYmluRGF0YSA9IEJ1ZmZlci5mcm9tKGJvZHksICdiYXNlNjQnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoYnVmZkVycikge1xuICAgICAgICAgICAgICAgICAgICAgIG9wdHMuYmluRGF0YSA9IG5ldyBCdWZmZXIoYm9keSwgJ2Jhc2U2NCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvcHRzLmJpbkRhdGEgPSBuZXcgQnVmZmVyKGJvZHksICdiYXNlNjQnKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIG9wdHMuY2h1bmtJZCA9IHBhcnNlSW50KGh0dHBSZXEuaGVhZGVyc1sneC1jaHVua2lkJ10pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IF9jb250aW51ZVVwbG9hZCA9IHRoaXMuX2NvbnRpbnVlVXBsb2FkKG9wdHMuZmlsZUlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIV9jb250aW51ZVVwbG9hZCkge1xuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDgsICdDYW5cXCd0IGNvbnRpbnVlIHVwbG9hZCwgc2Vzc2lvbiBleHBpcmVkLiBTdGFydCB1cGxvYWQgYWdhaW4uJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgKHtyZXN1bHQsIG9wdHN9ICA9IHRoaXMuX3ByZXBhcmVVcGxvYWQoT2JqZWN0LmFzc2lnbihvcHRzLCBfY29udGludWVVcGxvYWQpLCB1c2VyLnVzZXJJZCwgJ0hUVFAnKSk7XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0cy5lb2YpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZVVwbG9hZChyZXN1bHQsIG9wdHMsIChfZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGVycm9yID0gX2Vycm9yO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmhlYWRlcnNTZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBodHRwUmVzcC53cml0ZUhlYWQoNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmZpbmlzaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGVscGVycy5pc09iamVjdChlcnJvcikgJiYgaGVscGVycy5pc0Z1bmN0aW9uKGVycm9yLnRvU3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvciA9IGVycm9yLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaGVscGVycy5pc1N0cmluZyhlcnJvcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IgPSAnVW5leHBlY3RlZCBlcnJvciEnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBodHRwUmVzcC5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvciB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFodHRwUmVzcC5oZWFkZXJzU2VudCkge1xuICAgICAgICAgICAgICAgICAgICAgIGh0dHBSZXNwLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3QocmVzdWx0LmZpbGUpICYmIHJlc3VsdC5maWxlLm1ldGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuZmlsZS5tZXRhID0gZml4SlNPTlN0cmluZ2lmeShyZXN1bHQuZmlsZS5tZXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghaHR0cFJlc3AuZmluaXNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBodHRwUmVzcC5lbmQoSlNPTi5zdHJpbmdpZnkocmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnX2hhbmRsZVVwbG9hZCcsIHJlc3VsdCwgb3B0cywgTk9PUCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmhlYWRlcnNTZW50KSB7XG4gICAgICAgICAgICAgICAgICBodHRwUmVzcC53cml0ZUhlYWQoMjA0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFodHRwUmVzcC5maW5pc2hlZCkge1xuICAgICAgICAgICAgICAgICAgaHR0cFJlc3AuZW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBvcHRzID0gSlNPTi5wYXJzZShib2R5KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChqc29uRXJyKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdDYW5cXCd0IHBhcnNlIGluY29taW5nIEpTT04gZnJvbSBDbGllbnQgb24gWy5pbnNlcnQoKSB8IHVwbG9hZF0sIHNvbWV0aGluZyB3ZW50IHdyb25nIScsIGpzb25FcnIpO1xuICAgICAgICAgICAgICAgICAgb3B0cyA9IHtmaWxlOiB7fX07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFoZWxwZXJzLmlzT2JqZWN0KG9wdHMuZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgIG9wdHMuZmlsZSA9IHt9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG9wdHMuX19fcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtGaWxlIFN0YXJ0IEhUVFBdICR7b3B0cy5maWxlLm5hbWUgfHwgJ1tuby1uYW1lXSd9IC0gJHtvcHRzLmZpbGVJZH1gKTtcbiAgICAgICAgICAgICAgICBpZiAoaGVscGVycy5pc09iamVjdChvcHRzLmZpbGUpICYmIG9wdHMuZmlsZS5tZXRhKSB7XG4gICAgICAgICAgICAgICAgICBvcHRzLmZpbGUubWV0YSA9IGZpeEpTT05QYXJzZShvcHRzLmZpbGUubWV0YSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgKHtyZXN1bHR9ID0gdGhpcy5fcHJlcGFyZVVwbG9hZChoZWxwZXJzLmNsb25lKG9wdHMpLCB1c2VyLnVzZXJJZCwgJ0hUVFAgU3RhcnQgTWV0aG9kJykpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29sbGVjdGlvbi5maW5kT25lKHJlc3VsdC5faWQpKSB7XG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgJ0NhblxcJ3Qgc3RhcnQgdXBsb2FkLCBkYXRhIHN1YnN0aXR1dGlvbiBkZXRlY3RlZCEnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvcHRzLl9pZCAgICAgICA9IG9wdHMuZmlsZUlkO1xuICAgICAgICAgICAgICAgIG9wdHMuY3JlYXRlZEF0ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICBvcHRzLm1heExlbmd0aCA9IG9wdHMuZmlsZUxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmVDb2xsZWN0aW9uLmluc2VydChoZWxwZXJzLm9taXQob3B0cywgJ19fX3MnKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3JlYXRlU3RyZWFtKHJlc3VsdC5faWQsIHJlc3VsdC5wYXRoLCBoZWxwZXJzLm9taXQob3B0cywgJ19fX3MnKSk7XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0cy5yZXR1cm5NZXRhKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmhlYWRlcnNTZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGh0dHBSZXNwLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmZpbmlzaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGh0dHBSZXNwLmVuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgICAgdXBsb2FkUm91dGU6IGAke3RoaXMuZG93bmxvYWRSb3V0ZX0vJHt0aGlzLmNvbGxlY3Rpb25OYW1lfS9fX3VwbG9hZGAsXG4gICAgICAgICAgICAgICAgICAgICAgZmlsZTogcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgaWYgKCFodHRwUmVzcC5oZWFkZXJzU2VudCkge1xuICAgICAgICAgICAgICAgICAgICBodHRwUmVzcC53cml0ZUhlYWQoMjA0KTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKCFodHRwUmVzcC5maW5pc2hlZCkge1xuICAgICAgICAgICAgICAgICAgICBodHRwUmVzcC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGh0dHBSZXNwRXJyKSB7XG4gICAgICAgICAgICAgIGhhbmRsZUVycm9yKGh0dHBSZXNwRXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmRpc2FibGVEb3dubG9hZCkge1xuICAgICAgICBsZXQgaHR0cDtcbiAgICAgICAgbGV0IHBhcmFtcztcbiAgICAgICAgbGV0IHVyaTtcbiAgICAgICAgbGV0IHVyaXM7XG5cbiAgICAgICAgaWYgKCF0aGlzLnB1YmxpYykge1xuICAgICAgICAgIGlmICghIX5odHRwUmVxLl9wYXJzZWRVcmwucGF0aC5pbmRleE9mKGAke3RoaXMuZG93bmxvYWRSb3V0ZX0vJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWApKSB7XG4gICAgICAgICAgICB1cmkgPSBodHRwUmVxLl9wYXJzZWRVcmwucGF0aC5yZXBsYWNlKGAke3RoaXMuZG93bmxvYWRSb3V0ZX0vJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWAsICcnKTtcbiAgICAgICAgICAgIGlmICh1cmkuaW5kZXhPZignLycpID09PSAwKSB7XG4gICAgICAgICAgICAgIHVyaSA9IHVyaS5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHVyaXMgPSB1cmkuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgIGlmICh1cmlzLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgICBwYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgX2lkOiB1cmlzWzBdLFxuICAgICAgICAgICAgICAgIHF1ZXJ5OiBodHRwUmVxLl9wYXJzZWRVcmwucXVlcnkgPyBub2RlUXMucGFyc2UoaHR0cFJlcS5fcGFyc2VkVXJsLnF1ZXJ5KSA6IHt9LFxuICAgICAgICAgICAgICAgIG5hbWU6IHVyaXNbMl0uc3BsaXQoJz8nKVswXSxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiB1cmlzWzFdXG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgaHR0cCA9IHtyZXF1ZXN0OiBodHRwUmVxLCByZXNwb25zZTogaHR0cFJlc3AsIHBhcmFtc307XG4gICAgICAgICAgICAgIGlmICh0aGlzLl9jaGVja0FjY2VzcyhodHRwKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZG93bmxvYWQoaHR0cCwgdXJpc1sxXSwgdGhpcy5jb2xsZWN0aW9uLmZpbmRPbmUodXJpc1swXSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCEhfmh0dHBSZXEuX3BhcnNlZFVybC5wYXRoLmluZGV4T2YoYCR7dGhpcy5kb3dubG9hZFJvdXRlfWApKSB7XG4gICAgICAgICAgICB1cmkgPSBodHRwUmVxLl9wYXJzZWRVcmwucGF0aC5yZXBsYWNlKGAke3RoaXMuZG93bmxvYWRSb3V0ZX1gLCAnJyk7XG4gICAgICAgICAgICBpZiAodXJpLmluZGV4T2YoJy8nKSA9PT0gMCkge1xuICAgICAgICAgICAgICB1cmkgPSB1cmkuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB1cmlzICA9IHVyaS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgbGV0IF9maWxlID0gdXJpc1t1cmlzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgaWYgKF9maWxlKSB7XG4gICAgICAgICAgICAgIGxldCB2ZXJzaW9uO1xuICAgICAgICAgICAgICBpZiAoISF+X2ZpbGUuaW5kZXhPZignLScpKSB7XG4gICAgICAgICAgICAgICAgdmVyc2lvbiA9IF9maWxlLnNwbGl0KCctJylbMF07XG4gICAgICAgICAgICAgICAgX2ZpbGUgICA9IF9maWxlLnNwbGl0KCctJylbMV0uc3BsaXQoJz8nKVswXTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uID0gJ29yaWdpbmFsJztcbiAgICAgICAgICAgICAgICBfZmlsZSAgID0gX2ZpbGUuc3BsaXQoJz8nKVswXTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHBhcmFtcyA9IHtcbiAgICAgICAgICAgICAgICBxdWVyeTogaHR0cFJlcS5fcGFyc2VkVXJsLnF1ZXJ5ID8gbm9kZVFzLnBhcnNlKGh0dHBSZXEuX3BhcnNlZFVybC5xdWVyeSkgOiB7fSxcbiAgICAgICAgICAgICAgICBmaWxlOiBfZmlsZSxcbiAgICAgICAgICAgICAgICBfaWQ6IF9maWxlLnNwbGl0KCcuJylbMF0sXG4gICAgICAgICAgICAgICAgdmVyc2lvbixcbiAgICAgICAgICAgICAgICBuYW1lOiBfZmlsZVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBodHRwID0ge3JlcXVlc3Q6IGh0dHBSZXEsIHJlc3BvbnNlOiBodHRwUmVzcCwgcGFyYW1zfTtcbiAgICAgICAgICAgICAgdGhpcy5kb3dubG9hZChodHRwLCB2ZXJzaW9uLCB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShwYXJhbXMuX2lkKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbmV4dCgpO1xuICAgIH0pO1xuXG4gICAgaWYgKCF0aGlzLmRpc2FibGVVcGxvYWQpIHtcbiAgICAgIGNvbnN0IF9tZXRob2RzID0ge307XG5cbiAgICAgIC8vIE1ldGhvZCB1c2VkIHRvIHJlbW92ZSBmaWxlXG4gICAgICAvLyBmcm9tIENsaWVudCBzaWRlXG4gICAgICBfbWV0aG9kc1t0aGlzLl9tZXRob2ROYW1lcy5fUmVtb3ZlXSA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICBjaGVjayhzZWxlY3RvciwgTWF0Y2guT25lT2YoU3RyaW5nLCBPYmplY3QpKTtcbiAgICAgICAgc2VsZi5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtVbmxpbmsgTWV0aG9kXSBbLnJlbW92ZSgke3NlbGVjdG9yfSldYCk7XG5cbiAgICAgICAgaWYgKHNlbGYuYWxsb3dDbGllbnRDb2RlKSB7XG4gICAgICAgICAgaWYgKHNlbGYub25CZWZvcmVSZW1vdmUgJiYgaGVscGVycy5pc0Z1bmN0aW9uKHNlbGYub25CZWZvcmVSZW1vdmUpKSB7XG4gICAgICAgICAgICBjb25zdCB1c2VySWQgPSB0aGlzLnVzZXJJZDtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJGdW5jcyA9IHtcbiAgICAgICAgICAgICAgdXNlcklkOiB0aGlzLnVzZXJJZCxcbiAgICAgICAgICAgICAgdXNlcigpIHtcbiAgICAgICAgICAgICAgICBpZiAoTWV0ZW9yLnVzZXJzKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodXNlcklkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICghc2VsZi5vbkJlZm9yZVJlbW92ZS5jYWxsKHVzZXJGdW5jcywgKHNlbGYuZmluZChzZWxlY3RvcikgfHwgbnVsbCkpKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCAnW0ZpbGVzQ29sbGVjdGlvbl0gW3JlbW92ZV0gTm90IHBlcm1pdHRlZCEnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBjdXJzb3IgPSBzZWxmLmZpbmQoc2VsZWN0b3IpO1xuICAgICAgICAgIGlmIChjdXJzb3IuY291bnQoKSA+IDApIHtcbiAgICAgICAgICAgIHNlbGYucmVtb3ZlKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwNCwgJ0N1cnNvciBpcyBlbXB0eSwgbm8gZmlsZXMgaXMgcmVtb3ZlZCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAxLCAnW0ZpbGVzQ29sbGVjdGlvbl0gW3JlbW92ZV0gUnVuIGNvZGUgZnJvbSBjbGllbnQgaXMgbm90IGFsbG93ZWQhJyk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cblxuICAgICAgLy8gTWV0aG9kIHVzZWQgdG8gcmVjZWl2ZSBcImZpcnN0IGJ5dGVcIiBvZiB1cGxvYWRcbiAgICAgIC8vIGFuZCBhbGwgZmlsZSdzIG1ldGEtZGF0YSwgc29cbiAgICAgIC8vIGl0IHdvbid0IGJlIHRyYW5zZmVycmVkIHdpdGggZXZlcnkgY2h1bmtcbiAgICAgIC8vIEJhc2ljYWxseSBpdCBwcmVwYXJlcyBldmVyeXRoaW5nXG4gICAgICAvLyBTbyB1c2VyIGNhbiBwYXVzZS9kaXNjb25uZWN0IGFuZFxuICAgICAgLy8gY29udGludWUgdXBsb2FkIGxhdGVyLCBkdXJpbmcgYGNvbnRpbnVlVXBsb2FkVFRMYFxuICAgICAgX21ldGhvZHNbdGhpcy5fbWV0aG9kTmFtZXMuX1N0YXJ0XSA9IGZ1bmN0aW9uIChvcHRzLCByZXR1cm5NZXRhKSB7XG4gICAgICAgIGNoZWNrKG9wdHMsIHtcbiAgICAgICAgICBmaWxlOiBPYmplY3QsXG4gICAgICAgICAgZmlsZUlkOiBTdHJpbmcsXG4gICAgICAgICAgRlNOYW1lOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICAgICAgICAgIGNodW5rU2l6ZTogTnVtYmVyLFxuICAgICAgICAgIGZpbGVMZW5ndGg6IE51bWJlclxuICAgICAgICB9KTtcblxuICAgICAgICBjaGVjayhyZXR1cm5NZXRhLCBNYXRjaC5PcHRpb25hbChCb29sZWFuKSk7XG5cbiAgICAgICAgc2VsZi5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtGaWxlIFN0YXJ0IE1ldGhvZF0gJHtvcHRzLmZpbGUubmFtZX0gLSAke29wdHMuZmlsZUlkfWApO1xuICAgICAgICBvcHRzLl9fX3MgPSB0cnVlO1xuICAgICAgICBjb25zdCB7IHJlc3VsdCB9ID0gc2VsZi5fcHJlcGFyZVVwbG9hZChoZWxwZXJzLmNsb25lKG9wdHMpLCB0aGlzLnVzZXJJZCwgJ0REUCBTdGFydCBNZXRob2QnKTtcblxuICAgICAgICBpZiAoc2VsZi5jb2xsZWN0aW9uLmZpbmRPbmUocmVzdWx0Ll9pZCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgJ0NhblxcJ3Qgc3RhcnQgdXBsb2FkLCBkYXRhIHN1YnN0aXR1dGlvbiBkZXRlY3RlZCEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9wdHMuX2lkICAgICAgID0gb3B0cy5maWxlSWQ7XG4gICAgICAgIG9wdHMuY3JlYXRlZEF0ID0gbmV3IERhdGUoKTtcbiAgICAgICAgb3B0cy5tYXhMZW5ndGggPSBvcHRzLmZpbGVMZW5ndGg7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgc2VsZi5fcHJlQ29sbGVjdGlvbi5pbnNlcnQoaGVscGVycy5vbWl0KG9wdHMsICdfX19zJykpO1xuICAgICAgICAgIHNlbGYuX2NyZWF0ZVN0cmVhbShyZXN1bHQuX2lkLCByZXN1bHQucGF0aCwgaGVscGVycy5vbWl0KG9wdHMsICdfX19zJykpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgc2VsZi5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtGaWxlIFN0YXJ0IE1ldGhvZF0gW0VYQ0VQVElPTjpdICR7b3B0cy5maWxlLm5hbWV9IC0gJHtvcHRzLmZpbGVJZH1gLCBlKTtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgJ0NhblxcJ3Qgc3RhcnQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXR1cm5NZXRhKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHVwbG9hZFJvdXRlOiBgJHtzZWxmLmRvd25sb2FkUm91dGV9LyR7c2VsZi5jb2xsZWN0aW9uTmFtZX0vX191cGxvYWRgLFxuICAgICAgICAgICAgZmlsZTogcmVzdWx0XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH07XG5cblxuICAgICAgLy8gTWV0aG9kIHVzZWQgdG8gd3JpdGUgZmlsZSBjaHVua3NcbiAgICAgIC8vIGl0IHJlY2VpdmVzIHZlcnkgbGltaXRlZCBhbW91bnQgb2YgbWV0YS1kYXRhXG4gICAgICAvLyBUaGlzIG1ldGhvZCBhbHNvIHJlc3BvbnNpYmxlIGZvciBFT0ZcbiAgICAgIF9tZXRob2RzW3RoaXMuX21ldGhvZE5hbWVzLl9Xcml0ZV0gPSBmdW5jdGlvbiAoX29wdHMpIHtcbiAgICAgICAgbGV0IG9wdHMgPSBfb3B0cztcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgY2hlY2sob3B0cywge1xuICAgICAgICAgIGVvZjogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gICAgICAgICAgZmlsZUlkOiBTdHJpbmcsXG4gICAgICAgICAgYmluRGF0YTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgICAgICAgICBjaHVua0lkOiBNYXRjaC5PcHRpb25hbChOdW1iZXIpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChvcHRzLmJpbkRhdGEpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIEJ1ZmZlci5mcm9tID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBvcHRzLmJpbkRhdGEgPSBCdWZmZXIuZnJvbShvcHRzLmJpbkRhdGEsICdiYXNlNjQnKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGJ1ZmZFcnIpIHtcbiAgICAgICAgICAgICAgb3B0cy5iaW5EYXRhID0gbmV3IEJ1ZmZlcihvcHRzLmJpbkRhdGEsICdiYXNlNjQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3B0cy5iaW5EYXRhID0gbmV3IEJ1ZmZlcihvcHRzLmJpbkRhdGEsICdiYXNlNjQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBfY29udGludWVVcGxvYWQgPSBzZWxmLl9jb250aW51ZVVwbG9hZChvcHRzLmZpbGVJZCk7XG4gICAgICAgIGlmICghX2NvbnRpbnVlVXBsb2FkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDgsICdDYW5cXCd0IGNvbnRpbnVlIHVwbG9hZCwgc2Vzc2lvbiBleHBpcmVkLiBTdGFydCB1cGxvYWQgYWdhaW4uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnVuYmxvY2soKTtcbiAgICAgICAgKHtyZXN1bHQsIG9wdHN9ID0gc2VsZi5fcHJlcGFyZVVwbG9hZChPYmplY3QuYXNzaWduKG9wdHMsIF9jb250aW51ZVVwbG9hZCksIHRoaXMudXNlcklkLCAnRERQJykpO1xuXG4gICAgICAgIGlmIChvcHRzLmVvZikge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZi5faGFuZGxlVXBsb2FkU3luYyhyZXN1bHQsIG9wdHMpO1xuICAgICAgICAgIH0gY2F0Y2ggKGhhbmRsZVVwbG9hZEVycikge1xuICAgICAgICAgICAgc2VsZi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtXcml0ZSBNZXRob2RdIFtERFBdIEV4Y2VwdGlvbjonLCBoYW5kbGVVcGxvYWRFcnIpO1xuICAgICAgICAgICAgdGhyb3cgaGFuZGxlVXBsb2FkRXJyO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLmVtaXQoJ19oYW5kbGVVcGxvYWQnLCByZXN1bHQsIG9wdHMsIE5PT1ApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcblxuICAgICAgLy8gTWV0aG9kIHVzZWQgdG8gQWJvcnQgdXBsb2FkXG4gICAgICAvLyAtIEZlZWluZyBtZW1vcnkgYnkgLmVuZCgpaW5nIHdyaXRhYmxlU3RyZWFtc1xuICAgICAgLy8gLSBSZW1vdmluZyB0ZW1wb3JhcnkgcmVjb3JkIGZyb20gQF9wcmVDb2xsZWN0aW9uXG4gICAgICAvLyAtIFJlbW92aW5nIHJlY29yZCBmcm9tIEBjb2xsZWN0aW9uXG4gICAgICAvLyAtIC51bmxpbmsoKWluZyBjaHVua3MgZnJvbSBGU1xuICAgICAgX21ldGhvZHNbdGhpcy5fbWV0aG9kTmFtZXMuX0Fib3J0XSA9IGZ1bmN0aW9uIChfaWQpIHtcbiAgICAgICAgY2hlY2soX2lkLCBTdHJpbmcpO1xuXG4gICAgICAgIGNvbnN0IF9jb250aW51ZVVwbG9hZCA9IHNlbGYuX2NvbnRpbnVlVXBsb2FkKF9pZCk7XG4gICAgICAgIHNlbGYuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbQWJvcnQgTWV0aG9kXTogJHtfaWR9IC0gJHsoaGVscGVycy5pc09iamVjdChfY29udGludWVVcGxvYWQuZmlsZSkgPyBfY29udGludWVVcGxvYWQuZmlsZS5wYXRoIDogJycpfWApO1xuXG4gICAgICAgIGlmIChzZWxmLl9jdXJyZW50VXBsb2FkcyAmJiBzZWxmLl9jdXJyZW50VXBsb2Fkc1tfaWRdKSB7XG4gICAgICAgICAgc2VsZi5fY3VycmVudFVwbG9hZHNbX2lkXS5zdG9wKCk7XG4gICAgICAgICAgc2VsZi5fY3VycmVudFVwbG9hZHNbX2lkXS5hYm9ydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF9jb250aW51ZVVwbG9hZCkge1xuICAgICAgICAgIHNlbGYuX3ByZUNvbGxlY3Rpb24ucmVtb3ZlKHtfaWR9KTtcbiAgICAgICAgICBzZWxmLnJlbW92ZSh7X2lkfSk7XG4gICAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3QoX2NvbnRpbnVlVXBsb2FkLmZpbGUpICYmIF9jb250aW51ZVVwbG9hZC5maWxlLnBhdGgpIHtcbiAgICAgICAgICAgIHNlbGYudW5saW5rKHtfaWQsIHBhdGg6IF9jb250aW51ZVVwbG9hZC5maWxlLnBhdGh9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9O1xuXG4gICAgICBNZXRlb3IubWV0aG9kcyhfbWV0aG9kcyk7XG4gICAgfVxuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIF9wcmVwYXJlVXBsb2FkXG4gICAqIEBzdW1tYXJ5IEludGVybmFsIG1ldGhvZC4gVXNlZCB0byBvcHRpbWl6ZSByZWNlaXZlZCBkYXRhIGFuZCBjaGVjayB1cGxvYWQgcGVybWlzc2lvblxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgX3ByZXBhcmVVcGxvYWQob3B0cyA9IHt9LCB1c2VySWQsIHRyYW5zcG9ydCkge1xuICAgIGxldCBjdHg7XG4gICAgaWYgKCFoZWxwZXJzLmlzQm9vbGVhbihvcHRzLmVvZikpIHtcbiAgICAgIG9wdHMuZW9mID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFvcHRzLmJpbkRhdGEpIHtcbiAgICAgIG9wdHMuYmluRGF0YSA9ICdFT0YnO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc051bWJlcihvcHRzLmNodW5rSWQpKSB7XG4gICAgICBvcHRzLmNodW5rSWQgPSAtMTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNTdHJpbmcob3B0cy5GU05hbWUpKSB7XG4gICAgICBvcHRzLkZTTmFtZSA9IG9wdHMuZmlsZUlkO1xuICAgIH1cblxuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbVXBsb2FkXSBbJHt0cmFuc3BvcnR9XSBHb3QgIyR7b3B0cy5jaHVua0lkfS8ke29wdHMuZmlsZUxlbmd0aH0gY2h1bmtzLCBkc3Q6ICR7b3B0cy5maWxlLm5hbWUgfHwgb3B0cy5maWxlLmZpbGVOYW1lfWApO1xuXG4gICAgY29uc3QgZmlsZU5hbWUgPSB0aGlzLl9nZXRGaWxlTmFtZShvcHRzLmZpbGUpO1xuICAgIGNvbnN0IHtleHRlbnNpb24sIGV4dGVuc2lvbldpdGhEb3R9ID0gdGhpcy5fZ2V0RXh0KGZpbGVOYW1lKTtcblxuICAgIGlmICghaGVscGVycy5pc09iamVjdChvcHRzLmZpbGUubWV0YSkpIHtcbiAgICAgIG9wdHMuZmlsZS5tZXRhID0ge307XG4gICAgfVxuXG4gICAgbGV0IHJlc3VsdCAgICAgICA9IG9wdHMuZmlsZTtcbiAgICByZXN1bHQubmFtZSAgICAgID0gZmlsZU5hbWU7XG4gICAgcmVzdWx0Lm1ldGEgICAgICA9IG9wdHMuZmlsZS5tZXRhO1xuICAgIHJlc3VsdC5leHRlbnNpb24gPSBleHRlbnNpb247XG4gICAgcmVzdWx0LmV4dCAgICAgICA9IGV4dGVuc2lvbjtcbiAgICByZXN1bHQuX2lkICAgICAgID0gb3B0cy5maWxlSWQ7XG4gICAgcmVzdWx0LnVzZXJJZCAgICA9IHVzZXJJZCB8fCBudWxsO1xuICAgIG9wdHMuRlNOYW1lICAgICAgPSBvcHRzLkZTTmFtZS5yZXBsYWNlKC8oW15hLXowLTlcXC1cXF9dKykvZ2ksICctJyk7XG4gICAgcmVzdWx0LnBhdGggICAgICA9IGAke3RoaXMuc3RvcmFnZVBhdGgocmVzdWx0KX0ke25vZGVQYXRoLnNlcH0ke29wdHMuRlNOYW1lfSR7ZXh0ZW5zaW9uV2l0aERvdH1gO1xuICAgIHJlc3VsdCAgICAgICAgICAgPSBPYmplY3QuYXNzaWduKHJlc3VsdCwgdGhpcy5fZGF0YVRvU2NoZW1hKHJlc3VsdCkpO1xuXG4gICAgaWYgKHRoaXMub25CZWZvcmVVcGxvYWQgJiYgaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMub25CZWZvcmVVcGxvYWQpKSB7XG4gICAgICBjdHggPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgZmlsZTogb3B0cy5maWxlXG4gICAgICB9LCB7XG4gICAgICAgIGNodW5rSWQ6IG9wdHMuY2h1bmtJZCxcbiAgICAgICAgdXNlcklkOiByZXN1bHQudXNlcklkLFxuICAgICAgICB1c2VyKCkge1xuICAgICAgICAgIGlmIChNZXRlb3IudXNlcnMgJiYgcmVzdWx0LnVzZXJJZCkge1xuICAgICAgICAgICAgcmV0dXJuIE1ldGVvci51c2Vycy5maW5kT25lKHJlc3VsdC51c2VySWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgZW9mOiBvcHRzLmVvZlxuICAgICAgfSk7XG4gICAgICBjb25zdCBpc1VwbG9hZEFsbG93ZWQgPSB0aGlzLm9uQmVmb3JlVXBsb2FkLmNhbGwoY3R4LCByZXN1bHQpO1xuXG4gICAgICBpZiAoaXNVcGxvYWRBbGxvd2VkICE9PSB0cnVlKSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBoZWxwZXJzLmlzU3RyaW5nKGlzVXBsb2FkQWxsb3dlZCkgPyBpc1VwbG9hZEFsbG93ZWQgOiAnQG9uQmVmb3JlVXBsb2FkKCkgcmV0dXJuZWQgZmFsc2UnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICgob3B0cy5fX19zID09PSB0cnVlKSAmJiB0aGlzLm9uSW5pdGlhdGVVcGxvYWQgJiYgaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMub25Jbml0aWF0ZVVwbG9hZCkpIHtcbiAgICAgICAgICB0aGlzLm9uSW5pdGlhdGVVcGxvYWQuY2FsbChjdHgsIHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKChvcHRzLl9fX3MgPT09IHRydWUpICYmIHRoaXMub25Jbml0aWF0ZVVwbG9hZCAmJiBoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5vbkluaXRpYXRlVXBsb2FkKSkge1xuICAgICAgY3R4ID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIGZpbGU6IG9wdHMuZmlsZVxuICAgICAgfSwge1xuICAgICAgICBjaHVua0lkOiBvcHRzLmNodW5rSWQsXG4gICAgICAgIHVzZXJJZDogcmVzdWx0LnVzZXJJZCxcbiAgICAgICAgdXNlcigpIHtcbiAgICAgICAgICBpZiAoTWV0ZW9yLnVzZXJzICYmIHJlc3VsdC51c2VySWQpIHtcbiAgICAgICAgICAgIHJldHVybiBNZXRlb3IudXNlcnMuZmluZE9uZShyZXN1bHQudXNlcklkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIGVvZjogb3B0cy5lb2ZcbiAgICAgIH0pO1xuICAgICAgdGhpcy5vbkluaXRpYXRlVXBsb2FkLmNhbGwoY3R4LCByZXN1bHQpO1xuICAgIH1cblxuICAgIHJldHVybiB7cmVzdWx0LCBvcHRzfTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBfZmluaXNoVXBsb2FkXG4gICAqIEBzdW1tYXJ5IEludGVybmFsIG1ldGhvZC4gRmluaXNoIHVwbG9hZCwgY2xvc2UgV3JpdGFibGUgc3RyZWFtLCBhZGQgcmVjb3JkIHRvIE1vbmdvREIgYW5kIGZsdXNoIHVzZWQgbWVtb3J5XG4gICAqIEByZXR1cm5zIHt1bmRlZmluZWR9XG4gICAqL1xuICBfZmluaXNoVXBsb2FkKHJlc3VsdCwgb3B0cywgY2IpIHtcbiAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW1VwbG9hZF0gW2ZpbmlzaChpbmcpVXBsb2FkXSAtPiAke3Jlc3VsdC5wYXRofWApO1xuICAgIGZzLmNobW9kKHJlc3VsdC5wYXRoLCB0aGlzLnBlcm1pc3Npb25zLCBOT09QKTtcbiAgICByZXN1bHQudHlwZSAgID0gdGhpcy5fZ2V0TWltZVR5cGUob3B0cy5maWxlKTtcbiAgICByZXN1bHQucHVibGljID0gdGhpcy5wdWJsaWM7XG4gICAgdGhpcy5fdXBkYXRlRmlsZVR5cGVzKHJlc3VsdCk7XG5cbiAgICB0aGlzLmNvbGxlY3Rpb24uaW5zZXJ0KGhlbHBlcnMuY2xvbmUocmVzdWx0KSwgKGNvbEluc2VydCwgX2lkKSA9PiB7XG4gICAgICBpZiAoY29sSW5zZXJ0KSB7XG4gICAgICAgIGNiICYmIGNiKGNvbEluc2VydCk7XG4gICAgICAgIHRoaXMuX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbVXBsb2FkXSBbX2ZpbmlzaFVwbG9hZF0gW2luc2VydF0gRXJyb3I6JywgY29sSW5zZXJ0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3ByZUNvbGxlY3Rpb24udXBkYXRlKHtfaWQ6IG9wdHMuZmlsZUlkfSwgeyRzZXQ6IHtpc0ZpbmlzaGVkOiB0cnVlfX0sIChwcmVVcGRhdGVFcnJvcikgPT4ge1xuICAgICAgICAgIGlmIChwcmVVcGRhdGVFcnJvcikge1xuICAgICAgICAgICAgY2IgJiYgY2IocHJlVXBkYXRlRXJyb3IpO1xuICAgICAgICAgICAgdGhpcy5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtVcGxvYWRdIFtfZmluaXNoVXBsb2FkXSBbdXBkYXRlXSBFcnJvcjonLCBwcmVVcGRhdGVFcnJvcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5faWQgPSBfaWQ7XG4gICAgICAgICAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW1VwbG9hZF0gW2ZpbmlzaChlZClVcGxvYWRdIC0+ICR7cmVzdWx0LnBhdGh9YCk7XG4gICAgICAgICAgICB0aGlzLm9uQWZ0ZXJVcGxvYWQgJiYgdGhpcy5vbkFmdGVyVXBsb2FkLmNhbGwodGhpcywgcmVzdWx0KTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYWZ0ZXJVcGxvYWQnLCByZXN1bHQpO1xuICAgICAgICAgICAgY2IgJiYgY2IobnVsbCwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIF9oYW5kbGVVcGxvYWRcbiAgICogQHN1bW1hcnkgSW50ZXJuYWwgbWV0aG9kIHRvIGhhbmRsZSB1cGxvYWQgcHJvY2VzcywgcGlwZSBpbmNvbWluZyBkYXRhIHRvIFdyaXRhYmxlIHN0cmVhbVxuICAgKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxuICAgKi9cbiAgX2hhbmRsZVVwbG9hZChyZXN1bHQsIG9wdHMsIGNiKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChvcHRzLmVvZikge1xuICAgICAgICB0aGlzLl9jdXJyZW50VXBsb2Fkc1tyZXN1bHQuX2lkXS5lbmQoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZW1pdCgnX2ZpbmlzaFVwbG9hZCcsIHJlc3VsdCwgb3B0cywgY2IpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRVcGxvYWRzW3Jlc3VsdC5faWRdLndyaXRlKG9wdHMuY2h1bmtJZCwgb3B0cy5iaW5EYXRhLCBjYik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5fZGVidWcoJ1tfaGFuZGxlVXBsb2FkXSBbRVhDRVBUSU9OOl0nLCBlKTtcbiAgICAgIGNiICYmIGNiKGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIF9nZXRNaW1lVHlwZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZmlsZURhdGEgLSBGaWxlIE9iamVjdFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGZpbGUncyBtaW1lLXR5cGVcbiAgICogQHJldHVybnMge1N0cmluZ31cbiAgICovXG4gIF9nZXRNaW1lVHlwZShmaWxlRGF0YSkge1xuICAgIGxldCBtaW1lO1xuICAgIGNoZWNrKGZpbGVEYXRhLCBPYmplY3QpO1xuICAgIGlmIChoZWxwZXJzLmlzT2JqZWN0KGZpbGVEYXRhKSAmJiBmaWxlRGF0YS50eXBlKSB7XG4gICAgICBtaW1lID0gZmlsZURhdGEudHlwZTtcbiAgICB9XG5cbiAgICBpZiAoZmlsZURhdGEucGF0aCAmJiAoIW1pbWUgfHwgIWhlbHBlcnMuaXNTdHJpbmcobWltZSkpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgYnVmICAgPSBuZXcgQnVmZmVyKDI2Mik7XG4gICAgICAgIGNvbnN0IGZkICA9IGZzLm9wZW5TeW5jKGZpbGVEYXRhLnBhdGgsICdyJyk7XG4gICAgICAgIGNvbnN0IGJyICA9IGZzLnJlYWRTeW5jKGZkLCBidWYsIDAsIDI2MiwgMCk7XG4gICAgICAgIGZzLmNsb3NlKGZkLCBOT09QKTtcbiAgICAgICAgaWYgKGJyIDwgMjYyKSB7XG4gICAgICAgICAgYnVmID0gYnVmLnNsaWNlKDAsIGJyKTtcbiAgICAgICAgfVxuICAgICAgICAoe21pbWV9ID0gZmlsZVR5cGUoYnVmKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIFdlJ3JlIGdvb2RcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIW1pbWUgfHwgIWhlbHBlcnMuaXNTdHJpbmcobWltZSkpIHtcbiAgICAgIG1pbWUgPSAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJztcbiAgICB9XG4gICAgcmV0dXJuIG1pbWU7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBfZ2V0VXNlclxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIG9iamVjdCB3aXRoIGB1c2VySWRgIGFuZCBgdXNlcigpYCBtZXRob2Qgd2hpY2ggcmV0dXJuIHVzZXIncyBvYmplY3RcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIF9nZXRVc2VyKGh0dHApIHtcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICB1c2VyKCkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgIHVzZXJJZDogbnVsbFxuICAgIH07XG5cbiAgICBpZiAoaHR0cCkge1xuICAgICAgbGV0IG10b2sgPSBudWxsO1xuICAgICAgaWYgKGh0dHAucmVxdWVzdC5oZWFkZXJzWyd4LW10b2snXSkge1xuICAgICAgICBtdG9rID0gaHR0cC5yZXF1ZXN0LmhlYWRlcnNbJ3gtbXRvayddO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY29va2llID0gaHR0cC5yZXF1ZXN0LkNvb2tpZXM7XG4gICAgICAgIGlmIChjb29raWUuaGFzKCd4X210b2snKSkge1xuICAgICAgICAgIG10b2sgPSBjb29raWUuZ2V0KCd4X210b2snKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobXRvaykge1xuICAgICAgICBjb25zdCB1c2VySWQgPSAoaGVscGVycy5pc09iamVjdChNZXRlb3Iuc2VydmVyLnNlc3Npb25zKSAmJiBoZWxwZXJzLmlzT2JqZWN0KE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnNbbXRva10pKSA/IE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnNbbXRva10udXNlcklkIDogdm9pZCAwO1xuXG4gICAgICAgIGlmICh1c2VySWQpIHtcbiAgICAgICAgICByZXN1bHQudXNlciAgID0gKCkgPT4gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodXNlcklkKTtcbiAgICAgICAgICByZXN1bHQudXNlcklkID0gdXNlcklkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSB3cml0ZVxuICAgKiBAcGFyYW0ge0J1ZmZlcn0gYnVmZmVyIC0gQmluYXJ5IEZpbGUncyBCdWZmZXJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBPYmplY3Qgd2l0aCBmaWxlLWRhdGFcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMubmFtZSAtIEZpbGUgbmFtZSwgYWxpYXM6IGBmaWxlTmFtZWBcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMudHlwZSAtIEZpbGUgbWltZS10eXBlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzLm1ldGEgLSBGaWxlIGFkZGl0aW9uYWwgbWV0YS1kYXRhXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnVzZXJJZCAtIFVzZXJJZCwgZGVmYXVsdCAqbnVsbCpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuZmlsZUlkIC0gX2lkLCBkZWZhdWx0ICpudWxsKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIGZ1bmN0aW9uKGVycm9yLCBmaWxlT2JqKXsuLi59XG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gcHJvY2VlZEFmdGVyVXBsb2FkIC0gUHJvY2VlZCBvbkFmdGVyVXBsb2FkIGhvb2tcbiAgICogQHN1bW1hcnkgV3JpdGUgYnVmZmVyIHRvIEZTIGFuZCBhZGQgdG8gRmlsZXNDb2xsZWN0aW9uIENvbGxlY3Rpb25cbiAgICogQHJldHVybnMge0ZpbGVzQ29sbGVjdGlvbn0gSW5zdGFuY2VcbiAgICovXG4gIHdyaXRlKGJ1ZmZlciwgX29wdHMgPSB7fSwgX2NhbGxiYWNrLCBfcHJvY2VlZEFmdGVyVXBsb2FkKSB7XG4gICAgdGhpcy5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFt3cml0ZSgpXScpO1xuICAgIGxldCBvcHRzID0gX29wdHM7XG4gICAgbGV0IGNhbGxiYWNrID0gX2NhbGxiYWNrO1xuICAgIGxldCBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBfcHJvY2VlZEFmdGVyVXBsb2FkO1xuXG4gICAgaWYgKGhlbHBlcnMuaXNGdW5jdGlvbihvcHRzKSkge1xuICAgICAgcHJvY2VlZEFmdGVyVXBsb2FkID0gY2FsbGJhY2s7XG4gICAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgICBvcHRzICAgICA9IHt9O1xuICAgIH0gZWxzZSBpZiAoaGVscGVycy5pc0Jvb2xlYW4oY2FsbGJhY2spKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBjYWxsYmFjaztcbiAgICB9IGVsc2UgaWYgKGhlbHBlcnMuaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBvcHRzO1xuICAgIH1cblxuICAgIGNoZWNrKG9wdHMsIE1hdGNoLk9wdGlvbmFsKE9iamVjdCkpO1xuICAgIGNoZWNrKGNhbGxiYWNrLCBNYXRjaC5PcHRpb25hbChGdW5jdGlvbikpO1xuICAgIGNoZWNrKHByb2NlZWRBZnRlclVwbG9hZCwgTWF0Y2guT3B0aW9uYWwoQm9vbGVhbikpO1xuXG4gICAgY29uc3QgZmlsZUlkICAgPSBvcHRzLmZpbGVJZCB8fCBSYW5kb20uaWQoKTtcbiAgICBjb25zdCBGU05hbWUgICA9IHRoaXMubmFtaW5nRnVuY3Rpb24gPyB0aGlzLm5hbWluZ0Z1bmN0aW9uKG9wdHMpIDogZmlsZUlkO1xuICAgIGNvbnN0IGZpbGVOYW1lID0gKG9wdHMubmFtZSB8fCBvcHRzLmZpbGVOYW1lKSA/IChvcHRzLm5hbWUgfHwgb3B0cy5maWxlTmFtZSkgOiBGU05hbWU7XG5cbiAgICBjb25zdCB7ZXh0ZW5zaW9uLCBleHRlbnNpb25XaXRoRG90fSA9IHRoaXMuX2dldEV4dChmaWxlTmFtZSk7XG5cbiAgICBvcHRzLnBhdGggPSBgJHt0aGlzLnN0b3JhZ2VQYXRoKG9wdHMpfSR7bm9kZVBhdGguc2VwfSR7RlNOYW1lfSR7ZXh0ZW5zaW9uV2l0aERvdH1gO1xuICAgIG9wdHMudHlwZSA9IHRoaXMuX2dldE1pbWVUeXBlKG9wdHMpO1xuICAgIGlmICghaGVscGVycy5pc09iamVjdChvcHRzLm1ldGEpKSB7XG4gICAgICBvcHRzLm1ldGEgPSB7fTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNOdW1iZXIob3B0cy5zaXplKSkge1xuICAgICAgb3B0cy5zaXplID0gYnVmZmVyLmxlbmd0aDtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9kYXRhVG9TY2hlbWEoe1xuICAgICAgbmFtZTogZmlsZU5hbWUsXG4gICAgICBwYXRoOiBvcHRzLnBhdGgsXG4gICAgICBtZXRhOiBvcHRzLm1ldGEsXG4gICAgICB0eXBlOiBvcHRzLnR5cGUsXG4gICAgICBzaXplOiBvcHRzLnNpemUsXG4gICAgICB1c2VySWQ6IG9wdHMudXNlcklkLFxuICAgICAgZXh0ZW5zaW9uXG4gICAgfSk7XG5cbiAgICByZXN1bHQuX2lkID0gZmlsZUlkO1xuXG4gICAgY29uc3Qgc3RyZWFtID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0ob3B0cy5wYXRoLCB7ZmxhZ3M6ICd3JywgbW9kZTogdGhpcy5wZXJtaXNzaW9uc30pO1xuICAgIHN0cmVhbS5lbmQoYnVmZmVyLCAoc3RyZWFtRXJyKSA9PiBib3VuZCgoKSA9PiB7XG4gICAgICBpZiAoc3RyZWFtRXJyKSB7XG4gICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHN0cmVhbUVycik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb24uaW5zZXJ0KHJlc3VsdCwgKGluc2VydEVyciwgX2lkKSA9PiB7XG4gICAgICAgICAgaWYgKGluc2VydEVycikge1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soaW5zZXJ0RXJyKTtcbiAgICAgICAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbd3JpdGVdIFtpbnNlcnRdIEVycm9yOiAke2ZpbGVOYW1lfSAtPiAke3RoaXMuY29sbGVjdGlvbk5hbWV9YCwgaW5zZXJ0RXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZmlsZVJlZiA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKF9pZCk7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhudWxsLCBmaWxlUmVmKTtcbiAgICAgICAgICAgIGlmIChwcm9jZWVkQWZ0ZXJVcGxvYWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkFmdGVyVXBsb2FkICYmIHRoaXMub25BZnRlclVwbG9hZC5jYWxsKHRoaXMsIGZpbGVSZWYpO1xuICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2FmdGVyVXBsb2FkJywgZmlsZVJlZik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW3dyaXRlXTogJHtmaWxlTmFtZX0gLT4gJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIGxvYWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHVybCAtIFVSTCB0byBmaWxlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gT2JqZWN0IHdpdGggZmlsZS1kYXRhXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzLmhlYWRlcnMgLSBIVFRQIGhlYWRlcnMgdG8gdXNlIHdoZW4gcmVxdWVzdGluZyB0aGUgZmlsZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5uYW1lIC0gRmlsZSBuYW1lLCBhbGlhczogYGZpbGVOYW1lYFxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy50eXBlIC0gRmlsZSBtaW1lLXR5cGVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMubWV0YSAtIEZpbGUgYWRkaXRpb25hbCBtZXRhLWRhdGFcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMudXNlcklkIC0gVXNlcklkLCBkZWZhdWx0ICpudWxsKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5maWxlSWQgLSBfaWQsIGRlZmF1bHQgKm51bGwqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gZnVuY3Rpb24oZXJyb3IsIGZpbGVPYmopey4uLn1cbiAgICogQHBhcmFtIHtCb29sZWFufSBwcm9jZWVkQWZ0ZXJVcGxvYWQgLSBQcm9jZWVkIG9uQWZ0ZXJVcGxvYWQgaG9va1xuICAgKiBAc3VtbWFyeSBEb3dubG9hZCBmaWxlLCB3cml0ZSBzdHJlYW0gdG8gRlMgYW5kIGFkZCB0byBGaWxlc0NvbGxlY3Rpb24gQ29sbGVjdGlvblxuICAgKiBAcmV0dXJucyB7RmlsZXNDb2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgbG9hZCh1cmwsIF9vcHRzID0ge30sIF9jYWxsYmFjaywgX3Byb2NlZWRBZnRlclVwbG9hZCkge1xuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbbG9hZCgke3VybH0sICR7SlNPTi5zdHJpbmdpZnkoX29wdHMpfSwgY2FsbGJhY2spXWApO1xuICAgIGxldCBvcHRzID0gX29wdHM7XG4gICAgbGV0IGNhbGxiYWNrID0gX2NhbGxiYWNrO1xuICAgIGxldCBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBfcHJvY2VlZEFmdGVyVXBsb2FkO1xuXG4gICAgaWYgKGhlbHBlcnMuaXNGdW5jdGlvbihvcHRzKSkge1xuICAgICAgcHJvY2VlZEFmdGVyVXBsb2FkID0gY2FsbGJhY2s7XG4gICAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgICBvcHRzICAgICA9IHt9O1xuICAgIH0gZWxzZSBpZiAoaGVscGVycy5pc0Jvb2xlYW4oY2FsbGJhY2spKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBjYWxsYmFjaztcbiAgICB9IGVsc2UgaWYgKGhlbHBlcnMuaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBvcHRzO1xuICAgIH1cblxuICAgIGNoZWNrKHVybCwgU3RyaW5nKTtcbiAgICBjaGVjayhvcHRzLCBNYXRjaC5PcHRpb25hbChPYmplY3QpKTtcbiAgICBjaGVjayhjYWxsYmFjaywgTWF0Y2guT3B0aW9uYWwoRnVuY3Rpb24pKTtcbiAgICBjaGVjayhwcm9jZWVkQWZ0ZXJVcGxvYWQsIE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pKTtcblxuICAgIGlmICghaGVscGVycy5pc09iamVjdChvcHRzKSkge1xuICAgICAgb3B0cyA9IHt9O1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGVJZCAgICA9IG9wdHMuZmlsZUlkIHx8IFJhbmRvbS5pZCgpO1xuICAgIGNvbnN0IEZTTmFtZSAgICA9IHRoaXMubmFtaW5nRnVuY3Rpb24gPyB0aGlzLm5hbWluZ0Z1bmN0aW9uKG9wdHMpIDogZmlsZUlkO1xuICAgIGNvbnN0IHBhdGhQYXJ0cyA9IHVybC5zcGxpdCgnLycpO1xuICAgIGNvbnN0IGZpbGVOYW1lICA9IChvcHRzLm5hbWUgfHwgb3B0cy5maWxlTmFtZSkgPyAob3B0cy5uYW1lIHx8IG9wdHMuZmlsZU5hbWUpIDogcGF0aFBhcnRzW3BhdGhQYXJ0cy5sZW5ndGggLSAxXSB8fCBGU05hbWU7XG5cbiAgICBjb25zdCB7ZXh0ZW5zaW9uLCBleHRlbnNpb25XaXRoRG90fSA9IHRoaXMuX2dldEV4dChmaWxlTmFtZSk7XG4gICAgb3B0cy5wYXRoICA9IGAke3RoaXMuc3RvcmFnZVBhdGgob3B0cyl9JHtub2RlUGF0aC5zZXB9JHtGU05hbWV9JHtleHRlbnNpb25XaXRoRG90fWA7XG5cbiAgICBjb25zdCBzdG9yZVJlc3VsdCA9IChyZXN1bHQsIGNiKSA9PiB7XG4gICAgICByZXN1bHQuX2lkID0gZmlsZUlkO1xuXG4gICAgICB0aGlzLmNvbGxlY3Rpb24uaW5zZXJ0KHJlc3VsdCwgKGVycm9yLCBfaWQpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgY2IgJiYgY2IoZXJyb3IpO1xuICAgICAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbbG9hZF0gW2luc2VydF0gRXJyb3I6ICR7ZmlsZU5hbWV9IC0+ICR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gLCBlcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgZmlsZVJlZiA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKF9pZCk7XG4gICAgICAgICAgY2IgJiYgY2IobnVsbCwgZmlsZVJlZik7XG4gICAgICAgICAgaWYgKHByb2NlZWRBZnRlclVwbG9hZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgdGhpcy5vbkFmdGVyVXBsb2FkICYmIHRoaXMub25BZnRlclVwbG9hZC5jYWxsKHRoaXMsIGZpbGVSZWYpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdhZnRlclVwbG9hZCcsIGZpbGVSZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW2xvYWRdIFtpbnNlcnRdICR7ZmlsZU5hbWV9IC0+ICR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJlcXVlc3QuZ2V0KHtcbiAgICAgIHVybCxcbiAgICAgIGhlYWRlcnM6IG9wdHMuaGVhZGVycyB8fCB7fVxuICAgIH0pLm9uKCdlcnJvcicsIChlcnJvcikgPT4gYm91bmQoKCkgPT4ge1xuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyb3IpO1xuICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtsb2FkXSBbcmVxdWVzdC5nZXQoJHt1cmx9KV0gRXJyb3I6YCwgZXJyb3IpO1xuICAgIH0pKS5vbigncmVzcG9uc2UnLCAocmVzcG9uc2UpID0+IGJvdW5kKCgpID0+IHtcbiAgICAgIHJlc3BvbnNlLm9uKCdlbmQnLCAoKSA9PiBib3VuZCgoKSA9PiB7XG4gICAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbbG9hZF0gUmVjZWl2ZWQ6ICR7dXJsfWApO1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9kYXRhVG9TY2hlbWEoe1xuICAgICAgICAgIG5hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgIHBhdGg6IG9wdHMucGF0aCxcbiAgICAgICAgICBtZXRhOiBvcHRzLm1ldGEsXG4gICAgICAgICAgdHlwZTogb3B0cy50eXBlIHx8IHJlc3BvbnNlLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddIHx8IHRoaXMuX2dldE1pbWVUeXBlKHtwYXRoOiBvcHRzLnBhdGh9KSxcbiAgICAgICAgICBzaXplOiBvcHRzLnNpemUgfHwgcGFyc2VJbnQocmVzcG9uc2UuaGVhZGVyc1snY29udGVudC1sZW5ndGgnXSB8fCAwKSxcbiAgICAgICAgICB1c2VySWQ6IG9wdHMudXNlcklkLFxuICAgICAgICAgIGV4dGVuc2lvblxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIXJlc3VsdC5zaXplKSB7XG4gICAgICAgICAgZnMuc3RhdChvcHRzLnBhdGgsIChlcnJvciwgc3RhdHMpID0+IGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXN1bHQudmVyc2lvbnMub3JpZ2luYWwuc2l6ZSA9IChyZXN1bHQuc2l6ZSA9IHN0YXRzLnNpemUpO1xuICAgICAgICAgICAgICBzdG9yZVJlc3VsdChyZXN1bHQsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RvcmVSZXN1bHQocmVzdWx0LCBjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9KSkucGlwZShmcy5jcmVhdGVXcml0ZVN0cmVhbShvcHRzLnBhdGgsIHtmbGFnczogJ3cnLCBtb2RlOiB0aGlzLnBlcm1pc3Npb25zfSkpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgYWRkRmlsZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCAgICAgICAgICAtIFBhdGggdG8gZmlsZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cyAgICAgICAgICAtIFtPcHRpb25hbF0gT2JqZWN0IHdpdGggZmlsZS1kYXRhXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnR5cGUgICAgIC0gW09wdGlvbmFsXSBGaWxlIG1pbWUtdHlwZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cy5tZXRhICAgICAtIFtPcHRpb25hbF0gRmlsZSBhZGRpdGlvbmFsIG1ldGEtZGF0YVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5maWxlSWQgICAtIF9pZCwgZGVmYXVsdCAqbnVsbCpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMuZmlsZU5hbWUgLSBbT3B0aW9uYWxdIEZpbGUgbmFtZSwgaWYgbm90IHNwZWNpZmllZCBmaWxlIG5hbWUgYW5kIGV4dGVuc2lvbiB3aWxsIGJlIHRha2VuIGZyb20gcGF0aFxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy51c2VySWQgICAtIFtPcHRpb25hbF0gVXNlcklkLCBkZWZhdWx0ICpudWxsKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAgICAtIFtPcHRpb25hbF0gZnVuY3Rpb24oZXJyb3IsIGZpbGVPYmopey4uLn1cbiAgICogQHBhcmFtIHtCb29sZWFufSBwcm9jZWVkQWZ0ZXJVcGxvYWQgLSBQcm9jZWVkIG9uQWZ0ZXJVcGxvYWQgaG9va1xuICAgKiBAc3VtbWFyeSBBZGQgZmlsZSBmcm9tIEZTIHRvIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAcmV0dXJucyB7RmlsZXNDb2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgYWRkRmlsZShwYXRoLCBfb3B0cyA9IHt9LCBfY2FsbGJhY2ssIF9wcm9jZWVkQWZ0ZXJVcGxvYWQpIHtcbiAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW2FkZEZpbGUoJHtwYXRofSldYCk7XG4gICAgbGV0IG9wdHMgPSBfb3B0cztcbiAgICBsZXQgY2FsbGJhY2sgPSBfY2FsbGJhY2s7XG4gICAgbGV0IHByb2NlZWRBZnRlclVwbG9hZCA9IF9wcm9jZWVkQWZ0ZXJVcGxvYWQ7XG5cbiAgICBpZiAoaGVscGVycy5pc0Z1bmN0aW9uKG9wdHMpKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBjYWxsYmFjaztcbiAgICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICAgIG9wdHMgICAgID0ge307XG4gICAgfSBlbHNlIGlmIChoZWxwZXJzLmlzQm9vbGVhbihjYWxsYmFjaykpIHtcbiAgICAgIHByb2NlZWRBZnRlclVwbG9hZCA9IGNhbGxiYWNrO1xuICAgIH0gZWxzZSBpZiAoaGVscGVycy5pc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAgIHByb2NlZWRBZnRlclVwbG9hZCA9IG9wdHM7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHVibGljKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgJ0NhbiBub3QgcnVuIFthZGRGaWxlXSBvbiBwdWJsaWMgY29sbGVjdGlvbiEgSnVzdCBNb3ZlIGZpbGUgdG8gcm9vdCBvZiB5b3VyIHNlcnZlciwgdGhlbiBhZGQgcmVjb3JkIHRvIENvbGxlY3Rpb24nKTtcbiAgICB9XG5cbiAgICBjaGVjayhwYXRoLCBTdHJpbmcpO1xuICAgIGNoZWNrKG9wdHMsIE1hdGNoLk9wdGlvbmFsKE9iamVjdCkpO1xuICAgIGNoZWNrKGNhbGxiYWNrLCBNYXRjaC5PcHRpb25hbChGdW5jdGlvbikpO1xuICAgIGNoZWNrKHByb2NlZWRBZnRlclVwbG9hZCwgTWF0Y2guT3B0aW9uYWwoQm9vbGVhbikpO1xuXG4gICAgZnMuc3RhdChwYXRoLCAoc3RhdEVyciwgc3RhdHMpID0+IGJvdW5kKCgpID0+IHtcbiAgICAgIGlmIChzdGF0RXJyKSB7XG4gICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHN0YXRFcnIpO1xuICAgICAgfSBlbHNlIGlmIChzdGF0cy5pc0ZpbGUoKSkge1xuICAgICAgICBpZiAoIWhlbHBlcnMuaXNPYmplY3Qob3B0cykpIHtcbiAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgIH1cbiAgICAgICAgb3B0cy5wYXRoICA9IHBhdGg7XG5cbiAgICAgICAgaWYgKCFvcHRzLmZpbGVOYW1lKSB7XG4gICAgICAgICAgY29uc3QgcGF0aFBhcnRzID0gcGF0aC5zcGxpdChub2RlUGF0aC5zZXApO1xuICAgICAgICAgIG9wdHMuZmlsZU5hbWUgICA9IHBhdGguc3BsaXQobm9kZVBhdGguc2VwKVtwYXRoUGFydHMubGVuZ3RoIC0gMV07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7ZXh0ZW5zaW9ufSA9IHRoaXMuX2dldEV4dChvcHRzLmZpbGVOYW1lKTtcblxuICAgICAgICBpZiAoIWhlbHBlcnMuaXNTdHJpbmcob3B0cy50eXBlKSkge1xuICAgICAgICAgIG9wdHMudHlwZSA9IHRoaXMuX2dldE1pbWVUeXBlKG9wdHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFoZWxwZXJzLmlzT2JqZWN0KG9wdHMubWV0YSkpIHtcbiAgICAgICAgICBvcHRzLm1ldGEgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaGVscGVycy5pc051bWJlcihvcHRzLnNpemUpKSB7XG4gICAgICAgICAgb3B0cy5zaXplID0gc3RhdHMuc2l6ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2RhdGFUb1NjaGVtYSh7XG4gICAgICAgICAgbmFtZTogb3B0cy5maWxlTmFtZSxcbiAgICAgICAgICBwYXRoLFxuICAgICAgICAgIG1ldGE6IG9wdHMubWV0YSxcbiAgICAgICAgICB0eXBlOiBvcHRzLnR5cGUsXG4gICAgICAgICAgc2l6ZTogb3B0cy5zaXplLFxuICAgICAgICAgIHVzZXJJZDogb3B0cy51c2VySWQsXG4gICAgICAgICAgZXh0ZW5zaW9uLFxuICAgICAgICAgIF9zdG9yYWdlUGF0aDogcGF0aC5yZXBsYWNlKGAke25vZGVQYXRoLnNlcH0ke29wdHMuZmlsZU5hbWV9YCwgJycpLFxuICAgICAgICAgIGZpbGVJZDogb3B0cy5maWxlSWQgfHwgbnVsbFxuICAgICAgICB9KTtcblxuXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbi5pbnNlcnQocmVzdWx0LCAoaW5zZXJ0RXJyLCBfaWQpID0+IHtcbiAgICAgICAgICBpZiAoaW5zZXJ0RXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhpbnNlcnRFcnIpO1xuICAgICAgICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFthZGRGaWxlXSBbaW5zZXJ0XSBFcnJvcjogJHtyZXN1bHQubmFtZX0gLT4gJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWAsIGluc2VydEVycik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVSZWYgPSB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShfaWQpO1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobnVsbCwgZmlsZVJlZik7XG4gICAgICAgICAgICBpZiAocHJvY2VlZEFmdGVyVXBsb2FkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgIHRoaXMub25BZnRlclVwbG9hZCAmJiB0aGlzLm9uQWZ0ZXJVcGxvYWQuY2FsbCh0aGlzLCBmaWxlUmVmKTtcbiAgICAgICAgICAgICAgdGhpcy5lbWl0KCdhZnRlclVwbG9hZCcsIGZpbGVSZWYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFthZGRGaWxlXTogJHtyZXN1bHQubmFtZX0gLT4gJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKDQwMCwgYFtGaWxlc0NvbGxlY3Rpb25dIFthZGRGaWxlKCR7cGF0aH0pXTogRmlsZSBkb2VzIG5vdCBleGlzdGApKTtcbiAgICAgIH1cbiAgICB9KSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSByZW1vdmVcbiAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBzZWxlY3RvciAtIE1vbmdvLVN0eWxlIHNlbGVjdG9yIChodHRwOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI3NlbGVjdG9ycylcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayB3aXRoIG9uZSBgZXJyb3JgIGFyZ3VtZW50XG4gICAqIEBzdW1tYXJ5IFJlbW92ZSBkb2N1bWVudHMgZnJvbSB0aGUgY29sbGVjdGlvblxuICAgKiBAcmV0dXJucyB7RmlsZXNDb2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgcmVtb3ZlKHNlbGVjdG9yLCBjYWxsYmFjaykge1xuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbcmVtb3ZlKCR7SlNPTi5zdHJpbmdpZnkoc2VsZWN0b3IpfSldYCk7XG4gICAgaWYgKHNlbGVjdG9yID09PSB2b2lkIDApIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBjaGVjayhjYWxsYmFjaywgTWF0Y2guT3B0aW9uYWwoRnVuY3Rpb24pKTtcblxuICAgIGNvbnN0IGZpbGVzID0gdGhpcy5jb2xsZWN0aW9uLmZpbmQoc2VsZWN0b3IpO1xuICAgIGlmIChmaWxlcy5jb3VudCgpID4gMCkge1xuICAgICAgZmlsZXMuZm9yRWFjaCgoZmlsZSkgPT4ge1xuICAgICAgICB0aGlzLnVubGluayhmaWxlKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKDQwNCwgJ0N1cnNvciBpcyBlbXB0eSwgbm8gZmlsZXMgaXMgcmVtb3ZlZCcpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9uQWZ0ZXJSZW1vdmUpIHtcbiAgICAgIGNvbnN0IGRvY3MgPSBmaWxlcy5mZXRjaCgpO1xuICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICB0aGlzLmNvbGxlY3Rpb24ucmVtb3ZlKHNlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHNlbGYub25BZnRlclJlbW92ZShkb2NzKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbGxlY3Rpb24ucmVtb3ZlKHNlbGVjdG9yLCAoY2FsbGJhY2sgfHwgTk9PUCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBkZW55XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBydWxlc1xuICAgKiBAc2VlICBodHRwczovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNNb25nby1Db2xsZWN0aW9uLWRlbnlcbiAgICogQHN1bW1hcnkgbGluayBNb25nby5Db2xsZWN0aW9uIGRlbnkgbWV0aG9kc1xuICAgKiBAcmV0dXJucyB7TW9uZ28uQ29sbGVjdGlvbn0gSW5zdGFuY2VcbiAgICovXG4gIGRlbnkocnVsZXMpIHtcbiAgICB0aGlzLmNvbGxlY3Rpb24uZGVueShydWxlcyk7XG4gICAgcmV0dXJuIHRoaXMuY29sbGVjdGlvbjtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBhbGxvd1xuICAgKiBAcGFyYW0ge09iamVjdH0gcnVsZXNcbiAgICogQHNlZSBodHRwczovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNNb25nby1Db2xsZWN0aW9uLWFsbG93XG4gICAqIEBzdW1tYXJ5IGxpbmsgTW9uZ28uQ29sbGVjdGlvbiBhbGxvdyBtZXRob2RzXG4gICAqIEByZXR1cm5zIHtNb25nby5Db2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgYWxsb3cocnVsZXMpIHtcbiAgICB0aGlzLmNvbGxlY3Rpb24uYWxsb3cocnVsZXMpO1xuICAgIHJldHVybiB0aGlzLmNvbGxlY3Rpb247XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgZGVueUNsaWVudFxuICAgKiBAc2VlIGh0dHBzOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI01vbmdvLUNvbGxlY3Rpb24tZGVueVxuICAgKiBAc3VtbWFyeSBTaG9ydGhhbmRzIGZvciBNb25nby5Db2xsZWN0aW9uIGRlbnkgbWV0aG9kXG4gICAqIEByZXR1cm5zIHtNb25nby5Db2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgZGVueUNsaWVudCgpIHtcbiAgICB0aGlzLmNvbGxlY3Rpb24uZGVueSh7XG4gICAgICBpbnNlcnQoKSB7IHJldHVybiB0cnVlOyB9LFxuICAgICAgdXBkYXRlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgICAgIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH1cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5jb2xsZWN0aW9uO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIGFsbG93Q2xpZW50XG4gICAqIEBzZWUgaHR0cHM6Ly9kb2NzLm1ldGVvci5jb20vYXBpL2NvbGxlY3Rpb25zLmh0bWwjTW9uZ28tQ29sbGVjdGlvbi1hbGxvd1xuICAgKiBAc3VtbWFyeSBTaG9ydGhhbmRzIGZvciBNb25nby5Db2xsZWN0aW9uIGFsbG93IG1ldGhvZFxuICAgKiBAcmV0dXJucyB7TW9uZ28uQ29sbGVjdGlvbn0gSW5zdGFuY2VcbiAgICovXG4gIGFsbG93Q2xpZW50KCkge1xuICAgIHRoaXMuY29sbGVjdGlvbi5hbGxvdyh7XG4gICAgICBpbnNlcnQoKSB7IHJldHVybiB0cnVlOyB9LFxuICAgICAgdXBkYXRlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgICAgIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH1cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5jb2xsZWN0aW9uO1xuICB9XG5cblxuICAvKlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgdW5saW5rXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlUmVmIC0gZmlsZU9ialxuICAgKiBAcGFyYW0ge1N0cmluZ30gdmVyc2lvbiAtIFtPcHRpb25hbF0gZmlsZSdzIHZlcnNpb25cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBbT3B0aW9uYWxdIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqIEBzdW1tYXJ5IFVubGluayBmaWxlcyBhbmQgaXQncyB2ZXJzaW9ucyBmcm9tIEZTXG4gICAqIEByZXR1cm5zIHtGaWxlc0NvbGxlY3Rpb259IEluc3RhbmNlXG4gICAqL1xuICB1bmxpbmsoZmlsZVJlZiwgdmVyc2lvbiwgY2FsbGJhY2spIHtcbiAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW3VubGluaygke2ZpbGVSZWYuX2lkfSwgJHt2ZXJzaW9ufSldYCk7XG4gICAgaWYgKHZlcnNpb24pIHtcbiAgICAgIGlmIChoZWxwZXJzLmlzT2JqZWN0KGZpbGVSZWYudmVyc2lvbnMpICYmIGhlbHBlcnMuaXNPYmplY3QoZmlsZVJlZi52ZXJzaW9uc1t2ZXJzaW9uXSkgJiYgZmlsZVJlZi52ZXJzaW9uc1t2ZXJzaW9uXS5wYXRoKSB7XG4gICAgICAgIGZzLnVubGluayhmaWxlUmVmLnZlcnNpb25zW3ZlcnNpb25dLnBhdGgsIChjYWxsYmFjayB8fCBOT09QKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChoZWxwZXJzLmlzT2JqZWN0KGZpbGVSZWYudmVyc2lvbnMpKSB7XG4gICAgICAgIGZvcihsZXQgdktleSBpbiBmaWxlUmVmLnZlcnNpb25zKSB7XG4gICAgICAgICAgaWYgKGZpbGVSZWYudmVyc2lvbnNbdktleV0gJiYgZmlsZVJlZi52ZXJzaW9uc1t2S2V5XS5wYXRoKSB7XG4gICAgICAgICAgICBmcy51bmxpbmsoZmlsZVJlZi52ZXJzaW9uc1t2S2V5XS5wYXRoLCAoY2FsbGJhY2sgfHwgTk9PUCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnMudW5saW5rKGZpbGVSZWYucGF0aCwgKGNhbGxiYWNrIHx8IE5PT1ApKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgXzQwNFxuICAgKiBAc3VtbWFyeSBJbnRlcm5hbCBtZXRob2QsIHVzZWQgdG8gcmV0dXJuIDQwNCBlcnJvclxuICAgKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxuICAgKi9cbiAgXzQwNChodHRwKSB7XG4gICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtkb3dubG9hZCgke2h0dHAucmVxdWVzdC5vcmlnaW5hbFVybH0pXSBbXzQwNF0gRmlsZSBub3QgZm91bmRgKTtcbiAgICBjb25zdCB0ZXh0ID0gJ0ZpbGUgTm90IEZvdW5kIDooJztcblxuICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgaHR0cC5yZXNwb25zZS53cml0ZUhlYWQoNDA0LCB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAndGV4dC9wbGFpbicsXG4gICAgICAgICdDb250ZW50LUxlbmd0aCc6IHRleHQubGVuZ3RoXG4gICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoIWh0dHAucmVzcG9uc2UuZmluaXNoZWQpIHtcbiAgICAgIGh0dHAucmVzcG9uc2UuZW5kKHRleHQpO1xuICAgIH1cbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBkb3dubG9hZFxuICAgKiBAcGFyYW0ge09iamVjdH0gaHR0cCAgICAtIFNlcnZlciBIVFRQIG9iamVjdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdmVyc2lvbiAtIFJlcXVlc3RlZCBmaWxlIHZlcnNpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGZpbGVSZWYgLSBSZXF1ZXN0ZWQgZmlsZSBPYmplY3RcbiAgICogQHN1bW1hcnkgSW5pdGlhdGVzIHRoZSBIVFRQIHJlc3BvbnNlXG4gICAqIEByZXR1cm5zIHt1bmRlZmluZWR9XG4gICAqL1xuICBkb3dubG9hZChodHRwLCB2ZXJzaW9uID0gJ29yaWdpbmFsJywgZmlsZVJlZikge1xuICAgIGxldCB2UmVmO1xuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbZG93bmxvYWQoJHtodHRwLnJlcXVlc3Qub3JpZ2luYWxVcmx9LCAke3ZlcnNpb259KV1gKTtcblxuICAgIGlmIChmaWxlUmVmKSB7XG4gICAgICBpZiAoaGVscGVycy5oYXMoZmlsZVJlZiwgJ3ZlcnNpb25zJykgJiYgaGVscGVycy5oYXMoZmlsZVJlZi52ZXJzaW9ucywgdmVyc2lvbikpIHtcbiAgICAgICAgdlJlZiA9IGZpbGVSZWYudmVyc2lvbnNbdmVyc2lvbl07XG4gICAgICAgIHZSZWYuX2lkID0gZmlsZVJlZi5faWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2UmVmID0gZmlsZVJlZjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdlJlZiA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghdlJlZiB8fCAhaGVscGVycy5pc09iamVjdCh2UmVmKSkge1xuICAgICAgcmV0dXJuIHRoaXMuXzQwNChodHRwKTtcbiAgICB9IGVsc2UgaWYgKGZpbGVSZWYpIHtcbiAgICAgIGlmICh0aGlzLmRvd25sb2FkQ2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCF0aGlzLmRvd25sb2FkQ2FsbGJhY2suY2FsbChPYmplY3QuYXNzaWduKGh0dHAsIHRoaXMuX2dldFVzZXIoaHR0cCkpLCBmaWxlUmVmKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl80MDQoaHR0cCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuaW50ZXJjZXB0RG93bmxvYWQgJiYgaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMuaW50ZXJjZXB0RG93bmxvYWQpKSB7XG4gICAgICAgIGlmICh0aGlzLmludGVyY2VwdERvd25sb2FkKGh0dHAsIGZpbGVSZWYsIHZlcnNpb24pID09PSB0cnVlKSB7XG4gICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmcy5zdGF0KHZSZWYucGF0aCwgKHN0YXRFcnIsIHN0YXRzKSA9PiBib3VuZCgoKSA9PiB7XG4gICAgICAgIGxldCByZXNwb25zZVR5cGU7XG4gICAgICAgIGlmIChzdGF0RXJyIHx8ICFzdGF0cy5pc0ZpbGUoKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl80MDQoaHR0cCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKHN0YXRzLnNpemUgIT09IHZSZWYuc2l6ZSkgJiYgIXRoaXMuaW50ZWdyaXR5Q2hlY2spIHtcbiAgICAgICAgICB2UmVmLnNpemUgICAgPSBzdGF0cy5zaXplO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKChzdGF0cy5zaXplICE9PSB2UmVmLnNpemUpICYmIHRoaXMuaW50ZWdyaXR5Q2hlY2spIHtcbiAgICAgICAgICByZXNwb25zZVR5cGUgPSAnNDAwJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLnNlcnZlKGh0dHAsIGZpbGVSZWYsIHZSZWYsIHZlcnNpb24sIG51bGwsIChyZXNwb25zZVR5cGUgfHwgJzIwMCcpKTtcbiAgICAgIH0pKTtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl80MDQoaHR0cCk7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgc2VydmVcbiAgICogQHBhcmFtIHtPYmplY3R9IGh0dHAgICAgLSBTZXJ2ZXIgSFRUUCBvYmplY3RcbiAgICogQHBhcmFtIHtPYmplY3R9IGZpbGVSZWYgLSBSZXF1ZXN0ZWQgZmlsZSBPYmplY3RcbiAgICogQHBhcmFtIHtPYmplY3R9IHZSZWYgICAgLSBSZXF1ZXN0ZWQgZmlsZSB2ZXJzaW9uIE9iamVjdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdmVyc2lvbiAtIFJlcXVlc3RlZCBmaWxlIHZlcnNpb25cbiAgICogQHBhcmFtIHtzdHJlYW0uUmVhZGFibGV8bnVsbH0gcmVhZGFibGVTdHJlYW0gLSBSZWFkYWJsZSBzdHJlYW0sIHdoaWNoIHNlcnZlcyBiaW5hcnkgZmlsZSBkYXRhXG4gICAqIEBwYXJhbSB7U3RyaW5nfSByZXNwb25zZVR5cGUgLSBSZXNwb25zZSBjb2RlXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gZm9yY2UyMDAgLSBGb3JjZSAyMDAgcmVzcG9uc2UgY29kZSBvdmVyIDIwNlxuICAgKiBAc3VtbWFyeSBIYW5kbGUgYW5kIHJlcGx5IHRvIGluY29taW5nIHJlcXVlc3RcbiAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICovXG4gIHNlcnZlKGh0dHAsIGZpbGVSZWYsIHZSZWYsIHZlcnNpb24gPSAnb3JpZ2luYWwnLCByZWFkYWJsZVN0cmVhbSA9IG51bGwsIF9yZXNwb25zZVR5cGUgPSAnMjAwJywgZm9yY2UyMDAgPSBmYWxzZSkge1xuICAgIGxldCBwYXJ0aXJhbCA9IGZhbHNlO1xuICAgIGxldCByZXFSYW5nZSA9IGZhbHNlO1xuICAgIGxldCBkaXNwb3NpdGlvblR5cGUgPSAnJztcbiAgICBsZXQgc3RhcnQ7XG4gICAgbGV0IGVuZDtcbiAgICBsZXQgdGFrZTtcbiAgICBsZXQgcmVzcG9uc2VUeXBlID0gX3Jlc3BvbnNlVHlwZTtcblxuICAgIGlmIChodHRwLnBhcmFtcy5xdWVyeS5kb3dubG9hZCAmJiAoaHR0cC5wYXJhbXMucXVlcnkuZG93bmxvYWQgPT09ICd0cnVlJykpIHtcbiAgICAgIGRpc3Bvc2l0aW9uVHlwZSA9ICdhdHRhY2htZW50OyAnO1xuICAgIH0gZWxzZSB7XG4gICAgICBkaXNwb3NpdGlvblR5cGUgPSAnaW5saW5lOyAnO1xuICAgIH1cblxuICAgIGNvbnN0IGRpc3Bvc2l0aW9uTmFtZSAgICAgPSBgZmlsZW5hbWU9XFxcIiR7ZW5jb2RlVVJJKHZSZWYubmFtZSB8fCBmaWxlUmVmLm5hbWUpLnJlcGxhY2UoL1xcLC9nLCAnJTJDJyl9XFxcIjsgZmlsZW5hbWUqPVVURi04Jycke2VuY29kZVVSSUNvbXBvbmVudCh2UmVmLm5hbWUgfHwgZmlsZVJlZi5uYW1lKX07IGA7XG4gICAgY29uc3QgZGlzcG9zaXRpb25FbmNvZGluZyA9ICdjaGFyc2V0PVVURi04JztcblxuICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgaHR0cC5yZXNwb25zZS5zZXRIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nLCBkaXNwb3NpdGlvblR5cGUgKyBkaXNwb3NpdGlvbk5hbWUgKyBkaXNwb3NpdGlvbkVuY29kaW5nKTtcbiAgICB9XG5cbiAgICBpZiAoaHR0cC5yZXF1ZXN0LmhlYWRlcnMucmFuZ2UgJiYgIWZvcmNlMjAwKSB7XG4gICAgICBwYXJ0aXJhbCAgICA9IHRydWU7XG4gICAgICBjb25zdCBhcnJheSA9IGh0dHAucmVxdWVzdC5oZWFkZXJzLnJhbmdlLnNwbGl0KC9ieXRlcz0oWzAtOV0qKS0oWzAtOV0qKS8pO1xuICAgICAgc3RhcnQgICAgICAgPSBwYXJzZUludChhcnJheVsxXSk7XG4gICAgICBlbmQgICAgICAgICA9IHBhcnNlSW50KGFycmF5WzJdKTtcbiAgICAgIGlmIChpc05hTihlbmQpKSB7XG4gICAgICAgIGVuZCAgICAgICA9IHZSZWYuc2l6ZSAtIDE7XG4gICAgICB9XG4gICAgICB0YWtlICAgICAgICA9IGVuZCAtIHN0YXJ0O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydCA9IDA7XG4gICAgICBlbmQgICA9IHZSZWYuc2l6ZSAtIDE7XG4gICAgICB0YWtlICA9IHZSZWYuc2l6ZTtcbiAgICB9XG5cbiAgICBpZiAocGFydGlyYWwgfHwgKGh0dHAucGFyYW1zLnF1ZXJ5LnBsYXkgJiYgKGh0dHAucGFyYW1zLnF1ZXJ5LnBsYXkgPT09ICd0cnVlJykpKSB7XG4gICAgICByZXFSYW5nZSA9IHtzdGFydCwgZW5kfTtcbiAgICAgIGlmIChpc05hTihzdGFydCkgJiYgIWlzTmFOKGVuZCkpIHtcbiAgICAgICAgcmVxUmFuZ2Uuc3RhcnQgPSBlbmQgLSB0YWtlO1xuICAgICAgICByZXFSYW5nZS5lbmQgICA9IGVuZDtcbiAgICAgIH1cbiAgICAgIGlmICghaXNOYU4oc3RhcnQpICYmIGlzTmFOKGVuZCkpIHtcbiAgICAgICAgcmVxUmFuZ2Uuc3RhcnQgPSBzdGFydDtcbiAgICAgICAgcmVxUmFuZ2UuZW5kICAgPSBzdGFydCArIHRha2U7XG4gICAgICB9XG5cbiAgICAgIGlmICgoc3RhcnQgKyB0YWtlKSA+PSB2UmVmLnNpemUpIHsgcmVxUmFuZ2UuZW5kID0gdlJlZi5zaXplIC0gMTsgfVxuXG4gICAgICBpZiAodGhpcy5zdHJpY3QgJiYgKChyZXFSYW5nZS5zdGFydCA+PSAodlJlZi5zaXplIC0gMSkpIHx8IChyZXFSYW5nZS5lbmQgPiAodlJlZi5zaXplIC0gMSkpKSkge1xuICAgICAgICByZXNwb25zZVR5cGUgPSAnNDE2JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3BvbnNlVHlwZSA9ICcyMDYnO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXNwb25zZVR5cGUgPSAnMjAwJztcbiAgICB9XG5cbiAgICBjb25zdCBzdHJlYW1FcnJvckhhbmRsZXIgPSAoZXJyb3IpID0+IHtcbiAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbc2VydmUoJHt2UmVmLnBhdGh9LCAke3ZlcnNpb259KV0gWzUwMF1gLCBlcnJvcik7XG4gICAgICBpZiAoIWh0dHAucmVzcG9uc2UuZmluaXNoZWQpIHtcbiAgICAgICAgaHR0cC5yZXNwb25zZS5lbmQoZXJyb3IudG9TdHJpbmcoKSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IGhlYWRlcnMgPSBoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5yZXNwb25zZUhlYWRlcnMpID8gdGhpcy5yZXNwb25zZUhlYWRlcnMocmVzcG9uc2VUeXBlLCBmaWxlUmVmLCB2UmVmLCB2ZXJzaW9uKSA6IHRoaXMucmVzcG9uc2VIZWFkZXJzO1xuXG4gICAgaWYgKCFoZWFkZXJzWydDYWNoZS1Db250cm9sJ10pIHtcbiAgICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgICBodHRwLnJlc3BvbnNlLnNldEhlYWRlcignQ2FjaGUtQ29udHJvbCcsIHRoaXMuY2FjaGVDb250cm9sKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gaGVhZGVycykge1xuICAgICAgaWYgKCFodHRwLnJlc3BvbnNlLmhlYWRlcnNTZW50KSB7XG4gICAgICAgIGh0dHAucmVzcG9uc2Uuc2V0SGVhZGVyKGtleSwgaGVhZGVyc1trZXldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25kID0gKHN0cmVhbSwgY29kZSkgPT4ge1xuICAgICAgaWYgKCFodHRwLnJlc3BvbnNlLmhlYWRlcnNTZW50ICYmIHJlYWRhYmxlU3RyZWFtKSB7XG4gICAgICAgIGh0dHAucmVzcG9uc2Uud3JpdGVIZWFkKGNvZGUpO1xuICAgICAgfVxuXG4gICAgICBodHRwLnJlc3BvbnNlLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHJlYW0uYWJvcnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBzdHJlYW0uYWJvcnQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHN0cmVhbS5lbmQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBzdHJlYW0uZW5kKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBodHRwLnJlcXVlc3Qub24oJ2Fib3J0ZWQnLCAoKSA9PiB7XG4gICAgICAgIGh0dHAucmVxdWVzdC5hYm9ydGVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHJlYW0uYWJvcnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBzdHJlYW0uYWJvcnQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHN0cmVhbS5lbmQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBzdHJlYW0uZW5kKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBzdHJlYW0ub24oJ29wZW4nLCAoKSA9PiB7XG4gICAgICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgICAgIGh0dHAucmVzcG9uc2Uud3JpdGVIZWFkKGNvZGUpO1xuICAgICAgICB9XG4gICAgICB9KS5vbignYWJvcnQnLCAoKSA9PiB7XG4gICAgICAgIGlmICghaHR0cC5yZXNwb25zZS5maW5pc2hlZCkge1xuICAgICAgICAgIGh0dHAucmVzcG9uc2UuZW5kKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFodHRwLnJlcXVlc3QuYWJvcnRlZCkge1xuICAgICAgICAgIGh0dHAucmVxdWVzdC5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgIH0pLm9uKCdlcnJvcicsIHN0cmVhbUVycm9ySGFuZGxlclxuICAgICAgKS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICBpZiAoIWh0dHAucmVzcG9uc2UuZmluaXNoZWQpIHtcbiAgICAgICAgICBodHRwLnJlc3BvbnNlLmVuZCgpO1xuICAgICAgICB9XG4gICAgICB9KS5waXBlKGh0dHAucmVzcG9uc2UpO1xuICAgIH07XG5cbiAgICBzd2l0Y2ggKHJlc3BvbnNlVHlwZSkge1xuICAgIGNhc2UgJzQwMCc6XG4gICAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW3NlcnZlKCR7dlJlZi5wYXRofSwgJHt2ZXJzaW9ufSldIFs0MDBdIENvbnRlbnQtTGVuZ3RoIG1pc21hdGNoIWApO1xuICAgICAgdmFyIHRleHQgPSAnQ29udGVudC1MZW5ndGggbWlzbWF0Y2ghJztcblxuICAgICAgaWYgKCFodHRwLnJlc3BvbnNlLmhlYWRlcnNTZW50KSB7XG4gICAgICAgIGh0dHAucmVzcG9uc2Uud3JpdGVIZWFkKDQwMCwge1xuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAndGV4dC9wbGFpbicsXG4gICAgICAgICAgJ0NvbnRlbnQtTGVuZ3RoJzogdGV4dC5sZW5ndGhcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghaHR0cC5yZXNwb25zZS5maW5pc2hlZCkge1xuICAgICAgICBodHRwLnJlc3BvbnNlLmVuZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJzQwNCc6XG4gICAgICB0aGlzLl80MDQoaHR0cCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICc0MTYnOlxuICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtzZXJ2ZSgke3ZSZWYucGF0aH0sICR7dmVyc2lvbn0pXSBbNDE2XSBDb250ZW50LVJhbmdlIGlzIG5vdCBzcGVjaWZpZWQhYCk7XG4gICAgICBpZiAoIWh0dHAucmVzcG9uc2UuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgaHR0cC5yZXNwb25zZS53cml0ZUhlYWQoNDE2KTtcbiAgICAgIH1cbiAgICAgIGlmICghaHR0cC5yZXNwb25zZS5maW5pc2hlZCkge1xuICAgICAgICBodHRwLnJlc3BvbnNlLmVuZCgpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnMjA2JzpcbiAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbc2VydmUoJHt2UmVmLnBhdGh9LCAke3ZlcnNpb259KV0gWzIwNl1gKTtcbiAgICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgICBodHRwLnJlc3BvbnNlLnNldEhlYWRlcignQ29udGVudC1SYW5nZScsIGBieXRlcyAke3JlcVJhbmdlLnN0YXJ0fS0ke3JlcVJhbmdlLmVuZH0vJHt2UmVmLnNpemV9YCk7XG4gICAgICB9XG4gICAgICByZXNwb25kKHJlYWRhYmxlU3RyZWFtIHx8IGZzLmNyZWF0ZVJlYWRTdHJlYW0odlJlZi5wYXRoLCB7c3RhcnQ6IHJlcVJhbmdlLnN0YXJ0LCBlbmQ6IHJlcVJhbmdlLmVuZH0pLCAyMDYpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbc2VydmUoJHt2UmVmLnBhdGh9LCAke3ZlcnNpb259KV0gWzIwMF1gKTtcbiAgICAgIHJlc3BvbmQocmVhZGFibGVTdHJlYW0gfHwgZnMuY3JlYXRlUmVhZFN0cmVhbSh2UmVmLnBhdGgpLCAyMDApO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSAgICAgICAgICAgIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuaW1wb3J0IHsgY2hlY2ssIE1hdGNoIH0gICAgICAgICAgICBmcm9tICdtZXRlb3IvY2hlY2snO1xuaW1wb3J0IHsgZm9ybWF0RmxlVVJMLCBoZWxwZXJzIH0gICBmcm9tICcuL2xpYi5qcyc7XG5pbXBvcnQgeyBGaWxlc0N1cnNvciwgRmlsZUN1cnNvciB9IGZyb20gJy4vY3Vyc29yLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmlsZXNDb2xsZWN0aW9uQ29yZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBzdGF0aWMgX19oZWxwZXJzID0gaGVscGVycztcblxuICBzdGF0aWMgc2NoZW1hID0ge1xuICAgIF9pZDoge1xuICAgICAgdHlwZTogU3RyaW5nXG4gICAgfSxcbiAgICBzaXplOiB7XG4gICAgICB0eXBlOiBOdW1iZXJcbiAgICB9LFxuICAgIG5hbWU6IHtcbiAgICAgIHR5cGU6IFN0cmluZ1xuICAgIH0sXG4gICAgdHlwZToge1xuICAgICAgdHlwZTogU3RyaW5nXG4gICAgfSxcbiAgICBwYXRoOiB7XG4gICAgICB0eXBlOiBTdHJpbmdcbiAgICB9LFxuICAgIGlzVmlkZW86IHtcbiAgICAgIHR5cGU6IEJvb2xlYW5cbiAgICB9LFxuICAgIGlzQXVkaW86IHtcbiAgICAgIHR5cGU6IEJvb2xlYW5cbiAgICB9LFxuICAgIGlzSW1hZ2U6IHtcbiAgICAgIHR5cGU6IEJvb2xlYW5cbiAgICB9LFxuICAgIGlzVGV4dDoge1xuICAgICAgdHlwZTogQm9vbGVhblxuICAgIH0sXG4gICAgaXNKU09OOiB7XG4gICAgICB0eXBlOiBCb29sZWFuXG4gICAgfSxcbiAgICBpc1BERjoge1xuICAgICAgdHlwZTogQm9vbGVhblxuICAgIH0sXG4gICAgZXh0ZW5zaW9uOiB7XG4gICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG4gICAgZXh0OiB7XG4gICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG4gICAgZXh0ZW5zaW9uV2l0aERvdDoge1xuICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIG1pbWU6IHtcbiAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICAnbWltZS10eXBlJzoge1xuICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIF9zdG9yYWdlUGF0aDoge1xuICAgICAgdHlwZTogU3RyaW5nXG4gICAgfSxcbiAgICBfZG93bmxvYWRSb3V0ZToge1xuICAgICAgdHlwZTogU3RyaW5nXG4gICAgfSxcbiAgICBfY29sbGVjdGlvbk5hbWU6IHtcbiAgICAgIHR5cGU6IFN0cmluZ1xuICAgIH0sXG4gICAgcHVibGljOiB7XG4gICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIG1ldGE6IHtcbiAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgIGJsYWNrYm94OiB0cnVlLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIHVzZXJJZDoge1xuICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIHVwZGF0ZWRBdDoge1xuICAgICAgdHlwZTogRGF0ZSxcbiAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICB2ZXJzaW9uczoge1xuICAgICAgdHlwZTogT2JqZWN0LFxuICAgICAgYmxhY2tib3g6IHRydWVcbiAgICB9XG4gIH07XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25Db3JlXG4gICAqIEBuYW1lIF9kZWJ1Z1xuICAgKiBAc3VtbWFyeSBQcmludCBsb2dzIGluIGRlYnVnIG1vZGVcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBfZGVidWcoKSB7XG4gICAgaWYgKHRoaXMuZGVidWcpIHtcbiAgICAgIChjb25zb2xlLmluZm8gfHwgY29uc29sZS5sb2cgfHwgZnVuY3Rpb24gKCkgeyB9KS5hcHBseSh2b2lkIDAsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25Db3JlXG4gICAqIEBuYW1lIF9nZXRGaWxlTmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZmlsZURhdGEgLSBGaWxlIE9iamVjdFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGZpbGUncyBuYW1lXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAqL1xuICBfZ2V0RmlsZU5hbWUoZmlsZURhdGEpIHtcbiAgICBjb25zdCBmaWxlTmFtZSA9IGZpbGVEYXRhLm5hbWUgfHwgZmlsZURhdGEuZmlsZU5hbWU7XG4gICAgaWYgKGhlbHBlcnMuaXNTdHJpbmcoZmlsZU5hbWUpICYmIChmaWxlTmFtZS5sZW5ndGggPiAwKSkge1xuICAgICAgcmV0dXJuIChmaWxlRGF0YS5uYW1lIHx8IGZpbGVEYXRhLmZpbGVOYW1lKS5yZXBsYWNlKC9eXFwuXFwuKy8sICcnKS5yZXBsYWNlKC9cXC57Mix9L2csICcuJykucmVwbGFjZSgvXFwvL2csICcnKTtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25Db3JlXG4gICAqIEBuYW1lIF9nZXRFeHRcbiAgICogQHBhcmFtIHtTdHJpbmd9IEZpbGVOYW1lIC0gRmlsZSBuYW1lXG4gICAqIEBzdW1tYXJ5IEdldCBleHRlbnNpb24gZnJvbSBGaWxlTmFtZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgX2dldEV4dChmaWxlTmFtZSkge1xuICAgIGlmICghIX5maWxlTmFtZS5pbmRleE9mKCcuJykpIHtcbiAgICAgIGNvbnN0IGV4dGVuc2lvbiA9IChmaWxlTmFtZS5zcGxpdCgnLicpLnBvcCgpLnNwbGl0KCc/JylbMF0gfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gICAgICByZXR1cm4geyBleHQ6IGV4dGVuc2lvbiwgZXh0ZW5zaW9uLCBleHRlbnNpb25XaXRoRG90OiBgLiR7ZXh0ZW5zaW9ufWAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgZXh0OiAnJywgZXh0ZW5zaW9uOiAnJywgZXh0ZW5zaW9uV2l0aERvdDogJycgfTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uQ29yZVxuICAgKiBAbmFtZSBfdXBkYXRlRmlsZVR5cGVzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gRmlsZSBkYXRhXG4gICAqIEBzdW1tYXJ5IEludGVybmFsIG1ldGhvZC4gQ2xhc3NpZnkgZmlsZSBiYXNlZCBvbiAndHlwZScgZmllbGRcbiAgICovXG4gIF91cGRhdGVGaWxlVHlwZXMoZGF0YSkge1xuICAgIGRhdGEuaXNWaWRlbyAgPSAvXnZpZGVvXFwvL2kudGVzdChkYXRhLnR5cGUpO1xuICAgIGRhdGEuaXNBdWRpbyAgPSAvXmF1ZGlvXFwvL2kudGVzdChkYXRhLnR5cGUpO1xuICAgIGRhdGEuaXNJbWFnZSAgPSAvXmltYWdlXFwvL2kudGVzdChkYXRhLnR5cGUpO1xuICAgIGRhdGEuaXNUZXh0ICAgPSAvXnRleHRcXC8vaS50ZXN0KGRhdGEudHlwZSk7XG4gICAgZGF0YS5pc0pTT04gICA9IC9eYXBwbGljYXRpb25cXC9qc29uJC9pLnRlc3QoZGF0YS50eXBlKTtcbiAgICBkYXRhLmlzUERGICAgID0gL15hcHBsaWNhdGlvblxcLyh4LSk/cGRmJC9pLnRlc3QoZGF0YS50eXBlKTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uQ29yZVxuICAgKiBAbmFtZSBfZGF0YVRvU2NoZW1hXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gRmlsZSBkYXRhXG4gICAqIEBzdW1tYXJ5IEludGVybmFsIG1ldGhvZC4gQnVpbGQgb2JqZWN0IGluIGFjY29yZGFuY2Ugd2l0aCBkZWZhdWx0IHNjaGVtYSBmcm9tIEZpbGUgZGF0YVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgX2RhdGFUb1NjaGVtYShkYXRhKSB7XG4gICAgY29uc3QgZHMgPSB7XG4gICAgICBuYW1lOiBkYXRhLm5hbWUsXG4gICAgICBleHRlbnNpb246IGRhdGEuZXh0ZW5zaW9uLFxuICAgICAgZXh0OiBkYXRhLmV4dGVuc2lvbixcbiAgICAgIGV4dGVuc2lvbldpdGhEb3Q6ICcuJyArIGRhdGEuZXh0ZW5zaW9uLFxuICAgICAgcGF0aDogZGF0YS5wYXRoLFxuICAgICAgbWV0YTogZGF0YS5tZXRhLFxuICAgICAgdHlwZTogZGF0YS50eXBlLFxuICAgICAgbWltZTogZGF0YS50eXBlLFxuICAgICAgJ21pbWUtdHlwZSc6IGRhdGEudHlwZSxcbiAgICAgIHNpemU6IGRhdGEuc2l6ZSxcbiAgICAgIHVzZXJJZDogZGF0YS51c2VySWQgfHwgbnVsbCxcbiAgICAgIHZlcnNpb25zOiB7XG4gICAgICAgIG9yaWdpbmFsOiB7XG4gICAgICAgICAgcGF0aDogZGF0YS5wYXRoLFxuICAgICAgICAgIHNpemU6IGRhdGEuc2l6ZSxcbiAgICAgICAgICB0eXBlOiBkYXRhLnR5cGUsXG4gICAgICAgICAgZXh0ZW5zaW9uOiBkYXRhLmV4dGVuc2lvblxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgX2Rvd25sb2FkUm91dGU6IGRhdGEuX2Rvd25sb2FkUm91dGUgfHwgdGhpcy5kb3dubG9hZFJvdXRlLFxuICAgICAgX2NvbGxlY3Rpb25OYW1lOiBkYXRhLl9jb2xsZWN0aW9uTmFtZSB8fCB0aGlzLmNvbGxlY3Rpb25OYW1lXG4gICAgfTtcblxuICAgIC8vT3B0aW9uYWwgZmlsZUlkXG4gICAgaWYgKGRhdGEuZmlsZUlkKSB7XG4gICAgICBkcy5faWQgPSBkYXRhLmZpbGVJZDtcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVGaWxlVHlwZXMoZHMpO1xuICAgIGRzLl9zdG9yYWdlUGF0aCA9IGRhdGEuX3N0b3JhZ2VQYXRoIHx8IHRoaXMuc3RvcmFnZVBhdGgoT2JqZWN0LmFzc2lnbih7fSwgZGF0YSwgZHMpKTtcbiAgICByZXR1cm4gZHM7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvbkNvcmVcbiAgICogQG5hbWUgZmluZE9uZVxuICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHNlbGVjdG9yIC0gTW9uZ28tU3R5bGUgc2VsZWN0b3IgKGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vYXBpL2NvbGxlY3Rpb25zLmh0bWwjc2VsZWN0b3JzKVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE1vbmdvLVN0eWxlIHNlbGVjdG9yIE9wdGlvbnMgKGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vYXBpL2NvbGxlY3Rpb25zLmh0bWwjc29ydHNwZWNpZmllcnMpXG4gICAqIEBzdW1tYXJ5IEZpbmQgYW5kIHJldHVybiBDdXJzb3IgZm9yIG1hdGNoaW5nIGRvY3VtZW50IE9iamVjdFxuICAgKiBAcmV0dXJucyB7RmlsZUN1cnNvcn0gSW5zdGFuY2VcbiAgICovXG4gIGZpbmRPbmUoc2VsZWN0b3IgPSB7fSwgb3B0aW9ucykge1xuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbZmluZE9uZSgke0pTT04uc3RyaW5naWZ5KHNlbGVjdG9yKX0sICR7SlNPTi5zdHJpbmdpZnkob3B0aW9ucyl9KV1gKTtcbiAgICBjaGVjayhzZWxlY3RvciwgTWF0Y2guT3B0aW9uYWwoTWF0Y2guT25lT2YoT2JqZWN0LCBTdHJpbmcsIEJvb2xlYW4sIE51bWJlciwgbnVsbCkpKTtcbiAgICBjaGVjayhvcHRpb25zLCBNYXRjaC5PcHRpb25hbChPYmplY3QpKTtcblxuICAgIGNvbnN0IGRvYyA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKHNlbGVjdG9yLCBvcHRpb25zKTtcbiAgICBpZiAoZG9jKSB7XG4gICAgICByZXR1cm4gbmV3IEZpbGVDdXJzb3IoZG9jLCB0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIGRvYztcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uQ29yZVxuICAgKiBAbmFtZSBmaW5kXG4gICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gc2VsZWN0b3IgLSBNb25nby1TdHlsZSBzZWxlY3RvciAoaHR0cDovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNzZWxlY3RvcnMpXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgb3B0aW9ucyAgLSBNb25nby1TdHlsZSBzZWxlY3RvciBPcHRpb25zIChodHRwOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI3NvcnRzcGVjaWZpZXJzKVxuICAgKiBAc3VtbWFyeSBGaW5kIGFuZCByZXR1cm4gQ3Vyc29yIGZvciBtYXRjaGluZyBkb2N1bWVudHNcbiAgICogQHJldHVybnMge0ZpbGVzQ3Vyc29yfSBJbnN0YW5jZVxuICAgKi9cbiAgZmluZChzZWxlY3RvciA9IHt9LCBvcHRpb25zKSB7XG4gICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtmaW5kKCR7SlNPTi5zdHJpbmdpZnkoc2VsZWN0b3IpfSwgJHtKU09OLnN0cmluZ2lmeShvcHRpb25zKX0pXWApO1xuICAgIGNoZWNrKHNlbGVjdG9yLCBNYXRjaC5PcHRpb25hbChNYXRjaC5PbmVPZihPYmplY3QsIFN0cmluZywgQm9vbGVhbiwgTnVtYmVyLCBudWxsKSkpO1xuICAgIGNoZWNrKG9wdGlvbnMsIE1hdGNoLk9wdGlvbmFsKE9iamVjdCkpO1xuXG4gICAgcmV0dXJuIG5ldyBGaWxlc0N1cnNvcihzZWxlY3Rvciwgb3B0aW9ucywgdGhpcyk7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvbkNvcmVcbiAgICogQG5hbWUgdXBkYXRlXG4gICAqIEBzZWUgaHR0cDovL2RvY3MubWV0ZW9yLmNvbS8jL2Z1bGwvdXBkYXRlXG4gICAqIEBzdW1tYXJ5IGxpbmsgTW9uZ28uQ29sbGVjdGlvbiB1cGRhdGUgbWV0aG9kXG4gICAqIEByZXR1cm5zIHtNb25nby5Db2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgdXBkYXRlKCkge1xuICAgIHRoaXMuY29sbGVjdGlvbi51cGRhdGUuYXBwbHkodGhpcy5jb2xsZWN0aW9uLCBhcmd1bWVudHMpO1xuICAgIHJldHVybiB0aGlzLmNvbGxlY3Rpb247XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvbkNvcmVcbiAgICogQG5hbWUgbGlua1xuICAgKiBAcGFyYW0ge09iamVjdH0gZmlsZVJlZiAtIEZpbGUgcmVmZXJlbmNlIG9iamVjdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdmVyc2lvbiAtIFZlcnNpb24gb2YgZmlsZSB5b3Ugd291bGQgbGlrZSB0byByZXF1ZXN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBVUklCYXNlIC0gW09wdGlvbmFsXSBVUkkgYmFzZSwgc2VlIC0gaHR0cHM6Ly9naXRodWIuY29tL1ZlbGlvdkdyb3VwL01ldGVvci1GaWxlcy9pc3N1ZXMvNjI2XG4gICAqIEBzdW1tYXJ5IFJldHVybnMgZG93bmxvYWRhYmxlIFVSTFxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBFbXB0eSBzdHJpbmcgcmV0dXJuZWQgaW4gY2FzZSBpZiBmaWxlIG5vdCBmb3VuZCBpbiBEQlxuICAgKi9cbiAgbGluayhmaWxlUmVmLCB2ZXJzaW9uID0gJ29yaWdpbmFsJywgVVJJQmFzZSkge1xuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbbGluaygkeyhoZWxwZXJzLmlzT2JqZWN0KGZpbGVSZWYpID8gZmlsZVJlZi5faWQgOiB2b2lkIDApfSwgJHt2ZXJzaW9ufSldYCk7XG4gICAgY2hlY2soZmlsZVJlZiwgT2JqZWN0KTtcblxuICAgIGlmICghZmlsZVJlZikge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICByZXR1cm4gZm9ybWF0RmxlVVJMKGZpbGVSZWYsIHZlcnNpb24sIFVSSUJhc2UpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcblxuLypcbiAqIEBwcml2YXRlXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBjbGFzcyBGaWxlQ3Vyc29yXG4gKiBAcGFyYW0gX2ZpbGVSZWYgICAge09iamVjdH0gLSBNb25nby1TdHlsZSBzZWxlY3RvciAoaHR0cDovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNzZWxlY3RvcnMpXG4gKiBAcGFyYW0gX2NvbGxlY3Rpb24ge0ZpbGVzQ29sbGVjdGlvbn0gLSBGaWxlc0NvbGxlY3Rpb24gSW5zdGFuY2VcbiAqIEBzdW1tYXJ5IEludGVybmFsIGNsYXNzLCByZXByZXNlbnRzIGVhY2ggcmVjb3JkIGluIGBGaWxlc0N1cnNvci5lYWNoKClgIG9yIGRvY3VtZW50IHJldHVybmVkIGZyb20gYC5maW5kT25lKClgIG1ldGhvZFxuICovXG5leHBvcnQgY2xhc3MgRmlsZUN1cnNvciB7XG4gIGNvbnN0cnVjdG9yKF9maWxlUmVmLCBfY29sbGVjdGlvbikge1xuICAgIHRoaXMuX2ZpbGVSZWYgICAgPSBfZmlsZVJlZjtcbiAgICB0aGlzLl9jb2xsZWN0aW9uID0gX2NvbGxlY3Rpb247XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCBfZmlsZVJlZik7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVDdXJzb3JcbiAgICogQG5hbWUgcmVtb3ZlXG4gICAqIEBwYXJhbSBjYWxsYmFjayB7RnVuY3Rpb259IC0gVHJpZ2dlcmVkIGFzeW5jaHJvbm91c2x5IGFmdGVyIGl0ZW0gaXMgcmVtb3ZlZCBvciBmYWlsZWQgdG8gYmUgcmVtb3ZlZFxuICAgKiBAc3VtbWFyeSBSZW1vdmUgZG9jdW1lbnRcbiAgICogQHJldHVybnMge0ZpbGVDdXJzb3J9XG4gICAqL1xuICByZW1vdmUoY2FsbGJhY2spIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW0ZpbGVDdXJzb3JdIFtyZW1vdmUoKV0nKTtcbiAgICBpZiAodGhpcy5fZmlsZVJlZikge1xuICAgICAgdGhpcy5fY29sbGVjdGlvbi5yZW1vdmUodGhpcy5fZmlsZVJlZi5faWQsIGNhbGxiYWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobmV3IE1ldGVvci5FcnJvcig0MDQsICdObyBzdWNoIGZpbGUnKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlQ3Vyc29yXG4gICAqIEBuYW1lIGxpbmtcbiAgICogQHBhcmFtIHZlcnNpb24ge1N0cmluZ30gLSBOYW1lIG9mIGZpbGUncyBzdWJ2ZXJzaW9uXG4gICAqIEBwYXJhbSBVUklCYXNlIHtTdHJpbmd9IC0gW09wdGlvbmFsXSBVUkkgYmFzZSwgc2VlIC0gaHR0cHM6Ly9naXRodWIuY29tL1ZlbGlvdkdyb3VwL01ldGVvci1GaWxlcy9pc3N1ZXMvNjI2XG4gICAqIEBzdW1tYXJ5IFJldHVybnMgZG93bmxvYWRhYmxlIFVSTCB0byBGaWxlXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAqL1xuICBsaW5rKHZlcnNpb24gPSAnb3JpZ2luYWwnLCBVUklCYXNlKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtGaWxlQ3Vyc29yXSBbbGluaygke3ZlcnNpb259KV1gKTtcbiAgICBpZiAodGhpcy5fZmlsZVJlZikge1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbGxlY3Rpb24ubGluayh0aGlzLl9maWxlUmVmLCB2ZXJzaW9uLCBVUklCYXNlKTtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlQ3Vyc29yXG4gICAqIEBuYW1lIGdldFxuICAgKiBAcGFyYW0gcHJvcGVydHkge1N0cmluZ30gLSBOYW1lIG9mIHN1Yi1vYmplY3QgcHJvcGVydHlcbiAgICogQHN1bW1hcnkgUmV0dXJucyBjdXJyZW50IGRvY3VtZW50IGFzIGEgcGxhaW4gT2JqZWN0LCBpZiBgcHJvcGVydHlgIGlzIHNwZWNpZmllZCAtIHJldHVybnMgdmFsdWUgb2Ygc3ViLW9iamVjdCBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fG1peH1cbiAgICovXG4gIGdldChwcm9wZXJ0eSkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZUN1cnNvcl0gW2dldCgke3Byb3BlcnR5fSldYCk7XG4gICAgaWYgKHByb3BlcnR5KSB7XG4gICAgICByZXR1cm4gdGhpcy5fZmlsZVJlZltwcm9wZXJ0eV07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9maWxlUmVmO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlQ3Vyc29yXG4gICAqIEBuYW1lIGZldGNoXG4gICAqIEBzdW1tYXJ5IFJldHVybnMgZG9jdW1lbnQgYXMgcGxhaW4gT2JqZWN0IGluIEFycmF5XG4gICAqIEByZXR1cm5zIHtbT2JqZWN0XX1cbiAgICovXG4gIGZldGNoKCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZUN1cnNvcl0gW2ZldGNoKCldJyk7XG4gICAgcmV0dXJuIFt0aGlzLl9maWxlUmVmXTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZUN1cnNvclxuICAgKiBAbmFtZSB3aXRoXG4gICAqIEBzdW1tYXJ5IFJldHVybnMgcmVhY3RpdmUgdmVyc2lvbiBvZiBjdXJyZW50IEZpbGVDdXJzb3IsIHVzZWZ1bCB0byB1c2Ugd2l0aCBge3sjd2l0aH19Li4ue3svd2l0aH19YCBibG9jayB0ZW1wbGF0ZSBoZWxwZXJcbiAgICogQHJldHVybnMge1tPYmplY3RdfVxuICAgKi9cbiAgd2l0aCgpIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW0ZpbGVDdXJzb3JdIFt3aXRoKCldJyk7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24odGhpcywgdGhpcy5fY29sbGVjdGlvbi5jb2xsZWN0aW9uLmZpbmRPbmUodGhpcy5fZmlsZVJlZi5faWQpKTtcbiAgfVxufVxuXG4vKlxuICogQHByaXZhdGVcbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQGNsYXNzIEZpbGVzQ3Vyc29yXG4gKiBAcGFyYW0gX3NlbGVjdG9yICAge1N0cmluZ3xPYmplY3R9ICAgLSBNb25nby1TdHlsZSBzZWxlY3RvciAoaHR0cDovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNzZWxlY3RvcnMpXG4gKiBAcGFyYW0gb3B0aW9ucyAgICAge09iamVjdH0gICAgICAgICAgLSBNb25nby1TdHlsZSBzZWxlY3RvciBPcHRpb25zIChodHRwOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI3NlbGVjdG9ycylcbiAqIEBwYXJhbSBfY29sbGVjdGlvbiB7RmlsZXNDb2xsZWN0aW9ufSAtIEZpbGVzQ29sbGVjdGlvbiBJbnN0YW5jZVxuICogQHN1bW1hcnkgSW1wbGVtZW50YXRpb24gb2YgQ3Vyc29yIGZvciBGaWxlc0NvbGxlY3Rpb25cbiAqL1xuZXhwb3J0IGNsYXNzIEZpbGVzQ3Vyc29yIHtcbiAgY29uc3RydWN0b3IoX3NlbGVjdG9yID0ge30sIG9wdGlvbnMsIF9jb2xsZWN0aW9uKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbiA9IF9jb2xsZWN0aW9uO1xuICAgIHRoaXMuX3NlbGVjdG9yICAgPSBfc2VsZWN0b3I7XG4gICAgdGhpcy5fY3VycmVudCAgICA9IC0xO1xuICAgIHRoaXMuY3Vyc29yICAgICAgPSB0aGlzLl9jb2xsZWN0aW9uLmNvbGxlY3Rpb24uZmluZCh0aGlzLl9zZWxlY3Rvciwgb3B0aW9ucyk7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGdldFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGFsbCBtYXRjaGluZyBkb2N1bWVudChzKSBhcyBhbiBBcnJheS4gQWxpYXMgb2YgYC5mZXRjaCgpYFxuICAgKiBAcmV0dXJucyB7W09iamVjdF19XG4gICAqL1xuICBnZXQoKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW2dldCgpXScpO1xuICAgIHJldHVybiB0aGlzLmN1cnNvci5mZXRjaCgpO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBoYXNOZXh0XG4gICAqIEBzdW1tYXJ5IFJldHVybnMgYHRydWVgIGlmIHRoZXJlIGlzIG5leHQgaXRlbSBhdmFpbGFibGUgb24gQ3Vyc29yXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgaGFzTmV4dCgpIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW0ZpbGVzQ3Vyc29yXSBbaGFzTmV4dCgpXScpO1xuICAgIHJldHVybiB0aGlzLl9jdXJyZW50IDwgKHRoaXMuY3Vyc29yLmNvdW50KCkgLSAxKTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgbmV4dFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIG5leHQgaXRlbSBvbiBDdXJzb3IsIGlmIGF2YWlsYWJsZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fHVuZGVmaW5lZH1cbiAgICovXG4gIG5leHQoKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW25leHQoKV0nKTtcbiAgICB0aGlzLmN1cnNvci5mZXRjaCgpWysrdGhpcy5fY3VycmVudF07XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGhhc1ByZXZpb3VzXG4gICAqIEBzdW1tYXJ5IFJldHVybnMgYHRydWVgIGlmIHRoZXJlIGlzIHByZXZpb3VzIGl0ZW0gYXZhaWxhYmxlIG9uIEN1cnNvclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGhhc1ByZXZpb3VzKCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtoYXNQcmV2aW91cygpXScpO1xuICAgIHJldHVybiB0aGlzLl9jdXJyZW50ICE9PSAtMTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgcHJldmlvdXNcbiAgICogQHN1bW1hcnkgUmV0dXJucyBwcmV2aW91cyBpdGVtIG9uIEN1cnNvciwgaWYgYXZhaWxhYmxlXG4gICAqIEByZXR1cm5zIHtPYmplY3R8dW5kZWZpbmVkfVxuICAgKi9cbiAgcHJldmlvdXMoKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW3ByZXZpb3VzKCldJyk7XG4gICAgdGhpcy5jdXJzb3IuZmV0Y2goKVstLXRoaXMuX2N1cnJlbnRdO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBmZXRjaFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGFsbCBtYXRjaGluZyBkb2N1bWVudChzKSBhcyBhbiBBcnJheS5cbiAgICogQHJldHVybnMge1tPYmplY3RdfVxuICAgKi9cbiAgZmV0Y2goKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW2ZldGNoKCldJyk7XG4gICAgcmV0dXJuIHRoaXMuY3Vyc29yLmZldGNoKCkgfHwgW107XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGZpcnN0XG4gICAqIEBzdW1tYXJ5IFJldHVybnMgZmlyc3QgaXRlbSBvbiBDdXJzb3IsIGlmIGF2YWlsYWJsZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fHVuZGVmaW5lZH1cbiAgICovXG4gIGZpcnN0KCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtmaXJzdCgpXScpO1xuICAgIHRoaXMuX2N1cnJlbnQgPSAwO1xuICAgIHJldHVybiB0aGlzLmZldGNoKClbdGhpcy5fY3VycmVudF07XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGxhc3RcbiAgICogQHN1bW1hcnkgUmV0dXJucyBsYXN0IGl0ZW0gb24gQ3Vyc29yLCBpZiBhdmFpbGFibGVcbiAgICogQHJldHVybnMge09iamVjdHx1bmRlZmluZWR9XG4gICAqL1xuICBsYXN0KCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtsYXN0KCldJyk7XG4gICAgdGhpcy5fY3VycmVudCA9IHRoaXMuY291bnQoKSAtIDE7XG4gICAgcmV0dXJuIHRoaXMuZmV0Y2goKVt0aGlzLl9jdXJyZW50XTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgY291bnRcbiAgICogQHN1bW1hcnkgUmV0dXJucyB0aGUgbnVtYmVyIG9mIGRvY3VtZW50cyB0aGF0IG1hdGNoIGEgcXVlcnlcbiAgICogQHJldHVybnMge051bWJlcn1cbiAgICovXG4gIGNvdW50KCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtjb3VudCgpXScpO1xuICAgIHJldHVybiB0aGlzLmN1cnNvci5jb3VudCgpO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSByZW1vdmVcbiAgICogQHBhcmFtIGNhbGxiYWNrIHtGdW5jdGlvbn0gLSBUcmlnZ2VyZWQgYXN5bmNocm9ub3VzbHkgYWZ0ZXIgaXRlbSBpcyByZW1vdmVkIG9yIGZhaWxlZCB0byBiZSByZW1vdmVkXG4gICAqIEBzdW1tYXJ5IFJlbW92ZXMgYWxsIGRvY3VtZW50cyB0aGF0IG1hdGNoIGEgcXVlcnlcbiAgICogQHJldHVybnMge0ZpbGVzQ3Vyc29yfVxuICAgKi9cbiAgcmVtb3ZlKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW3JlbW92ZSgpXScpO1xuICAgIHRoaXMuX2NvbGxlY3Rpb24ucmVtb3ZlKHRoaXMuX3NlbGVjdG9yLCBjYWxsYmFjayk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGZvckVhY2hcbiAgICogQHBhcmFtIGNhbGxiYWNrIHtGdW5jdGlvbn0gLSBGdW5jdGlvbiB0byBjYWxsLiBJdCB3aWxsIGJlIGNhbGxlZCB3aXRoIHRocmVlIGFyZ3VtZW50czogdGhlIGBmaWxlYCwgYSAwLWJhc2VkIGluZGV4LCBhbmQgY3Vyc29yIGl0c2VsZlxuICAgKiBAcGFyYW0gY29udGV4dCB7T2JqZWN0fSAtIEFuIG9iamVjdCB3aGljaCB3aWxsIGJlIHRoZSB2YWx1ZSBvZiBgdGhpc2AgaW5zaWRlIGBjYWxsYmFja2BcbiAgICogQHN1bW1hcnkgQ2FsbCBgY2FsbGJhY2tgIG9uY2UgZm9yIGVhY2ggbWF0Y2hpbmcgZG9jdW1lbnQsIHNlcXVlbnRpYWxseSBhbmQgc3luY2hyb25vdXNseS5cbiAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICovXG4gIGZvckVhY2goY2FsbGJhY2ssIGNvbnRleHQgPSB7fSkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtmb3JFYWNoKCldJyk7XG4gICAgdGhpcy5jdXJzb3IuZm9yRWFjaChjYWxsYmFjaywgY29udGV4dCk7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGVhY2hcbiAgICogQHN1bW1hcnkgUmV0dXJucyBhbiBBcnJheSBvZiBGaWxlQ3Vyc29yIG1hZGUgZm9yIGVhY2ggZG9jdW1lbnQgb24gY3VycmVudCBjdXJzb3JcbiAgICogICAgICAgICAgVXNlZnVsIHdoZW4gdXNpbmcgaW4ge3sjZWFjaCBGaWxlc0N1cnNvciNlYWNofX0uLi57ey9lYWNofX0gYmxvY2sgdGVtcGxhdGUgaGVscGVyXG4gICAqIEByZXR1cm5zIHtbRmlsZUN1cnNvcl19XG4gICAqL1xuICBlYWNoKCkge1xuICAgIHJldHVybiB0aGlzLm1hcCgoZmlsZSkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBGaWxlQ3Vyc29yKGZpbGUsIHRoaXMuX2NvbGxlY3Rpb24pO1xuICAgIH0pO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBtYXBcbiAgICogQHBhcmFtIGNhbGxiYWNrIHtGdW5jdGlvbn0gLSBGdW5jdGlvbiB0byBjYWxsLiBJdCB3aWxsIGJlIGNhbGxlZCB3aXRoIHRocmVlIGFyZ3VtZW50czogdGhlIGBmaWxlYCwgYSAwLWJhc2VkIGluZGV4LCBhbmQgY3Vyc29yIGl0c2VsZlxuICAgKiBAcGFyYW0gY29udGV4dCB7T2JqZWN0fSAtIEFuIG9iamVjdCB3aGljaCB3aWxsIGJlIHRoZSB2YWx1ZSBvZiBgdGhpc2AgaW5zaWRlIGBjYWxsYmFja2BcbiAgICogQHN1bW1hcnkgTWFwIGBjYWxsYmFja2Agb3ZlciBhbGwgbWF0Y2hpbmcgZG9jdW1lbnRzLiBSZXR1cm5zIGFuIEFycmF5LlxuICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAqL1xuICBtYXAoY2FsbGJhY2ssIGNvbnRleHQgPSB7fSkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFttYXAoKV0nKTtcbiAgICByZXR1cm4gdGhpcy5jdXJzb3IubWFwKGNhbGxiYWNrLCBjb250ZXh0KTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgY3VycmVudFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGN1cnJlbnQgaXRlbSBvbiBDdXJzb3IsIGlmIGF2YWlsYWJsZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fHVuZGVmaW5lZH1cbiAgICovXG4gIGN1cnJlbnQoKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW2N1cnJlbnQoKV0nKTtcbiAgICBpZiAodGhpcy5fY3VycmVudCA8IDApIHtcbiAgICAgIHRoaXMuX2N1cnJlbnQgPSAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mZXRjaCgpW3RoaXMuX2N1cnJlbnRdO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBvYnNlcnZlXG4gICAqIEBwYXJhbSBjYWxsYmFja3Mge09iamVjdH0gLSBGdW5jdGlvbnMgdG8gY2FsbCB0byBkZWxpdmVyIHRoZSByZXN1bHQgc2V0IGFzIGl0IGNoYW5nZXNcbiAgICogQHN1bW1hcnkgV2F0Y2ggYSBxdWVyeS4gUmVjZWl2ZSBjYWxsYmFja3MgYXMgdGhlIHJlc3VsdCBzZXQgY2hhbmdlcy5cbiAgICogQHVybCBodHRwOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI01vbmdvLUN1cnNvci1vYnNlcnZlXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IC0gbGl2ZSBxdWVyeSBoYW5kbGVcbiAgICovXG4gIG9ic2VydmUoY2FsbGJhY2tzKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW29ic2VydmUoKV0nKTtcbiAgICByZXR1cm4gdGhpcy5jdXJzb3Iub2JzZXJ2ZShjYWxsYmFja3MpO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBvYnNlcnZlQ2hhbmdlc1xuICAgKiBAcGFyYW0gY2FsbGJhY2tzIHtPYmplY3R9IC0gRnVuY3Rpb25zIHRvIGNhbGwgdG8gZGVsaXZlciB0aGUgcmVzdWx0IHNldCBhcyBpdCBjaGFuZ2VzXG4gICAqIEBzdW1tYXJ5IFdhdGNoIGEgcXVlcnkuIFJlY2VpdmUgY2FsbGJhY2tzIGFzIHRoZSByZXN1bHQgc2V0IGNoYW5nZXMuIE9ubHkgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gdGhlIG9sZCBhbmQgbmV3IGRvY3VtZW50cyBhcmUgcGFzc2VkIHRvIHRoZSBjYWxsYmFja3MuXG4gICAqIEB1cmwgaHR0cDovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNNb25nby1DdXJzb3Itb2JzZXJ2ZUNoYW5nZXNcbiAgICogQHJldHVybnMge09iamVjdH0gLSBsaXZlIHF1ZXJ5IGhhbmRsZVxuICAgKi9cbiAgb2JzZXJ2ZUNoYW5nZXMoY2FsbGJhY2tzKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW29ic2VydmVDaGFuZ2VzKCldJyk7XG4gICAgcmV0dXJuIHRoaXMuY3Vyc29yLm9ic2VydmVDaGFuZ2VzKGNhbGxiYWNrcyk7XG4gIH1cbn1cbiIsImltcG9ydCB7IGNoZWNrIH0gZnJvbSAnbWV0ZW9yL2NoZWNrJztcblxuY29uc3QgaGVscGVycyA9IHtcbiAgaXNVbmRlZmluZWQob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdm9pZCAwO1xuICB9LFxuICBpc09iamVjdChvYmopIHtcbiAgICBpZiAodGhpcy5pc0FycmF5KG9iaikgfHwgdGhpcy5pc0Z1bmN0aW9uKG9iaikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gIH0sXG4gIGlzQXJyYXkob2JqKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkob2JqKTtcbiAgfSxcbiAgaXNCb29sZWFuKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHRydWUgfHwgb2JqID09PSBmYWxzZSB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xuICB9LFxuICBpc0Z1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nIHx8IGZhbHNlO1xuICB9LFxuICBpc0VtcHR5KG9iaikge1xuICAgIGlmICh0aGlzLmlzRGF0ZShvYmopKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLmlzT2JqZWN0KG9iaikpIHtcbiAgICAgIHJldHVybiAhT2JqZWN0LmtleXMob2JqKS5sZW5ndGg7XG4gICAgfVxuICAgIGlmICh0aGlzLmlzQXJyYXkob2JqKSB8fCB0aGlzLmlzU3RyaW5nKG9iaikpIHtcbiAgICAgIHJldHVybiAhb2JqLmxlbmd0aDtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuICBjbG9uZShvYmopIHtcbiAgICBpZiAoIXRoaXMuaXNPYmplY3Qob2JqKSkgcmV0dXJuIG9iajtcbiAgICByZXR1cm4gdGhpcy5pc0FycmF5KG9iaikgPyBvYmouc2xpY2UoKSA6IE9iamVjdC5hc3NpZ24oe30sIG9iaik7XG4gIH0sXG4gIGhhcyhfb2JqLCBwYXRoKSB7XG4gICAgbGV0IG9iaiA9IF9vYmo7XG4gICAgaWYgKCF0aGlzLmlzT2JqZWN0KG9iaikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkocGF0aCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmlzT2JqZWN0KG9iaikgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgbGVuZ3RoID0gcGF0aC5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwYXRoW2ldKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBvYmogPSBvYmpbcGF0aFtpXV07XG4gICAgfVxuICAgIHJldHVybiAhIWxlbmd0aDtcbiAgfSxcbiAgb21pdChvYmosIC4uLmtleXMpIHtcbiAgICBjb25zdCBjbGVhciA9IE9iamVjdC5hc3NpZ24oe30sIG9iaik7XG4gICAgZm9yIChsZXQgaSA9IGtleXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGRlbGV0ZSBjbGVhcltrZXlzW2ldXTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xlYXI7XG4gIH0sXG4gIG5vdzogRGF0ZS5ub3csXG4gIHRocm90dGxlKGZ1bmMsIHdhaXQsIG9wdGlvbnMgPSB7fSkge1xuICAgIGxldCBwcmV2aW91cyA9IDA7XG4gICAgbGV0IHRpbWVvdXQgPSBudWxsO1xuICAgIGxldCByZXN1bHQ7XG4gICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgbGV0IHNlbGY7XG4gICAgbGV0IGFyZ3M7XG5cbiAgICBjb25zdCBsYXRlciA9ICgpID0+IHtcbiAgICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiB0aGF0Lm5vdygpO1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgaWYgKCF0aW1lb3V0KSB7XG4gICAgICAgIHNlbGYgPSBhcmdzID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgdGhyb3R0bGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3Qgbm93ID0gdGhhdC5ub3coKTtcbiAgICAgIGlmICghcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSkgcHJldmlvdXMgPSBub3c7XG4gICAgICBjb25zdCByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICAgIHNlbGYgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGlmIChyZW1haW5pbmcgPD0gMCB8fCByZW1haW5pbmcgPiB3YWl0KSB7XG4gICAgICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHByZXZpb3VzID0gbm93O1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgICBzZWxmID0gYXJncyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICB0aHJvdHRsZWQuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgcHJldmlvdXMgPSAwO1xuICAgICAgdGltZW91dCA9IHNlbGYgPSBhcmdzID0gbnVsbDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRocm90dGxlZDtcbiAgfVxufTtcblxuY29uc3QgX2hlbHBlcnMgPSBbJ1N0cmluZycsICdOdW1iZXInLCAnRGF0ZSddO1xuZm9yIChsZXQgaSA9IDA7IGkgPCBfaGVscGVycy5sZW5ndGg7IGkrKykge1xuICBoZWxwZXJzWydpcycgKyBfaGVscGVyc1tpXV0gPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCAnICsgX2hlbHBlcnNbaV0gKyAnXSc7XG4gIH07XG59XG5cbi8qXG4gKiBAY29uc3Qge0Z1bmN0aW9ufSBmaXhKU09OUGFyc2UgLSBGaXggaXNzdWUgd2l0aCBEYXRlIHBhcnNlXG4gKi9cbmNvbnN0IGZpeEpTT05QYXJzZSA9IGZ1bmN0aW9uKG9iaikge1xuICBmb3IgKGxldCBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhlbHBlcnMuaXNTdHJpbmcob2JqW2tleV0pICYmICEhfm9ialtrZXldLmluZGV4T2YoJz0tLUpTT04tREFURS0tPScpKSB7XG4gICAgICBvYmpba2V5XSA9IG9ialtrZXldLnJlcGxhY2UoJz0tLUpTT04tREFURS0tPScsICcnKTtcbiAgICAgIG9ialtrZXldID0gbmV3IERhdGUocGFyc2VJbnQob2JqW2tleV0pKTtcbiAgICB9IGVsc2UgaWYgKGhlbHBlcnMuaXNPYmplY3Qob2JqW2tleV0pKSB7XG4gICAgICBvYmpba2V5XSA9IGZpeEpTT05QYXJzZShvYmpba2V5XSk7XG4gICAgfSBlbHNlIGlmIChoZWxwZXJzLmlzQXJyYXkob2JqW2tleV0pKSB7XG4gICAgICBsZXQgdjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqW2tleV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdiA9IG9ialtrZXldW2ldO1xuICAgICAgICBpZiAoaGVscGVycy5pc09iamVjdCh2KSkge1xuICAgICAgICAgIG9ialtrZXldW2ldID0gZml4SlNPTlBhcnNlKHYpO1xuICAgICAgICB9IGVsc2UgaWYgKGhlbHBlcnMuaXNTdHJpbmcodikgJiYgISF+di5pbmRleE9mKCc9LS1KU09OLURBVEUtLT0nKSkge1xuICAgICAgICAgIHYgPSB2LnJlcGxhY2UoJz0tLUpTT04tREFURS0tPScsICcnKTtcbiAgICAgICAgICBvYmpba2V5XVtpXSA9IG5ldyBEYXRlKHBhcnNlSW50KHYpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gb2JqO1xufTtcblxuLypcbiAqIEBjb25zdCB7RnVuY3Rpb259IGZpeEpTT05TdHJpbmdpZnkgLSBGaXggaXNzdWUgd2l0aCBEYXRlIHN0cmluZ2lmeVxuICovXG5jb25zdCBmaXhKU09OU3RyaW5naWZ5ID0gZnVuY3Rpb24ob2JqKSB7XG4gIGZvciAobGV0IGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGVscGVycy5pc0RhdGUob2JqW2tleV0pKSB7XG4gICAgICBvYmpba2V5XSA9IGA9LS1KU09OLURBVEUtLT0keytvYmpba2V5XX1gO1xuICAgIH0gZWxzZSBpZiAoaGVscGVycy5pc09iamVjdChvYmpba2V5XSkpIHtcbiAgICAgIG9ialtrZXldID0gZml4SlNPTlN0cmluZ2lmeShvYmpba2V5XSk7XG4gICAgfSBlbHNlIGlmIChoZWxwZXJzLmlzQXJyYXkob2JqW2tleV0pKSB7XG4gICAgICBsZXQgdjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqW2tleV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdiA9IG9ialtrZXldW2ldO1xuICAgICAgICBpZiAoaGVscGVycy5pc09iamVjdCh2KSkge1xuICAgICAgICAgIG9ialtrZXldW2ldID0gZml4SlNPTlN0cmluZ2lmeSh2KTtcbiAgICAgICAgfSBlbHNlIGlmIChoZWxwZXJzLmlzRGF0ZSh2KSkge1xuICAgICAgICAgIG9ialtrZXldW2ldID0gYD0tLUpTT04tREFURS0tPSR7K3Z9YDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gb2JqO1xufTtcblxuLypcbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQHByaXZhdGVcbiAqIEBuYW1lIGZvcm1hdEZsZVVSTFxuICogQHBhcmFtIHtPYmplY3R9IGZpbGVSZWYgLSBGaWxlIHJlZmVyZW5jZSBvYmplY3RcbiAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJzaW9uIC0gW09wdGlvbmFsXSBWZXJzaW9uIG9mIGZpbGUgeW91IHdvdWxkIGxpa2UgYnVpbGQgVVJMIGZvclxuICogQHBhcmFtIHtTdHJpbmd9IFVSSUJhc2UgLSBbT3B0aW9uYWxdIFVSSSBiYXNlLCBzZWUgLSBodHRwczovL2dpdGh1Yi5jb20vVmVsaW92R3JvdXAvTWV0ZW9yLUZpbGVzL2lzc3Vlcy82MjZcbiAqIEBzdW1tYXJ5IFJldHVybnMgZm9ybWF0dGVkIFVSTCBmb3IgZmlsZVxuICogQHJldHVybnMge1N0cmluZ30gRG93bmxvYWRhYmxlIGxpbmtcbiAqL1xuY29uc3QgZm9ybWF0RmxlVVJMID0gKGZpbGVSZWYsIHZlcnNpb24gPSAnb3JpZ2luYWwnLCBfVVJJQmFzZSA9IChfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fIHx8IHt9KS5ST09UX1VSTCkgPT4ge1xuICBjaGVjayhmaWxlUmVmLCBPYmplY3QpO1xuICBjaGVjayh2ZXJzaW9uLCBTdHJpbmcpO1xuICBsZXQgVVJJQmFzZSA9IF9VUklCYXNlO1xuXG4gIGlmICghaGVscGVycy5pc1N0cmluZyhVUklCYXNlKSkge1xuICAgIFVSSUJhc2UgPSAoX19tZXRlb3JfcnVudGltZV9jb25maWdfXyB8fCB7fSkuUk9PVF9VUkwgfHwgJy8nO1xuICB9XG5cbiAgY29uc3QgX3Jvb3QgPSBVUklCYXNlLnJlcGxhY2UoL1xcLyskLywgJycpO1xuICBjb25zdCB2UmVmID0gKGZpbGVSZWYudmVyc2lvbnMgJiYgZmlsZVJlZi52ZXJzaW9uc1t2ZXJzaW9uXSkgfHwgZmlsZVJlZiB8fCB7fTtcblxuICBsZXQgZXh0O1xuICBpZiAoaGVscGVycy5pc1N0cmluZyh2UmVmLmV4dGVuc2lvbikpIHtcbiAgICBleHQgPSBgLiR7dlJlZi5leHRlbnNpb24ucmVwbGFjZSgvXlxcLi8sICcnKX1gO1xuICB9IGVsc2Uge1xuICAgIGV4dCA9ICcnO1xuICB9XG5cbiAgaWYgKGZpbGVSZWYucHVibGljID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIF9yb290ICsgKHZlcnNpb24gPT09ICdvcmlnaW5hbCcgPyBgJHtmaWxlUmVmLl9kb3dubG9hZFJvdXRlfS8ke2ZpbGVSZWYuX2lkfSR7ZXh0fWAgOiBgJHtmaWxlUmVmLl9kb3dubG9hZFJvdXRlfS8ke3ZlcnNpb259LSR7ZmlsZVJlZi5faWR9JHtleHR9YCk7XG4gIH1cbiAgcmV0dXJuIF9yb290ICsgYCR7ZmlsZVJlZi5fZG93bmxvYWRSb3V0ZX0vJHtmaWxlUmVmLl9jb2xsZWN0aW9uTmFtZX0vJHtmaWxlUmVmLl9pZH0vJHt2ZXJzaW9ufS8ke2ZpbGVSZWYuX2lkfSR7ZXh0fWA7XG59O1xuXG5leHBvcnQgeyBmaXhKU09OUGFyc2UsIGZpeEpTT05TdHJpbmdpZnksIGZvcm1hdEZsZVVSTCwgaGVscGVycyB9O1xuIiwiaW1wb3J0IGZzICAgICAgICAgIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IE1ldGVvciB9ICBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IGhlbHBlcnMgfSBmcm9tICcuL2xpYi5qcyc7XG5jb25zdCBOT09QID0gKCkgPT4ge307XG5cbi8qXG4gKiBAY29uc3Qge09iamVjdH0gYm91bmQgICAtIE1ldGVvci5iaW5kRW52aXJvbm1lbnQgKEZpYmVyIHdyYXBwZXIpXG4gKiBAY29uc3Qge09iamVjdH0gZmRDYWNoZSAtIEZpbGUgRGVzY3JpcHRvcnMgQ2FjaGVcbiAqL1xuY29uc3QgYm91bmQgICA9IE1ldGVvci5iaW5kRW52aXJvbm1lbnQoY2FsbGJhY2sgPT4gY2FsbGJhY2soKSk7XG5jb25zdCBmZENhY2hlID0ge307XG5cbi8qXG4gKiBAcHJpdmF0ZVxuICogQGxvY3VzIFNlcnZlclxuICogQGNsYXNzIFdyaXRlU3RyZWFtXG4gKiBAcGFyYW0gcGF0aCAgICAgIHtTdHJpbmd9IC0gUGF0aCB0byBmaWxlIG9uIEZTXG4gKiBAcGFyYW0gbWF4TGVuZ3RoIHtOdW1iZXJ9IC0gTWF4IGFtb3VudCBvZiBjaHVua3MgaW4gc3RyZWFtXG4gKiBAcGFyYW0gZmlsZSAgICAgIHtPYmplY3R9IC0gZmlsZVJlZiBPYmplY3RcbiAqIEBzdW1tYXJ5IHdyaXRhYmxlU3RyZWFtIHdyYXBwZXIgY2xhc3MsIG1ha2VzIHN1cmUgY2h1bmtzIGlzIHdyaXR0ZW4gaW4gZ2l2ZW4gb3JkZXIuIEltcGxlbWVudGF0aW9uIG9mIHF1ZXVlIHN0cmVhbS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV3JpdGVTdHJlYW0ge1xuICBjb25zdHJ1Y3RvcihwYXRoLCBtYXhMZW5ndGgsIGZpbGUsIHBlcm1pc3Npb25zKSB7XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLm1heExlbmd0aCA9IG1heExlbmd0aDtcbiAgICB0aGlzLmZpbGUgPSBmaWxlO1xuICAgIHRoaXMucGVybWlzc2lvbnMgPSBwZXJtaXNzaW9ucztcbiAgICBpZiAoIXRoaXMucGF0aCB8fCAhaGVscGVycy5pc1N0cmluZyh0aGlzLnBhdGgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5mZCAgICAgICAgICAgID0gbnVsbDtcbiAgICB0aGlzLndyaXR0ZW5DaHVua3MgPSAwO1xuICAgIHRoaXMuZW5kZWQgICAgICAgICA9IGZhbHNlO1xuICAgIHRoaXMuYWJvcnRlZCAgICAgICA9IGZhbHNlO1xuXG4gICAgaWYgKGZkQ2FjaGVbdGhpcy5wYXRoXSAmJiAhZmRDYWNoZVt0aGlzLnBhdGhdLmVuZGVkICYmICFmZENhY2hlW3RoaXMucGF0aF0uYWJvcnRlZCkge1xuICAgICAgdGhpcy5mZCA9IGZkQ2FjaGVbdGhpcy5wYXRoXS5mZDtcbiAgICAgIHRoaXMud3JpdHRlbkNodW5rcyA9IGZkQ2FjaGVbdGhpcy5wYXRoXS53cml0dGVuQ2h1bmtzO1xuICAgIH0gZWxzZSB7XG4gICAgICBmcy5lbnN1cmVGaWxlKHRoaXMucGF0aCwgKGVmRXJyb3IpID0+IHtcbiAgICAgICAgYm91bmQoKCkgPT4ge1xuICAgICAgICAgIGlmIChlZkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLmFib3J0KCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgJ1tGaWxlc0NvbGxlY3Rpb25dIFt3cml0ZVN0cmVhbV0gW2Vuc3VyZUZpbGVdIFtFcnJvcjpdICcgKyBlZkVycm9yKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZnMub3Blbih0aGlzLnBhdGgsICdyKycsIHRoaXMucGVybWlzc2lvbnMsIChvRXJyb3IsIGZkKSA9PiB7XG4gICAgICAgICAgICAgIGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAob0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgJ1tGaWxlc0NvbGxlY3Rpb25dIFt3cml0ZVN0cmVhbV0gW2Vuc3VyZUZpbGVdIFtvcGVuXSBbRXJyb3I6XSAnICsgb0Vycm9yKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdGhpcy5mZCA9IGZkO1xuICAgICAgICAgICAgICAgICAgZmRDYWNoZVt0aGlzLnBhdGhdID0gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qXG4gICAqIEBtZW1iZXJPZiB3cml0ZVN0cmVhbVxuICAgKiBAbmFtZSB3cml0ZVxuICAgKiBAcGFyYW0ge051bWJlcn0gbnVtIC0gQ2h1bmsgcG9zaXRpb24gaW4gYSBzdHJlYW1cbiAgICogQHBhcmFtIHtCdWZmZXJ9IGNodW5rIC0gQnVmZmVyIChjaHVuayBiaW5hcnkgZGF0YSlcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFja1xuICAgKiBAc3VtbWFyeSBXcml0ZSBjaHVuayBpbiBnaXZlbiBvcmRlclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSBUcnVlIGlmIGNodW5rIGlzIHNlbnQgdG8gc3RyZWFtLCBmYWxzZSBpZiBjaHVuayBpcyBzZXQgaW50byBxdWV1ZVxuICAgKi9cbiAgd3JpdGUobnVtLCBjaHVuaywgY2FsbGJhY2spIHtcbiAgICBpZiAoIXRoaXMuYWJvcnRlZCAmJiAhdGhpcy5lbmRlZCkge1xuICAgICAgaWYgKHRoaXMuZmQpIHtcbiAgICAgICAgZnMud3JpdGUodGhpcy5mZCwgY2h1bmssIDAsIGNodW5rLmxlbmd0aCwgKG51bSAtIDEpICogdGhpcy5maWxlLmNodW5rU2l6ZSwgKGVycm9yLCB3cml0dGVuLCBidWZmZXIpID0+IHtcbiAgICAgICAgICBib3VuZCgoKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhlcnJvciwgd3JpdHRlbiwgYnVmZmVyKTtcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tGaWxlc0NvbGxlY3Rpb25dIFt3cml0ZVN0cmVhbV0gW3dyaXRlXSBbRXJyb3I6XScsIGVycm9yKTtcbiAgICAgICAgICAgICAgdGhpcy5hYm9ydCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgKyt0aGlzLndyaXR0ZW5DaHVua3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgTWV0ZW9yLnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHRoaXMud3JpdGUobnVtLCBjaHVuaywgY2FsbGJhY2spO1xuICAgICAgICB9LCAyNSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qXG4gICAqIEBtZW1iZXJPZiB3cml0ZVN0cmVhbVxuICAgKiBAbmFtZSBlbmRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFja1xuICAgKiBAc3VtbWFyeSBGaW5pc2hlcyB3cml0aW5nIHRvIHdyaXRhYmxlU3RyZWFtLCBvbmx5IGFmdGVyIGFsbCBjaHVua3MgaW4gcXVldWUgaXMgd3JpdHRlblxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSBUcnVlIGlmIHN0cmVhbSBpcyBmdWxmaWxsZWQsIGZhbHNlIGlmIHF1ZXVlIGlzIGluIHByb2dyZXNzXG4gICAqL1xuICBlbmQoY2FsbGJhY2spIHtcbiAgICBpZiAoIXRoaXMuYWJvcnRlZCAmJiAhdGhpcy5lbmRlZCkge1xuICAgICAgaWYgKHRoaXMud3JpdHRlbkNodW5rcyA9PT0gdGhpcy5tYXhMZW5ndGgpIHtcbiAgICAgICAgZnMuY2xvc2UodGhpcy5mZCwgKCkgPT4ge1xuICAgICAgICAgIGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSBmZENhY2hlW3RoaXMucGF0aF07XG4gICAgICAgICAgICB0aGlzLmVuZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHZvaWQgMCwgdHJ1ZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgZnMuc3RhdCh0aGlzLnBhdGgsIChlcnJvciwgc3RhdCkgPT4ge1xuICAgICAgICBib3VuZCgoKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnJvciAmJiBzdGF0KSB7XG4gICAgICAgICAgICB0aGlzLndyaXR0ZW5DaHVua3MgPSBNYXRoLmNlaWwoc3RhdC5zaXplIC8gdGhpcy5maWxlLmNodW5rU2l6ZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIE1ldGVvci5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW5kKGNhbGxiYWNrKTtcbiAgICAgICAgICB9LCAyNSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHZvaWQgMCwgdGhpcy5lbmRlZCk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qXG4gICAqIEBtZW1iZXJPZiB3cml0ZVN0cmVhbVxuICAgKiBAbmFtZSBhYm9ydFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIENhbGxiYWNrXG4gICAqIEBzdW1tYXJ5IEFib3J0cyB3cml0aW5nIHRvIHdyaXRhYmxlU3RyZWFtLCByZW1vdmVzIGNyZWF0ZWQgZmlsZVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSBUcnVlXG4gICAqL1xuICBhYm9ydChjYWxsYmFjaykge1xuICAgIHRoaXMuYWJvcnRlZCA9IHRydWU7XG4gICAgZGVsZXRlIGZkQ2FjaGVbdGhpcy5wYXRoXTtcbiAgICBmcy51bmxpbmsodGhpcy5wYXRoLCAoY2FsbGJhY2sgfHwgTk9PUCkpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLypcbiAgICogQG1lbWJlck9mIHdyaXRlU3RyZWFtXG4gICAqIEBuYW1lIHN0b3BcbiAgICogQHN1bW1hcnkgU3RvcCB3cml0aW5nIHRvIHdyaXRhYmxlU3RyZWFtXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSAtIFRydWVcbiAgICovXG4gIHN0b3AoKSB7XG4gICAgdGhpcy5hYm9ydGVkID0gdHJ1ZTtcbiAgICBkZWxldGUgZmRDYWNoZVt0aGlzLnBhdGhdO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG4iXX0=
