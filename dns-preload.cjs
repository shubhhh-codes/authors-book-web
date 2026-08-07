'use strict';

/**
 * Preload script loaded via Node.js --require / -r flag.
 * Overrides default DNS resolvers with public DNS (Google / Cloudflare) to ensure
 * reliable resolution of MongoDB Atlas SRV records, mitigating system DNS querySrv failures.
 */
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
  console.info('[DNS Preload] Applied fallback DNS resolvers (8.8.8.8, 1.1.1.1)');
} catch (err) {
  console.warn('[DNS Preload] Failed to set custom DNS servers:', err);
}
