export default {
  async fetch(request, env, ctx) {
    const userAgent = request.headers.get("user-agent") || "";
    const isClient = userAgent.includes("V2Ray") || userAgent.includes("Happ") || userAgent.includes("sing-box");

    // ---- Только 5 серверов (LTE №2 и №3 удалены) ----
    const nodes = [
      {
        tag: "de-1",
        address: "de-new.datanode-internal.net",
        port: 443,
        id: "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        serverName: "ads.x5.ru",
        publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
        shortId: "abbcd128",
        fingerprint: "qq",
        remarks: "🇩🇪 Германия⚡"
      },
      {
        tag: "se-1",
        address: "se-new.datanode-internal.net",
        port: 443,
        id: "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        serverName: "ads.x5.ru",
        publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
        shortId: "abbcd128",
        fingerprint: "qq",
        remarks: "🇸🇪 Швеция⚡"
      },
      {
        tag: "pl-1",
        address: "pl.datanode-internal.net",
        port: 443,
        id: "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        serverName: "sun9-35.userapi.com",
        publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
        shortId: "abbcd128",
        fingerprint: "qq",
        remarks: "🇵🇱 Польша"
      },
      {
        tag: "ru-1",
        address: "ru.datanode-internal.net",
        port: 443,
        id: "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        serverName: "sun9-38.userapi.com",
        publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
        shortId: "abbcd128",
        fingerprint: "qq",
        remarks: "🇷🇺 Россия"
      },
      {
        tag: "lte-1",
        address: "hole3.datanode-internal.net",
        port: 9443,
        id: "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        serverName: "ads.x5.ru",
        publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
        shortId: "abbcd128",
        fingerprint: "qq",
        remarks: "🇩🇪 LTE №1 ⚡"
      }
    ];

    // ---- Функция генерации полного конфига (для клиентов) ----
    function makeConfig({ tag, address, port, id, serverName, publicKey, shortId, fingerprint, remarks }) {
      return {
        dns: {
          servers: ["1.1.1.1", "1.0.0.1"],
          queryStrategy: "UseIP"
        },
        inbounds: [
          {
            tag: "socks",
            port: 10808,
            listen: "127.0.0.1",
            protocol: "socks",
            settings: { udp: true, auth: "noauth" },
            sniffing: { enabled: true, routeOnly: false, destOverride: ["http", "tls", "quic"] }
          },
          {
            tag: "http",
            port: 10809,
            listen: "127.0.0.1",
            protocol: "http",
            settings: { allowTransparent: false },
            sniffing: { enabled: true, routeOnly: false, destOverride: ["http", "tls", "quic"] }
          }
        ],
        observatory: {
          enableConcurrency: true,
          probeInterval: "1m",
          probeUrl: "https://www.google.com/generate_204",
          subjectSelector: [tag]
        },
        outbounds: [
          {
            tag: tag,
            protocol: "vless",
            settings: {
              vnext: [
                {
                  address: address,
                  port: port,
                  users: [
                    {
                      id: id,
                      encryption: "none",
                      flow: "xtls-rprx-vision"
                    }
                  ]
                }
              ]
            },
            streamSettings: {
              network: "tcp",
              tcpSettings: {},
              security: "reality",
              realitySettings: {
                serverName: serverName,
                show: false,
                publicKey: publicKey,
                shortId: shortId,
                fingerprint: fingerprint
              }
            }
          },
          { tag: "direct", protocol: "freedom" },
          { tag: "block", protocol: "blackhole" }
        ],
        remarks: remarks,
        routing: {
          domainMatcher: "hybrid",
          domainStrategy: "IPIfNonMatch",
          balancers: [
            {
              tag: `bal_${tag}`,
              selector: [tag],
              fallbackTag: "direct",
              strategy: {
                type: "leastLoad",
                settings: {
                  baselines: ["4s"],
                  costs: [{ match: tag, regexp: false, value: 1 }],
                  expected: 1,
                  maxRTT: "6s"
                }
              }
            }
          ],
          rules: [
            { type: "field", protocol: ["bittorrent"], outboundTag: "block" },
            {
              domain: [
                "domain:mtalk.google.com",
                "domain:push.apple.com",
                "domain:api.push.apple.com"
              ],
              outboundTag: "direct",
              type: "field"
            },
            { ip: ["17.0.0.0/8"], outboundTag: "direct", type: "field" },
            {
              type: "field",
              inboundTag: ["socks", "http"],
              network: "tcp,udp",
              balancerTag: `bal_${tag}`
            }
          ]
        }
      };
    }

    // ---- Если запрос от VPN-клиента ----
    if (isClient) {
      const configs = nodes.map(n => makeConfig(n));
      return new Response(JSON.stringify(configs, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "subscription-userinfo": "upload=0; download=383331401728; total=0; expire=1899589200"
        }
      });
    }

    // ---- МИНИМАЛИСТИЧНЫЙ ВЕБ-ИНТЕРФЕЙС (без кнопок копирования/скачивания) ----
    // Собираем карточки серверов (только общая информация)
    const cardsHtml = nodes.map((n) => {
      return `
        <div class="server-card">
          <div class="server-header">
            <span class="flag">${n.remarks.split(' ')[0]}</span>
            <span class="name">${n.remarks}</span>
            <span class="status online"></span>
          </div>
          <div class="server-info">
            <div class="info-item"><span class="label">Протокол:</span> vless</div>
            <div class="info-item"><span class="label">Адрес:</span> ${n.address}</div>
            <div class="info-item"><span class="label">Порт:</span> ${n.port}</div>
            <div class="info-item"><span class="label">SNI:</span> ${n.serverName}</div>
          </div>
        </div>
      `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VPN подписка</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0b0e14;
      color: #e4e9f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      width: 100%;
    }
    .header {
      text-align: center;
      padding: 20px 0 30px;
    }
    .header h1 {
      font-size: 2rem;
      font-weight: 600;
      background: linear-gradient(135deg, #58a6ff, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }
    .header p {
      color: #8b95a9;
      font-size: 0.95rem;
      margin-top: 4px;
    }
    .stats {
      display: flex;
      justify-content: space-between;
      background: #141a24;
      padding: 16px 24px;
      border-radius: 12px;
      border: 1px solid #1e293b;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
    }
    .stat-item .label {
      color: #8b949e;
    }
    .stat-item .value {
      font-weight: 500;
      color: #58a6ff;
    }
    .stat-item .online-status {
      color: #22c55e;
      font-weight: 500;
    }
    .servers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }
    .server-card {
      background: #141a24;
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 18px 20px 20px;
      transition: border-color 0.2s, transform 0.15s;
    }
    .server-card:hover {
      border-color: #334155;
      transform: translateY(-2px);
    }
    .server-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .flag {
      font-size: 1.6rem;
      line-height: 1;
    }
    .name {
      font-weight: 600;
      font-size: 1.1rem;
      flex: 1;
    }
    .status {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .status.online {
      background: #22c55e;
      box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
    }
    .server-info {
      font-size: 0.85rem;
      line-height: 1.7;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      border-bottom: 1px solid #1a2230;
    }
    .info-item:last-child {
      border-bottom: none;
    }
    .info-item .label {
      color: #8b95a9;
    }
    .info-item .value {
      color: #d1d5db;
      word-break: break-all;
      text-align: right;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #4b5563;
      font-size: 0.8rem;
    }
    .footer a {
      color: #58a6ff;
      text-decoration: none;
    }
    @media (max-width: 600px) {
      .header h1 { font-size: 1.6rem; }
      .stats { flex-direction: column; align-items: flex-start; gap: 6px; }
      .servers-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🔒 VPN Подписка</h1>
    <p>Ваши активные серверы</p>
  </div>

  <div class="stats">
    <div class="stat-item">
      <span class="label">Использовано:</span>
      <span class="value">357 GB / ∞</span>
    </div>
    <div class="stat-item">
      <span class="label">Статус:</span>
      <span class="online-status">● Активна</span>
    </div>
    <div class="stat-item">
      <span class="label">Серверов:</span>
      <span class="value">${nodes.length}</span>
    </div>
    <div class="stat-item">
      <span class="label">Поддержка:</span>
      <a href="https://t.me/fhcsupport" style="color:#58a6ff; text-decoration:none;">@fhcsupport</a>
    </div>
  </div>

  <div class="servers-grid">
    ${cardsHtml}
  </div>

  <div class="footer">
    Обновлено: ${new Date().toLocaleString('ru-RU')} · Данные защищены
  </div>
</div>
</body>
</html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};
