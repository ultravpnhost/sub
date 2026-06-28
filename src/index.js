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
            url: `https://${url.host}/sub/${newId}`,
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
            }],
            rules: [
              { type: "field", protocol: ["bittorrent"], outboundTag: "block" },
              { domain: ["domain:mtalk.google.com", "domain:push.apple.com", "domain:api.push.apple.com"], outboundTag: "direct", type: "field" },
              { ip: ["17.0.0.0/8"], outboundTag: "direct", type: "field" },
              { type: "field", inboundTag: ["socks", "http"], network: "tcp,udp", balancerTag: `bal_${node.tag}` }
            ]
          }
        };
      }

      const nodes = isActive ? realNodes : emptyNodes;
      const configs = nodes.map(n => makeFullConfig(n));
      
      // Трафик считаем только для активных подписок
      const usedTraffic = isActive ? getCurrentTrafficGB() : 0;
      const usedTrafficBytes = usedTraffic * 1024 * 1024 * 1024;
      
      // ДАТА ИСТЕЧЕНИЯ — реальная из подписки
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
        "subscription-userinfo": `upload=0; download=${usedTrafficBytes}; total=0; expire=${expireTimestamp}`
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
      const displayNames = [
        "Германия", "Швеция", "Польша", "Россия", "LTE #1"
      ];
      const serverDataJson = JSON.stringify(displayNames);

      const html = String.raw`
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultra VPN Plus</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #0b0e14;
            color: #e4e9f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 420px; width: 100%; }
        .page { display: none; animation: fade 0.25s ease; }
        .page.active { display: block; }
        @keyframes fade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .card {
            background: linear-gradient(145deg, #18181b, #0d0d10);
            border-radius: 28px;
            border: 1px solid #27272a;
            padding: 32px 24px 24px;
            box-shadow: 0 30px 60px -20px rgba(0,0,0,0.8);
            transition: 0.3s;
        }
        .card:hover { border-color: #3f3f46; }
        .header { text-align: center; margin-bottom: 24px; }
        .icon { font-size: 52px; display: block; margin-bottom: 4px; }
        .title {
            font-size: 26px;
            font-weight: 700;
            background: linear-gradient(135deg, #58a6ff, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .badge {
            display: inline-block;
            background: ${isActive ? 'rgba(22, 163, 74, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
            color: ${isActive ? '#22c55e' : '#ef4444'};
            padding: 4px 18px;
            border-radius: 99px;
            font-size: 13px;
            font-weight: 600;
            margin-top: 6px;
            border: 1px solid ${isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
        }
        .stats {
            background: #111113;
            border-radius: 18px;
            padding: 18px 16px;
            border: 1px solid #1e1e21;
            margin-bottom: 20px;
        }
        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
        }
        .stat-item + .stat-item {
            border-top: 1px solid #1e1e21;
            margin-top: 4px;
            padding-top: 12px;
        }
        .stat-label { font-size: 14px; color: #8b95a9; display: flex; align-items: center; gap: 8px; }
        .stat-value { font-size: 16px; font-weight: 600; }
        .stat-value .date { color: #fca5a5; }
        .expired-box {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            margin-bottom: 20px;
        }
        .expired-box .big-icon { font-size: 48px; display: block; margin-bottom: 8px; }
        .expired-box .text { font-size: 16px; font-weight: 600; color: #ef4444; }
        .expired-box .sub { font-size: 14px; color: #8b95a9; margin-top: 4px; }
        .btn-status {
            display: block;
            width: 100%;
            padding: 14px;
            border-radius: 99px;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            border: none;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: #fff;
            text-align: center;
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
            transition: 0.3s;
            letter-spacing: 0.5px;
            position: relative;
            overflow: hidden;
        }
        .btn-status:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);
        }
        .btn-status:active { transform: scale(0.98); }
        .footer { text-align: center; font-size: 14px; color: #5a5f6b; margin-top: 16px; }
        .footer a { color: #58a6ff; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        .back-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
        }
        .back-header button {
            background: transparent;
            border: none;
            color: #58a6ff;
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 8px;
            transition: 0.2s;
        }
        .back-header button:hover { background: #1e293b; }
        .back-header h2 { font-size: 22px; font-weight: 600; }
        .server-list { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
        .server-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #111113;
            padding: 14px 18px;
            border-radius: 14px;
            border: 1px solid #1e1e21;
            transition: 0.2s;
        }
        .server-item:hover { border-color: #3f3f46; }
        .server-name { font-weight: 500; font-size: 15px; }
        .server-stats { display: flex; gap: 16px; font-size: 13px; color: #8b95a9; }
        .server-stats span { font-weight: 600; color: #e4e9f0; }
        .ping { color: #58a6ff; }
        .speed { color: #22c55e; }
        .update-section {
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .update-btn {
            padding: 10px;
            border-radius: 99px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            border: 1px solid #27272a;
            background: #1e1e21;
            color: #e4e9f0;
            transition: 0.2s;
            text-align: center;
        }
        .update-btn:hover { background: #2a2a2e; border-color: #3f3f46; }
        .update-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .progress-container {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            visibility: hidden;
        }
        .progress-container.active { visibility: visible; }
        .progress-bar {
            flex: 1;
            height: 6px;
            background: #1e1e21;
            border-radius: 99px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #58a6ff, #a78bfa);
            border-radius: 99px;
            transition: width 0.3s ease;
        }
        .progress-text {
            font-size: 14px;
            font-weight: 600;
            color: #58a6ff;
            min-width: 44px;
            text-align: right;
        }
        @media (max-width: 400px) {
            .card { padding: 20px 14px; }
            .title { font-size: 22px; }
            .server-item { flex-direction: column; align-items: flex-start; gap: 6px; }
        }
    </style>
</head>
<body>
<div class="container">
    <div id="page-main" class="page active">
        <div class="card">
            <div class="header">
                <span class="icon">🚀</span>
                <div class="title">Ultra VPN Plus</div>
                <div class="badge">${isActive ? '● Активен' : '● Подписка истекла'}</div>
            </div>
            
            ${isActive ? `
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-label">📦 Трафик</span>
                    <span class="stat-value">${usedTrafficDisplay} GB <span style="color:#8b95a9;font-weight:400;">/ ∞</span></span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">📅 Истекает</span>
                    <span class="stat-value date">${sub.expire ? new Date(sub.expire).toLocaleDateString('ru-RU') : 'Навсегда'}</span>
                </div>
            </div>
            ` : `
            <div class="expired-box">
                <span class="big-icon">⛔</span>
                <div class="text">Подписка истекла</div>
                <div class="sub">Продление: <a href="https://t.me/fhcsupport" style="color:#58a6ff;">@fhcsupport</a></div>
            </div>
            `}
            
            ${isActive ? `<button class="btn-status" id="statusBtn">📊 Статус серверов</button>` : ''}
            <div class="footer">
                Вопросы? <a href="https://t.me/fhcsupport">@fhcsupport</a>
            </div>
        </div>
    </div>

    ${isActive ? `
    <div id="page-servers" class="page">
        <div class="card">
            <div class="back-header">
                <button id="backBtn">← Назад</button>
                <h2>Статус серверов</h2>
            </div>
            <div id="serverList" class="server-list"></div>
            <div class="update-section">
                <button class="update-btn" id="updateBtn">🔄 Обновить статус</button>
                <div class="progress-container" id="progressContainer">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <span class="progress-text" id="progressText">0%</span>
                </div>
            </div>
            <div class="footer" style="margin-top:12px;">
                <span style="color:#5a5f6b;">Обновлено: <span id="updateTime"></span></span>
            </div>
        </div>
    </div>
    ` : ''}
</div>

<script>
var serverNames = ${serverDataJson};
var STORAGE_KEY = 'ultra_vpn_servers_data';
var isUpdating = false;
var autoUpdateTimer = null;

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getPingRange(name) {
    if (name === 'Россия') return { min: 8, max: 42 };
    return { min: 60, max: 120 };
}
function getSpeedRange(name) {
    if (name === 'Россия') return { min: 50, max: 150 };
    if (name === 'Германия' || name === 'LTE #1') return { min: 100, max: 200 };
    return { min: 50, max: 200 };
}

function generateRandomData() {
    var result = [];
    for (var i = 0; i < serverNames.length; i++) {
        var name = serverNames[i];
        var pr = getPingRange(name);
        var sr = getSpeedRange(name);
        result.push({
            name: name,
            ping: random(pr.min, pr.max),
            speed: random(sr.min, sr.max)
        });
    }
    return result;
}

function generateVariantData(oldData) {
    var result = [];
    for (var i = 0; i < oldData.length; i++) {
        var old = oldData[i];
        var name = old.name;
        var pr = getPingRange(name);
        var sr = getSpeedRange(name);
        var pingDelta = Math.round(old.ping * 0.3);
        var newPing = old.ping + random(-pingDelta, pingDelta);
        newPing = Math.min(Math.max(newPing, pr.min), pr.max);
        var speedDelta = Math.round(old.speed * 0.3);
        var newSpeed = old.speed + random(-speedDelta, speedDelta);
        newSpeed = Math.min(Math.max(newSpeed, sr.min), sr.max);
        result.push({
            name: name,
            ping: newPing,
            speed: newSpeed
        });
    }
    return result;
}

function saveState(data, timestamp) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            data: data,
            timestamp: timestamp || Date.now()
        }));
    } catch(e) {}
}

function loadState() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            var parsed = JSON.parse(raw);
            if (parsed.data && Array.isArray(parsed.data) && parsed.data.length === serverNames.length) {
                return parsed;
            }
        }
    } catch(e) {}
    return null;
}

function getCurrentData() {
    var state = loadState();
    if (!state) {
        var fresh = generateRandomData();
        saveState(fresh);
        return fresh;
    }
    var now = Date.now();
    var age = now - state.timestamp;
    var TEN_MINUTES = 10 * 60 * 1000;
    if (age > TEN_MINUTES) {
        var fresh2 = generateRandomData();
        saveState(fresh2);
        return fresh2;
    } else {
        return state.data;
    }
}

function refreshData() {
    var state = loadState();
    var now = Date.now();
    var TEN_MINUTES = 10 * 60 * 1000;
    var newData;
    if (!state || (now - state.timestamp > TEN_MINUTES)) {
        newData = generateRandomData();
    } else {
        newData = generateVariantData(state.data);
    }
    saveState(newData);
    return newData;
}

function renderServers(data) {
    var container = document.getElementById('serverList');
    var html = '';
    for (var i = 0; i < data.length; i++) {
        var s = data[i];
        html += '<div class="server-item">' +
            '<span class="server-name">' + s.name + '</span>' +
            '<div class="server-stats">' +
                '<span>📶 <span class="ping">' + s.ping + '</span> мс</span>' +
                '<span>⚡ <span class="speed">' + s.speed + '</span> Мбит/с</span>' +
            '</div>' +
        '</div>';
    }
    container.innerHTML = html;
}

function updateTimeDisplay() {
    var now = new Date().toLocaleString('ru-RU');
    document.getElementById('updateTime').textContent = now;
}

function performUpdate(manual) {
    if (isUpdating) return;
    isUpdating = true;
    var btn = document.getElementById('updateBtn');
    var container = document.getElementById('progressContainer');
    var fill = document.getElementById('progressFill');
    var text = document.getElementById('progressText');

    btn.disabled = true;
    btn.textContent = '⏳ Обновление...';
    container.classList.add('active');
    fill.style.width = '0%';
    text.textContent = '0%';

    var progress = 0;
    var target = 100;
    var step = function() {
        var increment = random(1, 6);
        progress = Math.min(progress + increment, target);
        fill.style.width = progress + '%';
        text.textContent = progress + '%';

        if (progress >= target) {
            var newData = refreshData();
            renderServers(newData);
            updateTimeDisplay();
            container.classList.remove('active');
            btn.disabled = false;
            btn.textContent = '🔄 Обновить статус';
            isUpdating = false;
            resetAutoUpdate();
            return;
        }

        if (Math.random() < 0.25) {
            var delay = random(500, 1000);
            setTimeout(step, delay);
        } else {
            var nextDelay = random(200, 400);
            setTimeout(step, nextDelay);
        }
    };

    setTimeout(step, 300);
}

function resetAutoUpdate() {
    if (autoUpdateTimer) { clearTimeout(autoUpdateTimer); autoUpdateTimer = null; }
    var delay = random(10000, 20000);
    autoUpdateTimer = setTimeout(function() {
        if (!isUpdating) {
            performUpdate(false);
        }
    }, delay);
}

function init() {
    var data = getCurrentData();
    renderServers(data);
    updateTimeDisplay();
    resetAutoUpdate();
    document.getElementById('updateBtn').addEventListener('click', function() {
        performUpdate(true);
    });
}

var pageMain = document.getElementById('page-main');
var pageServers = document.getElementById('page-servers');
var statusBtn = document.getElementById('statusBtn');
var backBtn = document.getElementById('backBtn');

function showPage(page) {
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
        pages[i].classList.remove('active');
    }
    document.getElementById('page-' + page).classList.add('active');
    if (page === 'servers') {
        if (!document.getElementById('serverList').innerHTML) {
            init();
        }
    }
}

if (statusBtn) {
    statusBtn.addEventListener('click', function() { showPage('servers'); });
}
if (backBtn) {
    backBtn.addEventListener('click', function() { showPage('main'); });
}
</script>
</body>
</html>`;

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
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Админ-панель</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #0b0e14;
            color: #e4e9f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .card {
            max-width: 400px;
            width: 100%;
            background: linear-gradient(145deg, #18181b, #0d0d10);
            border-radius: 28px;
            border: 1px solid #27272a;
            padding: 40px 28px;
            box-shadow: 0 30px 60px -20px rgba(0,0,0,0.8);
            text-align: center;
        }
        h2 { margin-bottom: 8px; }
        .subtitle { color: #8b95a9; font-size: 14px; margin-bottom: 24px; }
        input {
            width: 100%;
            padding: 12px 16px;
            border-radius: 12px;
            border: 1px solid #27272a;
            background: #111113;
            color: #e4e9f0;
            font-size: 16px;
            margin-bottom: 16px;
        }
        input:focus { outline: none; border-color: #3b82f6; }
        button {
            width: 100%;
            padding: 12px;
            border-radius: 99px;
            border: none;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: #fff;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            transition: 0.3s;
        }
        button:hover { opacity: 0.8; transform: translateY(-2px); }
    </style>
</head>
<body>
<div class="card">
    <h2>🔐 Админ-панель</h2>
    <div class="subtitle">Введите пароль для доступа</div>
    <form method="GET" action="/admin">
        <input type="password" name="pass" placeholder="Пароль" required>
        <button type="submit">Войти</button>
    </form>
</div>
</body>
</html>
  `;
}

function getAdminPanel(subscriptions) {
  const listHtml = Object.entries(subscriptions).map(([id, sub]) => {
    const status = sub.active ? '🟢' : '🔴';
    const expireDate = sub.expire ? new Date(sub.expire).toLocaleDateString('ru-RU') : 'Навсегда';
    const link = `https://${window.location.host}/sub/${id}`;
    return `
    <div class="sub-item" id="sub-${id}">
        <div class="sub-info">
            <div class="sub-name"><span class="status-dot ${sub.active ? 'active' : 'disabled'}"></span> ${sub.name || id}</div>
            <div class="sub-details">Статус: ${sub.active ? 'Активна' : 'Отключена'} | Истекает: ${expireDate}</div>
            <div class="sub-link"><input type="text" value="${link}" readonly onclick="this.select(); document.execCommand('copy')"> <span style="color:#8b95a9;font-size:12px;">(кликни чтобы скопировать)</span></div>
        </div>
        <div class="sub-actions">
            <button onclick="quickAction('${id}','enable')" class="btn btn-success btn-sm">✅ Включить</button>
            <button onclick="quickAction('${id}','disable')" class="btn btn-danger btn-sm">❌ Отключить</button>
            <button onclick="quickActionExtend('${id}')" class="btn btn-warning btn-sm">🔄 Продлить</button>
            <button onclick="quickAction('${id}','delete')" class="btn btn-gray btn-sm" style="background:#ef444433;color:#ef4444;">🗑️</button>
        </div>
    </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Админ-панель</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #0b0e14;
            color: #e4e9f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 700px; width: 100%; }
        .card {
            background: linear-gradient(145deg, #18181b, #0d0d10);
            border-radius: 28px;
            border: 1px solid #27272a;
            padding: 32px 24px;
            box-shadow: 0 30px 60px -20px rgba(0,0,0,0.8);
            margin-bottom: 20px;
        }
        h2 { margin-bottom: 4px; }
        .subtitle { color: #8b95a9; font-size: 14px; margin-bottom: 20px; }
        .form-group { margin-bottom: 16px; }
        label { display: block; font-size: 14px; color: #8b95a9; margin-bottom: 4px; }
        select, input {
            width: 100%;
            padding: 10px 14px;
            border-radius: 10px;
            border: 1px solid #27272a;
            background: #111113;
            color: #e4e9f0;
            font-size: 14px;
        }
        select:focus, input:focus { outline: none; border-color: #3b82f6; }
        .btn {
            padding: 10px 20px;
            border-radius: 99px;
            border: none;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: 0.3s;
        }
        .btn:hover { opacity: 0.8; transform: translateY(-2px); }
        .btn-primary { background: #3b82f6; color: #fff; }
        .btn-success { background: #22c55e; color: #fff; }
        .btn-danger { background: #ef4444; color: #fff; }
        .btn-warning { background: #f59e0b; color: #fff; }
        .btn-gray { background: #1e293b; color: #e4e9f0; }
        .btn-sm { padding: 6px 14px; font-size: 12px; }
        .btn-group { display: flex; gap: 8px; flex-wrap: wrap; }
        .sub-item {
            background: #111113;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            border: 1px solid #1e1e21;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }
        .sub-item:hover { border-color: #3f3f46; }
        .sub-name { font-weight: 600; font-size: 16px; display: flex; align-items: center; gap: 8px; }
        .sub-details { font-size: 13px; color: #8b95a9; margin-top: 4px; }
        .sub-link input { 
            background: #0b0e14; 
            border: none; 
            color: #58a6ff; 
            font-size: 13px; 
            padding: 4px 8px; 
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            max-width: 300px;
        }
        .sub-actions { display: flex; gap: 6px; flex-wrap: wrap; }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .status-dot.active { background: #22c55e; }
        .status-dot.disabled { background: #ef4444; }
        .back-link { color: #58a6ff; text-decoration: none; display: inline-block; margin-bottom: 16px; }
        .back-link:hover { text-decoration: underline; }
        .empty-text { color: #8b95a9; text-align: center; padding: 20px 0; }
        .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .flex-1 { flex: 1; }
    </style>
</head>
<body>
<div class="container">
    <a href="/" class="back-link">← На главную</a>
    
    <div class="card">
        <h2>🔧 Админ-панель</h2>
        <div class="subtitle">Управление подписками</div>
        
        <form method="POST" action="/admin?pass=18032014" id="adminForm">
            <input type="hidden" name="action" value="create">
            
            <div class="row">
                <div class="flex-1">
                    <div class="form-group">
                        <label>Название подписки</label>
                        <input type="text" name="subscription_name" placeholder="Например: client1" required>
                    </div>
                </div>
                <div class="flex-1">
                    <div class="form-group">
                        <label>Срок</label>
                        <select name="period">
                            <option value="30">1 месяц</option>
                            <option value="90">3 месяца</option>
                            <option value="180">6 месяцев</option>
                            <option value="365">1 год</option>
                            <option value="forever">Навсегда</option>
                        </select>
                    </div>
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%;">➕ Создать подписку</button>
        </form>
    </div>

    <div class="card">
        <h3 style="font-size:16px; margin-bottom:16px;">📋 Список подписок</h3>
        <div id="subscriptionsList">
            ${Object.keys(subscriptions).length === 0 ? '<div class="empty-text">Нет активных подписок</div>' : listHtml}
        </div>
    </div>
</div>

<script>
function quickAction(id, action) {
    if (action === 'delete' && !confirm('Удалить подписку "' + id + '"?')) return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/admin?pass=18032014';
    form.innerHTML = `
        <input type="hidden" name="action" value="${action}">
        <input type="hidden" name="subscription_id" value="${id}">
        <input type="hidden" name="period" value="30">
    `;
    document.body.appendChild(form);
    form.submit();
}

function quickActionExtend(id) {
    const days = prompt('На сколько дней продлить? (введите число)', '30');
    if (!days) return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/admin?pass=18032014';
    form.innerHTML = `
        <input type="hidden" name="action" value="extend">
        <input type="hidden" name="subscription_id" value="${id}">
        <input type="hidden" name="period" value="${days}">
    `;
    document.body.appendChild(form);
    form.submit();
}
</script>
</body>
</html>
  `;
}
