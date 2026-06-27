export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const accept = request.headers.get("Accept") || "";
    const userAgent = request.headers.get("user-agent") || "";

    // ---- Обработка POST /reset-devices (сброс всех устройств) ----
    if (path === '/reset-devices' && method === 'POST') {
      // Эмуляция сброса – клиент сам очистит localStorage
      return new Response(JSON.stringify({ success: true, message: "Все устройства отключены" }), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

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

    // ---- ОБНОВЛЁННЫЙ ВЕБ-ИНТЕРФЕЙС с двумя страницами ----
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultra VPN Plus | Dashboard</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --bg: #09090b;
            --card-bg: linear-gradient(145deg, #18181b, #09090b);
            --border: #27272a;
            --accent: #3b82f6;
            --success: #16a34a;
            --danger: #ef4444;
            --text: #e4e4e7;
            --dim: #71717a;
            --date-color: #fca5a5;
            --progress-bg: #27272a;
            --progress-fill: #3b82f6;
            --card-bg-solid: #141a24;
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
            padding: 20px;
        }
        .container {
            width: 100%;
            max-width: 400px;
            position: relative;
        }
        .page {
            display: none;
            animation: fadeIn 0.25s ease;
        }
        .page.active { display: block; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .card { 
            background: var(--card-bg); 
            padding: 30px; 
            border-radius: 24px; 
            border: 1px solid var(--border); 
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
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
        }
        .stat-row + .stat-row { border-top: 1px solid #27272a; margin-top: 10px; padding-top: 10px; }
        .stat-label { font-size: 12px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 17px; font-weight: bold; }
        .date-value { color: var(--date-color); }
        .devices-clickable { cursor: pointer; transition: 0.2s; }
        .devices-clickable:hover { opacity: 0.7; }
        .progress-bar {
            width: 100%;
            height: 6px;
            background: var(--progress-bg);
            border-radius: 99px;
            overflow: hidden;
            margin-top: 4px;
        }
        .progress-fill {
            height: 100%;
            background: var(--progress-fill);
            border-radius: 99px;
            transition: width 0.3s ease;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 99px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            border: none;
            transition: 0.2s;
            width: 100%;
            margin-top: 12px;
        }
        .btn-danger {
            background: rgba(239, 68, 68, 0.15);
            color: var(--danger);
            border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .btn-danger:hover {
            background: rgba(239, 68, 68, 0.25);
            border-color: var(--danger);
        }
        .btn-outline {
            background: transparent;
            color: var(--dim);
            border: 1px solid var(--border);
        }
        .btn-outline:hover {
            background: #1e293b;
            color: var(--text);
        }
        .btn-primary {
            background: var(--accent);
            color: #fff;
            border: 1px solid var(--accent);
        }
        .btn-primary:hover { opacity: 0.8; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .footer { font-size: 14px; color: var(--dim); margin-top: 20px; }
        .footer a { color: var(--accent); text-decoration: none; }
        .footer a:hover { opacity: 0.8; }
        .toast {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #1e293b;
            color: #e4e9f0;
            padding: 12px 28px;
            border-radius: 40px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.6);
            font-size: 0.95rem;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            border: 1px solid #334155;
            z-index: 999;
            white-space: nowrap;
        }
        .toast.show { opacity: 1; }

        /* Список устройств */
        .device-list {
            text-align: left;
            margin-top: 10px;
        }
        .device-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px;
            background: #111113;
            border-radius: 10px;
            margin-bottom: 8px;
            border: 1px solid var(--border);
            transition: 0.2s;
        }
        .device-item.disabled {
            opacity: 0.5;
            border-color: #3f3f46;
        }
        .device-name {
            font-weight: 500;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .device-name .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }
        .device-name .status-dot.online { background: var(--success); }
        .device-name .status-dot.offline { background: var(--danger); }
        .device-actions {
            display: flex;
            gap: 6px;
        }
        .device-actions button {
            background: transparent;
            border: none;
            color: var(--dim);
            font-size: 13px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
            transition: 0.2s;
        }
        .device-actions button:hover { background: #1e293b; color: var(--text); }
        .device-actions .btn-kick {
            color: var(--danger);
        }
        .device-actions .btn-kick:hover { background: rgba(239,68,68,0.15); }
        .device-actions .btn-restore {
            color: var(--accent);
        }
        .device-actions .btn-restore:hover { background: rgba(59,130,246,0.15); }
        .device-empty {
            color: var(--dim);
            font-size: 14px;
            text-align: center;
            padding: 20px 0;
        }
        .back-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            text-align: left;
        }
        .back-header button {
            background: transparent;
            border: none;
            color: var(--accent);
            font-size: 16px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 8px;
            transition: 0.2s;
        }
        .back-header button:hover { background: #1e293b; }
        .back-header h2 {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
        }
        .section-title {
            font-size: 13px;
            text-transform: uppercase;
            color: var(--dim);
            letter-spacing: 0.5px;
            margin: 16px 0 8px 0;
        }
        .device-item .device-name .offline-label {
            color: var(--danger);
            font-size: 12px;
            margin-left: 4px;
        }
    </style>
</head>
<body>
<div class="container">
    <!-- Главная страница -->
    <div id="page-main" class="page active">
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
                <div class="stat-row devices-clickable" id="devicesBlock">
                    <span class="stat-label">Устройства</span>
                    <span class="stat-value" id="deviceCountMain">1 <span style="color:var(--dim); font-weight:400;">/ 5</span></span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="deviceProgressMain" style="width: 20%;"></div>
                </div>
            </div>

            <button class="btn btn-danger" id="resetAllBtn">🔴 Отключить все устройства</button>

            <div class="footer">
                Вопросы? <a href="https://t.me/fhcsupport">@fhcsupport</a>
            </div>
        </div>
    </div>

    <!-- Страница списка устройств -->
    <div id="page-devices" class="page">
        <div class="card" style="padding: 20px;">
            <div class="back-header">
                <button id="backBtn">← Назад</button>
                <h2>Устройства</h2>
            </div>
            <div id="deviceListContainer">
                <!-- Список будет отрисован JS -->
            </div>
        </div>
    </div>
</div>

<div id="toast" class="toast"></div>

<script>
    (function() {
        // --- Работа с localStorage для хранения устройств ---
        const STORAGE_KEY = 'ultra_vpn_devices';
        const DEFAULT_DEVICES = [
            { id: 'dev1', name: 'Happ-Windows', active: true },
            { id: 'dev2', name: 'Incy-Android', active: true },
            { id: 'dev3', name: 'sing-box-iOS', active: true },
            { id: 'dev4', name: 'V2Ray-Mac', active: true },
            { id: 'dev5', name: 'Clash-Linux', active: true }
        ];

        function loadDevices() {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {}
            // Если нет данных, инициализируем и сохраняем
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEVICES));
            return DEFAULT_DEVICES.slice();
        }

        function saveDevices(devices) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
        }

        // --- DOM элементы ---
        const pageMain = document.getElementById('page-main');
        const pageDevices = document.getElementById('page-devices');
        const deviceCountMain = document.getElementById('deviceCountMain');
        const deviceProgressMain = document.getElementById('deviceProgressMain');
        const deviceListContainer = document.getElementById('deviceListContainer');
        const resetAllBtn = document.getElementById('resetAllBtn');
        const backBtn = document.getElementById('backBtn');
        const devicesBlock = document.getElementById('devicesBlock');
        const toast = document.getElementById('toast');

        // --- Утилиты ---
        function showToast(msg, duration = 2000) {
            toast.textContent = msg;
            toast.classList.add('show');
            clearTimeout(toast._timer);
            toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
        }

        function updateMainStats(devices) {
            const active = devices.filter(d => d.active).length;
            const total = 5;
            const percent = Math.round((active / total) * 100);
            deviceCountMain.innerHTML = active + ' <span style="color:var(--dim); font-weight:400;">/ ' + total + '</span>';
            deviceProgressMain.style.width = percent + '%';
        }

        function renderDeviceList(devices) {
            const activeDevices = devices.filter(d => d.active);
            const inactiveDevices = devices.filter(d => !d.active);

            let html = '';
            if (activeDevices.length === 0 && inactiveDevices.length === 0) {
                html = '<div class="device-empty">Нет устройств</div>';
            } else {
                if (activeDevices.length > 0) {
                    html += '<div class="section-title">Активные</div>';
                    activeDevices.forEach(d => {
                        html += `
                            <div class="device-item">
                                <span class="device-name">
                                    <span class="status-dot online"></span>
                                    ${d.name}
                                </span>
                                <div class="device-actions">
                                    <button class="btn-kick" data-id="${d.id}">Отключить</button>
                                </div>
                            </div>
                        `;
                    });
                }
                if (inactiveDevices.length > 0) {
                    html += '<div class="section-title">Отключённые</div>';
                    inactiveDevices.forEach(d => {
                        html += `
                            <div class="device-item disabled">
                                <span class="device-name">
                                    <span class="status-dot offline"></span>
                                    ${d.name}
                                    <span class="offline-label">🔴 Отключено</span>
                                </span>
                                <div class="device-actions">
                                    <button class="btn-restore" data-id="${d.id}">Восстановить</button>
                                </div>
                            </div>
                        `;
                    });
                }
            }
            deviceListContainer.innerHTML = html;

            // Обработчики для кнопок Отключить / Восстановить
            document.querySelectorAll('.btn-kick').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = this.dataset.id;
                    kickDevice(id);
                });
            });
            document.querySelectorAll('.btn-restore').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = this.dataset.id;
                    restoreDevice(id);
                });
            });
        }

        function kickDevice(id) {
            let devices = loadDevices();
            const idx = devices.findIndex(d => d.id === id);
            if (idx !== -1 && devices[idx].active) {
                devices[idx].active = false;
                saveDevices(devices);
                renderDeviceList(devices);
                updateMainStats(devices);
                showToast('🔴 Устройство отключено', 1500);
            }
        }

        function restoreDevice(id) {
            let devices = loadDevices();
            const idx = devices.findIndex(d => d.id === id);
            if (idx !== -1 && !devices[idx].active) {
                devices[idx].active = true;
                saveDevices(devices);
                renderDeviceList(devices);
                updateMainStats(devices);
                showToast('✅ Устройство восстановлено', 1500);
            }
        }

        function resetAllDevices() {
            if (!confirm('Отключить все устройства?')) return;
            let devices = loadDevices();
            devices.forEach(d => d.active = false);
            saveDevices(devices);
            renderDeviceList(devices);
            updateMainStats(devices);
            showToast('✅ Все устройства отключены', 1500);
        }

        // --- Переключение страниц ---
        function showPage(page) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('page-' + page).classList.add('active');
            if (page === 'devices') {
                const devices = loadDevices();
                renderDeviceList(devices);
            }
        }

        // --- Инициализация ---
        function init() {
            const devices = loadDevices();
            updateMainStats(devices);

            // Клик по блоку "Устройства" на главной
            devicesBlock.addEventListener('click', function() {
                showPage('devices');
            });

            // Кнопка "Назад"
            backBtn.addEventListener('click', function() {
                showPage('main');
            });

            // Кнопка "Отключить все" на главной
            resetAllBtn.addEventListener('click', resetAllDevices);

            // При загрузке страницы также обновляем список устройств (если уже на странице устройств)
            // Но мы не знаем, какая страница активна, поэтому слушаем событие показа страницы
        }

        // Если пользователь захочет обновить список на странице устройств при повторном входе
        // Мы вызываем renderDeviceList при переключении.

        init();

        // Дополнительно: чтобы при загрузке страницы устройств (если она активна) отрисовался список
        // Проверим, если страница устройств видна изначально (но по умолчанию скрыта)
        // Мы вызываем render при первом открытии.
        // Сделаем так: при первом клике на устройствах вызывается renderDeviceList.
        // Но уже сделано в showPage.
        // Также можно добавить обработчик для восстановления состояния после перезагрузки, если страница устройств была активна.

        // Экспортируем функции для отладки (опционально)
        window.__devices = { loadDevices, saveDevices, kickDevice, restoreDevice, resetAllDevices };
    })();
</script>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};
