(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"ostrio:cookies":{"cookies.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ostrio_cookies/cookies.js                                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  Cookies: () => Cookies
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let HTTP;
let WebApp;

if (Meteor.isServer) {
  WebApp = require('meteor/webapp').WebApp;
} else {
  HTTP = require('meteor/http').HTTP;
}

const NoOp = () => {};

const urlRE = /\/___cookie___\/set/;
const helpers = {
  isUndefined(obj) {
    return obj === void 0;
  },

  isArray(obj) {
    return Array.isArray(obj);
  },

  clone(obj) {
    if (!this.isObject(obj)) return obj;
    return this.isArray(obj) ? obj.slice() : Object.assign({}, obj);
  }

};
const _helpers = ['Number', 'Object'];

for (let i = 0; i < _helpers.length; i++) {
  helpers['is' + _helpers[i]] = function (obj) {
    return Object.prototype.toString.call(obj) === '[object ' + _helpers[i] + ']';
  };
}
/*
 * @url https://github.com/jshttp/cookie/blob/master/index.js
 * @name cookie
 * @author jshttp
 * @license
 * (The MIT License)
 *
 * Copyright (c) 2012-2014 Roman Shtylman <shtylman@gmail.com>
 * Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


const decode = decodeURIComponent;
const encode = encodeURIComponent;
const pairSplitRegExp = /; */;
/*
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */

const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
/*
 * @function
 * @name tryDecode
 * @param {String} str
 * @param {Function} d
 * @summary Try decoding a string using a decoding function.
 * @private
 */

const tryDecode = (str, d) => {
  try {
    return d(str);
  } catch (e) {
    return str;
  }
};
/*
 * @function
 * @name parse
 * @param {String} str
 * @param {Object} [options]
 * @return {Object}
 * @summary
 * Parse a cookie header.
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 * @private
 */


const parse = (str, options) => {
  if (typeof str !== 'string') {
    throw new Meteor.Error(404, 'argument str must be a string');
  }

  const obj = {};
  const opt = options || {};
  let val;
  let key;
  let eqIndx;
  str.split(pairSplitRegExp).forEach(pair => {
    eqIndx = pair.indexOf('=');

    if (eqIndx < 0) {
      return;
    }

    key = pair.substr(0, eqIndx).trim();
    key = tryDecode(unescape(key), opt.decode || decode);
    val = pair.substr(++eqIndx, pair.length).trim();

    if (val[0] === '"') {
      val = val.slice(1, -1);
    }

    if (void 0 === obj[key]) {
      obj[key] = tryDecode(val, opt.decode || decode);
    }
  });
  return obj;
};
/*
 * @function
 * @name antiCircular
 * @param data {Object} - Circular or any other object which needs to be non-circular
 */


const antiCircular = _obj => {
  const object = helpers.clone(_obj);
  const cache = new Map();
  return JSON.stringify(object, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.get(value)) {
        return void 0;
      }

      cache.set(value, true);
    }

    return value;
  });
};
/*
 * @function
 * @name serialize
 * @param {String} name
 * @param {String} val
 * @param {Object} [options]
 * @return { cookieString: String, sanitizedValue: Mixed }
 * @summary
 * Serialize data into a cookie header.
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 * serialize('foo', 'bar', { httpOnly: true }) => "foo=bar; httpOnly"
 * @private
 */


const serialize = (key, val, opt = {}) => {
  let name;

  if (!fieldContentRegExp.test(key)) {
    name = escape(key);
  } else {
    name = key;
  }

  let sanitizedValue = val;
  let value = val;

  if (!helpers.isUndefined(value)) {
    if (helpers.isObject(value) || helpers.isArray(value)) {
      const stringified = antiCircular(value);
      value = encode(`JSON.parse(${stringified})`);
      sanitizedValue = JSON.parse(stringified);
    } else {
      value = encode(value);

      if (value && !fieldContentRegExp.test(value)) {
        value = escape(value);
      }
    }
  } else {
    value = '';
  }

  const pairs = [`${name}=${value}`];

  if (helpers.isNumber(opt.maxAge)) {
    pairs.push(`Max-Age=${opt.maxAge}`);
  }

  if (opt.domain && typeof opt.domain === 'string') {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new Meteor.Error(404, 'option domain is invalid');
    }

    pairs.push(`Domain=${opt.domain}`);
  }

  if (opt.path && typeof opt.path === 'string') {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new Meteor.Error(404, 'option path is invalid');
    }

    pairs.push(`Path=${opt.path}`);
  }

  opt.expires = opt.expires || opt.expire || false;

  if (opt.expires === Infinity) {
    pairs.push('Expires=Fri, 31 Dec 9999 23:59:59 GMT');
  } else if (opt.expires instanceof Date) {
    pairs.push(`Expires=${opt.expires.toUTCString()}`);
  } else if (opt.expires === 0) {
    pairs.push('Expires=0');
  } else if (helpers.isNumber(opt.expires)) {
    pairs.push(`Expires=${new Date(opt.expires).toUTCString()}`);
  }

  if (opt.httpOnly) {
    pairs.push('HttpOnly');
  }

  if (opt.secure) {
    pairs.push('Secure');
  }

  if (opt.firstPartyOnly) {
    pairs.push('First-Party-Only');
  }

  if (opt.sameSite) {
    pairs.push('SameSite');
  }

  return {
    cookieString: pairs.join('; '),
    sanitizedValue
  };
};

const isStringifiedRegEx = /JSON\.parse\((.*)\)/;
const isTypedRegEx = /false|true|null|undefined/;

const deserialize = string => {
  if (typeof string !== 'string') {
    return string;
  }

  if (isStringifiedRegEx.test(string)) {
    let obj = string.match(isStringifiedRegEx)[1];

    if (obj) {
      try {
        return JSON.parse(decode(obj));
      } catch (e) {
        console.error('[ostrio:cookies] [.get()] [deserialize()] Exception:', e, string, obj);
        return string;
      }
    }

    return string;
  } else if (isTypedRegEx.test(string)) {
    return JSON.parse(string);
  }

  return string;
};
/*
 * @locus Anywhere
 * @class __cookies
 * @param _cookies {Object|String} - Current cookies as String or Object
 * @param TTL {Number} - Default cookies expiration time (max-age) in milliseconds, by default - session (false)
 * @param runOnServer {Boolean} - Expose Cookies class to Server
 * @param response {http.ServerResponse|Object} - This object is created internally by a HTTP server
 * @summary Internal Class
 */


class __cookies {
  constructor(_cookies, TTL, runOnServer, response) {
    this.TTL = TTL;
    this.response = response;
    this.runOnServer = runOnServer;

    if (helpers.isObject(_cookies)) {
      this.cookies = _cookies;
    } else {
      this.cookies = parse(_cookies);
    }
  }
  /*
   * @locus Anywhere
   * @memberOf __cookies
   * @name get
   * @param {String} key  - The name of the cookie to read
   * @param {String} _tmp - Unparsed string instead of user's cookies
   * @summary Read a cookie. If the cookie doesn't exist a null value will be returned.
   * @returns {String|void}
   */


  get(key, _tmp) {
    const cookieString = _tmp ? parse(_tmp) : this.cookies;

    if (!key || !cookieString) {
      return void 0;
    }

    if (cookieString.hasOwnProperty(key)) {
      return deserialize(cookieString[key]);
    }

    return void 0;
  }
  /*
   * @locus Anywhere
   * @memberOf __cookies
   * @name set
   * @param {String}  key   - The name of the cookie to create/overwrite
   * @param {String}  value - The value of the cookie
   * @param {Object}  opts  - [Optional] Cookie options (see readme docs)
   * @summary Create/overwrite a cookie.
   * @returns {Boolean}
   */


  set(key, value, opts = {}) {
    if (key && !helpers.isUndefined(value)) {
      if (helpers.isNumber(this.TTL) && opts.expires === undefined) {
        opts.expires = new Date(+new Date() + this.TTL);
      }

      const {
        cookieString,
        sanitizedValue
      } = serialize(key, value, opts);
      this.cookies[key] = sanitizedValue;

      if (Meteor.isClient) {
        document.cookie = cookieString;
      } else {
        this.response.setHeader('Set-Cookie', cookieString);
      }

      return true;
    }

    return false;
  }
  /*
   * @locus Anywhere
   * @memberOf __cookies
   * @name remove
   * @param {String} key    - The name of the cookie to create/overwrite
   * @param {String} path   - [Optional] The path from where the cookie will be
   * readable. E.g., "/", "/mydir"; if not specified, defaults to the current
   * path of the current document location (string or null). The path must be
   * absolute (see RFC 2965). For more information on how to use relative paths
   * in this argument, see: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter
   * @param {String} domain - [Optional] The domain from where the cookie will
   * be readable. E.g., "example.com", ".example.com" (includes all subdomains)
   * or "subdomain.example.com"; if not specified, defaults to the host portion
   * of the current document location (string or null).
   * @summary Remove a cookie(s).
   * @returns {Boolean}
   */


  remove(key, path = '/', domain = '') {
    if (key && this.cookies.hasOwnProperty(key)) {
      const {
        cookieString
      } = serialize(key, '', {
        domain,
        path,
        expires: new Date(0)
      });
      delete this.cookies[key];

      if (Meteor.isClient) {
        document.cookie = cookieString;
      } else {
        this.response.setHeader('Set-Cookie', cookieString);
      }

      return true;
    } else if (!key && this.keys().length > 0 && this.keys()[0] !== '') {
      const keys = Object.keys(this.cookies);

      for (let i = 0; i < keys.length; i++) {
        this.remove(keys[i]);
      }

      return true;
    }

    return false;
  }
  /*
   * @locus Anywhere
   * @memberOf __cookies
   * @name has
   * @param {String} key  - The name of the cookie to create/overwrite
   * @param {String} _tmp - Unparsed string instead of user's cookies
   * @summary Check whether a cookie exists in the current position.
   * @returns {Boolean}
   */


  has(key, _tmp) {
    const cookieString = _tmp ? parse(_tmp) : this.cookies;

    if (!key || !cookieString) {
      return false;
    }

    return cookieString.hasOwnProperty(key);
  }
  /*
   * @locus Anywhere
   * @memberOf __cookies
   * @name keys
   * @summary Returns an array of all readable cookies from this location.
   * @returns {[String]}
   */


  keys() {
    if (this.cookies) {
      return Object.keys(this.cookies);
    }

    return [];
  }
  /*
   * @locus Client
   * @memberOf __cookies
   * @name send
   * @param cb {Function} - Callback
   * @summary Send all cookies over XHR to server.
   * @returns {void}
   */


  send(cb = NoOp) {
    if (Meteor.isServer) {
      cb(new Meteor.Error(400, 'Can\'t run `.send()` on server, it\'s Client only method!'));
    }

    if (this.runOnServer) {
      HTTP.get(`${window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || ''}/___cookie___/set`, cb);
    } else {
      cb(new Meteor.Error(400, 'Can\'t send cookies on server when `runOnServer` is false.'));
    }

    return void 0;
  }

}
/*
 * @function
 * @locus Server
 * @summary Middleware handler
 * @private
 */


const __middlewareHandler = (req, res, self) => {
  let _cookies = {};

  if (self.runOnServer) {
    if (req.headers && req.headers.cookie) {
      _cookies = parse(req.headers.cookie);
    }

    return new __cookies(_cookies, self.TTL, self.runOnServer, res);
  }

  throw new Meteor.Error(400, 'Can\'t use middleware when `runOnServer` is false.');
};
/*
 * @locus Anywhere
 * @class Cookies
 * @param opts {Object}
 * @param opts.TTL {Number} - Default cookies expiration time (max-age) in milliseconds, by default - session (false)
 * @param opts.auto {Boolean} - [Server] Auto-bind in middleware as `req.Cookies`, by default `true`
 * @param opts.handler {Function} - [Server] Middleware handler
 * @param opts.runOnServer {Boolean} - Expose Cookies class to Server
 * @summary Main Cookie class
 */


class Cookies extends __cookies {
  constructor(opts = {}) {
    opts.TTL = helpers.isNumber(opts.TTL) ? opts.TTL : false;
    opts.runOnServer = opts.runOnServer !== false ? true : false;

    if (Meteor.isClient) {
      super(document.cookie, opts.TTL, opts.runOnServer);
    } else {
      super({}, opts.TTL, opts.runOnServer);
      opts.auto = opts.auto !== false ? true : false;

      this.handler = opts.handler || (() => {});

      this.runOnServer = opts.runOnServer;

      if (this.runOnServer) {
        if (!Cookies.isLoadedOnServer) {
          if (opts.auto) {
            WebApp.connectHandlers.use((req, res, next) => {
              if (urlRE.test(req._parsedUrl.path)) {
                if (req.headers && req.headers.cookie) {
                  const cookiesObject = parse(req.headers.cookie);
                  const cookiesKeys = Object.keys(cookiesObject);
                  const cookiesArray = [];

                  for (let i = 0; i < cookiesKeys.length; i++) {
                    const {
                      cookieString
                    } = serialize(cookiesKeys[i], cookiesObject[cookiesKeys[i]]);

                    if (!cookiesArray.includes(cookieString)) {
                      cookiesArray.push(cookieString);
                    }
                  }

                  res.setHeader('Set-Cookie', cookiesArray);
                }

                res.writeHead(200);
                res.end('');
              } else {
                req.Cookies = __middlewareHandler(req, res, this);
                next();
              }
            });
          }

          Cookies.isLoadedOnServer = true;
        }
      }
    }
  }
  /*
   * @locus Server
   * @memberOf Cookies
   * @name middleware
   * @summary Get Cookies instance into callback
   * @returns {void}
   */


  middleware() {
    if (!Meteor.isServer) {
      throw new Meteor.Error(500, '[ostrio:cookies] Can\'t use `.middleware()` on Client, it\'s Server only!');
    }

    return (req, res, next) => {
      this.handler && this.handler(__middlewareHandler(req, res, this));
      next();
    };
  }

}

if (Meteor.isServer) {
  Cookies.isLoadedOnServer = false;
}
/* Export the Cookies class */
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/ostrio:cookies/cookies.js");

/* Exports */
Package._define("ostrio:cookies", exports);

})();

//# sourceURL=meteor://💻app/packages/ostrio_cookies.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmNvb2tpZXMvY29va2llcy5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJDb29raWVzIiwiTWV0ZW9yIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIkhUVFAiLCJXZWJBcHAiLCJpc1NlcnZlciIsIk5vT3AiLCJ1cmxSRSIsImhlbHBlcnMiLCJpc1VuZGVmaW5lZCIsIm9iaiIsImlzQXJyYXkiLCJBcnJheSIsImNsb25lIiwiaXNPYmplY3QiLCJzbGljZSIsIk9iamVjdCIsImFzc2lnbiIsIl9oZWxwZXJzIiwiaSIsImxlbmd0aCIsInByb3RvdHlwZSIsInRvU3RyaW5nIiwiY2FsbCIsImRlY29kZSIsImRlY29kZVVSSUNvbXBvbmVudCIsImVuY29kZSIsImVuY29kZVVSSUNvbXBvbmVudCIsInBhaXJTcGxpdFJlZ0V4cCIsImZpZWxkQ29udGVudFJlZ0V4cCIsInRyeURlY29kZSIsInN0ciIsImQiLCJlIiwicGFyc2UiLCJvcHRpb25zIiwiRXJyb3IiLCJvcHQiLCJ2YWwiLCJrZXkiLCJlcUluZHgiLCJzcGxpdCIsImZvckVhY2giLCJwYWlyIiwiaW5kZXhPZiIsInN1YnN0ciIsInRyaW0iLCJ1bmVzY2FwZSIsImFudGlDaXJjdWxhciIsIl9vYmoiLCJvYmplY3QiLCJjYWNoZSIsIk1hcCIsIkpTT04iLCJzdHJpbmdpZnkiLCJ2YWx1ZSIsImdldCIsInNldCIsInNlcmlhbGl6ZSIsIm5hbWUiLCJ0ZXN0IiwiZXNjYXBlIiwic2FuaXRpemVkVmFsdWUiLCJzdHJpbmdpZmllZCIsInBhaXJzIiwiaXNOdW1iZXIiLCJtYXhBZ2UiLCJwdXNoIiwiZG9tYWluIiwicGF0aCIsImV4cGlyZXMiLCJleHBpcmUiLCJJbmZpbml0eSIsIkRhdGUiLCJ0b1VUQ1N0cmluZyIsImh0dHBPbmx5Iiwic2VjdXJlIiwiZmlyc3RQYXJ0eU9ubHkiLCJzYW1lU2l0ZSIsImNvb2tpZVN0cmluZyIsImpvaW4iLCJpc1N0cmluZ2lmaWVkUmVnRXgiLCJpc1R5cGVkUmVnRXgiLCJkZXNlcmlhbGl6ZSIsInN0cmluZyIsIm1hdGNoIiwiY29uc29sZSIsImVycm9yIiwiX19jb29raWVzIiwiY29uc3RydWN0b3IiLCJfY29va2llcyIsIlRUTCIsInJ1bk9uU2VydmVyIiwicmVzcG9uc2UiLCJjb29raWVzIiwiX3RtcCIsImhhc093blByb3BlcnR5Iiwib3B0cyIsInVuZGVmaW5lZCIsImlzQ2xpZW50IiwiZG9jdW1lbnQiLCJjb29raWUiLCJzZXRIZWFkZXIiLCJyZW1vdmUiLCJrZXlzIiwiaGFzIiwic2VuZCIsImNiIiwid2luZG93IiwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyIsIlJPT1RfVVJMX1BBVEhfUFJFRklYIiwiX19taWRkbGV3YXJlSGFuZGxlciIsInJlcSIsInJlcyIsInNlbGYiLCJoZWFkZXJzIiwiYXV0byIsImhhbmRsZXIiLCJpc0xvYWRlZE9uU2VydmVyIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwibmV4dCIsIl9wYXJzZWRVcmwiLCJjb29raWVzT2JqZWN0IiwiY29va2llc0tleXMiLCJjb29raWVzQXJyYXkiLCJpbmNsdWRlcyIsIndyaXRlSGVhZCIsImVuZCIsIm1pZGRsZXdhcmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLFdBQVEsTUFBSUE7QUFBYixDQUFkO0FBQXFDLElBQUlDLE1BQUo7QUFBV0gsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYixFQUFzQztBQUFDRixTQUFPRyxDQUFQLEVBQVM7QUFBQ0gsYUFBT0csQ0FBUDtBQUFTOztBQUFwQixDQUF0QyxFQUE0RCxDQUE1RDtBQUVoRCxJQUFJQyxJQUFKO0FBQ0EsSUFBSUMsTUFBSjs7QUFFQSxJQUFJTCxPQUFPTSxRQUFYLEVBQXFCO0FBQ25CRCxXQUFTSCxRQUFRLGVBQVIsRUFBeUJHLE1BQWxDO0FBQ0QsQ0FGRCxNQUVPO0FBQ0xELFNBQU9GLFFB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Ozs7Ozs7OztBQU9BVyxlQUFhO0FBQ1gsUUFBSSxDQUFDbEksT0FBT00sUUFBWixFQUFzQjtBQUNwQixZQUFNLElBQUlOLE9BQU9xQyxLQUFYLENBQWlCLEdBQWpCLEVBQXNCLDJFQUF0QixDQUFOO0FBQ0Q7O0FBRUQsV0FBTyxDQUFDNEUsR0FBRCxFQUFNQyxHQUFOLEVBQVdRLElBQVgsS0FBb0I7QUFDekIsV0FBS0osT0FBTCxJQUFnQixLQUFLQSxPQUFMLENBQWFOLG9CQUFvQkMsR0FBcEIsRUFBeUJDLEdBQXpCLEVBQThCLElBQTlCLENBQWIsQ0FBaEI7QUFDQVE7QUFDRCxLQUhEO0FBSUQ7O0FBaEU2Qjs7QUFtRWhDLElBQUkxSCxPQUFPTSxRQUFYLEVBQXFCO0FBQ25CUCxVQUFRd0gsZ0JBQVIsR0FBMkIsS0FBM0I7QUFDRDtBQUVELDhCIiwiZmlsZSI6Ii9wYWNrYWdlcy9vc3RyaW9fY29va2llcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuXG5sZXQgSFRUUDtcbmxldCBXZWJBcHA7XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgV2ViQXBwID0gcmVxdWlyZSgnbWV0ZW9yL3dlYmFwcCcpLldlYkFwcDtcbn0gZWxzZSB7XG4gIEhUVFAgPSByZXF1aXJlKCdtZXRlb3IvaHR0cCcpLkhUVFA7XG59XG5cbmNvbnN0IE5vT3AgID0gKCkgPT4ge307XG5jb25zdCB1cmxSRSA9IC9cXC9fX19jb29raWVfX19cXC9zZXQvO1xuY29uc3QgaGVscGVycyA9IHtcbiAgaXNVbmRlZmluZWQob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdm9pZCAwO1xuICB9LFxuICBpc0FycmF5KG9iaikge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KG9iaik7XG4gIH0sXG4gIGNsb25lKG9iaikge1xuICAgIGlmICghdGhpcy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHJldHVybiB0aGlzLmlzQXJyYXkob2JqKSA/IG9iai5zbGljZSgpIDogT2JqZWN0LmFzc2lnbih7fSwgb2JqKTtcbiAgfVxufTtcbmNvbnN0IF9oZWxwZXJzID0gWydOdW1iZXInLCAnT2JqZWN0J107XG5mb3IgKGxldCBpID0gMDsgaSA8IF9oZWxwZXJzLmxlbmd0aDsgaSsrKSB7XG4gIGhlbHBlcnNbJ2lzJyArIF9oZWxwZXJzW2ldXSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0ICcgKyBfaGVscGVyc1tpXSArICddJztcbiAgfTtcbn1cblxuLypcbiAqIEB1cmwgaHR0cHM6Ly9naXRodWIuY29tL2pzaHR0cC9jb29raWUvYmxvYi9tYXN0ZXIvaW5kZXguanNcbiAqIEBuYW1lIGNvb2tpZVxuICogQGF1dGhvciBqc2h0dHBcbiAqIEBsaWNlbnNlXG4gKiAoVGhlIE1JVCBMaWNlbnNlKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMi0yMDE0IFJvbWFuIFNodHlsbWFuIDxzaHR5bG1hbkBnbWFpbC5jb20+XG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRG91Z2xhcyBDaHJpc3RvcGhlciBXaWxzb24gPGRvdWdAc29tZXRoaW5nZG91Zy5jb20+XG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nXG4gKiBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbiAqICdTb2Z0d2FyZScpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbiAqIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbiAqIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvXG4gKiB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gKiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuXG4gKiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWVxuICogQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCxcbiAqIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFXG4gKiBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuY29uc3QgZGVjb2RlID0gZGVjb2RlVVJJQ29tcG9uZW50O1xuY29uc3QgZW5jb2RlID0gZW5jb2RlVVJJQ29tcG9uZW50O1xuY29uc3QgcGFpclNwbGl0UmVnRXhwID0gLzsgKi87XG5cbi8qXG4gKiBSZWdFeHAgdG8gbWF0Y2ggZmllbGQtY29udGVudCBpbiBSRkMgNzIzMCBzZWMgMy4yXG4gKlxuICogZmllbGQtY29udGVudCA9IGZpZWxkLXZjaGFyIFsgMSooIFNQIC8gSFRBQiApIGZpZWxkLXZjaGFyIF1cbiAqIGZpZWxkLXZjaGFyICAgPSBWQ0hBUiAvIG9icy10ZXh0XG4gKiBvYnMtdGV4dCAgICAgID0gJXg4MC1GRlxuICovXG5jb25zdCBmaWVsZENvbnRlbnRSZWdFeHAgPSAvXltcXHUwMDA5XFx1MDAyMC1cXHUwMDdlXFx1MDA4MC1cXHUwMGZmXSskLztcblxuLypcbiAqIEBmdW5jdGlvblxuICogQG5hbWUgdHJ5RGVjb2RlXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkXG4gKiBAc3VtbWFyeSBUcnkgZGVjb2RpbmcgYSBzdHJpbmcgdXNpbmcgYSBkZWNvZGluZyBmdW5jdGlvbi5cbiAqIEBwcml2YXRlXG4gKi9cbmNvbnN0IHRyeURlY29kZSA9IChzdHIsIGQpID0+IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZChzdHIpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufTtcblxuLypcbiAqIEBmdW5jdGlvblxuICogQG5hbWUgcGFyc2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBzdW1tYXJ5XG4gKiBQYXJzZSBhIGNvb2tpZSBoZWFkZXIuXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gY29va2llIGhlYWRlciBzdHJpbmcgaW50byBhbiBvYmplY3RcbiAqIFRoZSBvYmplY3QgaGFzIHRoZSB2YXJpb3VzIGNvb2tpZXMgYXMga2V5cyhuYW1lcykgPT4gdmFsdWVzXG4gKiBAcHJpdmF0ZVxuICovXG5jb25zdCBwYXJzZSA9IChzdHIsIG9wdGlvbnMpID0+IHtcbiAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDQsICdhcmd1bWVudCBzdHIgbXVzdCBiZSBhIHN0cmluZycpO1xuICB9XG4gIGNvbnN0IG9iaiA9IHt9O1xuICBjb25zdCBvcHQgPSBvcHRpb25zIHx8IHt9O1xuICBsZXQgdmFsO1xuICBsZXQga2V5O1xuICBsZXQgZXFJbmR4O1xuXG4gIHN0ci5zcGxpdChwYWlyU3BsaXRSZWdFeHApLmZvckVhY2goKHBhaXIpID0+IHtcbiAgICBlcUluZHggPSBwYWlyLmluZGV4T2YoJz0nKTtcbiAgICBpZiAoZXFJbmR4IDwgMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBrZXkgPSBwYWlyLnN1YnN0cigwLCBlcUluZHgpLnRyaW0oKTtcbiAgICBrZXkgPSB0cnlEZWNvZGUodW5lc2NhcGUoa2V5KSwgKG9wdC5kZWNvZGUgfHwgZGVjb2RlKSk7XG4gICAgdmFsID0gcGFpci5zdWJzdHIoKytlcUluZHgsIHBhaXIubGVuZ3RoKS50cmltKCk7XG4gICAgaWYgKHZhbFswXSA9PT0gJ1wiJykge1xuICAgICAgdmFsID0gdmFsLnNsaWNlKDEsIC0xKTtcbiAgICB9XG4gICAgaWYgKHZvaWQgMCA9PT0gb2JqW2tleV0pIHtcbiAgICAgIG9ialtrZXldID0gdHJ5RGVjb2RlKHZhbCwgKG9wdC5kZWNvZGUgfHwgZGVjb2RlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG9iajtcbn07XG5cbi8qXG4gKiBAZnVuY3Rpb25cbiAqIEBuYW1lIGFudGlDaXJjdWxhclxuICogQHBhcmFtIGRhdGEge09iamVjdH0gLSBDaXJjdWxhciBvciBhbnkgb3RoZXIgb2JqZWN0IHdoaWNoIG5lZWRzIHRvIGJlIG5vbi1jaXJjdWxhclxuICovXG5jb25zdCBhbnRpQ2lyY3VsYXIgPSAoX29iaikgPT4ge1xuICBjb25zdCBvYmplY3QgPSBoZWxwZXJzLmNsb25lKF9vYmopO1xuICBjb25zdCBjYWNoZSAgPSBuZXcgTWFwKCk7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmplY3QsIChrZXksIHZhbHVlKSA9PiB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgIGlmIChjYWNoZS5nZXQodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgICB9XG4gICAgICBjYWNoZS5zZXQodmFsdWUsIHRydWUpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH0pO1xufTtcblxuLypcbiAqIEBmdW5jdGlvblxuICogQG5hbWUgc2VyaWFsaXplXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IHZhbFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHJldHVybiB7IGNvb2tpZVN0cmluZzogU3RyaW5nLCBzYW5pdGl6ZWRWYWx1ZTogTWl4ZWQgfVxuICogQHN1bW1hcnlcbiAqIFNlcmlhbGl6ZSBkYXRhIGludG8gYSBjb29raWUgaGVhZGVyLlxuICogU2VyaWFsaXplIHRoZSBhIG5hbWUgdmFsdWUgcGFpciBpbnRvIGEgY29va2llIHN0cmluZyBzdWl0YWJsZSBmb3JcbiAqIGh0dHAgaGVhZGVycy4gQW4gb3B0aW9uYWwgb3B0aW9ucyBvYmplY3Qgc3BlY2lmaWVkIGNvb2tpZSBwYXJhbWV0ZXJzLlxuICogc2VyaWFsaXplKCdmb28nLCAnYmFyJywgeyBodHRwT25seTogdHJ1ZSB9KSA9PiBcImZvbz1iYXI7IGh0dHBPbmx5XCJcbiAqIEBwcml2YXRlXG4gKi9cbmNvbnN0IHNlcmlhbGl6ZSA9IChrZXksIHZhbCwgb3B0ID0ge30pID0+IHtcbiAgbGV0IG5hbWU7XG5cbiAgaWYgKCFmaWVsZENvbnRlbnRSZWdFeHAudGVzdChrZXkpKSB7XG4gICAgbmFtZSA9IGVzY2FwZShrZXkpO1xuICB9IGVsc2Uge1xuICAgIG5hbWUgPSBrZXk7XG4gIH1cblxuICBsZXQgc2FuaXRpemVkVmFsdWUgPSB2YWw7XG4gIGxldCB2YWx1ZSA9IHZhbDtcbiAgaWYgKCFoZWxwZXJzLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgIGlmIChoZWxwZXJzLmlzT2JqZWN0KHZhbHVlKSB8fCBoZWxwZXJzLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBjb25zdCBzdHJpbmdpZmllZCA9IGFudGlDaXJjdWxhcih2YWx1ZSk7XG4gICAgICB2YWx1ZSA9IGVuY29kZShgSlNPTi5wYXJzZSgke3N0cmluZ2lmaWVkfSlgKTtcbiAgICAgIHNhbml0aXplZFZhbHVlID0gSlNPTi5wYXJzZShzdHJpbmdpZmllZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gZW5jb2RlKHZhbHVlKTtcbiAgICAgIGlmICh2YWx1ZSAmJiAhZmllbGRDb250ZW50UmVnRXhwLnRlc3QodmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gZXNjYXBlKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSAnJztcbiAgfVxuXG4gIGNvbnN0IHBhaXJzID0gW2Ake25hbWV9PSR7dmFsdWV9YF07XG5cbiAgaWYgKGhlbHBlcnMuaXNOdW1iZXIob3B0Lm1heEFnZSkpIHtcbiAgICBwYWlycy5wdXNoKGBNYXgtQWdlPSR7b3B0Lm1heEFnZX1gKTtcbiAgfVxuXG4gIGlmIChvcHQuZG9tYWluICYmIHR5cGVvZiBvcHQuZG9tYWluID09PSAnc3RyaW5nJykge1xuICAgIGlmICghZmllbGRDb250ZW50UmVnRXhwLnRlc3Qob3B0LmRvbWFpbikpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDA0LCAnb3B0aW9uIGRvbWFpbiBpcyBpbnZhbGlkJyk7XG4gICAgfVxuICAgIHBhaXJzLnB1c2goYERvbWFpbj0ke29wdC5kb21haW59YCk7XG4gIH1cblxuICBpZiAob3B0LnBhdGggJiYgdHlwZW9mIG9wdC5wYXRoID09PSAnc3RyaW5nJykge1xuICAgIGlmICghZmllbGRDb250ZW50UmVnRXhwLnRlc3Qob3B0LnBhdGgpKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwNCwgJ29wdGlvbiBwYXRoIGlzIGludmFsaWQnKTtcbiAgICB9XG4gICAgcGFpcnMucHVzaChgUGF0aD0ke29wdC5wYXRofWApO1xuICB9XG5cbiAgb3B0LmV4cGlyZXMgPSBvcHQuZXhwaXJlcyB8fCBvcHQuZXhwaXJlIHx8IGZhbHNlO1xuICBpZiAob3B0LmV4cGlyZXMgPT09IEluZmluaXR5KSB7XG4gICAgcGFpcnMucHVzaCgnRXhwaXJlcz1GcmksIDMxIERlYyA5OTk5IDIzOjU5OjU5IEdNVCcpO1xuICB9IGVsc2UgaWYgKG9wdC5leHBpcmVzIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHBhaXJzLnB1c2goYEV4cGlyZXM9JHtvcHQuZXhwaXJlcy50b1VUQ1N0cmluZygpfWApO1xuICB9IGVsc2UgaWYgKG9wdC5leHBpcmVzID09PSAwKSB7XG4gICAgcGFpcnMucHVzaCgnRXhwaXJlcz0wJyk7XG4gIH0gZWxzZSBpZiAoaGVscGVycy5pc051bWJlcihvcHQuZXhwaXJlcykpIHtcbiAgICBwYWlycy5wdXNoKGBFeHBpcmVzPSR7KG5ldyBEYXRlKG9wdC5leHBpcmVzKSkudG9VVENTdHJpbmcoKX1gKTtcbiAgfVxuXG4gIGlmIChvcHQuaHR0cE9ubHkpIHtcbiAgICBwYWlycy5wdXNoKCdIdHRwT25seScpO1xuICB9XG5cbiAgaWYgKG9wdC5zZWN1cmUpIHtcbiAgICBwYWlycy5wdXNoKCdTZWN1cmUnKTtcbiAgfVxuXG4gIGlmIChvcHQuZmlyc3RQYXJ0eU9ubHkpIHtcbiAgICBwYWlycy5wdXNoKCdGaXJzdC1QYXJ0eS1Pbmx5Jyk7XG4gIH1cblxuICBpZiAob3B0LnNhbWVTaXRlKSB7XG4gICAgcGFpcnMucHVzaCgnU2FtZVNpdGUnKTtcbiAgfVxuXG4gIHJldHVybiB7IGNvb2tpZVN0cmluZzogcGFpcnMuam9pbignOyAnKSwgc2FuaXRpemVkVmFsdWUgfTtcbn07XG5cbmNvbnN0IGlzU3RyaW5naWZpZWRSZWdFeCA9IC9KU09OXFwucGFyc2VcXCgoLiopXFwpLztcbmNvbnN0IGlzVHlwZWRSZWdFeCA9IC9mYWxzZXx0cnVlfG51bGx8dW5kZWZpbmVkLztcbmNvbnN0IGRlc2VyaWFsaXplID0gKHN0cmluZykgPT4ge1xuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gc3RyaW5nO1xuICB9XG5cbiAgaWYgKGlzU3RyaW5naWZpZWRSZWdFeC50ZXN0KHN0cmluZykpIHtcbiAgICBsZXQgb2JqID0gc3RyaW5nLm1hdGNoKGlzU3RyaW5naWZpZWRSZWdFeClbMV07XG4gICAgaWYgKG9iaikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGVjb2RlKG9iaikpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdbb3N0cmlvOmNvb2tpZXNdIFsuZ2V0KCldIFtkZXNlcmlhbGl6ZSgpXSBFeGNlcHRpb246JywgZSwgc3RyaW5nLCBvYmopO1xuICAgICAgICByZXR1cm4gc3RyaW5nO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3RyaW5nO1xuICB9IGVsc2UgaWYgKGlzVHlwZWRSZWdFeC50ZXN0KHN0cmluZykpIHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShzdHJpbmcpO1xuICB9XG4gIHJldHVybiBzdHJpbmc7XG59O1xuXG4vKlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAY2xhc3MgX19jb29raWVzXG4gKiBAcGFyYW0gX2Nvb2tpZXMge09iamVjdHxTdHJpbmd9IC0gQ3VycmVudCBjb29raWVzIGFzIFN0cmluZyBvciBPYmplY3RcbiAqIEBwYXJhbSBUVEwge051bWJlcn0gLSBEZWZhdWx0IGNvb2tpZXMgZXhwaXJhdGlvbiB0aW1lIChtYXgtYWdlKSBpbiBtaWxsaXNlY29uZHMsIGJ5IGRlZmF1bHQgLSBzZXNzaW9uIChmYWxzZSlcbiAqIEBwYXJhbSBydW5PblNlcnZlciB7Qm9vbGVhbn0gLSBFeHBvc2UgQ29va2llcyBjbGFzcyB0byBTZXJ2ZXJcbiAqIEBwYXJhbSByZXNwb25zZSB7aHR0cC5TZXJ2ZXJSZXNwb25zZXxPYmplY3R9IC0gVGhpcyBvYmplY3QgaXMgY3JlYXRlZCBpbnRlcm5hbGx5IGJ5IGEgSFRUUCBzZXJ2ZXJcbiAqIEBzdW1tYXJ5IEludGVybmFsIENsYXNzXG4gKi9cbmNsYXNzIF9fY29va2llcyB7XG4gIGNvbnN0cnVjdG9yKF9jb29raWVzLCBUVEwsIHJ1bk9uU2VydmVyLCByZXNwb25zZSkge1xuICAgIHRoaXMuVFRMICAgICAgICAgPSBUVEw7XG4gICAgdGhpcy5yZXNwb25zZSAgICA9IHJlc3BvbnNlO1xuICAgIHRoaXMucnVuT25TZXJ2ZXIgPSBydW5PblNlcnZlcjtcblxuICAgIGlmIChoZWxwZXJzLmlzT2JqZWN0KF9jb29raWVzKSkge1xuICAgICAgdGhpcy5jb29raWVzID0gX2Nvb2tpZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29va2llcyA9IHBhcnNlKF9jb29raWVzKTtcbiAgICB9XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIF9fY29va2llc1xuICAgKiBAbmFtZSBnZXRcbiAgICogQHBhcmFtIHtTdHJpbmd9IGtleSAgLSBUaGUgbmFtZSBvZiB0aGUgY29va2llIHRvIHJlYWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IF90bXAgLSBVbnBhcnNlZCBzdHJpbmcgaW5zdGVhZCBvZiB1c2VyJ3MgY29va2llc1xuICAgKiBAc3VtbWFyeSBSZWFkIGEgY29va2llLiBJZiB0aGUgY29va2llIGRvZXNuJ3QgZXhpc3QgYSBudWxsIHZhbHVlIHdpbGwgYmUgcmV0dXJuZWQuXG4gICAqIEByZXR1cm5zIHtTdHJpbmd8dm9pZH1cbiAgICovXG4gIGdldChrZXksIF90bXApIHtcbiAgICBjb25zdCBjb29raWVTdHJpbmcgPSBfdG1wID8gcGFyc2UoX3RtcCkgOiB0aGlzLmNvb2tpZXM7XG4gICAgaWYgKCFrZXkgfHwgIWNvb2tpZVN0cmluZykge1xuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9XG5cbiAgICBpZiAoY29va2llU3RyaW5nLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHJldHVybiBkZXNlcmlhbGl6ZShjb29raWVTdHJpbmdba2V5XSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZvaWQgMDtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgX19jb29raWVzXG4gICAqIEBuYW1lIHNldFxuICAgKiBAcGFyYW0ge1N0cmluZ30gIGtleSAgIC0gVGhlIG5hbWUgb2YgdGhlIGNvb2tpZSB0byBjcmVhdGUvb3ZlcndyaXRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSAgdmFsdWUgLSBUaGUgdmFsdWUgb2YgdGhlIGNvb2tpZVxuICAgKiBAcGFyYW0ge09iamVjdH0gIG9wdHMgIC0gW09wdGlvbmFsXSBDb29raWUgb3B0aW9ucyAoc2VlIHJlYWRtZSBkb2NzKVxuICAgKiBAc3VtbWFyeSBDcmVhdGUvb3ZlcndyaXRlIGEgY29va2llLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIHNldChrZXksIHZhbHVlLCBvcHRzID0ge30pIHtcbiAgICBpZiAoa2V5ICYmICFoZWxwZXJzLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgICAgaWYgKGhlbHBlcnMuaXNOdW1iZXIodGhpcy5UVEwpICYmIG9wdHMuZXhwaXJlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG9wdHMuZXhwaXJlcyA9IG5ldyBEYXRlKCtuZXcgRGF0ZSgpICsgdGhpcy5UVEwpO1xuICAgICAgfVxuICAgICAgY29uc3QgeyBjb29raWVTdHJpbmcsIHNhbml0aXplZFZhbHVlIH0gPSBzZXJpYWxpemUoa2V5LCB2YWx1ZSwgb3B0cyk7XG4gICAgICB0aGlzLmNvb2tpZXNba2V5XSA9IHNhbml0aXplZFZhbHVlO1xuICAgICAgaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICAgICAgICBkb2N1bWVudC5jb29raWUgPSBjb29raWVTdHJpbmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlc3BvbnNlLnNldEhlYWRlcignU2V0LUNvb2tpZScsIGNvb2tpZVN0cmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBfX2Nvb2tpZXNcbiAgICogQG5hbWUgcmVtb3ZlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgICAgLSBUaGUgbmFtZSBvZiB0aGUgY29va2llIHRvIGNyZWF0ZS9vdmVyd3JpdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggICAtIFtPcHRpb25hbF0gVGhlIHBhdGggZnJvbSB3aGVyZSB0aGUgY29va2llIHdpbGwgYmVcbiAgICogcmVhZGFibGUuIEUuZy4sIFwiL1wiLCBcIi9teWRpclwiOyBpZiBub3Qgc3BlY2lmaWVkLCBkZWZhdWx0cyB0byB0aGUgY3VycmVudFxuICAgKiBwYXRoIG9mIHRoZSBjdXJyZW50IGRvY3VtZW50IGxvY2F0aW9uIChzdHJpbmcgb3IgbnVsbCkuIFRoZSBwYXRoIG11c3QgYmVcbiAgICogYWJzb2x1dGUgKHNlZSBSRkMgMjk2NSkuIEZvciBtb3JlIGluZm9ybWF0aW9uIG9uIGhvdyB0byB1c2UgcmVsYXRpdmUgcGF0aHNcbiAgICogaW4gdGhpcyBhcmd1bWVudCwgc2VlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvZG9jdW1lbnQuY29va2llI1VzaW5nX3JlbGF0aXZlX1VSTHNfaW5fdGhlX3BhdGhfcGFyYW1ldGVyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBkb21haW4gLSBbT3B0aW9uYWxdIFRoZSBkb21haW4gZnJvbSB3aGVyZSB0aGUgY29va2llIHdpbGxcbiAgICogYmUgcmVhZGFibGUuIEUuZy4sIFwiZXhhbXBsZS5jb21cIiwgXCIuZXhhbXBsZS5jb21cIiAoaW5jbHVkZXMgYWxsIHN1YmRvbWFpbnMpXG4gICAqIG9yIFwic3ViZG9tYWluLmV4YW1wbGUuY29tXCI7IGlmIG5vdCBzcGVjaWZpZWQsIGRlZmF1bHRzIHRvIHRoZSBob3N0IHBvcnRpb25cbiAgICogb2YgdGhlIGN1cnJlbnQgZG9jdW1lbnQgbG9jYXRpb24gKHN0cmluZyBvciBudWxsKS5cbiAgICogQHN1bW1hcnkgUmVtb3ZlIGEgY29va2llKHMpLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIHJlbW92ZShrZXksIHBhdGggPSAnLycsIGRvbWFpbiA9ICcnKSB7XG4gICAgaWYgKGtleSAmJiB0aGlzLmNvb2tpZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29uc3QgeyBjb29raWVTdHJpbmcgfSA9IHNlcmlhbGl6ZShrZXksICcnLCB7XG4gICAgICAgIGRvbWFpbixcbiAgICAgICAgcGF0aCxcbiAgICAgICAgZXhwaXJlczogbmV3IERhdGUoMClcbiAgICAgIH0pO1xuXG4gICAgICBkZWxldGUgdGhpcy5jb29raWVzW2tleV07XG4gICAgICBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgICAgIGRvY3VtZW50LmNvb2tpZSA9IGNvb2tpZVN0cmluZztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVzcG9uc2Uuc2V0SGVhZGVyKCdTZXQtQ29va2llJywgY29va2llU3RyaW5nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoIWtleSAmJiB0aGlzLmtleXMoKS5sZW5ndGggPiAwICYmIHRoaXMua2V5cygpWzBdICE9PSAnJykge1xuICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuY29va2llcyk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5yZW1vdmUoa2V5c1tpXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBfX2Nvb2tpZXNcbiAgICogQG5hbWUgaGFzXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgIC0gVGhlIG5hbWUgb2YgdGhlIGNvb2tpZSB0byBjcmVhdGUvb3ZlcndyaXRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBfdG1wIC0gVW5wYXJzZWQgc3RyaW5nIGluc3RlYWQgb2YgdXNlcidzIGNvb2tpZXNcbiAgICogQHN1bW1hcnkgQ2hlY2sgd2hldGhlciBhIGNvb2tpZSBleGlzdHMgaW4gdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgaGFzKGtleSwgX3RtcCkge1xuICAgIGNvbnN0IGNvb2tpZVN0cmluZyA9IF90bXAgPyBwYXJzZShfdG1wKSA6IHRoaXMuY29va2llcztcbiAgICBpZiAoIWtleSB8fCAhY29va2llU3RyaW5nKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvb2tpZVN0cmluZy5oYXNPd25Qcm9wZXJ0eShrZXkpO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBfX2Nvb2tpZXNcbiAgICogQG5hbWUga2V5c1xuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGFuIGFycmF5IG9mIGFsbCByZWFkYWJsZSBjb29raWVzIGZyb20gdGhpcyBsb2NhdGlvbi5cbiAgICogQHJldHVybnMge1tTdHJpbmddfVxuICAgKi9cbiAga2V5cygpIHtcbiAgICBpZiAodGhpcy5jb29raWVzKSB7XG4gICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5jb29raWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIENsaWVudFxuICAgKiBAbWVtYmVyT2YgX19jb29raWVzXG4gICAqIEBuYW1lIHNlbmRcbiAgICogQHBhcmFtIGNiIHtGdW5jdGlvbn0gLSBDYWxsYmFja1xuICAgKiBAc3VtbWFyeSBTZW5kIGFsbCBjb29raWVzIG92ZXIgWEhSIHRvIHNlcnZlci5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBzZW5kKGNiID0gTm9PcCkge1xuICAgIGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgICAgIGNiKG5ldyBNZXRlb3IuRXJyb3IoNDAwLCAnQ2FuXFwndCBydW4gYC5zZW5kKClgIG9uIHNlcnZlciwgaXRcXCdzIENsaWVudCBvbmx5IG1ldGhvZCEnKSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucnVuT25TZXJ2ZXIpIHtcbiAgICAgIEhUVFAuZ2V0KGAke3dpbmRvdy5fX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMX1BBVEhfUFJFRklYIHx8ICcnfS9fX19jb29raWVfX18vc2V0YCwgY2IpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYihuZXcgTWV0ZW9yLkVycm9yKDQwMCwgJ0NhblxcJ3Qgc2VuZCBjb29raWVzIG9uIHNlcnZlciB3aGVuIGBydW5PblNlcnZlcmAgaXMgZmFsc2UuJykpO1xuICAgIH1cbiAgICByZXR1cm4gdm9pZCAwO1xuICB9XG59XG5cbi8qXG4gKiBAZnVuY3Rpb25cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBzdW1tYXJ5IE1pZGRsZXdhcmUgaGFuZGxlclxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgX19taWRkbGV3YXJlSGFuZGxlciA9IChyZXEsIHJlcywgc2VsZikgPT4ge1xuICBsZXQgX2Nvb2tpZXMgPSB7fTtcbiAgaWYgKHNlbGYucnVuT25TZXJ2ZXIpIHtcbiAgICBpZiAocmVxLmhlYWRlcnMgJiYgcmVxLmhlYWRlcnMuY29va2llKSB7XG4gICAgICBfY29va2llcyA9IHBhcnNlKHJlcS5oZWFkZXJzLmNvb2tpZSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgX19jb29raWVzKF9jb29raWVzLCBzZWxmLlRUTCwgc2VsZi5ydW5PblNlcnZlciwgcmVzKTtcbiAgfVxuXG4gIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAwLCAnQ2FuXFwndCB1c2UgbWlkZGxld2FyZSB3aGVuIGBydW5PblNlcnZlcmAgaXMgZmFsc2UuJyk7XG59O1xuXG5cbi8qXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBjbGFzcyBDb29raWVzXG4gKiBAcGFyYW0gb3B0cyB7T2JqZWN0fVxuICogQHBhcmFtIG9wdHMuVFRMIHtOdW1iZXJ9IC0gRGVmYXVsdCBjb29raWVzIGV4cGlyYXRpb24gdGltZSAobWF4LWFnZSkgaW4gbWlsbGlzZWNvbmRzLCBieSBkZWZhdWx0IC0gc2Vzc2lvbiAoZmFsc2UpXG4gKiBAcGFyYW0gb3B0cy5hdXRvIHtCb29sZWFufSAtIFtTZXJ2ZXJdIEF1dG8tYmluZCBpbiBtaWRkbGV3YXJlIGFzIGByZXEuQ29va2llc2AsIGJ5IGRlZmF1bHQgYHRydWVgXG4gKiBAcGFyYW0gb3B0cy5oYW5kbGVyIHtGdW5jdGlvbn0gLSBbU2VydmVyXSBNaWRkbGV3YXJlIGhhbmRsZXJcbiAqIEBwYXJhbSBvcHRzLnJ1bk9uU2VydmVyIHtCb29sZWFufSAtIEV4cG9zZSBDb29raWVzIGNsYXNzIHRvIFNlcnZlclxuICogQHN1bW1hcnkgTWFpbiBDb29raWUgY2xhc3NcbiAqL1xuY2xhc3MgQ29va2llcyBleHRlbmRzIF9fY29va2llcyB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIG9wdHMuVFRMID0gaGVscGVycy5pc051bWJlcihvcHRzLlRUTCkgPyBvcHRzLlRUTCA6IGZhbHNlO1xuICAgIG9wdHMucnVuT25TZXJ2ZXIgPSAob3B0cy5ydW5PblNlcnZlciAhPT0gZmFsc2UpID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICAgICAgc3VwZXIoZG9jdW1lbnQuY29va2llLCBvcHRzLlRUTCwgb3B0cy5ydW5PblNlcnZlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1cGVyKHt9LCBvcHRzLlRUTCwgb3B0cy5ydW5PblNlcnZlcik7XG4gICAgICBvcHRzLmF1dG8gICAgICAgID0gb3B0cy5hdXRvICE9PSBmYWxzZSA/IHRydWUgOiBmYWxzZTtcbiAgICAgIHRoaXMuaGFuZGxlciAgICAgPSBvcHRzLmhhbmRsZXIgfHwgKCgpID0+IHt9KTtcbiAgICAgIHRoaXMucnVuT25TZXJ2ZXIgPSBvcHRzLnJ1bk9uU2VydmVyO1xuXG4gICAgICBpZiAodGhpcy5ydW5PblNlcnZlcikge1xuICAgICAgICBpZiAoIUNvb2tpZXMuaXNMb2FkZWRPblNlcnZlcikge1xuICAgICAgICAgIGlmIChvcHRzLmF1dG8pIHtcbiAgICAgICAgICAgIFdlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodXJsUkUudGVzdChyZXEuX3BhcnNlZFVybC5wYXRoKSkge1xuICAgICAgICAgICAgICAgIGlmIChyZXEuaGVhZGVycyAmJiByZXEuaGVhZGVycy5jb29raWUpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGNvb2tpZXNPYmplY3QgPSBwYXJzZShyZXEuaGVhZGVycy5jb29raWUpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgY29va2llc0tleXMgICA9IE9iamVjdC5rZXlzKGNvb2tpZXNPYmplY3QpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgY29va2llc0FycmF5ICA9IFtdO1xuXG4gICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvb2tpZXNLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgY29va2llU3RyaW5nIH0gPSBzZXJpYWxpemUoY29va2llc0tleXNbaV0sIGNvb2tpZXNPYmplY3RbY29va2llc0tleXNbaV1dKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjb29raWVzQXJyYXkuaW5jbHVkZXMoY29va2llU3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICAgIGNvb2tpZXNBcnJheS5wdXNoKGNvb2tpZVN0cmluZyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignU2V0LUNvb2tpZScsIGNvb2tpZXNBcnJheSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoJycpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcS5Db29raWVzID0gX19taWRkbGV3YXJlSGFuZGxlcihyZXEsIHJlcywgdGhpcyk7XG4gICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgQ29va2llcy5pc0xvYWRlZE9uU2VydmVyID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgLypcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgQ29va2llc1xuICAgKiBAbmFtZSBtaWRkbGV3YXJlXG4gICAqIEBzdW1tYXJ5IEdldCBDb29raWVzIGluc3RhbmNlIGludG8gY2FsbGJhY2tcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBtaWRkbGV3YXJlKCkge1xuICAgIGlmICghTWV0ZW9yLmlzU2VydmVyKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgJ1tvc3RyaW86Y29va2llc10gQ2FuXFwndCB1c2UgYC5taWRkbGV3YXJlKClgIG9uIENsaWVudCwgaXRcXCdzIFNlcnZlciBvbmx5IScpO1xuICAgIH1cblxuICAgIHJldHVybiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgIHRoaXMuaGFuZGxlciAmJiB0aGlzLmhhbmRsZXIoX19taWRkbGV3YXJlSGFuZGxlcihyZXEsIHJlcywgdGhpcykpO1xuICAgICAgbmV4dCgpO1xuICAgIH07XG4gIH1cbn1cblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICBDb29raWVzLmlzTG9hZGVkT25TZXJ2ZXIgPSBmYWxzZTtcbn1cblxuLyogRXhwb3J0IHRoZSBDb29raWVzIGNsYXNzICovXG5leHBvcnQgeyBDb29raWVzIH07XG4iXX0=
