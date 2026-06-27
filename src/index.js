export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const accept = request.headers.get("Accept") || "";
    const userAgent = request.headers.get("user-agent") || "";

    // ---- Ваши 5 серверов (LTE обновлён по полному JSON) ----
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
        remarks: "🇩🇪 Германия⚡",
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
        remarks: "🇸🇪 Швеция⚡",
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
        remarks: "🇩🇪 LTE №1 ⚡",
        network: "grpc",
        flow: "",
        grpcServiceName: "ads.x5.ru"
      }
    ];

    // ---- Функция генерации outbound ----
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

    // ---- Полный объект конфига ----
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

    // ---- ОБНОВЛЁННЫЙ ВЕБ-ИНТЕРФЕЙС (с устройствами) ----
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
            --progress-bg: #27272a;
            --progress-fill: #3b82f6;
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
        .stat-row { 
            margin-bottom: 15px; 
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .stat-row:last-child { margin-bottom: 0; }
        .stat-label { 
            font-size: 11px; 
            color: var(--dim); 
            text-transform: uppercase; 
            letter-spacing: 0.5px;
        }
        .stat-value { 
            font-size: 17px; 
            font-weight: bold; 
        }
        .date-value { color: var(--date-color); }
        .devices-row {
            margin-top: 15px;
            border-top: 1px solid #27272a;
            padding-top: 15px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .devices-header {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
        }
        .devices-header .count {
            font-weight: 600;
            color: #e4e4e7;
        }
        .devices-header .limit {
            color: var(--dim);
        }
        .progress-bar {
            width: 100%;
            height: 6px;
            background: var(--progress-bg);
            border-radius: 99px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: var(--progress-fill);
            border-radius: 99px;
            transition: width 0.3s ease;
            width: 20%; /* 1 из 5 = 20% */
        }
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
                <span class="stat-label">Доступный трафик</span>
                <span class="stat-value">357 GB / ∞</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Истекает</span>
                <span class="stat-value date-value">13.03.2030</span>
            </div>
            <!-- НОВАЯ СТРОКА: Устройства -->
            <div class="devices-row">
                <div class="devices-header">
                    <span class="stat-label">Устройства</span>
                    <span class="count">1 <span class="limit">/ 5</span></span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 20%;"></div>
                </div>
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
