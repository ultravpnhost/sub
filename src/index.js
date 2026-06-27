// Массив полных рабочих Xray-конфигов в JSON для клиентов
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
    "remarks": "Белый список 🏳️",
    "routing": { "domainStrategy": "AsIs", "rules": [ { "network": "tcp,udp", "outboundTag": "proxy", "type": "field" } ] },
    "stats": {}
  }
];

// Экспортируем через ES Modules, как просит новый Wrangler API
export default {
  async fetch(request, env, ctx) {
    const userAgent = request.headers.get("user-agent") || "";
    
    // Проверяем клиентов
    const vpnClients = ["v2ray", "nekobox", "shadowrocket", "streisand", "sing-box", "clash", "happ", "xray"];
    const isVpnClient = vpnClients.some(client => userAgent.toLowerCase().includes(client));
    const url = new URL(request.url);

    // 1. ДЛЯ VPN КЛИЕНТОВ (JSON Конфиги)
    if (isVpnClient || url.searchParams.get("sub") === "1" || request.headers.get("accept")?.includes("json")) {
      const cleanJson = JSON.stringify(configsObj);

      const newHeaders = new Headers();
      newHeaders.set("Content-Type", "application/json; charset=utf-8");
      newHeaders.set("profile-title", "base64:VWx0cmEgVlBOIOKavw=="); // Ultra VPN 🏳️
      newHeaders.set("subscription-userinfo", "upload=0; download=383331401728; total=0; expire=1899589200");
      newHeaders.set("profile-update-interval", "1");
      newHeaders.set("Access-Control-Allow-Origin", "*");

      return new Response(cleanJson, {
        status: 200,
        headers: newHeaders
      });
    }

    // 2. ДЛЯ БРАУЗЕРА (Красивый Веб-Интерфейс)
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ultra VPN | Информация о подписке</title>
      <style>
        :root {
          --bg-color: #0d1117;
          --card-bg: #161b22;
          --border-color: #30363d;
          --text-main: #c9d1d9;
          --text-sub: #8b949e;
          --accent-color: #1f6feb;
          --accent-hover: #388bfd;
        }
        body {
          margin: 0;
          padding: 0;
          background-color: var(--bg-color);
          color: var(--text-main);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        header {
          background-color: var(--card-bg);
          border-bottom: 1px solid var(--border-color);
          padding: 15px 24px;
        }
        .logo {
          font-weight: 700;
          font-size: 1.25rem;
          color: #f0f6fc;
        }
        .container {
          max-width: 550px;
          margin: 50px auto;
          padding: 0 16px;
          flex: 1;
        }
        .card {
          background-color: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 28px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        h1 {
          font-size: 1.4rem;
          margin-top: 0;
          margin-bottom: 6px;
          color: #f0f6fc;
        }
        .status {
          color: var(--text-sub);
          font-size: 0.9rem;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-badge {
          background-color: #238636;
          color: #f0f6fc;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .input-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          color: var(--text-sub);
          font-size: 0.85rem;
          margin-bottom: 8px;
        }
        .url-box {
          background-color: #0d1117;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 14px;
          font-family: monospace;
          font-size: 0.85rem;
          word-break: break-all;
          user-select: all;
          color: #58a6ff;
        }
        .btn {
          display: block;
          width: 100%;
          background-color: var(--accent-color);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          box-sizing: border-box;
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: var(--accent-hover);
        }
        .footer-text {
          text-align: center;
          color: var(--text-sub);
          font-size: 0.8rem;
          margin-top: 35px;
          line-height: 1.4;
        }
      </style>
    </head>
    <body>

      <header>
        <div class="logo">Ultra VPN 🏳️</div>
      </header>

      <div class="container">
        <div class="card">
          <h1>Подписка успешно настроена</h1>
          <div class="status">
            <span class="status-badge">Активна</span>
            <span>• 5 приватных узлов Xray</span>
          </div>

          <div class="input-group">
            <label>Ссылка для добавления в VPN-клиент:</label>
            <div class="url-box" id="subUrl">${request.url}</div>
          </div>

          <button class="btn" onclick="copyLink()">Скопировать ссылку подписки</button>
        </div>
        
        <div class="footer-text">
          Вставьте скопированную ссылку в Happ, v2rayN или NekoBox как «URL подписки».<br>
          Сервер автоматически выдаст конфигурации под ваше устройство.
        </div>
      </div>

      <script>
        function copyLink() {
          const urlText = document.getElementById('subUrl').innerText;
          navigator.clipboard.writeText(urlText).then(() => {
            alert('Ссылка скопирована!');
          }).catch(err => {
            alert('Не удалось скопировать, выделите текст вручную.');
          });
        }
      </script>
    </body>
    </html>
    `;

    return new Response(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  }
};
