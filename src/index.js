export default {
  async fetch(request, env, ctx) {
    const userAgent = request.headers.get("user-agent") || "";
    const url = new URL(request.url);

    // --- ДАННЫЕ ПОДПИСКИ ---
    const totalTraffic = "357 GB";
    const expirationDate = "13.03.2030";
    const supportContact = "@fhcsupport"; 
    const profileTitleBase64 = "VWx0cmEgVlBOIFBsdXM="; // База64 для "Ultra VPN Plus"

    // Анонс для VPN-клиентов
    const announceStr = "#announce: Ultra VPN Plus — стабильное и быстрое подключение без ограничений.\n";

    // Твои 5 оригинальных рабочих конфигов в виде объекта
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
              "realitySettings": { "fingerprint": "qq", "mldsa65Verify": "", "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", "serverName": "ads.x5.ru", "shortId": "abbcd128", "show": false }
            },
            "settings": { "address": "de-new.datanode-internal.net", "encryption": "none", "flow": "xtls-rprx-vision", "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5", "level": 8, "port": 443 }
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
              "realitySettings": { "fingerprint": "qq", "mldsa65Verify": "", "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", "serverName": "ads.x5.ru", "shortId": "abbcd128", "show": false }
            },
            "settings": { "address": "se-new.datanode-internal.net", "encryption": "none", "flow": "xtls-rprx-vision", "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5", "level": 8, "port": 443 }
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
              "realitySettings": { "fingerprint": "qq", "mldsa65Verify": "", "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", "serverName": "sun9-35.userapi.com", "shortId": "abbcd128", "show": false }
            },
            "settings": { "address": "pl.datanode-internal.net", "encryption": "none", "flow": "xtls-rprx-vision", "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5", "level": 8, "port": 443 }
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
              "realitySettings": { "fingerprint": "qq", "mldsa65Verify": "", "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", "serverName": "sun9-38.userapi.com", "shortId": "abbcd128", "show": false }
            },
            "settings": { "address": "ru.datanode-internal.net", "encryption": "none", "flow": "xtls-rprx-vision", "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5", "level": 8, "port": 443 }
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
              "realitySettings": { "fingerprint": "qq", "mldsa65Verify": "", "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", "serverName": "ads.x5.ru", "shortId": "abbcd128", "show": false }
            },
            "settings": { "address": "hole3.datanode-internal.net", "encryption": "none", "flow": "xtls-rprx-vision", "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5", "level": 8, "port": 9443 }
          },
          { "protocol": "freedom", "settings": { "domainStrategy": "AsIs", "noises": [], "redirect": "" }, "tag": "direct" },
          { "protocol": "blackhole", "settings": { "response": { "type": "http" } }, "tag": "block" }
        ],
        "policy": { "levels": { "8": { "connIdle": 300, "downlinkOnly": 1, "handshake": 4, "uplinkOnly": 1 } }, "system": { "statsOutboundDownlink": true, "statsOutboundUplink": true } },
        "remarks": "🇩🇪 LTE #1",
        "routing": { "domainStrategy": "AsIs", "rules": [ { "network": "tcp,udp", "outboundTag": "proxy", "type": "field" } ] },
        "stats": {}
      }
    ];

    // Проверяем: это браузер?
    const vpnClients = ["v2ray", "nekobox", "shadowrocket", "streisand", "sing-box", "clash", "happ", "xray"];
    const isVpnClient = vpnClients.some(client => userAgent.toLowerCase().includes(client));

    if (!isVpnClient && userAgent.includes("Mozilla") && !url.searchParams.has("config") && url.searchParams.get("sub") !== "1") {
      const html = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ultra VPN Plus</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0d1117; color: #c9d1d9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .card { background: #161b22; padding: 28px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 100%; max-width: 350px; border: 1px solid #30363d; box-sizing: border-box; }
              h1 { font-size: 22px; margin-top: 0; color: #f0f6fc; }
              .status { display: inline-block; padding: 4px 10px; background: #238636; color: #fff; font-size: 12px; border-radius: 20px; font-weight: 600; margin-bottom: 20px; }
              .info-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #30363d; font-size: 14px; }
              .info-item:last-child { border-bottom: none; }
              .label { color: #8b949e; }
              .value { font-weight: 500; color: #c9d1d9; }
              .footer { text-align: center; margin-top: 24px; font-size: 13px; color: #8b949e; }
              .footer a { color: #58a6ff; text-decoration: none; font-weight: 500; }
          </style>
      </head>
      <body>
          <div class="card">
              <h1>Ultra VPN Plus</h1>
              <div class="status">Подписка активна</div>
              <div class="info-item">
                  <span class="label">Трафик:</span>
                  <span class="value">${totalTraffic} / ∞</span>
              </div>
              <div class="info-item">
                  <span class="label">Истекает:</span>
                  <span class="value">${expirationDate}</span>
              </div>
              <div class="info-item">
                  <span class="label">Обновление:</span>
                  <span class="value">Каждый час</span>
              </div>
              <div class="footer">
                  Поддержка: <a href="https://t.me/${supportContact.replace('@', '')}" target="_blank">${supportContact}</a>
              </div>
          </div>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // --- ВАРИАНТ ДЛЯ VPN КЛИЕНТОВ ---
    const cleanJson = JSON.stringify(configsObj);
    const finalPayload = announceStr + cleanJson;

    const newHeaders = new Headers();
    newHeaders.set("Content-Type", "application/json; charset=utf-8");
    newHeaders.set("profile-title", `base64:${profileTitleBase64}`);
    newHeaders.set("subscription-userinfo", "upload=0; download=383331401728; total=383331401728; expire=1899589200");
    newHeaders.set("profile-update-interval", "1");
    newHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(finalPayload, { status: 200, headers: newHeaders });
  }
};
