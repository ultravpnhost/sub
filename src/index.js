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
          // Возвращаем в админку с обновлённым списком
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
        // Возвращаем в админку с обновлённым списком
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
      const nodes = isActive ? getRealNodes() : getEmptyNodes();
      const configs = nodes.map(makeFullConfig);
      
      const expireTimestamp = sub.expire ? Math.floor(sub.expire / 1000) : 0;
      const title = isActive ? (sub.name || 'Ultra VPN Plus') : 'Подписка отключена';
      const traffic = isActive ? '876 GB / ∞' : '0 GB / 0 GB';
      const trafficBytes = isActive ? 876000000000 : 0;

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

    // ---- ОСНОВНАЯ ПОДПИСКА (корень) ----
    if (path === '/' || path === '') {
      const isBrowser = !accept.includes('application/json') && 
                        !userAgent.includes('V2Ray') && 
                        !userAgent.includes('Happ') && 
                        !userAgent.includes('sing-box') && 
                        !userAgent.includes('INCY');

      if (isBrowser) {
        return new Response(getMainPage(), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      const configs = getRealNodes().map(makeFullConfig);
      const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Profile-Title': 'Ultra VPN Plus',
        'Subscription-Status': 'active',
        'Subscription-Traffic': '876 GB / ∞',
        'Subscription-Expire': '1899589200',
        'subscription-userinfo': 'upload=0; download=876000000000; total=0; expire=1899589200'
      };
      return new Response(JSON.stringify(configs, null, 2), { headers });
    }

    return new Response('Страница не найдена', { status: 404 });
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

function getMainPage() {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ultra VPN Plus</title><style>body{background:#0b0e14;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif}.card{background:linear-gradient(145deg,#18181b,#0d0d10);padding:40px;border-radius:28px;border:1px solid #27272a;max-width:400px;width:100%;text-align:center}.icon{font-size:60px}.title{font-size:26px;font-weight:700;background:linear-gradient(135deg,#58a6ff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.badge{display:inline-block;background:rgba(34,197,94,0.15);color:#22c55e;padding:4px 18px;border-radius:99px;font-size:13px;margin-top:8px}.stats{background:#111;padding:18px;border-radius:18px;border:1px solid #1e1e21;margin:20px 0}.stat-item{display:flex;justify-content:space-between;padding:8px 0}.stat-item+.stat-item{border-top:1px solid #1e1e21}.stat-label{color:#8b95a9}.stat-value{font-weight:600}.stat-value .date{color:#fca5a5}.footer{color:#5a5f6b;font-size:14px;margin-top:16px}a{color:#58a6ff;text-decoration:none}</style></head><body><div class="card"><div class="icon">🚀</div><div class="title">Ultra VPN Plus</div><div class="badge">● Активен</div><div class="stats"><div class="stat-item"><span class="stat-label">📦 Трафик</span><span class="stat-value">876 GB / ∞</span></div><div class="stat-item"><span class="stat-label">📅 Истекает</span><span class="stat-value"><span class="date">13.03.2030</span></span></div></div><div class="footer">Вопросы? <a href="https://t.me/fhcsupport">@fhcsupport</a></div></div></body></html>';
}
