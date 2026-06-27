addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Тот самый массив полных конфигураций, который работает на 100%
  const configsObj = [
    {
      "dns": { "queryStrategy": "UseIP", "servers": [ { "address": "8.8.8.8", "skipFallback": false } ], "tag": "dns_out" },
      "inbounds": [
        { "port": 10808, "protocol": "mixed", "settings": { "auth": "noauth", "udp": true, "userLevel": 8 }, "sniffing": { "destOverride": ["http", "tls", "quic", "fakedns"], "enabled": true }, "tag": "mixed" },
        { "port": 10809, "protocol": "http", "settings": { "userLevel": 8 }, "tag": "http" }
      ],
      "log": { "loglevel": "warning" },
      "outbounds": [
        {
          "protocol": "vless",
          "tag": "proxy",
          "streamSettings": {
            "network": "tcp",
            "security": "reality",
            "realitySettings": {
              "fingerprint": "qq",
              "mldsa65Verify": "",
              "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
              "serverName": "ads.x5.ru",
              "shortId": "abbcd128",
              "show": false
            }
          },
          "settings": {
            "address": "de-new.datanode-internal.net",
            "encryption": "none",
            "flow": "xtls-rprx-vision",
            "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5",
            "level": 8,
            "port": 443
          }
        },
        { "protocol": "freedom", "settings": { "domainStrategy": "AsIs", "noises": [], "redirect": "" }, "tag": "direct" },
        { "protocol": "blackhole", "settings": { "response": { "type": "http" } }, "tag": "block" }
      ],
      "policy": { "levels": { "8": { "connIdle": 300, "downlinkOnly": 1, "handshake": 4, "uplinkOnly": 1 } }, "system": { "statsOutboundDownlink": true, "statsOutboundUplink": true } },
      "remarks": "🇩🇪 Германия⚡",
      "routing": { "domainStrategy": "AsIs", "rules": [ { "network": "tcp,udp", "outboundTag": "proxy", "type": "field" } ] },
      "stats": {}
    },
    {
      "dns": { "queryStrategy": "UseIP", "servers": [ { "address": "8.8.8.8", "skipFallback": false } ], "tag": "dns_out" },
      "inbounds": [
        { "port": 10808, "protocol": "mixed", "settings": { "auth": "noauth", "udp": true, "userLevel": 8 }, "sniffing": { "destOverride": ["http", "tls", "quic", "fakedns"], "enabled": true }, "tag": "mixed" },
        { "port": 10809, "protocol": "http", "settings": { "userLevel": 8 }, "tag": "http" }
      ],
      "log": { "loglevel": "warning" },
      "outbounds": [
        {
          "protocol": "vless",
          "tag": "proxy",
          "streamSettings": {
            "network": "tcp",
            "security": "reality",
            "realitySettings": {
              "fingerprint": "qq",
              "mldsa65Verify": "",
              "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
              "serverName": "ads.x5.ru",
              "shortId": "abbcd128",
              "show": false
            }
          },
          "settings": {
            "address": "se-new.datanode-internal.net",
            "encryption": "none",
            "flow": "xtls-rprx-vision",
            "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5",
            "level": 8,
            "port": 443
          }
        },
        { "protocol": "freedom", "settings": { "domainStrategy": "AsIs", "noises": [], "redirect": "" }, "tag": "direct" },
        { "protocol": "blackhole", "settings": { "response": { "type": "http" } }, "tag": "block" }
      ],
      "policy": { "levels": { "8": { "connIdle": 300, "downlinkOnly": 1, "handshake": 4, "uplinkOnly": 1 } }, "system": { "statsOutboundDownlink": true, "statsOutboundUplink": true } },
      "remarks": "🇸🇪 Швеция⚡",
      "routing": { "domainStrategy": "AsIs", "rules": [ { "network": "tcp,udp", "outboundTag": "proxy", "type": "field" } ] },
      "stats": {}
    },
    {
      "dns": { "queryStrategy": "UseIP", "servers": [ { "address": "8.8.8.8", "skipFallback": false } ], "tag": "dns_out" },
      "inbounds": [
        { "port": 10808, "protocol": "mixed", "settings": { "auth": "noauth", "udp": true, "userLevel": 8 }, "sniffing": { "destOverride": ["http", "tls", "quic", "fakedns"], "enabled": true }, "tag": "mixed" },
        { "port": 10809, "protocol": "http", "settings": { "userLevel": 8 }, "tag": "http" }
      ],
      "log": { "loglevel": "warning" },
      "outbounds": [
        {
          "protocol": "vless",
          "tag": "proxy",
          "streamSettings": {
            "network": "tcp",
            "security": "reality",
            "realitySettings": {
              "fingerprint": "qq",
              "mldsa65Verify": "",
              "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
              "serverName": "sun9-35.userapi.com",
              "shortId": "abbcd128",
              "show": false
            }
          },
          "settings": {
            "address": "pl.datanode-internal.net",
            "encryption": "none",
            "flow": "xtls-rprx-vision",
            "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5",
            "level": 8,
            "port": 443
          }
        },
        { "protocol": "freedom", "settings": { "domainStrategy": "AsIs", "noises": [], "redirect": "" }, "tag": "direct" },
        { "protocol": "blackhole", "settings": { "response": { "type": "http" } }, "tag": "block" }
      ],
      "policy": { "levels": { "8": { "connIdle": 300, "downlinkOnly": 1, "handshake": 4, "uplinkOnly": 1 } }, "system": { "statsOutboundDownlink": true, "statsOutboundUplink": true } },
      "remarks": "🇵🇱 Польша",
      "routing": { "domainStrategy": "AsIs", "rules": [ { "network": "tcp,udp", "outboundTag": "proxy", "type": "field" } ] },
      "stats": {}
    },
    {
      "dns": { "queryStrategy": "UseIP", "servers": [ { "address": "8.8.8.8", "skipFallback": false } ], "tag": "dns_out" },
      "inbounds": [
        { "port": 10808, "protocol": "mixed", "settings": { "auth": "noauth", "udp": true, "userLevel": 8 }, "sniffing": { "destOverride": ["http", "tls", "quic", "fakedns"], "enabled": true }, "tag": "mixed" },
        { "port": 10809, "protocol": "http", "settings": { "userLevel": 8 }, "tag": "http" }
      ],
      "log": { "loglevel": "warning" },
      "outbounds": [
        {
          "protocol": "vless",
          "tag": "proxy",
          "streamSettings": {
            "network": "tcp",
            "security": "reality",
            "realitySettings": {
              "fingerprint": "qq",
              "mldsa65Verify": "",
              "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
              "serverName": "sun9-38.userapi.com",
              "shortId": "abbcd128",
              "show": false
            }
          },
          "settings": {
            "address": "ru.datanode-internal.net",
            "encryption": "none",
            "flow": "xtls-rprx-vision",
            "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5",
            "level": 8,
            "port": 443
          }
        },
        { "protocol": "freedom", "settings": { "domainStrategy": "AsIs", "noises": [], "redirect": "" }, "tag": "direct" },
        { "protocol": "blackhole", "settings": { "response": { "type": "http" } }, "tag": "block" }
      ],
      "policy": { "levels": { "8": { "connIdle": 300, "downlinkOnly": 1, "handshake": 4, "uplinkOnly": 1 } }, "system": { "statsOutboundDownlink": true, "statsOutboundUplink": true } },
      "remarks": "🇷🇺 Россия",
      "routing": { "domainStrategy": "AsIs", "rules": [ { "network": "tcp,udp", "outboundTag": "proxy", "type": "field" } ] },
      "stats": {}
    },
    {
      "dns": { "queryStrategy": "UseIP", "servers": [ { "address": "8.8.8.8", "skipFallback": false } ], "tag": "dns_out" },
      "inbounds": [
        { "port": 10808, "protocol": "mixed", "settings": { "auth": "noauth", "udp": true, "userLevel": 8 }, "sniffing": { "destOverride": ["http", "tls", "quic", "fakedns"], "enabled": true }, "tag": "mixed" },
        { "port": 10809, "protocol": "http", "settings": { "userLevel": 8 }, "tag": "http" }
      ],
      "log": { "loglevel": "warning" },
      "outbounds": [
        {
          "protocol": "vless",
          "tag": "proxy",
          "streamSettings": {
            "network": "tcp",
            "security": "reality",
            "realitySettings": {
              "fingerprint": "qq",
              "mldsa65Verify": "",
              "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
              "serverName": "ads.x5.ru",
              "shortId": "abbcd128",
              "show": false
            }
          },
          "settings": {
            "address": "hole3.datanode-internal.net",
            "encryption": "none",
            "flow": "xtls-rprx-vision",
            "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5",
            "level": 8,
            "port": 9443
          }
        },
        { "protocol": "freedom", "settings": { "domainStrategy": "AsIs", "noises": [], "redirect": "" }, "tag": "direct" },
        { "protocol": "blackhole", "settings": { "response": { "type": "http" } }, "tag": "block" }
      ],
      "policy": { "levels": { "8": { "connIdle": 300, "downlinkOnly": 1, "handshake": 4, "uplinkOnly": 1 } }, "system": { "statsOutboundDownlink": true, "statsOutboundUplink": true } },
      "remarks": "🇩🇪 LTE #1 ⚡",
      "routing": { "domainStrategy": "AsIs", "rules": [ { "network": "tcp,udp", "outboundTag": "proxy", "type": "field" } ] },
      "stats": {}
    },
    {
      "dns": { "queryStrategy": "UseIP", "servers": [ { "address": "8.8.8.8", "skipFallback": false } ], "tag": "dns_out" },
      "inbounds": [
        { "port": 10808, "protocol": "mixed", "settings": { "auth": "noauth", "udp": true, "userLevel": 8 }, "sniffing": { "destOverride": ["http", "tls", "quic", "fakedns"], "enabled": true }, "tag": "mixed" },
        { "port": 10809, "protocol": "http", "settings": { "userLevel": 8 }, "tag": "http" }
      ],
      "log": { "loglevel": "warning" },
      "outbounds": [
        {
          "protocol": "vless",
          "tag": "proxy",
          "streamSettings": {
            "network": "tcp",
            "security": "reality",
            "realitySettings": {
              "fingerprint": "firefox",
              "mldsa65Verify": "",
              "publicKey": "noOR7PAxYWRRrbQywDahrBlTkbNuNFkMLCPcX-wfa5TY",
              "serverName": "a.wb.ru",
              "shortId": "086007",
              "show": false
            }
          },
          "settings": {
            "address": "178.250.242.194",
            "encryption": "none",
            "flow": "xtls-rprx-vision",
            "id": "b92337e0-6819-4f17-a3cc-f860b138b27a",
            "level": 8,
            "port": 6443
          }
        },
        { "protocol": "freedom", "settings": { "domainStrategy": "AsIs", "noises": [], "redirect": "" }, "tag": "direct" },
        { "protocol": "blackhole", "settings": { "response": { "type": "http" } }, "tag": "block" }
      ],
      "policy": { "levels": { "8": { "connIdle": 300, "downlinkOnly": 1, "handshake": 4, "uplinkOnly": 1 } }, "system": { "statsOutboundDownlink": true, "statsOutboundUplink": true } },
      "remarks": "🇵🇱 LTE #2 ",
      "routing": { "domainStrategy": "AsIs", "rules": [ { "network": "tcp,udp", "outboundTag": "proxy", "type": "field" } ] },
      "stats": {}
    },
    {
      "dns": { "queryStrategy": "UseIP", "servers": [ { "address": "8.8.8.8", "skipFallback": false } ], "tag": "dns_out" },
      "inbounds": [
        { "port": 10808, "protocol": "mixed", "settings": { "auth": "noauth", "udp": true, "userLevel": 8 }, "sniffing": { "destOverride": ["http", "tls", "quic", "fakedns"], "enabled": true }, "tag": "mixed" },
        { "port": 10809, "protocol": "http", "settings": { "userLevel": 8 }, "tag": "http" }
      ],
      "log": { "loglevel": "warning" },
      "outbounds": [
        {
          "protocol": "vless",
          "tag": "proxy",
          "streamSettings": {
            "network": "tcp",
            "security": "reality",
            "realitySettings": {
              "fingerprint": "firefox",
              "mldsa65Verify": "",
              "publicKey": "grRXV9R0CYdwQX8R4S1qfMde1b8g6Ejr1UZCxM5-PkM",
              "serverName": "api.ok.ru",
              "shortId": "3efa66e0",
              "show": false
            }
          },
          "settings": {
            "address": "178.250.242.194",
            "encryption": "none",
            "flow": "xtls-rprx-vision",
            "id": "7573908b-d981-4153-92aa-33ee2d22144c",
            "level": 8,
            "port": 443
          }
        },
        { "protocol": "freedom", "settings": { "domainStrategy": "AsIs", "noises": [], "redirect": "" }, "tag": "direct" },
        { "protocol": "blackhole", "settings": { "response": { "type": "http" } }, "tag": "block" }
      ],
      "policy": { "levels": { "8": { "connIdle": 300, "downlinkOnly": 1, "handshake": 4, "uplinkOnly": 1 } }, "system": { "statsOutboundDownlink": true, "statsOutboundUplink": true } },
      "remarks": "🇳🇱 LTE #3 ",
      "routing": { "domainStrategy": "AsIs", "rules": [ { "network": "tcp,udp", "outboundTag": "proxy", "type": "field" } ] },
      "stats": {}
    }
  ];

  // Сжимаем в чистую JSON строку для выдачи без пробелов и ломающих переносов
  const cleanJson = JSON.stringify(configsObj);

  const newHeaders = new Headers();
  newHeaders.set("Content-Type", "application/json; charset=utf-8");
  
  // Строго "Ultra VPN" без флагов в Base64, чтобы ничего не коверкалось
  newHeaders.set("profile-title", "base64:VWx0cmEgVlBO");
  
  // Лимиты и срок действия подписки
  newHeaders.set("subscription-userinfo", "upload=0; download=383331401728; total=0; expire=1899589200");
  newHeaders.set("profile-update-interval", "1");
  newHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(cleanJson, {
    status: 200,
    headers: newHeaders
  });
}
