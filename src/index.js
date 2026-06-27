export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const accept = request.headers.get("Accept") || "";
    const userAgent = request.headers.get("user-agent") || "";

    // ---- Ваши 5 серверов (без изменений) ----
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
        remarks: "🇩🇪 Германия",
        network: "tcp",
        flow: "xtls-rprx-vision"
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
        remarks: "🇸🇪 Швеция",
        network: "tcp",
        flow: "xtls-rprx-vision"
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
        remarks: "🇵🇱 Польша",
        network: "tcp",
        flow: "xtls-rprx-vision"
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
        remarks: "🇷🇺 Россия",
        network: "tcp",
        flow: "xtls-rprx-vision"
      },
      {
        tag: "lte-1",
        address: "hole-nn.datanode-internal.net",
        port: 443,
        id: "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        serverName: "ads.x5.ru",
        publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
        shortId: "abbcd128",
        fingerprint: "qq",
        remarks: "🇩🇪 LTE",
        network: "grpc",
        flow: "",
        grpcServiceName: "ads.x5.ru"
      }
    ];

    // ---- Функции генерации конфигов (без изменений) ----
    function makeOutbound({ tag, address, port, id, serverName, publicKey, shortId, fingerprint, network, flow, grpcServiceName }) {
      const outbound = {
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
                  encryption: "none"
                }
              ]
            }
          ]
        },
        streamSettings: {
          network: network,
          security: "reality",
          realitySettings: {
            serverName: serverName,
            show: false,
            publicKey: publicKey,
            shortId: shortId,
            fingerprint: fingerprint
          }
        }
      };
      if (flow) {
        outbound.settings.vnext[0].users[0].flow = flow;
      }
      if (network === "grpc") {
        outbound.streamSettings.grpcSettings = {
          serviceName: grpcServiceName || ""
        };
      } else {
        outbound.streamSettings.tcpSettings = {};
      }
      return outbound;
    }

    function makeFullConfig(node) {
      const outbound = makeOutbound(node);
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
          subjectSelector: [node.tag]
        },
        outbounds: [
          outbound,
          { tag: "direct", protocol: "freedom" },
          { tag: "block", protocol: "blackhole" }
        ],
        remarks: node.remarks,
        routing: {
          domainMatcher: "hybrid",
          domainStrategy: "IPIfNonMatch",
          balancers: [
            {
              tag: `bal_${node.tag}`,
              selector: [node.tag],
              fallbackTag: "direct",
              strategy: {
                type: "leastLoad",
                settings: {
                  baselines: ["4s"],
                  costs: [{ match: node.tag, regexp: false, value: 1 }],
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
              balancerTag: `bal_${node.tag}`
            }
          ]
        }
      };
    }

    // ---- Условия для JSON ----
    const wantsJson = (path === '/json') 
                   || accept.includes('application/json')
                   || userAgent.includes('V2Ray') 
                   || userAgent.includes('Happ') 
                   || userAgent.includes('sing-box')
                   || userAgent.includes('INCy');

    if (wantsJson) {
      const configs = nodes.map(n => makeFullConfig(n));
      const expireTimestamp = 1899589200;

      return new Response(JSON.stringify(configs, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Profile-Title": "Ultra VPN Plus",
          "Subscription-Status": "active",
          "Subscription-Traffic": "357 GB / ∞",
          "Subscription-Expire": String(expireTimestamp),
          "subscription-userinfo": `upload=0; download=383331401728; total=0; expire=${expireTimestamp}`
        }
      });
    }

    // ---- УЛУЧШЕННЫЙ ВЕБ-ИНТЕРФЕЙС (без устройств) ----
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultra VPN Plus</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: #0b0e14;
            color: #e4e9f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .card {
            max-width: 380px;
            width: 100%;
            background: linear-gradient(145deg, #18181b, #0d0d10);
            border-radius: 28px;
            border: 1px solid #27272a;
            padding: 36px 28px 28px;
            box-shadow: 0 30px 60px -20px rgba(0,0,0,0.8);
            transition: 0.3s;
            backdrop-filter: blur(2px);
        }
        .card:hover {
            border-color: #3f3f46;
        }
        .header {
            text-align: center;
            margin-bottom: 28px;
        }
        .icon {
            font-size: 56px;
            display: block;
            margin-bottom: 6px;
        }
        .title {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #58a6ff, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.5px;
        }
        .status-badge {
            display: inline-block;
            background: rgba(22, 163, 74, 0.15);
            color: #22c55e;
            padding: 4px 18px;
            border-radius: 99px;
            font-size: 13px;
            font-weight: 600;
            margin-top: 8px;
            border: 1px solid rgba(34, 197, 94, 0.2);
        }
        .stats {
            background: #111113;
            border-radius: 18px;
            padding: 20px 18px;
            border: 1px solid #1e1e21;
            margin-bottom: 24px;
        }
        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
        }
        .stat-item + .stat-item {
            border-top: 1px solid #1e1e21;
            margin-top: 6px;
            padding-top: 12px;
        }
        .stat-label {
            font-size: 13px;
            font-weight: 500;
            color: #8b95a9;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .stat-value {
            font-size: 16px;
            font-weight: 600;
            color: #e4e9f0;
        }
        .stat-value .highlight {
            color: #58a6ff;
        }
        .stat-value .date {
            color: #fca5a5;
        }
        .progress-wrap {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #1e1e21;
        }
        .progress-label {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: #8b95a9;
            margin-bottom: 6px;
        }
        .progress-bar {
            width: 100%;
            height: 6px;
            background: #1e1e21;
            border-radius: 99px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            width: 70%; /* пример – можно сделать динамическим */
            background: linear-gradient(90deg, #58a6ff, #a78bfa);
            border-radius: 99px;
            transition: width 0.6s ease;
        }
        .servers-info {
            display: flex;
            justify-content: center;
            gap: 8px;
            font-size: 14px;
            color: #8b95a9;
            margin-top: 6px;
        }
        .servers-info span {
            font-weight: 600;
            color: #e4e9f0;
        }
        .footer {
            text-align: center;
            font-size: 14px;
            color: #5a5f6b;
            margin-top: 16px;
        }
        .footer a {
            color: #58a6ff;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        @media (max-width: 400px) {
            .card { padding: 24px 16px; }
            .title { font-size: 24px; }
        }
    </style>
</head>
<body>
<div class="card">
    <div class="header">
        <span class="icon">🚀</span>
        <div class="title">Ultra VPN Plus</div>
        <div class="status-badge">● Активен</div>
    </div>

    <div class="stats">
        <div class="stat-item">
            <span class="stat-label">📦 Трафик</span>
            <span class="stat-value">357 <span style="color:#8b95a9;font-weight:400;">GB</span> <span style="color:#8b95a9;font-weight:400;">/ ∞</span></span>
        </div>
        <div class="stat-item">
            <span class="stat-label">📅 Истекает</span>
            <span class="stat-value date">13.03.2030</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">🖥️ Серверов</span>
            <span class="stat-value">5</span>
        </div>
        <div class="progress-wrap">
            <div class="progress-label">
                <span>Использовано</span>
                <span>70%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width:70%;"></div>
            </div>
        </div>
    </div>

    <div class="servers-info">
        <span>🌍 Доступно серверов: <span>5</span></span>
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
