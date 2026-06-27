export default {
  async fetch(request, env, ctx) {
    // ---- Вспомогательная функция для генерации одного конфига ----
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

    // ---- Ваши 7 серверов ----
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
      },
      {
        tag: "lte-2",
        address: "178.250.242.194",
        port: 6443,
        id: "b92337e0-6819-4f17-a3cc-f860b138b27a",
        serverName: "a.wb.ru",
        publicKey: "noOR7PAxYWRRrbQywDahrBlTkbNuNFkMLCPcX-wfa5TY",
        shortId: "086007",
        fingerprint: "firefox",
        remarks: "🇵🇱 LTE №2"
      },
      {
        tag: "lte-3",
        address: "178.250.242.194",
        port: 443,
        id: "7573908b-d981-4153-92aa-33ee2d22144c",
        serverName: "api.ok.ru",
        publicKey: "grRXV9R0CYdwQX8R4S1qfMde1b8g6Ejr1UZCxM5-PkM",
        shortId: "3efa66e0",
        fingerprint: "firefox",
        remarks: "🇳🇱 LTE №3"
      }
    ];

    // Генерируем массив конфигов
    const configs = nodes.map(n => makeConfig(n));

    // Возвращаем JSON (без веб-интерфейса)
    return new Response(JSON.stringify(configs, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "subscription-userinfo": "upload=0; download=383331401728; total=0; expire=1899589200"
      }
    });
  }
};
