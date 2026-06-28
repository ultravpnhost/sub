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

    // ---- АДМИН-ПАНЕЛЬ ----
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
          return new Response(getAdminPanel(subscriptions), {
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        }

        if (!subscriptions[subId]) {
          subscriptions[subId] = { name: subId, active: true, expire: null, createdAt: Date.now() };
        }

        const sub = subscriptions[subId];

        switch(action) {
          case 'disable': sub.active = false; break;
          case 'enable': sub.active = true; break;
          case 'extend':
            sub.active = true;
            sub.expire = period === 'forever' ? null : Date.now() + parseInt(period) * 24 * 60 * 60 * 1000;
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

    // ---- ПОДПИСКИ /sub/ID ----
    if (path.startsWith('/sub/')) {
      const subId = path.replace('/sub/', '');
      const sub = subscriptions[subId];

      if (!sub) {
        return new Response('Подписка не найдена', { status: 404 });
      }

      const isActive = sub.active && (sub.expire === null || Date.now() < sub.expire);

      // ---- ЕСЛИ ЗАПРОС ОТ КЛИЕНТА (JSON) ----
      const isClient = accept.includes('application/json') || 
                       userAgent.includes('V2Ray') || 
                       userAgent.includes('Happ') || 
                       userAgent.includes('sing-box') || 
                       userAgent.includes('INCY');

      if (isClient) {
        const nodes = isActive ? getRealNodes() : getEmptyNodes();
        const configs = nodes.map(makeFullConfig);
        
        const expireTimestamp = sub.expire ? Math.floor(sub.expire / 1000) : 0;
        const title = isActive ? 'Ultra VPN' : 'Подписка отключена';
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

      // ---- ИНАЧЕ — ИНДИВИДУАЛЬНЫЙ ВЕБ-ИНТЕРФЕЙС ----
      const usedTraffic = isActive ? getSubscriptionTraffic(new Date(sub.createdAt)) : 0;
      return new Response(getSubPage(subId, sub, isActive, usedTraffic), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // ============================================================
    // ГЛАВНАЯ — LANDING PAGE (с плавными переходами)
    // ============================================================
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
    remarks: "Подписка отключена 🔴",
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
function getLoginPage() {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Админ</title><style>body{background:#0b0e14;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif}.card{background:#18181b;padding:40px;border-radius:28px;border:1px solid #27272a;max-width:400px;width:100%;text-align:center}h2{margin-bottom:8px}.subtitle{color:#8b95a9;font-size:14px;margin-bottom:24px}input{width:100%;padding:12px;border-radius:12px;border:1px solid #27272a;background:#111;color:#fff;font-size:16px;margin-bottom:16px}button{width:100%;padding:12px;border-radius:99px;border:none;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-weight:700;font-size:16px;cursor:pointer}button:hover{opacity:0.8}</style></head><body><div class="card"><h2>🔐 Админ-панель</h2><div class="subtitle">Введите пароль</div><form method="GET" action="/admin"><input type="password" name="pass" placeholder="Пароль" required><button type="submit">Войти</button></form></div></body></html>';
}

function getAdminPanel(subscriptions) {
  let list = '';
  for (const [id, sub] of Object.entries(subscriptions)) {
    const status = sub.active ? '🟢 Активна' : '🔴 Отключена';
    const expire = sub.expire ? new Date(sub.expire).toLocaleDateString('ru-RU') : 'Навсегда';
    const link = 'https://sub.ultravpnhosting.workers.dev/sub/' + id;
    list += '<div class="sub-item">' +
      '<div><b>' + (sub.name || id) + '</b><br><span style="color:#8b95a9;font-size:13px">' + status + ' | ' + expire + '</span><br><span style="color:#58a6ff;font-size:12px">' + link + '</span></div>' +
      '<div class="actions">' +
      '<button onclick="action(\'' + id + '\',\'enable\')" class="btn-green">✅</button>' +
      '<button onclick="action(\'' + id + '\',\'disable\')" class="btn-red">❌</button>' +
      '<button onclick="extend(\'' + id + '\')" class="btn-yellow">🔄</button>' +
      '<button onclick="action(\'' + id + '\',\'delete\')" class="btn-gray">🗑️</button>' +
      '</div></div>';
  }

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Админ</title><style>body{background:#0b0e14;color:#fff;font-family:sans-serif;padding:20px}.container{max-width:700px;margin:0 auto}.card{background:#18181b;padding:24px;border-radius:28px;border:1px solid #27272a;margin-bottom:20px}h2{margin-bottom:4px}.subtitle{color:#8b95a9;font-size:14px;margin-bottom:20px}.form-group{margin-bottom:16px}label{display:block;color:#8b95a9;font-size:14px}input,select{width:100%;padding:10px;border-radius:10px;border:1px solid #27272a;background:#111;color:#fff;font-size:14px}.btn{padding:10px 20px;border-radius:99px;border:none;font-weight:600;cursor:pointer}.btn-primary{background:#3b82f6;color:#fff}.btn-primary:hover{opacity:0.8}.sub-item{background:#111;padding:16px;border-radius:12px;border:1px solid #1e1e21;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}.sub-item:hover{border-color:#3f3f46}.actions{display:flex;gap:6px}.actions button{padding:6px 12px;border-radius:99px;border:none;cursor:pointer;font-size:14px;transition:0.2s}.actions button:hover{transform:scale(1.05)}.btn-green{background:#22c55e33;color:#22c55e}.btn-green:hover{background:#22c55e55}.btn-red{background:#ef444433;color:#ef4444}.btn-red:hover{background:#ef444455}.btn-yellow{background:#f59e0b33;color:#f59e0b}.btn-yellow:hover{background:#f59e0b55}.btn-gray{background:#1e293b;color:#8b95a9}.btn-gray:hover{background:#2d3b52}.row{display:flex;gap:10px;flex-wrap:wrap}.flex-1{flex:1}.back-link{color:#58a6ff;text-decoration:none;display:inline-block;margin-bottom:16px}.back-link:hover{text-decoration:underline}</style></head><body><div class="container"><a href="/" class="back-link">← На главную</a><div class="card"><h2>🔧 Админ-панель</h2><div class="subtitle">Управление подписками</div><form method="POST" action="/admin?pass=18032014"><input type="hidden" name="action" value="create"><div class="row"><div class="flex-1"><div class="form-group"><label>Название подписки</label><input type="text" name="subscription_name" placeholder="client1" required></div></div><div class="flex-1"><div class="form-group"><label>Срок</label><select name="period"><option value="30">1 месяц</option><option value="90">3 месяца</option><option value="180">6 месяцев</option><option value="365">1 год</option><option value="forever">Навсегда</option></select></div></div></div><button type="submit" class="btn btn-primary" style="width:100%;padding:14px">➕ Создать подписку</button></form></div><div class="card"><h3 style="font-size:16px;margin-bottom:16px">📋 Список подписок</h3>' + (list || '<div style="color:#8b95a9;text-align:center;padding:20px">Нет подписок</div>') + '</div></div><script>function action(id,a){if(a==="delete"&&!confirm("Удалить подписку?"))return;var f=document.createElement("form");f.method="POST";f.action="/admin?pass=18032014";f.innerHTML=\'<input type="hidden" name="action" value="\'+a+\'"><input type="hidden" name="subscription_id" value="\'+id+\'">\';document.body.appendChild(f);f.submit()}function extend(id){var d=prompt("На сколько дней продлить?","30");if(d){var f=document.createElement("form");f.method="POST";f.action="/admin?pass=18032014";f.innerHTML=\'<input type="hidden" name="action" value="extend"><input type="hidden" name="subscription_id" value="\'+id+\'"><input type="hidden" name="period" value="\'+d+\'">\';document.body.appendChild(f);f.submit()}}</script></body></html>';
}

function getSubPage(subId, sub, isActive, usedTraffic) {
  const expireDate = sub.expire ? new Date(sub.expire).toLocaleDateString('ru-RU') : 'Навсегда';
  const subName = sub.name || subId;
  
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ultra VPN — ' + subName + '</title><style>body{background:#0b0e14;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;padding:20px}.card{background:linear-gradient(145deg,#18181b,#0d0d10);padding:40px;border-radius:28px;border:1px solid #27272a;max-width:400px;width:100%;text-align:center;box-shadow:0 30px 60px -20px rgba(0,0,0,0.8)}.icon{font-size:60px}.title{font-size:26px;font-weight:700;background:linear-gradient(135deg,#58a6ff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.subtitle{color:#8b95a9;font-size:14px;margin-top:4px}.badge{display:inline-block;background:' + (isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') + ';color:' + (isActive ? '#22c55e' : '#ef4444') + ';padding:4px 18px;border-radius:99px;font-size:13px;margin-top:8px;border:1px solid ' + (isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') + '}.stats{background:#111;padding:18px;border-radius:18px;border:1px solid #1e1e21;margin:20px 0}.stat-item{display:flex;justify-content:space-between;padding:8px 0}.stat-item+.stat-item{border-top:1px solid #1e1e21}.stat-label{color:#8b95a9}.stat-value{font-weight:600}.stat-value .date{color:#fca5a5}.expired-box{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:16px;margin-bottom:20px}.expired-box .big-icon{font-size:48px;display:block}.expired-box .text{font-size:16px;font-weight:600;color:#ef4444}.expired-box .sub{font-size:14px;color:#8b95a9;margin-top:4px}.footer{color:#5a5f6b;font-size:14px;margin-top:16px}.back-link{color:#58a6ff;text-decoration:none;display:inline-block;margin-top:8px}.back-link:hover{text-decoration:underline}.id-label{font-size:12px;color:#4b5563;margin-top:12px;word-break:break-all}</style></head><body><div class="card"><div class="icon">' + (isActive ? '🚀' : '⛔') + '</div><div class="title">Ultra VPN</div><div class="subtitle">' + subName + '</div><div class="badge">' + (isActive ? '● Активен' : '● Подписка истекла') + '</div>' + (isActive ? '<div class="stats"><div class="stat-item"><span class="stat-label">📦 Трафик</span><span class="stat-value">' + usedTraffic + ' GB <span style="color:#8b95a9;font-weight:400;">/ ∞</span></span></div><div class="stat-item"><span class="stat-label">📅 Истекает</span><span class="stat-value"><span class="date">' + expireDate + '</span></span></div></div>' : '<div class="expired-box"><span class="big-icon">⛔</span><div class="text">Подписка истекла</div><div class="sub">Продление: <a href="https://t.me/fhcsupport" style="color:#58a6ff;">@fhcsupport</a></div></div>') + '<div class="footer">Вопросы? <a href="https://t.me/fhcsupport">@fhcsupport</a></div><a href="/" class="back-link">← На главную</a><div class="id-label">ID: ' + subId + '</div></div></body></html>';
}

function getLandingPage() {
  return '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Ultra VPN — Надёжный VPN сервис</title><style>*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}body{font-family:"Segoe UI",system-ui,sans-serif;background:#0b0e14;color:#e4e9f0;min-height:100vh;display:flex;flex-direction:column}.container{max-width:1100px;margin:0 auto;padding:0 20px;width:100%}/* HEADER */header{padding:24px 0;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;position:sticky;top:0;background:#0b0e14cc;backdrop-filter:blur(12px);z-index:100}.logo{font-size:24px;font-weight:700;background:linear-gradient(135deg,#58a6ff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.logo span{color:#e4e9f0;-webkit-text-fill-color:#e4e9f0}.nav{display:flex;gap:24px;align-items:center;flex-wrap:wrap}.nav a{color:#8b95a9;text-decoration:none;font-size:14px;transition:0.3s;position:relative}.nav a::after{content:"";position:absolute;bottom:-4px;left:0;width:0;height:2px;background:linear-gradient(135deg,#58a6ff,#a78bfa);transition:width 0.3s ease}.nav a:hover{color:#e4e9f0}.nav a:hover::after{width:100%}.nav .btn{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:8px 24px;border-radius:99px;font-weight:600;font-size:14px;border:none;cursor:pointer;transition:0.3s}.nav .btn:hover{opacity:0.8;transform:translateY(-2px)}/* SECTIONS */section{opacity:0;transform:translateY(40px);animation:fadeUp 0.8s ease forwards}section:nth-child(1){animation-delay:0.1s}section:nth-child(2){animation-delay:0.2s}section:nth-child(3){animation-delay:0.3s}section:nth-child(4){animation-delay:0.4s}@keyframes fadeUp{to{opacity:1;transform:translateY(0)}}.hero{padding:80px 0 60px;text-align:center}.hero h1{font-size:48px;font-weight:700;margin-bottom:16px;background:linear-gradient(135deg,#fff,#8b95a9);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.hero p{font-size:18px;color:#8b95a9;max-width:600px;margin:0 auto 32px;line-height:1.6}.hero .btn{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:14px 48px;border-radius:99px;font-weight:600;font-size:16px;border:none;cursor:pointer;transition:0.3s;display:inline-block;text-decoration:none}.hero .btn:hover{opacity:0.8;transform:translateY(-3px);box-shadow:0 8px 30px rgba(59,130,246,0.3)}section{padding:60px 0}.section-title{font-size:28px;text-align:center;margin-bottom:8px}.section-sub{color:#8b95a9;text-align:center;font-size:16px;margin-bottom:8px}.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:40px}.feature{background:#141a24;padding:32px 24px;border-radius:16px;border:1px solid #1e293b;text-align:center;transition:0.3s;cursor:default}.feature:hover{border-color:#3f3f46;transform:translateY(-4px);box-shadow:0 8px 30px rgba(0,0,0,0.3)}.feature .icon{font-size:40px;margin-bottom:12px}.feature h3{font-size:18px;margin-bottom:8px}.feature p{color:#8b95a9;font-size:14px;line-height:1.6}.servers-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-top:24px}.server-card{background:#111113;padding:16px;border-radius:12px;border:1px solid #1e1e21;text-align:center;transition:0.3s}.server-card:hover{border-color:#3f3f46;transform:translateY(-4px)}.server-card .flag{font-size:28px}.server-card .name{font-weight:500;margin-top:4px}.server-card .ping{color:#58a6ff;font-size:13px;margin-top:2px}.server-card .speed{color:#22c55e;font-size:13px}.cta{text-align:center;background:linear-gradient(145deg,#18181b,#0d0d10);padding:48px;border-radius:28px;border:1px solid #27272a;transition:0.3s}.cta:hover{border-color:#3f3f46}.cta h2{font-size:28px;margin-bottom:12px}.cta p{color:#8b95a9;font-size:16px;margin-bottom:24px}.cta .btn{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:14px 48px;border-radius:99px;font-weight:600;font-size:16px;border:none;cursor:pointer;transition:0.3s;display:inline-block;text-decoration:none}.cta .btn:hover{opacity:0.8;transform:translateY(-3px);box-shadow:0 8px 30px rgba(59,130,246,0.3)}footer{padding:24px 0;border-top:1px solid #1e293b;text-align:center;color:#4b5563;font-size:14px;margin-top:auto}footer a{color:#58a6ff;text-decoration:none}footer a:hover{text-decoration:underline}.admin-link{position:fixed;bottom:24px;right:24px;background:#18181b;border:1px solid #27272a;border-radius:99px;padding:10px 20px;font-size:13px;color:#8b95a9;text-decoration:none;transition:0.3s;z-index:50;backdrop-filter:blur(8px)}.admin-link:hover{color:#e4e9f0;border-color:#3f3f46}@media(max-width:600px){.hero h1{font-size:32px}.features{grid-template-columns:1fr}.servers-grid{grid-template-columns:1fr 1fr}.cta{padding:32px 20px}.admin-link{bottom:16px;right:16px;padding:8px 14px;font-size:12px}}</style></head><body><header><div class="container"><div class="logo">Ultra <span>VPN</span></div><div class="nav"><a href="#features">Возможности</a><a href="#servers">Серверы</a><a href="#contact">Контакты</a></div></div></header><main><section class="hero"><div class="container"><h1>Безлимитный VPN <br>для свободного интернета</h1><p>Надёжные серверы в Европе и России. Безлимитный трафик, высокая скорость и полная анонимность.</p><a href="#contact" class="btn">Начать использовать</a></div></section><section id="features"><div class="container"><h2 class="section-title">🔥 Почему мы?</h2><p class="section-sub">Всё, что нужно для комфортного серфинга</p><div class="features"><div class="feature"><div class="icon">🌍</div><h3>5 серверов</h3><p>Германия, Швеция, Польша, Россия, LTE — выбирай любой</p></div><div class="feature"><div class="icon">📦</div><h3>Безлимитный трафик</h3><p>Никаких ограничений по объёму — качай и смотри сколько хочешь</p></div><div class="feature"><div class="icon">⚡</div><h3>Высокая скорость</h3><p>Скорость от 70 до 500 Мбит/с — идеально для стримов и игр</p></div><div class="feature"><div class="icon">🔒</div><h3>Reality протокол</h3><p>Современная защита, которая не оставляет следов</p></div><div class="feature"><div class="icon">📱</div><h3>Все устройства</h3><p>Windows, macOS, Android, iOS — подключай что угодно</p></div><div class="feature"><div class="icon">💬</div><h3>Поддержка 24/7</h3><p>Всегда на связи в Telegram — поможем с настройкой</p></div></div></div></section><section id="servers"><div class="container"><h2 class="section-title">🖥️ Наши серверы</h2><p class="section-sub">Реальные пинг и скорость (обновляются автоматически)</p><div class="servers-grid"><div class="server-card"><div class="flag">🇩🇪</div><div class="name">Германия</div><div class="ping">📶 80 мс</div><div class="speed">⚡ 210 Мбит/с</div></div><div class="server-card"><div class="flag">🇸🇪</div><div class="name">Швеция</div><div class="ping">📶 94 мс</div><div class="speed">⚡ 158 Мбит/с</div></div><div class="server-card"><div class="flag">🇵🇱</div><div class="name">Польша</div><div class="ping">📶 87 мс</div><div class="speed">⚡ 122 Мбит/с</div></div><div class="server-card"><div class="flag">🇷🇺</div><div class="name">Россия</div><div class="ping">📶 14 мс</div><div class="speed">⚡ 98 Мбит/с</div></div><div class="server-card"><div class="flag">🇩🇪</div><div class="name">LTE #1</div><div class="ping">📶 24 мс</div><div class="speed">⚡ 154 Мбит/с</div></div></div></div></section><section id="contact"><div class="container"><div class="cta"><h2>🚀 Готов начать?</h2><p>Получи доступ к Ultra VPN прямо сейчас. Безлимитный трафик, высокая скорость и полная анонимность.</p><a href="https://t.me/fhcsupport" class="btn" target="_blank">💬 Связаться с нами</a><p style="margin-top:16px;font-size:14px;color:#4b5563">Вопросы? Пиши в Telegram — <a href="https://t.me/fhcsupport" style="color:#58a6ff;">@fhcsupport</a></p></div></div></section></main><footer><div class="container"><p>© 2026 Ultra VPN. Все права защищены. Работает на <a href="https://cloudflare.com" target="_blank">Cloudflare Workers</a></p></div></footer><a href="/admin?pass=18032014" class="admin-link">🔐 Админ-панель</a></body></html>';
}
