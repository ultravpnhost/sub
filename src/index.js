export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const accept = request.headers.get("Accept") || "";
    const userAgent = request.headers.get("user-agent") || "";
    const method = request.method;

    // ---- ФУНКЦИИ ДЛЯ KV ----
    async function getSubscriptions() {
      try {
        const data = await env.KV.get('subscriptions', 'json');
        if (data) return data;
      } catch (e) {}
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

    async function saveSubscriptions(data) {
      await env.KV.put('subscriptions', JSON.stringify(data));
    }

    const subscriptions = await getSubscriptions();

    // ---- КОНСТАНТЫ ДЛЯ ТРАФИКА ----
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

    // ---- ФУНКЦИЯ ДЛЯ ТРАФИКА ПОДПИСКИ (с момента создания) ----
    function getSubscriptionTraffic(createdAt) {
      if (!createdAt) return 0;
      const now = new Date();
      const diffTime = now - createdAt;
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours <= 0) return 0;
      let total = 0;
      for (let h = 1; h <= diffHours; h++) {
        const hourDate = new Date(createdAt.getTime() + h * 60 * 60 * 1000);
        total += getHourlyIncrement(hourDate);
      }
      return total;
    }

    // ---- АДМИН-ПАНЕЛЬ (с формой входа) ----
    if (path === '/admin') {
      // Проверяем, есть ли сессия (cookies)
      const cookies = request.headers.get('Cookie') || '';
      const hasSession = cookies.includes('admin_session=18032014');

      // Если сессия есть — показываем админку
      if (hasSession) {
        if (method === 'POST') {
          const formData = await request.formData();
          const action = formData.get('action');
          const subId = formData.get('subscription_id') || 'default';
          const period = formData.get('period');
          const subName = formData.get('subscription_name') || subId;
          const isForever = formData.get('forever') === 'on';

          if (action === 'create') {
            const newId = 'sub_' + Date.now().toString(36);
            const days = parseInt(period);
            subscriptions[newId] = {
              name: subName,
              active: true,
              expire: isForever ? null : Date.now() + days * 24 * 60 * 60 * 1000,
              createdAt: Date.now()
            };
            await saveSubscriptions(subscriptions);
            return new Response(getAdminPanel(subscriptions), {
              headers: { "Content-Type": "text/html; charset=utf-8" }
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
              sub.active = true;
              if (isForever) {
                sub.expire = null;
              } else {
                const days = parseInt(period);
                if (isNaN(days) || days <= 0) {
                  return new Response('Ошибка: укажите корректное количество дней', { status: 400 });
                }
                sub.expire = Date.now() + days * 24 * 60 * 60 * 1000;
              }
              break;
            case 'delete': delete subscriptions[subId]; break;
          }

          await saveSubscriptions(subscriptions);
          return new Response(getAdminPanel(subscriptions), {
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        }

        return new Response(getAdminPanel(subscriptions), {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }

      // Если нет сессии — проверяем пароль из формы
      if (method === 'POST') {
        const formData = await request.formData();
        const password = formData.get('password');

        if (password === '18032014') {
          // Устанавливаем сессию (cookie на 24 часа)
          return new Response(getAdminPanel(subscriptions), {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Set-Cookie": "admin_session=18032014; Max-Age=86400; Path=/; Secure; HttpOnly; SameSite=Strict"
            }
          });
        } else {
          return new Response(getLoginPage(true), {
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        }
      }

      // Показываем страницу входа
      return new Response(getLoginPage(false), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // ---- ПОДПИСКИ /sub/ID ----
    if (path.startsWith('/sub/')) {
      const subId = path.replace('/sub/', '');
      const sub = subscriptions[subId];

      if (!sub) {
        return new Response('Подписка не найдена', { status: 404 });
      }

      const isActive = sub.active && (sub.expire === null || Date.now() < sub.expire);
      const isManuallyDisabled = !sub.active;
      const isExpired = !isActive && !isManuallyDisabled;

      const isClient = accept.includes('application/json') || 
                       userAgent.includes('V2Ray') || 
                       userAgent.includes('Happ') || 
                       userAgent.includes('sing-box') || 
                       userAgent.includes('INCY');

      if (isClient) {
        const nodes = isActive ? getRealNodes() : getEmptyNodes();
        const configs = nodes.map(makeFullConfig);
        
        const expireTimestamp = sub.expire ? Math.floor(sub.expire / 1000) : 0;
        const title = 'Ultra VPN';
        const usedTraffic = isActive ? getSubscriptionTraffic(new Date(sub.createdAt)) : 0;
        const traffic = isActive ? usedTraffic + ' GB / ∞' : '0 GB / 0 GB';
        const trafficBytes = isActive ? usedTraffic * 1024 * 1024 * 1024 : 0;

        const headers = {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Profile-Title': title,
          'Subscription-Status': isActive ? 'active' : 'expired',
          'Subscription-Traffic': traffic,
          'Subscription-Expire': String(expireTimestamp),
          'subscription-userinfo': 'upload=0; download=' + trafficBytes + '; total=0; expire=' + expireTimestamp
        };

        return new Response(JSON.stringify(configs, null, 2), { headers });
      }

      const usedTraffic = isActive ? getSubscriptionTraffic(new Date(sub.createdAt)) : 0;
      return new Response(getSubPage(subId, sub, isActive, isManuallyDisabled, isExpired, usedTraffic), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    return new Response(getLandingPage(), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};

// ---- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ----
function getRealNodes() {
  return [
    { tag: "de-1", address: "de-new.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇩🇪 Германия", network: "tcp", flow: "xtls-rprx-vision" },
    { tag: "se-1", address: "se-new.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇸🇪 Швеция", network: "tcp", flow: "xtls-rprx-vision" },
    { tag: "pl-1", address: "pl.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "sun9-35.userapi.com", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇵🇱 Польша", network: "tcp", flow: "xtls-rprx-vision" },
    { tag: "ru-1", address: "ru.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "sun9-38.userapi.com", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇷🇺 Россия", network: "tcp", flow: "xtls-rprx-vision" },
    { tag: "lte-1", address: "hole-nn.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", fingerprint: "qq", remarks: "🇩🇪 LTE #1", network: "grpc", flow: "", grpcServiceName: "ads.x5.ru" }
  ];
}

function getEmptyNodes() {
  return [{
    tag: "disabled",
    address: "0.0.0.0",
    port: 0,
    id: "00000000-0000-0000-0000-000000000000",
    serverName: "disabled",
    publicKey: "disabled",
    shortId: "00000000",
    fingerprint: "none",
    remarks: "🔴 Подписка отключена",
    network: "tcp",
    flow: "",
    grpcServiceName: ""
  }];
}

function makeOutbound(n) {
  const outbound = {
    tag: n.tag,
    protocol: "vless",
    settings: {
      vnext: [{
        address: n.address,
        port: n.port,
        users: [{ id: n.id, encryption: "none" }]
      }]
    },
    streamSettings: {
      network: n.network,
      security: "reality",
      realitySettings: {
        serverName: n.serverName,
        show: false,
        publicKey: n.publicKey,
        shortId: n.shortId,
        fingerprint: n.fingerprint
      }
    }
  };
  if (n.flow) outbound.settings.vnext[0].users[0].flow = n.flow;
  if (n.network === "grpc") {
    outbound.streamSettings.grpcSettings = { serviceName: n.grpcServiceName || "" };
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

// ---- СТРАНИЦЫ ----
function getLoginPage(error) {
  const errorHtml = error ? '<div style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:12px;margin-bottom:20px;color:#ef4444;font-size:14px;">❌ Неверный пароль. Попробуйте снова.</div>' : '';
  
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Админ-панель</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Segoe UI",system-ui,sans-serif;background:#0b0e14;color:#e4e9f0;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}.card{background:linear-gradient(145deg,#18181b,#0d0d10);padding:48px 40px;border-radius:32px;border:1px solid #27272a;max-width:400px;width:100%;text-align:center;box-shadow:0 30px 60px -20px rgba(0,0,0,0.8)}.icon{font-size:56px;display:block;margin-bottom:12px}.title{font-size:28px;font-weight:700;background:linear-gradient(135deg,#58a6ff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}.sub{color:#8b95a9;font-size:15px;margin-bottom:28px}.input-group{position:relative;margin-bottom:16px}.input-group input{width:100%;padding:14px 18px;border-radius:14px;border:1px solid #27272a;background:#111113;color:#e4e9f0;font-size:16px;transition:0.3s}.input-group input:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.15)}.btn{width:100%;padding:14px;border-radius:99px;border:none;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-weight:700;font-size:16px;cursor:pointer;transition:0.3s}.btn:hover{opacity:0.85;transform:translateY(-2px);box-shadow:0 8px 30px rgba(59,130,246,0.3)}.btn:active{transform:scale(0.98)}.footer{color:#4b5563;font-size:13px;margin-top:20px}.footer a{color:#58a6ff;text-decoration:none}</style></head><body><div class="card"><span class="icon">🔐</span><div class="title">Админ-панель</div><div class="sub">Введите пароль для доступа</div>' + errorHtml + '<form method="POST" action="/admin"><div class="input-group"><input type="password" name="password" placeholder="Пароль" required></div><button type="submit" class="btn">Войти</button></form><div class="footer">Ошибка? <a href="https://t.me/fhcsupport">@fhcsupport</a></div></div></body></html>';
}

function getAdminPanel(subscriptions) {
  let list = '';
  for (const [id, sub] of Object.entries(subscriptions)) {
    const status = sub.active ? '🟢 Активна' : '🔴 Отключена';
    const expire = sub.expire ? new Date(sub.expire).toLocaleDateString('ru-RU') : 'Навсегда';
    const link = 'https://sub.ultravpnhosting.workers.dev/sub/' + id;
    list += '<div class="sub-item">' +
      '<div class="sub-info"><div class="sub-name"><span class="status-dot ' + (sub.active ? 'active' : 'disabled') + '"></span> ' + (sub.name || id) + '</div><div class="sub-details">' + status + ' · Истекает: ' + expire + '</div><div class="sub-link">' + link + '</div></div>' +
      '<div class="sub-actions"><button onclick="action(\'' + id + '\',\'enable\')" class="btn btn-sm btn-success" title="Включить">✅</button><button onclick="action(\'' + id + '\',\'disable\')" class="btn btn-sm btn-danger" title="Отключить">❌</button><button onclick="showExtend(\'' + id + '\')" class="btn btn-sm btn-warning" title="Продлить">🔄</button><button onclick="action(\'' + id + '\',\'delete\')" class="btn btn-sm btn-delete" title="Удалить">🗑️</button></div></div>';
  }

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Админ-панель</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Segoe UI",system-ui,sans-serif;background:#0b0e14;color:#e4e9f0;padding:24px;min-height:100vh}.container{max-width:800px;margin:0 auto}.header{display:flex;justify-content:space-between;align-items:center;padding:16px 0 24px;border-bottom:1px solid #1e293b;margin-bottom:24px;flex-wrap:wrap;gap:12px}.header .logo{font-size:24px;font-weight:700;background:linear-gradient(135deg,#58a6ff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.header .logo span{color:#e4e9f0;-webkit-text-fill-color:#e4e9f0}.header .back{color:#8b95a9;text-decoration:none;font-size:14px;transition:0.3s}.header .back:hover{color:#e4e9f0}.card{background:linear-gradient(145deg,#18181b,#0d0d10);border-radius:24px;border:1px solid #27272a;padding:28px 32px;margin-bottom:20px;transition:0.3s}.card:hover{border-color:#3f3f46}.card-title{font-size:20px;font-weight:600;margin-bottom:4px}.card-sub{color:#8b95a9;font-size:14px;margin-bottom:20px}.row{display:flex;gap:16px;flex-wrap:wrap}.row .field{flex:1;min-width:180px}.field label{display:block;font-size:13px;color:#8b95a9;margin-bottom:6px;font-weight:500}.field input,.field select{width:100%;padding:12px 16px;border-radius:12px;border:1px solid #27272a;background:#111113;color:#e4e9f0;font-size:14px;transition:0.3s}.field input:focus,.field select:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.12)}.checkbox-group{display:flex;align-items:center;gap:10px;padding:8px 0}.checkbox-group input[type="checkbox"]{width:18px;height:18px;accent-color:#3b82f6;cursor:pointer}.checkbox-group label{color:#8b95a9;font-size:14px;cursor:pointer}.btn{padding:12px 28px;border-radius:99px;border:none;font-weight:600;font-size:14px;cursor:pointer;transition:0.3s;display:inline-flex;align-items:center;gap:8px}.btn:hover{transform:translateY(-2px)}.btn:active{transform:scale(0.97)}.btn-primary{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff}.btn-primary:hover{box-shadow:0 8px 30px rgba(59,130,246,0.3)}.btn-success{background:#22c55e22;color:#22c55e;border:1px solid #22c55e33}.btn-success:hover{background:#22c55e33}.btn-danger{background:#ef444422;color:#ef4444;border:1px solid #ef444433}.btn-danger:hover{background:#ef444433}.btn-warning{background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b33}.btn-warning:hover{background:#f59e0b33}.btn-delete{background:#1e293b;color:#8b95a9;border:1px solid #27272a}.btn-delete:hover{background:#2d3b52;color:#e4e9f0}.btn-sm{padding:6px 12px;font-size:13px;border-radius:99px}.sub-item{background:#111113;border-radius:16px;padding:16px 20px;border:1px solid #1e1e21;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;transition:0.3s}.sub-item:hover{border-color:#3f3f46}.sub-info{display:flex;flex-direction:column;gap:4px}.sub-name{font-weight:600;font-size:16px;display:flex;align-items:center;gap:8px}.status-dot{width:10px;height:10px;border-radius:50%;display:inline-block;flex-shrink:0}.status-dot.active{background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,0.3)}.status-dot.disabled{background:#ef4444;box-shadow:0 0 8px rgba(239,68,68,0.3)}.sub-details{color:#8b95a9;font-size:13px}.sub-link{color:#58a6ff;font-size:12px;word-break:break-all;background:#0b0e14;padding:4px 10px;border-radius:6px;display:inline-block;margin-top:2px}.sub-actions{display:flex;gap:6px;flex-wrap:wrap}.empty{color:#8b95a9;text-align:center;padding:32px 0;font-size:15px}.footer{text-align:center;color:#4b5563;font-size:13px;margin-top:20px}.footer a{color:#58a6ff;text-decoration:none}.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:none;justify-content:center;align-items:center;z-index:1000;backdrop-filter:blur(4px)}.modal-overlay.show{display:flex}.modal{background:#18181b;border-radius:24px;border:1px solid #27272a;padding:32px;max-width:400px;width:90%;box-shadow:0 30px 60px -20px rgba(0,0,0,0.8)}.modal h3{font-size:20px;margin-bottom:4px}.modal .sub{color:#8b95a9;font-size:14px;margin-bottom:20px}.modal .field{margin-bottom:12px}.modal .field label{display:block;font-size:13px;color:#8b95a9;margin-bottom:4px}.modal .field input{width:100%;padding:10px 14px;border-radius:10px;border:1px solid #27272a;background:#111113;color:#e4e9f0;font-size:14px}.modal .field input:focus{outline:none;border-color:#3b82f6}.modal .btn-group{display:flex;gap:10px;margin-top:16px}.modal .btn-group .btn{flex:1;justify-content:center}.btn-secondary{background:#1e293b;color:#e4e9f0;border:1px solid #27272a}.btn-secondary:hover{background:#2d3b52}@media(max-width:600px){.card{padding:20px 16px}.row{flex-direction:column}.row .field{min-width:auto}.sub-item{flex-direction:column;align-items:stretch}.sub-actions{justify-content:center}.header .logo{font-size:20px}}</style></head><body><div class="container"><div class="header"><div class="logo">Ultra <span>VPN</span> <span style="font-size:14px;color:#8b95a9;-webkit-text-fill-color:#8b95a9;font-weight:400;">· Админ</span></div><a href="/" class="back">← На главную</a></div><div class="card"><div class="card-title">➕ Создать подписку</div><div class="card-sub">Новая подписка будет доступна по уникальной ссылке</div><form method="POST" action="/admin"><input type="hidden" name="action" value="create"><div class="row"><div class="field"><label>Название</label><input type="text" name="subscription_name" placeholder="client1" required></div><div class="field"><label>Количество дней</label><input type="number" name="period" placeholder="30" min="1" required></div></div><div class="checkbox-group"><input type="checkbox" name="forever" id="createForever"><label for="createForever">♾️ Навсегда (без ограничений)</label></div><button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px">➕ Создать подписку</button></form></div><div class="card"><div class="card-title">📋 Список подписок</div><div class="card-sub">Управление активными подписками</div>' + (Object.keys(subscriptions).length === 0 ? '<div class="empty">Нет активных подписок</div>' : list) + '</div><div class="footer">Вопросы? <a href="https://t.me/fhcsupport">@fhcsupport</a></div></div><div class="modal-overlay" id="extendModal"><div class="modal"><h3>🔄 Продлить подписку</h3><div class="sub" id="extendSubName">Подписка</div><input type="hidden" id="extendSubId"><div class="field"><label>Количество дней</label><input type="number" id="extendDays" placeholder="30" min="1"></div><div class="checkbox-group"><input type="checkbox" id="extendForever"><label for="extendForever">♾️ Навсегда (без ограничений)</label></div><div class="btn-group"><button onclick="closeExtend()" class="btn btn-secondary">Отмена</button><button onclick="confirmExtend()" class="btn btn-primary">Продлить</button></div></div></div><script>function action(id,a){if(a==="delete"&&!confirm("Удалить подписку «"+id+"»?"))return;var f=document.createElement("form");f.method="POST";f.action="/admin";f.innerHTML=\'<input type="hidden" name="action" value="\'+a+\'"><input type="hidden" name="subscription_id" value="\'+id+\'">\';document.body.appendChild(f);f.submit()}function showExtend(id){document.getElementById("extendSubId").value=id;document.getElementById("extendSubName").textContent="Подписка: " + id;document.getElementById("extendDays").value="30";document.getElementById("extendForever").checked=false;document.getElementById("extendModal").classList.add("show")}function closeExtend(){document.getElementById("extendModal").classList.remove("show")}function confirmExtend(){var id=document.getElementById("extendSubId").value;var days=document.getElementById("extendDays").value;var forever=document.getElementById("extendForever").checked;if(!forever&&(!days||parseInt(days)<=0)){alert("Укажите количество дней или выберите Навсегда");return}var f=document.createElement("form");f.method="POST";f.action="/admin";f.innerHTML=\'<input type="hidden" name="action" value="extend"><input type="hidden" name="subscription_id" value="\'+id+\'"><input type="hidden" name="period" value="\'+days+\'"><input type="hidden" name="forever" value="\'+(forever?"on":"")+\'">\';document.body.appendChild(f);f.submit()}</script></body></html>';
}

function getSubPage(subId, sub, isActive, isManuallyDisabled, isExpired, usedTraffic) {
  const expireDate = sub.expire ? new Date(sub.expire).toLocaleDateString('ru-RU') : 'Навсегда';
  const subName = sub.name || subId;
  const link = 'https://sub.ultravpnhosting.workers.dev/sub/' + subId;
  
  if (!isActive) {
    let statusText = '';
    let statusIcon = '🔴';
    let helpText = '';
    
    if (isManuallyDisabled) {
      statusText = 'Подписка отключена';
      helpText = 'Свяжитесь с поддержкой: <a href="https://t.me/fhcsupport" class="support-link" target="_blank">@fhcsupport</a>';
    } else {
      statusText = 'Подписка истекла';
      helpText = 'Продлите доступ, чтобы продолжить пользоваться сервисом';
    }
    
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ultra VPN — ' + subName + '</title><style>body{background:#0b0e14;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;padding:20px}.card{background:linear-gradient(145deg,#18181b,#0d0d10);padding:40px;border-radius:28px;border:1px solid #27272a;max-width:400px;width:100%;text-align:center;box-shadow:0 30px 60px -20px rgba(0,0,0,0.8)}.icon{font-size:60px}.title{font-size:26px;font-weight:700;background:linear-gradient(135deg,#58a6ff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.subtitle{color:#8b95a9;font-size:14px;margin-top:4px}.badge{display:inline-block;background:rgba(239,68,68,0.15);color:#ef4444;padding:4px 18px;border-radius:99px;font-size:13px;margin-top:8px;border:1px solid rgba(239,68,68,0.2)}.expired-box{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:20px;margin-bottom:20px}.expired-box .big-icon{font-size:48px;display:block;margin-bottom:6px}.expired-box .text{font-size:18px;font-weight:600;color:#ef4444}.expired-box .sub{font-size:14px;color:#8b95a9;margin-top:6px}.copy-btn{display:inline-block;background:#18181b;border:1px solid #27272a;border-radius:99px;padding:10px 24px;color:#e4e9f0;font-size:14px;font-weight:500;cursor:pointer;transition:0.3s;margin:8px 0}.copy-btn:hover{background:#1e293b;border-color:#3f3f46;transform:translateY(-2px)}.toast{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1e293b;color:#e4e9f0;padding:12px 28px;border-radius:40px;box-shadow:0 8px 24px rgba(0,0,0,0.6);font-size:14px;opacity:0;transition:opacity 0.3s ease;pointer-events:none;border:1px solid #334155;z-index:999}.toast.show{opacity:1}.footer{color:#5a5f6b;font-size:14px;margin-top:16px}.back-link{color:#58a6ff;text-decoration:none;display:inline-block;margin-top:8px}.back-link:hover{text-decoration:underline}.support-link{color:#58a6ff;text-decoration:none;font-weight:500}.support-link:hover{text-decoration:underline}.id-label{font-size:12px;color:#4b5563;margin-top:12px;word-break:break-all}</style></head><body><div class="card"><div class="icon">⛔</div><div class="title">Ultra VPN</div><div class="subtitle">' + subName + '</div><div class="badge">● Неактивна</div><div class="expired-box"><div class="big-icon">' + statusIcon + '</div><div class="text">' + statusText + '</div><div class="sub">' + helpText + '</div></div><button class="copy-btn" onclick="copyLink()">📋 Копировать ссылку</button><div class="footer">Вопросы? <a href="https://t.me/fhcsupport" class="support-link" target="_blank">@fhcsupport</a></div><a href="/" class="back-link">← На главную</a><div class="id-label">ID: ' + subId + '</div></div><div id="toast" class="toast">✅ Ссылка скопирована!</div><script>function copyLink(){var link="' + link + '";if(navigator.clipboard){navigator.clipboard.writeText(link).then(function(){showToast()}).catch(function(){fallbackCopy(link)})}else{fallbackCopy(link)}}function fallbackCopy(text){var ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");showToast()}catch(e){}document.body.removeChild(ta)}function showToast(){var t=document.getElementById("toast");t.classList.add("show");clearTimeout(t._timer);t._timer=setTimeout(function(){t.classList.remove("show")},2000)}</script></body></html>';
  }
  
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ultra VPN — ' + subName + '</title><style>body{background:#0b0e14;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;padding:20px}.card{background:linear-gradient(145deg,#18181b,#0d0d10);padding:40px;border-radius:28px;border:1px solid #27272a;max-width:400px;width:100%;text-align:center;box-shadow:0 30px 60px -20px rgba(0,0,0,0.8)}.icon{font-size:60px}.title{font-size:26px;font-weight:700;background:linear-gradient(135deg,#58a6ff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.subtitle{color:#8b95a9;font-size:14px;margin-top:4px}.badge{display:inline-block;background:rgba(34,197,94,0.15);color:#22c55e;padding:4px 18px;border-radius:99px;font-size:13px;margin-top:8px;border:1px solid rgba(34,197,94,0.2)}.stats{background:#111;padding:18px;border-radius:18px;border:1px solid #1e1e21;margin:20px 0}.stat-item{display:flex;justify-content:space-between;padding:8px 0}.stat-item+.stat-item{border-top:1px solid #1e1e21}.stat-label{color:#8b95a9}.stat-value{font-weight:600}.stat-value .date{color:#fca5a5}.copy-btn{display:inline-block;background:#18181b;border:1px solid #27272a;border-radius:99px;padding:10px 24px;color:#e4e9f0;font-size:14px;font-weight:500;cursor:pointer;transition:0.3s;margin:8px 0}.copy-btn:hover{background:#1e293b;border-color:#3f3f46;transform:translateY(-2px)}.copy-btn:active{transform:scale(0.97)}.toast{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1e293b;color:#e4e9f0;padding:12px 28px;border-radius:40px;box-shadow:0 8px 24px rgba(0,0,0,0.6);font-size:14px;opacity:0;transition:opacity 0.3s ease;pointer-events:none;border:1px solid #334155;z-index:999}.toast.show{opacity:1}.footer{color:#5a5f6b;font-size:14px;margin-top:16px}.back-link{color:#58a6ff;text-decoration:none;display:inline-block;margin-top:8px}.back-link:hover{text-decoration:underline}.support-link{color:#58a6ff;text-decoration:none}.support-link:hover{text-decoration:underline}.id-label{font-size:12px;color:#4b5563;margin-top:12px;word-break:break-all}</style></head><body><div class="card"><div class="icon">🚀</div><div class="title">Ultra VPN</div><div class="subtitle">' + subName + '</div><div class="badge">● Активен</div><div class="stats"><div class="stat-item"><span class="stat-label">📦 Трафик</span><span class="stat-value">' + usedTraffic + ' GB <span style="color:#8b95a9;font-weight:400;">/ ∞</span></span></div><div class="stat-item"><span class="stat-label">📅 Истекает</span><span class="stat-value"><span class="date">' + expireDate + '</span></span></div></div><button class="copy-btn" onclick="copyLink()">📋 Копировать ссылку</button><div class="footer">Вопросы? <a href="https://t.me/fhcsupport" class="support-link" target="_blank">@fhcsupport</a></div><a href="/" class="back-link">← На главную</a><div class="id-label">ID: ' + subId + '</div></div><div id="toast" class="toast">✅ Ссылка скопирована!</div><script>function copyLink(){var link="' + link + '";if(navigator.clipboard){navigator.clipboard.writeText(link).then(function(){showToast()}).catch(function(){fallbackCopy(link)})}else{fallbackCopy(link)}}function fallbackCopy(text){var ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");showToast()}catch(e){}document.body.removeChild(ta)}function showToast(){var t=document.getElementById("toast");t.classList.add("show");clearTimeout(t._timer);t._timer=setTimeout(function(){t.classList.remove("show")},2000)}</script></body></html>';
}

function getLandingPage() {
  return '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Ultra VPN — Надёжный VPN сервис</title><style>*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}body{font-family:"Segoe UI",system-ui,sans-serif;background:#0b0e14;color:#e4e9f0;min-height:100vh;display:flex;flex-direction:column}.container{max-width:1100px;margin:0 auto;padding:0 20px;width:100%}header{padding:24px 0;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;position:sticky;top:0;background:#0b0e14cc;backdrop-filter:blur(12px);z-index:100}.logo{font-size:24px;font-weight:700;background:linear-gradient(135deg,#58a6ff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.logo span{color:#e4e9f0;-webkit-text-fill-color:#e4e9f0}.nav{display:flex;gap:24px;align-items:center;flex-wrap:wrap}.nav a{color:#8b95a9;text-decoration:none;font-size:14px;transition:0.3s;position:relative}.nav a::after{content:"";position:absolute;bottom:-4px;left:0;width:0;height:2px;background:linear-gradient(135deg,#58a6ff,#a78bfa);transition:width 0.3s ease}.nav a:hover{color:#e4e9f0}.nav a:hover::after{width:100%}section{opacity:0;transform:translateY(40px);animation:fadeUp 0.8s ease forwards}section:nth-child(1){animation-delay:0.1s}section:nth-child(2){animation-delay:0.2s}section:nth-child(3){animation-delay:0.3s}section:nth-child(4){animation-delay:0.4s}@keyframes fadeUp{to{opacity:1;transform:translateY(0)}}.hero{padding:80px 0 60px;text-align:center}.hero h1{font-size:48px;font-weight:700;margin-bottom:16px;background:linear-gradient(135deg,#fff,#8b95a9);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.hero p{font-size:18px;color:#8b95a9;max-width:600px;margin:0 auto 32px;line-height:1.6}.hero .btn{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:14px 48px;border-radius:99px;font-weight:600;font-size:16px;border:none;cursor:pointer;transition:0.3s;display:inline-block;text-decoration:none}.hero .btn:hover{opacity:0.8;transform:translateY(-3px);box-shadow:0 8px 30px rgba(59,130,246,0.3)}section{padding:60px 0}.section-title{font-size:28px;text-align:center;margin-bottom:8px}.section-sub{color:#8b95a9;text-align:center;font-size:16px;margin-bottom:8px}.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:40px}.feature{background:#141a24;padding:32px 24px;border-radius:16px;border:1px solid #1e293b;text-align:center;transition:0.3s;cursor:default}.feature:hover{border-color:#3f3f46;transform:translateY(-4px);box-shadow:0 8px 30px rgba(0,0,0,0.3)}.feature .icon{font-size:40px;margin-bottom:12px}.feature h3{font-size:18px;margin-bottom:8px}.feature p{color:#8b95a9;font-size:14px;line-height:1.6}.servers-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-top:24px}.server-card{background:#111113;padding:16px;border-radius:12px;border:1px solid #1e1e21;text-align:center;transition:0.3s}.server-card:hover{border-color:#3f3f46;transform:translateY(-4px)}.server-card .flag{font-size:28px}.server-card .name{font-weight:500;margin-top:4px}.server-card .ping{color:#58a6ff;font-size:13px;margin-top:2px}.server-card .speed{color:#22c55e;font-size:13px}.cta{text-align:center;background:linear-gradient(145deg,#18181b,#0d0d10);padding:48px;border-radius:28px;border:1px solid #27272a;transition:0.3s}.cta:hover{border-color:#3f3f46}.cta h2{font-size:28px;margin-bottom:12px}.cta p{color:#8b95a9;font-size:16px;margin-bottom:24px}.cta .btn{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:14px 48px;border-radius:99px;font-weight:600;font-size:16px;border:none;cursor:pointer;transition:0.3s;display:inline-block;text-decoration:none}.cta .btn:hover{opacity:0.8;transform:translateY(-3px);box-shadow:0 8px 30px rgba(59,130,246,0.3)}footer{padding:24px 0;border-top:1px solid #1e293b;text-align:center;color:#4b5563;font-size:14px;margin-top:auto}footer a{color:#58a6ff;text-decoration:none}footer a:hover{text-decoration:underline}@media(max-width:600px){.hero h1{font-size:32px}.features{grid-template-columns:1fr}.servers-grid{grid-template-columns:1fr 1fr}.cta{padding:32px 20px}}</style></head><body><header><div class="container"><div class="logo">Ultra <span>VPN</span></div><div class="nav"><a href="#features">Возможности</a><a href="#servers">Серверы</a><a href="#contact">Контакты</a></div></div></header><main><section class="hero"><div class="container"><h1>Безлимитный VPN <br>для свободного интернета</h1><p>Надёжные серверы в Европе и России. Безлимитный трафик, высокая скорость и полная анонимность.</p><a href="#contact" class="btn">Начать использовать</a></div></section><section id="features"><div class="container"><h2 class="section-title">🔥 Почему мы?</h2><p class="section-sub">Всё, что нужно для комфортного серфинга</p><div class="features"><div class="feature"><div class="icon">🌍</div><h3>5 серверов</h3><p>Германия, Швеция, Польша, Россия, LTE — выбирай любой</p></div><div class="feature"><div class="icon">📦</div><h3>Безлимитный трафик</h3><p>Никаких ограничений по объёму — качай и смотри сколько хочешь</p></div><div class="feature"><div class="icon">⚡</div><h3>Высокая скорость</h3><p>Скорость от 70 до 500 Мбит/с — идеально для стримов и игр</p></div><div class="feature"><div class="icon">🔒</div><h3>Reality протокол</h3><p>Современная защита, которая не оставляет следов</p></div><div class="feature"><div class="icon">📱</div><h3>Все устройства</h3><p>Windows, macOS, Android, iOS — подключай что угодно</p></div><div class="feature"><div class="icon">💬</div><h3>Поддержка 24/7</h3><p>Всегда на связи в Telegram — поможем с настройкой</p></div></div></div></section><section id="servers"><div class="container"><h2 class="section-title">🖥️ Наши серверы</h2><p class="section-sub">Реальные пинг и скорость (обновляются автоматически)</p><div class="servers-grid"><div class="server-card"><div class="flag">🇩🇪</div><div class="name">Германия</div><div class="ping">📶 80 мс</div><div class="speed">⚡ 210 Мбит/с</div></div><div class="server-card"><div class="flag">🇸🇪</div><div class="name">Швеция</div><div class="ping">📶 94 мс</div><div class="speed">⚡ 158 Мбит/с</div></div><div class="server-card"><div class="flag">🇵🇱</div><div class="name">Польша</div><div class="ping">📶 87 мс</div><div class="speed">⚡ 122 Мбит/с</div></div><div class="server-card"><div class="flag">🇷🇺</div><div class="name">Россия</div><div class="ping">📶 14 мс</div><div class="speed">⚡ 98 Мбит/с</div></div><div class="server-card"><div class="flag">🇩🇪</div><div class="name">LTE #1</div><div class="ping">📶 24 мс</div><div class="speed">⚡ 154 Мбит/с</div></div></div></div></section><section id="contact"><div class="container"><div class="cta"><h2>🚀 Готов начать?</h2><p>Получи доступ к Ultra VPN прямо сейчас. Безлимитный трафик, высокая скорость и полная анонимность.</p><a href="https://t.me/fhcsupport" class="btn" target="_blank">💬 Связаться с нами</a><p style="margin-top:16px;font-size:14px;color:#4b5563">Вопросы? Пиши в Telegram — <a href="https://t.me/fhcsupport" style="color:#58a6ff;">@fhcsupport</a></p></div></div></section></main><footer><div class="container"><p>© 2026 Ultra VPN. Все права защищены. Работает на <a href="https://cloudflare.com" target="_blank">Cloudflare Workers</a></p></div></footer></body></html>';
}
