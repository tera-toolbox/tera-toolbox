const fs = require('fs');
const path = require('path');
const dns = require('dns');
const url = require('url');
const http = require('http');
const https = require('https');
const zlib = require('zlib');

const proxy = require('http-proxy');
const xmldom = require('xmldom');

const log = require('./logger');

function asArray(nodes) {
  return Array.from(nodes || []);
}

function modifySlsXml(doc, customServers) {
  const servers = asArray(doc.getElementsByTagName('server'));
  for (let server of servers) {
    for (const node of asArray(server.childNodes)) {
      if (node.nodeType !== 1 || node.nodeName !== 'id') continue;

      const settings = customServers[node.textContent];
      if (!settings) continue;

      if (settings.keepOriginal) {
        const parent = server.parentNode;
        server = server.cloneNode(true);
        parent.appendChild(server);
      }

      for (const n of asArray(server.childNodes)) {
        if (n.nodeType !== 1) continue; // ensure type: element

        switch (n.nodeName) {
          case 'ip': {
            n.textContent = settings.ip || '127.0.0.1';
            break;
          }

          case 'port': {
            if (settings.port) {
              n.textContent = settings.port;
            }
            break;
          }

          case 'name': {
            if (settings.name) {
              for (const c of asArray(n.childNodes)) {
                if (c.nodeType === 4) { // CDATA_SECTION_NODE
                  c.data = settings.name;
                  break;
                }
              }
              for (const a of asArray(n.attributes)) {
                if (a.name === 'raw_name') {
                  a.value = settings.name;
                  break;
                }
              }
            }
            break;
          }

          case 'crowdness': {
            if (settings.keepOriginal) {
              for (const a of asArray(n.attributes)) {
                if (a.name === 'sort') {
                  // 0 crowdness makes this server highest priority
                  // if there are multiple servers with this ID
                  a.value = '0';
                  break;
                }
              }
            }
            break;
          }
        }
      }
    }
  }

  // appease RU sls (prevent conversion to <popup/>)
  for (const server of asArray(doc.getElementsByTagName('server'))) {
    for (const node of asArray(server.childNodes)) {
      if (node.nodeType === 1 && node.nodeName === 'popup') {
        if (!node.hasChildNodes()) {
          node.appendChild(doc.createCDATASection(''));
        }
      }
    }
  }

  return new xmldom.XMLSerializer().serializeToString(doc);
}

const errorHandler = {
  warning(msg) {
    log.warn({ err: msg }, 'xml parser warning');
  },

  error(msg) {
    log.error({ err: msg }, 'xml parser error');
  },

  fatalError(msg) {
    log.error({ err: msg }, 'xml parser fatal error');
  },
};

class SlsProxy {
  constructor(opts = {}) {
    const slsUrl = opts.url;
    const parsed = Object.assign(url.parse(slsUrl), opts);

    this.protocolInstance = (parsed.protocol == 'https:') ? https : http;
    this.protocol = parsed.protocol
    this.host = parsed.hostname;
    this.port = parsed.port || 80;
    this.path = parsed.pathname || '/';
    this.paths = new Set(Array.isArray(this.path) ? this.path : [this.path]);

    this.customServers = opts.customServers || {};

    this.address = opts.address || null;
    this.proxy = null;
    this.server = null;
    this.fetches = new Map();
  }

  setServers(servers) {
    // TODO is this a necessary method?
    this.customServers = servers;
  }

  resolve(callback) {
    if (!this.address) {
      dns.resolve(this.host, (err, addresses) => {
        if (!err) this.address = addresses[0];
        callback(err);
      });
    } else {
      process.nextTick(callback);
    }
  }

  fetch(index, callback) {
    if (typeof index === 'function') {
      callback = index;
      index = 0;
    }

    const urlPath = [...this.paths][index || 0];

    if (this.fetches.has(urlPath)) {
      this.fetches.get(urlPath).callbacks.push(callback);
      return;
    }

    const fetchData = { callbacks: [callback] };
    this.fetches.set(urlPath, fetchData);

    let done = false;
    const runCallbacks = (...args) => {
      if (!done) {
        done = true;
        this.fetches.delete(urlPath);
        for (const cb of fetchData.callbacks) cb(...args);
      }
    };

    this.resolve((err) => {
      if (err) {
        runCallbacks(err);
        return;
      }

      const req = this.protocolInstance.request({
        hostname: this.address || this.host,
        port: this.port,
        path: urlPath,
        headers: {
          'Host': `${this.host}:${this.port}`,
        },
        timeout: 5000,
      });

      fetchData.req = req;

      req.on('response', (res) => {
        const buffer = [];

        res.on('error', (err) => {
          // TODO what kind of errors will be here? how should we handle them?
          log.error({ err, req, res }, 'error fetching server list');
        });

        res.on('data', chunk => buffer.push(chunk));

        res.on('end', () => {
          const data = Buffer.concat(buffer).toString('utf8');
          log.debug({ data }, 'received response');

          const parser = new xmldom.DOMParser({ errorHandler });
          const doc = parser.parseFromString(data, 'text/xml');
          if (!doc) {
            callback(new Error('failed to parse document'));
            return;
          }

          const servers = {};
          for (const server of asArray(doc.getElementsByTagName('server'))) {
            const serverInfo = {};

            for (const node of asArray(server.childNodes)) {
              if (node.nodeType !== 1) continue;
              switch (node.nodeName) {
                case 'id':
                case 'ip':
                case 'port': {
                  serverInfo[node.nodeName] = node.textContent;
                  break;
                }

                case 'name': {
                  for (const c of asArray(node.childNodes)) {
                    if (c.nodeType === 4) { // CDATA_SECTION_NODE
                      serverInfo.name = c.data;
                      break;
                    }
                  }
                  break;
                }
              }
            }

            if (serverInfo.id) {
              servers[serverInfo.id] = serverInfo;
            }
          }

          runCallbacks(null, servers);
        });
      });

      req.on('error', (e) => {
        runCallbacks(e);
      });

      req.on('timeout', () => {
        runCallbacks(new Error('request timed out'));
      });

      req.end();
    });
  }

  listen(hostname, callback) {
    this.resolve((err) => {
      if (err) return callback(err);

      let key, cert;
      if (this.protocol == 'https:') {
        key = fs.readFileSync(path.join(__dirname, 'res', 'private.pem'));
        cert = fs.readFileSync(path.join(__dirname, 'res', 'public.pem'));
      }

      const proxyOptions = {
        target: `${this.protocol}//${this.address}:${this.port}`,
      };
      if (this.protocol == 'https:') {
        proxyOptions.ssl = {
          key: key,
          cert: cert,
        };
        proxyOptions.secure = false;
      }

      const proxied = proxy.createProxyServer(proxyOptions);

      proxied.on('proxyReq', (proxyReq) => {
        const port = (this.port !== 80) ? `:${this.port}` : '';
        proxyReq.setHeader('Host', this.host + port);
      });

      let requestListener = (req, res) => {
        if (req.url[0] !== '/') return res.end();

        if (this.paths.has(req.url.split('?')[0])) {
          const writeHead = res.writeHead;
          const write = res.write;
          const end = res.end;

          const buffer = [];

          res.writeHead = (...args) => {
            res.removeHeader('Content-Length');
            writeHead.apply(res, args);
          };

          res.write = (chunk) => {
            buffer.push(chunk);
          };

          res.end = (chunk) => {
            if (chunk) buffer.push(chunk);

            // TODO doing this all in-memory is pretty not-great
            const gzipped = (res.getHeader('content-encoding') === 'gzip');
            const response = Buffer.concat(buffer);
            const decoded = (gzipped ? zlib.gunzipSync(response) : response);
            const data = decoded.toString('utf8');

            const doc = new xmldom.DOMParser().parseFromString(data, 'text/xml');
            const transformed = doc
              ? modifySlsXml(doc, this.customServers)
              : data; // assume xmldom already logged an error

            const out = (gzipped ? zlib.gzipSync(transformed) : transformed);

            write.call(res, out, 'utf8');
            end.call(res);
          };
        }

        proxied.web(req, res, (err) => {
          log.error({ err, req, res }, 'error proxying request');

          res.writeHead(500, err.toString(), { 'Content-Type': 'text/plain' });
          res.end();
        });
      }

      const server = (this.protocol == 'https:') ? this.protocolInstance.createServer({key, cert}, requestListener) : this.protocolInstance.createServer(requestListener);

      this.proxy = proxied;
      this.server = server;

      server.listen(this.port, hostname, callback).on('error', callback);
    });
  }

  close() {
    if (this.proxy) this.proxy.close();
    if (this.server) this.server.close();

    for (const { req } of this.fetches.values()) {
      if (req) {
        req.removeAllListeners('error');
        req.on('error', () => {});
        req.abort();

        const { res } = req;
        if (res) {
          res.removeAllListeners('error');
          res.on('error', () => {});
          res.destroy();
        }
      }
    }
    this.fetches.clear();
  }
}

module.exports = SlsProxy;
