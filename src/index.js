export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const accept = request.headers.get("Accept") || "";
    const userAgent = request.headers.get("user-agent") || "";
    const method = request.method;

    // ============================================================
    // ФУНКЦИИ ДЛЯ РАБОТЫ С KV
    // ============================================================
    async function getSubscriptions() {
      try {
        const data = await env.KV.get('subscriptions', 'json');
        if (!data) {
          const defaultData = {
            'default': {
              name: 'Основная',
              active: true,
              expire: null,
              createdAt: Date.now()
            }
          };
          await env.KV.put('subscriptions', JSON.stringify(defaultData));
          return defaultData;
        }
        return data;
      } catch (e) {
        console.error('KV error:', e);
        return {
          'default': {
            name: 'Основная',
            active: true,
            expire: null,
            createdAt: Date.now()
          }
        };
      }
    }

    async function saveSubscriptions(data) {
      await env.KV.put('subscriptions', JSON.stringify(data));
    }

    const subscriptions = await getSubscriptions();

    // ============================================================
    // АДМИН-ПАНЕЛЬ
    // ============================================================
    if (path === '/admin') {
      const params = new URLSearchParams(url.search);
      const password = params.get('pass') || '';
      
      if (password !== '18032014') {
        return new Response(getLoginPage(), {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }

      if (method === 'POST') {
        const formData = await request.formData();
        const action = formData.get('action');
        const subId = formData.get('subscription_id') || 'default';
        const period = formData.get('period');
        const subName = formData.get('subscription_name') || subId;

        if (action === 'create') {
          const newId = 'sub_' + Date.now().toString(36);
          subscriptions[newId] = {
            name: subName,
            active: true,
            expire: period === 'forever' ? null : Date.now() + parseInt(period) * 24 * 60 * 60 * 1000,
            createdAt: Date.now()
          };
          await saveSubscriptions(subscriptions);
          return new Response(JSON.stringify({ 
            success: true, 
            action, 
            subId: newId, 
            url: 'https://' + url.host + '/sub/' + newId,
            subscription: subscriptions[newId] 
          }), {
            headers: { "Content-Type": "application/json; charset=utf-8" }
          });
        }

        if (!subscriptions[subId]) {
          subscriptions[subId] = { name: subId, active: true, expire: null, createdAt: Date.now() };
        }

        const sub = subscriptions[subId];

        switch(action) {
          case 'disable':
            sub.active = false;
            break;
          case 'enable':
            sub.active = true;
            break;
          case 'extend':
            if (period === 'forever') {
              sub.expire = null;
            } else {
              const days = parseInt(period);
              sub.expire = Date.now() + days * 24 * 60 * 60 * 1000;
            }
            sub.active = true;
            break;
          case 'delete':
            delete subscriptions[subId];
            break;
        }

        await saveSubscriptions(subscriptions);

        return new Response(JSON.stringify({ success: true, action, subId, subscription: sub }), {
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
      }

      return new Response(getAdminPanel(subscriptions), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // ============================================================
    // ОБРАБОТКА ПОДПИСОК /sub/ID
    // ============================================================
    const subMatch = path.match(/^\/sub\/([a-zA-Z0-9_]+)$/);
    if (subMatch) {
      const subId = subMatch[1];
      const sub = subscriptions[subId];

      if (!sub) {
        return new Response('Подписка не найдена', { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }

      const isActive = sub.active && (sub.expire === null || Date.now() < sub.expire);

      // ---- Реальные серверы ----
      const realNodes = [
        { tag: "de-1", address: "de-new.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇩🇪 Германия", network: "tcp", flow: "xtls-rprx-vision" },
        { tag: "se-1", address: "se-new.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇸🇪 Швеция", network: "tcp", flow: "xtls-rprx-vision" },
        { tag: "pl-1", address: "pl.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "sun9-35.userapi.com", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇵🇱 Польша", network: "tcp", flow: "xtls-rprx-vision" },
        { tag: "ru-1", address: "ru.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "sun9-38.userapi.com", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇷🇺 Россия", network: "tcp", flow: "xtls-rprx-vision" },
        { tag: "lte-1", address: "hole-nn.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇩🇪 LTE #1", network: "grpc", flow: "", grpcServiceName: "ads.x5.ru" }
      ];

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

      function makeOutbound({ tag, address, port, id, serverName, publicKey, shortId, fingerprint, network, flow, grpcServiceName }) {
        const outbound = {
          tag: tag,
          protocol: "vless",
          settings: {
            vnext: [{
              address: address,
              port: port,
              users: [{ id: id, encryption: "none" }]
            }]
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
            balancers: [{
              tag: "bal_" + node.tag,
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
            }],
            rules: [
              { type: "field", protocol: ["bittorrent"], outboundTag: "block" },
              { domain: ["domain:mtalk.google.com", "domain:push.apple.com", "domain:api.push.apple.com"], outboundTag: "direct", type: "field" },
              { ip: ["17.0.0.0/8"], outboundTag: "direct", type: "field" },
              { type: "field", inboundTag: ["socks", "http"], network: "tcp,udp", balancerTag: "bal_" + node.tag }
            ]
          }
        };
      }

      const nodes = isActive ? realNodes : emptyNodes;
      const configs = nodes.map(function(n) { return makeFullConfig(n); });
      
      const usedTraffic = isActive ? getCurrentTrafficGB() : 0;
      const usedTrafficBytes = usedTraffic * 1024 * 1024 * 1024;
      
      const expireTimestamp = sub.expire ? Math.floor(sub.expire / 1000) : 0;
      const title = isActive ? sub.name || "Ultra VPN Plus" : "Подписка отключена";
      const status = isActive ? "active" : "expired";
      const trafficDisplay = isActive ? usedTraffic + " GB / ∞" : "0 GB / 0 GB";

      const commonHeaders = {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Profile-Title": title,
        "Subscription-Status": status,
        "Subscription-Traffic": trafficDisplay,
        "Subscription-Expire": String(expireTimestamp),
        "subscription-userinfo": "upload=0; download=" + usedTrafficBytes + "; total=0; expire=" + expireTimestamp
      };

      if (userAgent.includes('INCY')) {
        const responseBody = {
          servers: configs,
          subscription: {
            title: title,
            traffic: trafficDisplay,
            expire: expireTimestamp,
            status: status
          }
        };
        return new Response(JSON.stringify(responseBody, null, 2), { headers: commonHeaders });
      } else {
        return new Response(JSON.stringify(configs, null, 2), { headers: commonHeaders });
      }
    }

    // ============================================================
    // ОСНОВНАЯ ЛОГИКА (трафик)
    // ============================================================
    const START_DATE = new Date('2026-06-28T00:00:00Z');
    const BASE_TRAFFIC_GB = 0;

    function getHourlyIncrement(date) {
      const seed = date.getFullYear() * 1000000 + (date.getMonth() + 1) * 10000 + date.getDate() * 100 + date.getHours();
      const x = Math.sin(seed) * 10000;
      const r = x - Math.floor(x);
      const dayOfYear = Math.floor((date - START_DATE) / (1000 * 60 * 60 * 24));
      const isBonusDay = (dayOfYear % 10 === 0 && dayOfYear > 0);
      if (isBonusDay) {
        return Math.floor(r * 3) + 10;
      } else {
        return Math.floor(r * 2) + 1;
      }
    }

    function getCurrentTrafficGB() {
      const now = new Date();
      const diffTime = now - START_DATE;
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours <= 0) return BASE_TRAFFIC_GB;
      let total = BASE_TRAFFIC_GB;
      for (let h = 1; h <= diffHours; h++) {
        const hourDate = new Date(START_DATE.getTime() + h * 60 * 60 * 1000);
        total += getHourlyIncrement(hourDate);
      }
      return total;
    }

    // ============================================================
    // ВЕБ-ИНТЕРФЕЙС (для браузеров)
    // ============================================================
    const isBrowser = !accept.includes('application/json') && !userAgent.includes('V2Ray') && !userAgent.includes('Happ') && !userAgent.includes('sing-box') && !userAgent.includes('INCY');

    if (isBrowser) {
      const sub = subscriptions['default'] || { name: 'Ultra VPN Plus', active: true, expire: null };
      const isActive = sub.active && (sub.expire === null || Date.now() < sub.expire);
      const usedTrafficDisplay = getCurrentTrafficGB();
      const displayNames = ["Германия", "Швеция", "Польша", "Россия", "LTE #1"];
      const serverDataJson = JSON.stringify(displayNames);

      const html = '<!DOCTYPE html>\n<html lang="ru">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Ultra VPN Plus</title>\n    <style>\n        * { margin: 0; padding: 0; box-sizing: border-box; }\n        body {\n            font-family: \'Segoe UI\', system-ui, sans-serif;\n            background: #0b0e14;\n            color: #e4e9f0;\n            display: flex;\n            justify-content: center;\n            align-items: center;\n            min-height: 100vh;\n            padding: 20px;\n        }\n        .container { max-width: 420px; width: 100%; }\n        .page { display: none; animation: fade 0.25s ease; }\n        .page.active { display: block; }\n        @keyframes fade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }\n        .card {\n            background: linear-gradient(145deg, #18181b, #0d0d10);\n            border-radius: 28px;\n            border: 1px solid #27272a;\n            padding: 32px 24px 24px;\n            box-shadow: 0 30px 60px -20px rgba(0,0,0,0.8);\n            transition: 0.3s;\n        }\n        .card:hover { border-color: #3f3f46; }\n        .header { text-align: center; margin-bottom: 24px; }\n        .icon { font-size: 52px; display: block; margin-bottom: 4px; }\n        .title {\n            font-size: 26px;\n            font-weight: 700;\n            background: linear-gradient(135deg, #58a6ff, #a78bfa);\n            -webkit-background-clip: text;\n            -webkit-text-fill-color: transparent;\n            background-clip: text;\n        }\n        .badge {\n            display: inline-block;\n            background: ' + (isActive ? 'rgba(22, 163, 74, 0.15)' : 'rgba(239, 68, 68, 0.15)') + ';\n            color: ' + (isActive ? '#22c55e' : '#ef4444') + ';\n            padding: 4px 18px;\n            border-radius: 99px;\n            font-size: 13px;\n            font-weight: 600;\n            margin-top: 6px;\n            border: 1px solid ' + (isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)') + ';\n        }\n        .stats {\n            background: #111113;\n            border-radius: 18px;\n            padding: 18px 16px;\n            border: 1px solid #1e1e21;\n            margin-bottom: 20px;\n        }\n        .stat-item {\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            padding: 8px 0;\n        }\n        .stat-item + .stat-item {\n            border-top: 1px solid #1e1e21;\n            margin-top: 4px;\n            padding-top: 12px;\n        }\n        .stat-label { font-size: 14px; color: #8b95a9; display: flex; align-items: center; gap: 8px; }\n        .stat-value { font-size: 16px; font-weight: 600; }\n        .stat-value .date { color: #fca5a5; }\n        .expired-box {\n            background: rgba(239, 68, 68, 0.1);\n            border: 1px solid rgba(239, 68, 68, 0.3);\n            border-radius: 12px;\n            padding: 16px;\n            text-align: center;\n            margin-bottom: 20px;\n        }\n        .expired-box .big-icon { font-size: 48px; display: block; margin-bottom: 8px; }\n        .expired-box .text { font-size: 16px; font-weight: 600; color: #ef4444; }\n        .expired-box .sub { font-size: 14px; color: #8b95a9; margin-top: 4px; }\n        .btn-status {\n            display: block;\n            width: 100%;\n            padding: 14px;\n            border-radius: 99px;\n            font-weight: 700;\n            font-size: 16px;\n            cursor: pointer;\n            border: none;\n            background: linear-gradient(135deg, #3b82f6, #8b5cf6);\n            color: #fff;\n            text-align: center;\n            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);\n            transition: 0.3s;\n            letter-spacing: 0.5px;\n            position: relative;\n            overflow: hidden;\n        }\n        .btn-status:hover {\n            transform: translateY(-2px);\n            box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);\n        }\n        .btn-status:active { transform: scale(0.98); }\n        .footer { text-align: center; font-size: 14px; color: #5a5f6b; margin-top: 16px; }\n        .footer a { color: #58a6ff; text-decoration: none; }\n        .footer a:hover { text-decoration: underline; }\n        .back-header {\n            display: flex;\n            align-items: center;\n            gap: 12px;\n            margin-bottom: 18px;\n        }\n        .back-header button {\n            background: transparent;\n            border: none;\n            color: #58a6ff;\n            font-size: 18px;\n            cursor: pointer;\n            padding: 4px 8px;\n            border-radius: 8px;\n            transition: 0.2s;\n        }\n        .back-header button:hover { background: #1e293b; }\n        .back-header h2 { font-size: 22px; font-weight: 600; }\n        .server-list { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }\n        .server-item {\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            background: #111113;\n            padding: 14px 18px;\n            border-radius: 14px;\n            border: 1px solid #1e1e21;\n            transition: 0.2s;\n        }\n        .server-item:hover { border-color: #3f3f46; }\n        .server-name { font-weight: 500; font-size: 15px; }\n        .server-stats { display: flex; gap: 16px; font-size: 13px; color: #8b95a9; }\n        .server-stats span { font-weight: 600; color: #e4e9f0; }\n        .ping { color: #58a6ff; }\n        .speed { color: #22c55e; }\n        .update-section {\n            margin-top: 16px;\n            display: flex;\n            flex-direction: column;\n            gap: 10px;\n        }\n        .update-btn {\n            padding: 10px;\n            border-radius: 99px;\n            font-weight: 600;\n            font-size: 14px;\n            cursor: pointer;\n            border: 1px solid #27272a;\n            background: #1e1e21;\n            color: #e4e9f0;\n            transition: 0.2s;\n            text-align: center;\n        }\n        .update-btn:hover { background: #2a2a2e; border-color: #3f3f46; }\n        .update-btn:disabled { opacity: 0.5; cursor: not-allowed; }\n        .progress-container {\n            width: 100%;\n            display: flex;\n            align-items: center;\n            gap: 12px;\n            visibility: hidden;\n        }\n        .progress-container.active { visibility: visible; }\n        .progress-bar {\n            flex: 1;\n            height: 6px;\n            background: #1e1e21;\n            border-radius: 99px;\n            overflow: hidden;\n        }\n        .progress-fill {\n            height: 100%;\n            width: 0%;\n            background: linear-gradient(90deg, #58a6ff, #a78bfa);\n            border-radius: 99px;\n            transition: width 0.3s ease;\n        }\n        .progress-text {\n            font-size: 14px;\n            font-weight: 600;\n            color: #58a6ff;\n            min-width: 44px;\n            text-align: right;\n        }\n        @media (max-width: 400px) {\n            .card { padding: 20px 14px; }\n            .title { font-size: 22px; }\n            .server-item { flex-direction: column; align-items: flex-start; gap: 6px; }\n        }\n    </style>\n</head>\n<body>\n<div class="container">\n    <div id="page-main" class="page active">\n        <div class="card">\n            <div class="header">\n                <span class="icon">🚀</span>\n                <div class="title">Ultra VPN Plus</div>\n                <div class="badge">' + (isActive ? '● Активен' : '● Подписка истекла') + '</div>\n            </div>\n            ' + (isActive ? '\n            <div class="stats">\n                <div class="stat-item">\n                    <span class="stat-label">📦 Трафик</span>\n                    <span class="stat-value">' + usedTrafficDisplay + ' GB <span style="color:#8b95a9;font-weight:400;">/ ∞</span></span>\n                </div>\n                <div class="stat-item">\n                    <span class="stat-label">📅 Истекает</span>\n                    <span class="stat-value date">' + (sub.expire ? new Date(sub.expire).toLocaleDateString('ru-RU') : 'Навсегда') + '</span>\n                </div>\n            </div>\n            ' : '\n            <div class="expired-box">\n                <span class="big-icon">⛔</span>\n                <div class="text">Подписка истекла</div>\n                <div class="sub">Продление: <a href="https://t.me/fhcsupport" style="color:#58a6ff;">@fhcsupport</a></div>\n            </div>\n            ') + '\n            ' + (isActive ? '<button class="btn-status" id="statusBtn">📊 Статус серверов</button>' : '') + '\n            <div class="footer">\n                Вопросы? <a href="https://t.me/fhcsupport">@fhcsupport</a>\n            </div>\n        </div>\n    </div>\n\n    ' + (isActive ? '\n    <div id="page-servers" class="page">\n        <div class="card">\n            <div class="back-header">\n                <button id="backBtn">← Назад</button>\n                <h2>Статус серверов</h2>\n            </div>\n            <div id="serverList" class="server-list"></div>\n            <div class="update-section">\n                <button class="update-btn" id="updateBtn">🔄 Обновить статус</button>\n                <div class="progress-container" id="progressContainer">\n                    <div class="progress-bar">\n                        <div class="progress-fill" id="progressFill"></div>\n                    </div>\n                    <span class="progress-text" id="progressText">0%</span>\n                </div>\n            </div>\n            <div class="footer" style="margin-top:12px;">\n                <span style="color:#5a5f6b;">Обновлено: <span id="updateTime"></span></span>\n            </div>\n        </div>\n    </div>\n    ' : '') + '\n</div>\n\n<script>\nvar serverNames = ' + serverDataJson + ';\nvar STORAGE_KEY = \'ultra_vpn_servers_data\';\nvar isUpdating = false;\nvar autoUpdateTimer = null;\n\nfunction random(min, max) {\n    return Math.floor(Math.random() * (max - min + 1)) + min;\n}\n\nfunction getPingRange(name) {\n    if (name === \'Россия\') return { min: 8, max: 42 };\n    return { min: 60, max: 120 };\n}\nfunction getSpeedRange(name) {\n    if (name === \'Россия\') return { min: 50, max: 150 };\n    if (name === \'Германия\' || name === \'LTE #1\') return { min: 100, max: 200 };\n    return { min: 50, max: 200 };\n}\n\nfunction generateRandomData() {\n    var result = [];\n    for (var i = 0; i < serverNames.length; i++) {\n        var name = serverNames[i];\n        var pr = getPingRange(name);\n        var sr = getSpeedRange(name);\n        result.push({\n            name: name,\n            ping: random(pr.min, pr.max),\n            speed: random(sr.min, sr.max)\n        });\n    }\n    return result;\n}\n\nfunction generateVariantData(oldData) {\n    var result = [];\n    for (var i = 0; i < oldData.length; i++) {\n        var old = oldData[i];\n        var name = old.name;\n        var pr = getPingRange(name);\n        var sr = getSpeedRange(name);\n        var pingDelta = Math.round(old.ping * 0.3);\n        var newPing = old.ping + random(-pingDelta, pingDelta);\n        newPing = Math.min(Math.max(newPing, pr.min), pr.max);\n        var speedDelta = Math.round(old.speed * 0.3);\n        var newSpeed = old.speed + random(-speedDelta, speedDelta);\n        newSpeed = Math.min(Math.max(newSpeed, sr.min), sr.max);\n        result.push({\n            name: name,\n            ping: newPing,\n            speed: newSpeed\n        });\n    }\n    return result;\n}\n\nfunction saveState(data, timestamp) {\n    try {\n        localStorage.setItem(STORAGE_KEY, JSON.stringify({\n            data: data,\n            timestamp: timestamp || Date.now()\n        }));\n    } catch(e) {}\n}\n\nfunction loadState() {\n    try {\n        var raw = localStorage.getItem(STORAGE_KEY);\n        if (raw) {\n            var parsed = JSON.parse(raw);\n            if (parsed.data && Array.isArray(parsed.data) && parsed.data.length === serverNames.length) {\n                return parsed;\n            }\n        }\n    } catch(e) {}\n    return null;\n}\n\nfunction getCurrentData() {\n    var state = loadState();\n    if (!state) {\n        var fresh = generateRandomData();\n        saveState(fresh);\n        return fresh;\n    }\n    var now = Date.now();\n    var age = now - state.timestamp;\n    var TEN_MINUTES = 10 * 60 * 1000;\n    if (age > TEN_MINUTES) {\n        var fresh2 = generateRandomData();\n        saveState(fresh2);\n        return fresh2;\n    } else {\n        return state.data;\n    }\n}\n\nfunction refreshData() {\n    var state = loadState();\n    var now = Date.now();\n    var TEN_MINUTES = 10 * 60 * 1000;\n    var newData;\n    if (!state || (now - state.timestamp > TEN_MINUTES)) {\n        newData = generateRandomData();\n    } else {\n        newData = generateVariantData(state.data);\n    }\n    saveState(newData);\n    return newData;\n}\n\nfunction renderServers(data) {\n    var container = document.getElementById(\'serverList\');\n    var html = \'\';\n    for (var i = 0; i < data.length; i++) {\n        var s = data[i];\n        html += \'<div class="server-item">\' +\n            \'<span class="server-name">\' + s.name + \'</span>\' +\n            \'<div class="server-stats">\' +\n                \'<span>📶 <span class="ping">\' + s.ping + \'</span> мс</span>\' +\n                \'<span>⚡ <span class="speed">\' + s.speed + \'</span> Мбит/с</span>\' +\n            \'</div>\' +\n        \'</div>\';\n    }\n    container.innerHTML = html;\n}\n\nfunction updateTimeDisplay() {\n    var now = new Date().toLocaleString(\'ru-RU\');\n    document.getElementById(\'updateTime\').textContent = now;\n}\n\nfunction performUpdate(manual) {\n    if (isUpdating) return;\n    isUpdating = true;\n    var btn = document.getElementById(\'updateBtn\');\n    var container = document.getElementById(\'progressContainer\');\n    var fill = document.getElementById(\'progressFill\');\n    var text = document.getElementById(\'progressText\');\n\n    btn.disabled = true;\n    btn.textContent = \'⏳ Обновление...\';\n    container.classList.add(\'active\');\n    fill.style.width = \'0%\';\n    text.textContent = \'0%\';\n\n    var progress = 0;\n    var target = 100;\n    var step = function() {\n        var increment = random(1, 6);\n        progress = Math.min(progress + increment, target);\n        fill.style.width = progress + \'%\';\n        text.textContent = progress + \'%\';\n\n        if (progress >= target) {\n            var newData = refreshData();\n            renderServers(newData);\n            updateTimeDisplay();\n            container.classList.remove(\'active\');\n            btn.disabled = false;\n            btn.textContent = \'🔄 Обновить статус\';\n            isUpdating = false;\n            resetAutoUpdate();\n            return;\n        }\n\n        if (Math.random() < 0.25) {\n            var delay = random(500, 1000);\n            setTimeout(step, delay);\n        } else {\n            var nextDelay = random(200, 400);\n            setTimeout(step, nextDelay);\n        }\n    };\n\n    setTimeout(step, 300);\n}\n\nfunction resetAutoUpdate() {\n    if (autoUpdateTimer) { clearTimeout(autoUpdateTimer); autoUpdateTimer = null; }\n    var delay = random(10000, 20000);\n    autoUpdateTimer = setTimeout(function() {\n        if (!isUpdating) {\n            performUpdate(false);\n        }\n    }, delay);\n}\n\nfunction init() {\n    var data = getCurrentData();\n    renderServers(data);\n    updateTimeDisplay();\n    resetAutoUpdate();\n    document.getElementById(\'updateBtn\').addEventListener(\'click\', function() {\n        performUpdate(true);\n    });\n}\n\nvar pageMain = document.getElementById(\'page-main\');\nvar pageServers = document.getElementById(\'page-servers\');\nvar statusBtn = document.getElementById(\'statusBtn\');\nvar backBtn = document.getElementById(\'backBtn\');\n\nfunction showPage(page) {\n    var pages = document.querySelectorAll(\'.page\');\n    for (var i = 0; i < pages.length; i++) {\n        pages[i].classList.remove(\'active\');\n    }\n    document.getElementById(\'page-\' + page).classList.add(\'active\');\n    if (page === \'servers\') {\n        if (!document.getElementById(\'serverList\').innerHTML) {\n            init();\n        }\n    }\n}\n\nif (statusBtn) {\n    statusBtn.addEventListener(\'click\', function() { showPage(\'servers\'); });\n}\nif (backBtn) {\n    backBtn.addEventListener(\'click\', function() { showPage(\'main\'); });\n}\n</script>\n</body>\n</html>';

      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // ============================================================
    // ВСЁ ОСТАЛЬНОЕ — 404
    // ============================================================
    return new Response('Страница не найдена', { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
};

// ============================================================
// ФУНКЦИИ ДЛЯ СТРАНИЦ ВХОДА И АДМИН-ПАНЕЛИ
// ============================================================

function getLoginPage() {
  return '<!DOCTYPE html>\n<html lang="ru">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Админ-панель</title>\n    <style>\n        * { margin: 0; padding: 0; box-sizing: border-box; }\n        body {\n            font-family: \'Segoe UI\', system-ui, sans-serif;\n            background: #0b0e14;\n            color: #e4e9f0;\n            display: flex;\n            justify-content: center;\n            align-items: center;\n            min-height: 100vh;\n            padding: 20px;\n        }\n        .card {\n            max-width: 400px;\n            width: 100%;\n            background: linear-gradient(145deg, #18181b, #0d0d10);\n            border-radius: 28px;\n            border: 1px solid #27272a;\n            padding: 40px 28px;\n            box-shadow: 0 30px 60px -20px rgba(0,0,0,0.8);\n            text-align: center;\n        }\n        h2 { margin-bottom: 8px; }\n        .subtitle { color: #8b95a9; font-size: 14px; margin-bottom: 24px; }\n        input {\n            width: 100%;\n            padding: 12px 16px;\n            border-radius: 12px;\n            border: 1px solid #27272a;\n            background: #111113;\n            color: #e4e9f0;\n            font-size: 16px;\n            margin-bottom: 16px;\n        }\n        input:focus { outline: none; border-color: #3b82f6; }\n        button {\n            width: 100%;\n            padding: 12px;\n            border-radius: 99px;\n            border: none;\n            background: linear-gradient(135deg, #3b82f6, #8b5cf6);\n            color: #fff;\n            font-weight: 700;\n            font-size: 16px;\n            cursor: pointer;\n            transition: 0.3s;\n        }\n        button:hover { opacity: 0.8; transform: translateY(-2px); }\n    </style>\n</head>\n<body>\n<div class="card">\n    <h2>🔐 Админ-панель</h2>\n    <div class="subtitle">Введите пароль для доступа</div>\n    <form method="GET" action="/admin">\n        <input type="password" name="pass" placeholder="Пароль" required>\n        <button type="submit">Войти</button>\n    </form>\n</div>\n</body>\n</html>';
}

function getAdminPanel(subscriptions) {
  let listHtml = '';
  for (const [id, sub] of Object.entries(subscriptions)) {
    const status = sub.active ? '🟢' : '🔴';
    const expireDate = sub.expire ? new Date(sub.expire).toLocaleDateString('ru-RU') : 'Навсегда';
    const link = 'https://' + (typeof window !== 'undefined' ? window.location.host : 'sub.ultravpnhosting.workers.dev') + '/sub/' + id;
    listHtml += '\n    <div class="sub-item" id="sub-' + id + '">\n        <div class="sub-info">\n            <div class="sub-name"><span class="status-dot ' + (sub.active ? 'active' : 'disabled') + '"></span> ' + (sub.name || id) + '</div>\n            <div class="sub-details">Статус: ' + (sub.active ? 'Активна' : 'Отключена') + ' | Истекает: ' + expireDate + '</div>\n            <div class="sub-link"><input type="text" value="' + link + '" readonly onclick="this.select(); document.execCommand(\'copy\')"> <span style="color:#8b95a9;font-size:12px;">(кликни чтобы скопировать)</span></div>\n        </div>\n        <div class="sub-actions">\n            <button onclick="quickAction(\'' + id + '\',\'enable\')" class="btn btn-success btn-sm">✅ Включить</button>\n            <button onclick="quickAction(\'' + id + '\',\'disable\')" class="btn btn-danger btn-sm">❌ Отключить</button>\n            <button onclick="quickActionExtend(\'' + id + '\')" class="btn btn-warning btn-sm">🔄 Продлить</button>\n            <button onclick="quickAction(\'' + id + '\',\'delete\')" class="btn btn-gray btn-sm" style="background:#ef444433;color:#ef4444;">🗑️</button>\n        </div>\n    </div>';
  }

  return '<!DOCTYPE html>\n<html lang="ru">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Админ-панель</title>\n    <style>\n        * { margin: 0; padding: 0; box-sizing: border-box; }\n        body {\n            font-family: \'Segoe UI\', system-ui, sans-serif;\n            background: #0b0e14;\n            color: #e4e9f0;\n            display: flex;\n            justify-content: center;\n            align-items: center;\n            min-height: 100vh;\n            padding: 20px;\n        }\n        .container { max-width: 700px; width: 100%; }\n        .card {\n            background: linear-gradient(145deg, #18181b, #0d0d10);\n            border-radius: 28px;\n            border: 1px solid #27272a;\n            padding: 32px 24px;\n            box-shadow: 0 30px 60px -20px rgba(0,0,0,0.8);\n            margin-bottom: 20px;\n        }\n        h2 { margin-bottom: 4px; }\n        .subtitle { color: #8b95a9; font-size: 14px; margin-bottom: 20px; }\n        .form-group { margin-bottom: 16px; }\n        label { display: block; font-size: 14px; color: #8b95a9; margin-bottom: 4px; }\n        select, input {\n            width: 100%;\n            padding: 10px 14px;\n            border-radius: 10px;\n            border: 1px solid #27272a;\n            background: #111113;\n            color: #e4e9f0;\n            font-size: 14px;\n        }\n        select:focus, input:focus { outline: none; border-color: #3b82f6; }\n        .btn {\n            padding: 10px 20px;\n            border-radius: 99px;\n            border: none;\n            font-weight: 600;\n            font-size: 14px;\n            cursor: pointer;\n            transition: 0.3s;\n        }\n        .btn:hover { opacity: 0.8; transform: translateY(-2px); }\n        .btn-primary { background: #3b82f6; color: #fff; }\n        .btn-success { background: #22c55e; color: #fff; }\n        .btn-danger { background: #ef4444; color: #fff; }\n        .btn-warning { background: #f59e0b; color: #fff; }\n        .btn-gray { background: #1e293b; color: #e4e9f0; }\n        .btn-sm { padding: 6px 14px; font-size: 12px; }\n        .btn-group { display: flex; gap: 8px; flex-wrap: wrap; }\n        .sub-item {\n            background: #111113;\n            border-radius: 12px;\n            padding: 16px;\n            margin-bottom: 12px;\n            border: 1px solid #1e1e21;\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            flex-wrap: wrap;\n            gap: 12px;\n        }\n        .sub-item:hover { border-color: #3f3f46; }\n        .sub-name { font-weight: 600; font-size: 16px; display: flex; align-items: center; gap: 8px; }\n        .sub-details { font-size: 13px; color: #8b95a9; margin-top: 4px; }\n        .sub-link input { \n            background: #0b0e14; \n            border: none; \n            color: #58a6ff; \n            font-size: 13px; \n            padding: 4px 8px; \n            border-radius: 6px;\n            cursor: pointer;\n            width: 100%;\n            max-width: 300px;\n        }\n        .sub-actions { display: flex; gap: 6px; flex-wrap: wrap; }\n        .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }\n        .status-dot.active { background: #22c55e; }\n        .status-dot.disabled { background: #ef4444; }\n        .back-link { color: #58a6ff; text-decoration: none; display: inline-block; margin-bottom: 16px; }\n        .back-link:hover { text-decoration: underline; }\n        .empty-text { color: #8b95a9; text-align: center; padding: 20px 0; }\n        .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }\n        .flex-1 { flex: 1; }\n    </style>\n</head>\n<body>\n<div class="container">\n    <a href="/" class="back-link">← На главную</a>\n    \n    <div class="card">\n        <h2>🔧 Админ-панель</h2>\n        <div class="subtitle">Управление подписками</div>\n        \n        <form method="POST" action="/admin?pass=18032014" id="adminForm">\n            <input type="hidden" name="action" value="create">\n            \n            <div class="row">\n                <div class="flex-1">\n                    <div class="form-group">\n                        <label>Название подписки</label>\n                        <input type="text" name="subscription_name" placeholder="Например: client1" required>\n                    </div>\n                </div>\n                <div class="flex-1">\n                    <div class="form-group">\n                        <label>Срок</label>\n                        <select name="period">\n                            <option value="30">1 месяц</option>\n                            <option value="90">3 месяца</option>\n                            <option value="180">6 месяцев</option>\n                            <option value="365">1 год</option>\n                            <option value="forever">Навсегда</option>\n                        </select>\n                    </div>\n                </div>\n            </div>\n\n            <button type="submit" class="btn btn-primary" style="width:100%;">➕ Создать подписку</button>\n        </form>\n    </div>\n\n    <div class="card">\n        <h3 style="font-size:16px; margin-bottom:16px;">📋 Список подписок</h3>\n        <div id="subscriptionsList">\n            ' + (Object.keys(subscriptions).length === 0 ? '<div class="empty-text">Нет активных подписок</div>' : listHtml) + '\n        </div>\n    </div>\n</div>\n\n<script>\nfunction quickAction(id, action) {\n    if (action === \'delete\' && !confirm(\'Удалить подписку "\' + id + \'"?\')) return;\n    var form = document.createElement(\'form\');\n    form.method = \'POST\';\n    form.action = \'/admin?pass=18032014\';\n    form.innerHTML = \'<input type="hidden" name="action" value="\' + action + \'"><input type="hidden" name="subscription_id" value="\' + id + \'"><input type="hidden" name="period" value="30">\';\n    document.body.appendChild(form);\n    form.submit();\n}\n\nfunction quickActionExtend(id) {\n    var days = prompt(\'На сколько дней продлить? (введите число)\', \'30\');\n    if (!days) return;\n    var form = document.createElement(\'form\');\n    form.method = \'POST\';\n    form.action = \'/admin?pass=18032014\';\n    form.innerHTML = \'<input type="hidden" name="action" value="extend"><input type="hidden" name="subscription_id" value="\' + id + \'"><input type="hidden" name="period" value="\' + days + \'">\';\n    document.body.appendChild(form);\n    form.submit();\n}\n</script>\n</body>\n</html>';
}
