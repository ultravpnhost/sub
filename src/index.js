export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isBrowser = !request.headers.get("user-agent")?.includes("V2Ray") && !request.headers.get("user-agent")?.includes("Happ");

    // --- ДАННЫЕ ---
    const totalTraffic = "874 GB";
    const expirationDate = "13.03.2030";
    const supportContact = "@fhcsupport";
    const profileTitleBase64 = "VWx0cmEgVlBOIFBsdXM=";

    const configs = [
      { address: "de-new.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", flow: "xtls-rprx-vision", serverName: "ads.x5.ru", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", remarks: "🇩🇪 Германия⚡" },
      { address: "se-new.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", flow: "xtls-rprx-vision", serverName: "ads.x5.ru", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", remarks: "🇸🇪 Швеция⚡" },
      { address: "pl.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", flow: "xtls-rprx-vision", serverName: "sun9-35.userapi.com", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", remarks: "🇵🇱 Польша" },
      { address: "ru.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", flow: "xtls-rprx-vision", serverName: "sun9-38.userapi.com", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", remarks: "🇷🇺 Россия" },
      { address: "hole3.datanode-internal.net", port: 9443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", flow: "xtls-rprx-vision", serverName: "ads.x5.ru", publicKey: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", shortId: "abbcd128", remarks: "🇩🇪 LTE #1" }
    ];

    // Генерируем ссылки
    const plainTextLinks = configs.map(c => 
      `vless://${c.id}@${c.address}:${c.port}?encryption=none&flow=${c.flow}&security=reality&sni=${c.serverName}&fp=qq&pbk=${c.publicKey}&sid=${c.shortId}#${encodeURIComponent(c.remarks)}`
    ).join("\n");

    // Если это браузер — показываем HTML
    if (isBrowser) {
      const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Ultra VPN Plus</title><style>body{font-family:sans-serif;background:#0d1117;color:#c9d1d9;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}.card{background:#161b22;padding:28px;border-radius:12px;width:100%;max-width:350px;border:1px solid #30363d}.status{background:#238636;color:#fff;padding:4px 10px;border-radius:20px;font-size:12px}.info-item{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #30363d}</style></head><body><div class="card"><h1>Ultra VPN Plus</h1><div class="status">Подписка активна</div><div class="info-item"><span>Трафик:</span><span>0 GB / ${totalTraffic}</span></div><div class="info-item"><span>Истекает:</span><span>${expirationDate}</span></div><div class="footer" style="text-align:center;margin-top:20px;">Поддержка: <a href="https://t.me/${supportContact.replace('@', '')}">@fhcsupport</a></div></div></body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // Если это VPN клиент — отдаем ссылки
    const newHeaders = new Headers();
    newHeaders.set("Content-Type", "text/plain; charset=utf-8");
    newHeaders.set("profile-title", `base64:${profileTitleBase64}`);
    newHeaders.set("subscription-userinfo", "upload=0; download=938460353216; total=0; expire=1899589200");
    newHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(plainTextLinks, { status: 200, headers: newHeaders });
  }
};
