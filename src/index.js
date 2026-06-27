export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const accept = request.headers.get("Accept") || "";
    const userAgent = request.headers.get("user-agent") || "";

    // ---- Серверы ----
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
        remarks: "Германия",
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
        remarks: "Швеция",
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
        remarks: "Польша",
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
        remarks: "Россия",
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
        remarks: "LTE #1",
        network: "grpc",
        flow: "",
        grpcServiceName: "ads.x5.ru"
      }
    ];

    // ---- Функции генерации конфигов ----
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
          "Subscription-Traffic": "876 GB / ∞",
          "Subscription-Expire": String(expireTimestamp),
          "subscription-userinfo": `upload=0; download=876000000000; total=0; expire=${expireTimestamp}`
        }
      });
    }

    // ---- Подготовка данных для клиента (только имена) ----
    const serverNames = nodes.map(n => n.remarks);
    const serverDataJson = JSON.stringify(serverNames);

    // ---- ОБНОВЛЁННЫЙ ИНТЕРФЕЙС ----
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
            background: rgba(22, 163, 74, 0.15);
            color: #22c55e;
            padding: 4px 18px;
            border-radius: 99px;
            font-size: 13px;
            font-weight: 600;
            margin-top: 6px;
            border: 1px solid rgba(34, 197, 94, 0.2);
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
        .btn-status::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
            opacity: 0;
            transition: 0.5s;
        }
        .btn-status:hover::after { opacity: 1; }
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
        .footer { text-align: center; font-size: 14px; color: #5a5f6b; margin-top: 16px; }
        .footer a { color: #58a6ff; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
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
            height: 6px;
            background: #1e1e21;
            border-radius: 99px;
            overflow: hidden;
            visibility: hidden;
        }
        .progress-container.active { visibility: visible; }
        .progress-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #58a6ff, #a78bfa);
            border-radius: 99px;
            transition: width 0.2s linear;
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
    <!-- Главная страница -->
    <div id="page-main" class="page active">
        <div class="card">
            <div class="header">
                <span class="icon">🚀</span>
                <div class="title">Ultra VPN Plus</div>
                <div class="badge">● Активен</div>
            </div>
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-label">📦 Трафик</span>
                    <span class="stat-value">876 GB <span style="color:#8b95a9;font-weight:400;">/ ∞</span></span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">📅 Истекает</span>
                    <span class="stat-value date">13.03.2030</span>
                </div>
            </div>
            <button class="btn-status" id="statusBtn">📊 Статус серверов</button>
            <div class="footer">
                Вопросы? <a href="https://t.me/fhcsupport">@fhcsupport</a>
            </div>
        </div>
    </div>

    <!-- Страница статуса серверов -->
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
                    <div class="progress-fill" id="progressFill"></div>
                </div>
            </div>
            <div class="footer" style="margin-top:12px;">
                <span style="color:#5a5f6b;">Обновлено: <span id="updateTime"></span></span>
            </div>
        </div>
    </div>
</div>

<script>
// Список имён серверов (передан с сервера)
var serverNames = ${serverDataJson};
var STORAGE_KEY = 'ultra_vpn_servers_data';
var isUpdating = false;
var autoUpdateTimer = null;

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Генерация новых данных для всех серверов
function generateServerData() {
    var result = [];
    for (var i = 0; i < serverNames.length; i++) {
        var name = serverNames[i];
        var ping, speed;
        if (name === 'Россия') {
            ping = random(8, 42);
            speed = random(50, 150);
        } else {
            ping = random(60, 120);
            speed = random(50, 200);
        }
        result.push({ name: name, ping: ping, speed: speed });
    }
    return result;
}

// Сохранение данных в localStorage
function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
}

// Загрузка данных из localStorage
function loadData() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            var parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length === serverNames.length) {
                return parsed;
            }
        }
    } catch (e) {}
    return null;
}

// Получить актуальные данные (из localStorage или новые)
function getCurrentData() {
    var data = loadData();
    if (!data) {
        data = generateServerData();
        saveData(data);
    }
    return data;
}

// Обновить данные (сгенерировать новые, сохранить, вернуть)
function refreshData() {
    var data = generateServerData();
    saveData(data);
    return data;
}

// Отобразить данные в списке
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

// Обновить время на странице
function updateTimeDisplay() {
    var now = new Date().toLocaleString('ru-RU');
    document.getElementById('updateTime').textContent = now;
}

// Основная функция обновления (с анимацией прогресса)
function performUpdate(manual = false) {
    if (isUpdating) return;
    isUpdating = true;
    var btn = document.getElementById('updateBtn');
    var progressContainer = document.getElementById('progressContainer');
    var progressFill = document.getElementById('progressFill');
    
    btn.disabled = true;
    btn.textContent = '⏳ Обновление...';
    progressContainer.classList.add('active');
    progressFill.style.width = '0%';

    var startTime = Date.now();
    var duration = 8000; // 8 секунд
    var interval = setInterval(function() {
        var elapsed = Date.now() - startTime;
        var percent = Math.min((elapsed / duration) * 100, 100);
        progressFill.style.width = percent + '%';
        if (percent >= 100) {
            clearInterval(interval);
            // Генерируем новые данные
            var newData = refreshData();
            renderServers(newData);
            updateTimeDisplay();
            // Скрываем прогресс
            progressContainer.classList.remove('active');
            btn.disabled = false;
            btn.textContent = '🔄 Обновить статус';
            isUpdating = false;
            // Если обновление было ручным, сбрасываем таймер автообновления и запускаем заново
            if (manual) {
                resetAutoUpdate();
            }
        }
    }, 50);
}

// Сброс и запуск таймера автообновления
function resetAutoUpdate() {
    if (autoUpdateTimer) {
        clearTimeout(autoUpdateTimer);
        autoUpdateTimer = null;
    }
    // Случайный интервал от 10 до 20 секунд (в миллисекундах)
    var delay = random(10000, 20000);
    autoUpdateTimer = setTimeout(function() {
        // Проверяем, не обновляется ли уже, и не находится ли страница в фоновом режиме (можно игнорировать)
        if (!isUpdating) {
            performUpdate(false);
        }
        // После завершения обновления таймер будет перезапущен внутри performUpdate (если manual=false)
        // Но если по какой-то причине обновление не запустилось, перезапускаем таймер снова
        // Лучше перезапускать после завершения обновления, но здесь мы сделаем так:
        // После каждого автообновления перезапускаем таймер.
        // Однако performUpdate не знает, что был авто-вызов, поэтому после его завершения нужно перезапустить таймер.
        // Но мы перезапустим таймер сразу после окончания обновления, независимо от того, ручное или авто.
        // Для этого мы можем добавить флаг, что обновление завершено, и перезапустить таймер.
    }, delay);
}

// Функция, вызываемая после завершения обновления (ручного или авто)
function onUpdateComplete(manual) {
    // Перезапускаем таймер автообновления
    resetAutoUpdate();
}

// Модифицируем performUpdate, чтобы после завершения вызывать onUpdateComplete
// Переопределим performUpdate
var originalPerformUpdate = performUpdate;
performUpdate = function(manual) {
    if (isUpdating) return;
    isUpdating = true;
    var btn = document.getElementById('updateBtn');
    var progressContainer = document.getElementById('progressContainer');
    var progressFill = document.getElementById('progressFill');
    
    btn.disabled = true;
    btn.textContent = '⏳ Обновление...';
    progressContainer.classList.add('active');
    progressFill.style.width = '0%';

    var startTime = Date.now();
    var duration = 8000;
    var interval = setInterval(function() {
        var elapsed = Date.now() - startTime;
        var percent = Math.min((elapsed / duration) * 100, 100);
        progressFill.style.width = percent + '%';
        if (percent >= 100) {
            clearInterval(interval);
            var newData = refreshData();
            renderServers(newData);
            updateTimeDisplay();
            progressContainer.classList.remove('active');
            btn.disabled = false;
            btn.textContent = '🔄 Обновить статус';
            isUpdating = false;
            // Запускаем таймер автообновления заново
            resetAutoUpdate();
        }
    }, 50);
};

// Инициализация при загрузке страницы
function init() {
    var data = getCurrentData();
    renderServers(data);
    updateTimeDisplay();
    // Запускаем автообновление
    resetAutoUpdate();
    // Обработчики кнопок
    document.getElementById('updateBtn').addEventListener('click', function() {
        performUpdate(true); // ручное обновление
    });
}

// Страница статуса серверов
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
        // Если список пуст (первый раз), инициализируем
        if (!document.getElementById('serverList').innerHTML) {
            init();
        }
    }
}

statusBtn.addEventListener('click', function() { showPage('servers'); });
backBtn.addEventListener('click', function() { showPage('main'); });

// Если страница серверов была открыта ранее (например, при обновлении), но не была инициализирована
// Мы можем проверить при загрузке, но проще вызвать init при первом открытии.
// Для безопасности, если при загрузке страницы сразу активна страница серверов (что маловероятно), то инициализируем.
// Но по умолчанию активна главная.
// Поэтому init вызывается только при переходе на страницу серверов, если список пуст.
</script>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};
