export default {
  async fetch(request, env, ctx) {
    const userAgent = request.headers.get("user-agent") || "";
    const isClient = userAgent.includes("V2Ray") || userAgent.includes("Happ") || userAgent.includes("sing-box");

    // ---- Ваши 5 серверов (LTE №2 и №3 удалены) ----
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

    // ---- Функция генерации полного конфига для Sing-box (как в vpn.json) ----
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

    // ---- Если запрос от VPN-клиента (V2Ray, Happ, sing-box) ----
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

    // ---- ИНАЧЕ: ВЕБ-ИНТЕРФЕЙС (ваш минималистичный шаблон) ----
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultra VPN Plus | Dashboard</title>
    <style>
        :root {
            --bg: #09090b;
            --card-bg: linear-gradient(145deg, #18181b, #09090b);
            --border: #27272a;
            --accent: #3b82f6;
            --success: #16a34a;
            --text: #e4e4e7;
            --dim: #71717a;
            --date-color: #fca5a5;
        }
        body { 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            background: var(--bg); 
            color: var(--text); 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            margin: 0; 
        }
        .card { 
            background: var(--card-bg); 
            padding: 40px; 
            border-radius: 24px; 
            border: 1px solid var(--border); 
            width: 100%; 
            max-width: 340px; 
            text-align: center; 
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .icon { font-size: 60px; margin-bottom: 10px; display: block; }
        h1 { font-size: 26px; margin: 0 0 10px 0; letter-spacing: -0.5px; }
        .badge { 
            display: inline-block; 
            background: rgba(22, 163, 74, 0.15); 
            color: var(--success); 
            padding: 4px 16px; 
            border-radius: 99px; 
            font-size: 13px; 
            font-weight: 600; 
            margin-bottom: 25px; 
        }
        .stat-box { 
            background: #111113; 
            padding: 20px; 
            border-radius: 16px; 
            border: 1px solid var(--border);
            margin-bottom: 25px;
        }
        .stat-row { margin-bottom: 15px; }
        .stat-row:last-child { margin-bottom: 0; }
        .stat-label { font-size: 11px; color: var(--dim); text-transform: uppercase; margin-bottom: 4px; }
        .stat-value { font-size: 17px; font-weight: bold; }
        .date-value { color: var(--date-color); }
        .footer { font-size: 14px; color: var(--dim); }
        a { color: var(--accent); text-decoration: none; transition: 0.2s; }
        a:hover { opacity: 0.8; }
    </style>
</head>
<body>
    <div class="card">
        <span class="icon">🚀</span>
        <h1>Ultra VPN Plus</h1>
        <div class="badge">● Статус: Активен</div>
        
        <div class="stat-box">
            <div class="stat-row">
                <div class="stat-label">Доступный трафик</div>
                <div class="stat-value">357 GB / Безлимит</div>
            </div>
            <div class="stat-row" style="margin-top: 15px; border-top: 1px solid #27272a; padding-top: 15px;">
                <div class="stat-label">Истекает</div>
                <div class="stat-value date-value">13.03.2030</div>
            </div>
        </div>

        <div class="footer">
            Вопросы? <a href="https://t.me/fhcsupport">@fhcsupport</a>
        </div>
    </div>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};
