export default {
  async fetch(request, env, ctx) {
    // --- ДАННЫЕ ПОДПИСКИ ---
    const totalTraffic = "874 GB";
    const expirationDate = "13.03.2030";
    const supportContact = "@fhcsupport"; 
    const profileTitleBase64 = "VWx0cmEgVlBOIFBsdXM="; // Base64 для "Ultra VPN Plus"

    // Твои 5 оригинальных рабочих конфигов
    const configsObj = [
      {
        address: "de-new.datanode-internal.net",
        port: 443,
        id: "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        flow: "xtls-rprx-vision",
        serverName: "ads.x5.ru",
        publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
        shortId: "abbcd128",
        remarks: "🇩🇪 Германия⚡"
      },
      {
        address: "se-new.datanode-internal.net",
        port: 443,
        id: "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        flow: "xtls-rprx-vision",
        serverName: "ads.x5.ru",
        publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
        shortId: "abbcd128",
        remarks: "🇸🇪 Швеция⚡"
      },
      {
        address: "pl.datanode-internal.net",
        port: 443,
        id: "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        flow: "xtls-rprx-vision",
        serverName: "sun9-35.userapi.com",
        publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
        shortId: "abbcd128",
        remarks: "🇵🇱 Польша"
      },
      {
        address: "ru.datanode-internal.net",
        port: 443,
        id: "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        flow: "xtls-rprx-vision",
        serverName: "sun9-38.userapi.com",
        publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
        shortId: "abbcd128",
        remarks: "🇷🇺 Россия"
      },
      {
        address: "hole3.datanode-internal.net",
        port: 9443,
        id: "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        flow: "xtls-rprx-vision",
        serverName: "ads.x5.ru",
        publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
        shortId: "abbcd128",
        remarks: "🇩🇪 LTE #1"
      }
    ];

    // Формируем HTML-страницу для отображения в браузере
    const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ultra VPN Plus</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0d1117; color: #c9d1d9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #161b22; padding: 28px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 100%; max-width: 350px; border: 1px solid #30363d; box-sizing: border-box; }
            h1 { font-size: 22px; margin-top: 0; color: #f0f6fc; }
            .status { display: inline-block; padding: 4px 10px; background: #238636; color: #fff; font-size: 12px; border-radius: 20px; font-weight: 600; margin-bottom: 20px; }
            .info-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #30363d; font-size: 14px; }
            .info-item:last-child { border-bottom: none; }
            .label { color: #8b949e; }
            .value { font-weight: 500; color: #c9d1d9; }
            .footer { text-align: center; margin-top: 24px; font-size: 13px; color: #8b949e; }
            .footer a { color: #58a6ff; text-decoration: none; font-weight: 500; }
            .hidden-configs { display: none; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Ultra VPN Plus</h1>
            <div class="status">Подписка активна</div>
            <div class="info-item">
                <span class="label">Трафик:</span>
                <span class="value">0 GB / ${totalTraffic}</span>
            </div>
            <div class="info-item">
                <span class="label">Истекает:</span>
                <span class="value">${expirationDate}</span>
            </div>
            <div class="info-item">
                <span class="label">Обновление:</span>
                <span class="value">Каждый час</span>
            </div>
            <div class="footer">
                Поддержка: <a href="https://t.me/${supportContact.replace('@', '')}" target="_blank">${supportContact}</a>
            </div>
        </div>

        <div class="hidden-configs">
${plainTextLinks}
        </div>
    </body>
    </html>
    `;

    const newHeaders = new Headers();
    newHeaders.set("Content-Type", "text/html; charset=utf-8");
    
    // Передаем статистику (0 использовано из 357 GB) в хедерах для VPN-клиентов
    newHeaders.set("profile-title", `base64:${profileTitleBase64}`);
    newHeaders.set("subscription-userinfo", "upload=0; download=938460353216; total=0; expire=1899589200");
    newHeaders.set("profile-update-interval", "1");
    newHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(html, { status: 200, headers: newHeaders });
  }
};
