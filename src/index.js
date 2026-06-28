export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const accept = request.headers.get("Accept") || "";
    const userAgent = request.headers.get("user-agent") || "";

    // ---- ВСЕ UID ----
    const PERMANENT_UID = '123456798';
    const allowedUids = [
      '812394799',
      '345678912',
      '567891234',
      '789123456',
      '901234567',
      '234567890',
      '456789012',
      '678901234',
      '890123456',
      '987654321',
      PERMANENT_UID
    ];

    // ---- Константы ----
    const START_DATE = new Date('2026-06-20T00:00:00Z');
    const BASE_TRAFFIC_GB = 806;
    const EXPIRE_DATE = new Date('2026-07-28T23:59:59Z');

    function getDailyIncrement(date) {
      const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
      const x = Math.sin(seed) * 10000;
      const r = x - Math.floor(x);
      return Math.floor(r * 21) + 10;
    }

    function getCurrentTrafficGB() {
      const now = new Date();
      const diffTime = now - START_DATE;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return BASE_TRAFFIC_GB;
      let total = BASE_TRAFFIC_GB;
      for (let d = 1; d <= diffDays; d++) {
        const dayDate = new Date(START_DATE.getTime() + d * 24 * 60 * 60 * 1000);
        total += getDailyIncrement(dayDate);
      }
      return total;
    }

    const usedTraffic = getCurrentTrafficGB();
    const expireTimestamp = 1899589200;
    const subscriptionTitle = "Ultra VPN Plus";

    // ---- Реальные серверы ----
    const realNodes = [
      { tag: "de-1", address: "de-new.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇩🇪 Германия", network: "tcp", flow: "xtls-rprx-vision" },
      { tag: "se-1", address: "se-new.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇸🇪 Швеция", network: "tcp", flow: "xtls-rprx-vision" },
      { tag: "pl-1", address: "pl.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "sun9-35.userapi.com", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇵🇱 Польша", network: "tcp", flow: "xtls-rprx-vision" },
      { tag: "ru-1", address: "ru.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "sun9-38.userapi.com", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇷🇺 Россия", network: "tcp", flow: "xtls-rprx-vision" },
      { tag: "lte-1", address: "hole-nn.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇩🇪 LTE #1", network: "grpc", flow: "", grpcServiceName: "ads.x5.ru" }
    ];

    // ---- Пустой сервер (для отключённой подписки) ----
    const emptyNodes = [
      {
        tag: "disabled",
        address: "0.0.0.0",
        port: 0,
        id: "00000000-0000-0000-0000-000000000000",
        serverName: "disabled",
        publicKey: "disabled",
        shortId: "00000000",
        fingerprint: "none",
        remarks: "Подписка отключена 🔴",
        network: "tcp",
        flow: "",
        grpcServiceName: ""
      }
    ];

    // ---- Функции для генерации JSON ----
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
      if (flow) outbound.settings.vnext[0].users[0].flow = flow;
      if (network === "grpc") {
        outbound.streamSettings.grpcSettings = { serviceName: grpcServiceName || "" };
      } else {
        outbound.streamSettings.tcpSettings = {};
      }
      return outbound;
    }

    function makeFullConfig(node) {
      const outbound = makeOutbound(node);
      return {
        dns: { servers: ["1.1.1.1", "1.0.0.1"], queryStrategy: "UseIP" },
        inbounds: [
          { tag: "socks", port: 10808, listen: "127.0.0.1", protocol: "socks", settings: { udp: true, auth: "noauth" }, sniffing: { enabled: true, routeOnly: false, destOverride: ["http", "tls", "quic"] } },
          { tag: "http", port: 10809, listen: "127.0.0.1", protocol: "http", settings: { allowTransparent: false }, sniffing: { enabled: true, routeOnly: false, destOverride: ["http", "tls", "quic"] } }
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
            { domain: ["domain:mtalk.google.com", "domain:push.apple.com", "domain:api.push.apple.com"], outboundTag: "direct", type: "field" },
            { ip: ["17.0.0.0/8"], outboundTag: "direct", type: "field" },
            { type: "field", inboundTag: ["socks", "http"], network: "tcp,udp", balancerTag: `bal_${node.tag}` }
          ]
        }
      };
    }

    // ---- Проверка на INCY (исправлено) ----
    const isINCY = userAgent.includes('INCY');

    // ============================================================
    // ОБРАБОТКА ССЫЛОК /uid:XXXXXXXXX
    // ============================================================
    const uidMatch = path.match(/^\/uid:(\d{9})$/);
    if (uidMatch) {
      const uid = uidMatch[1];
      
      // Проверяем, разрешён ли этот UID
      if (!allowedUids.includes(uid)) {
        const blockedNode = {
          tag: "blocked",
          address: "0.0.0.0",
          port: 0,
          id: "00000000-0000-0000-0000-000000000000",
          serverName: "blocked",
          publicKey: "blocked",
          shortId: "00000000",
          fingerprint: "none",
          remarks: "Доступ запрещён 🔒",
          network: "tcp",
          flow: "",
          grpcServiceName: ""
        };
        const blockedConfig = makeFullConfig(blockedNode);
        
        const headers = {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Profile-Title": "Доступ запрещён",
          "Subscription-Status": "blocked",
          "Subscription-Traffic": "0 GB / 0 GB"
        };

        if (isINCY) {
          return new Response(JSON.stringify({
            servers: [blockedConfig],
            subscription: {
              title: "Доступ запрещён",
              traffic: "0 GB / 0 GB",
              expire: 0,
              status: "blocked"
            }
          }, null, 2), { headers });
        } else {
          return new Response(JSON.stringify([blockedConfig], null, 2), { headers });
        }
      }

      // Проверяем, вечный ли это UID
      const isPermanent = (uid === PERMANENT_UID);

      // Проверяем срок действия (если не вечный)
      const now = new Date();
      const isExpired = !isPermanent && (now > EXPIRE_DATE);

      // Выбираем ноды
      const nodes = isExpired ? emptyNodes : realNodes;

      // Статус
      let status = "active";
      let title = subscriptionTitle;
      let trafficDisplay = usedTraffic + " GB / ∞";
      let trafficBytes = usedTraffic * 1024 * 1024 * 1024;

      if (isExpired) {
        status = "expired";
        title = "Подписка отключена";
        trafficDisplay = "0 GB / 0 GB";
        trafficBytes = 0;
      } else if (isPermanent) {
        status = "active (permanent)";
      }

      const configs = nodes.map(n => makeFullConfig(n));
      const headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Profile-Title": title,
        "Subscription-Status": status,
        "Subscription-Traffic": trafficDisplay,
        "Subscription-Expire": String(expireTimestamp),
        "subscription-userinfo": `upload=0; download=${trafficBytes}; total=0; expire=${expireTimestamp}`
      };

      if (isINCY) {
        const responseBody = {
          servers: configs,
          subscription: {
            title: title,
            traffic: trafficDisplay,
            expire: expireTimestamp,
            status: status
          }
        };
        return new Response(JSON.stringify(responseBody, null, 2), { headers });
      } else {
        return new Response(JSON.stringify(configs, null, 2), { headers });
      }
    }

    // ============================================================
    // ВСЁ ОСТАЛЬНОЕ: 404
    // ============================================================
    return new Response('Страница не найдена', { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
};
