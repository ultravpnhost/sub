export default {
  async fetch(request, env, ctx) {
    // Базовые данные для конфигов (все параметры)
    const nodes = [
      { addr: "de-new.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", pk: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", sid: "abbcd128", name: "🇩🇪 Германия ⚡" },
      { addr: "se-new.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", pk: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", sid: "abbcd128", name: "🇸🇪 Швеция ⚡" },
      { addr: "pl.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "sun9-35.userapi.com", pk: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", sid: "abbcd128", name: "🇵🇱 Польша" },
      { addr: "ru.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "sun9-38.userapi.com", pk: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", sid: "abbcd128", name: "🇷🇺 Россия" },
      { addr: "hole3.datanode-internal.net", port: 9443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", pk: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", sid: "abbcd128", name: "🇩🇪 LTE №1 ⚡" }
    ];

    // Формируем массив в «плоском» формате, который понимают все Xray-клиенты
    const configs = nodes.map(c => ({
      protocol: "vless",
      remarks: c.name,
      address: c.addr,
      port: c.port,
      id: c.id,
      encryption: "none",
      flow: "xtls-rprx-vision",
      streamSettings: {
        network: "tcp",
        security: "reality",
        realitySettings: {
          fingerprint: "qq",
          publicKey: c.pk,
          serverName: c.serverName,
          shortId: c.sid
          // Убрал лишние поля: show, spiderX (они не нужны и мешают)
        }
      }
    }));

    // Возвращаем JSON с правильными заголовками
    return new Response(JSON.stringify(configs, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        // Опционально – информация о подписке (для совместимости)
        "subscription-userinfo": "upload=0; download=383331401728; total=0; expire=1899589200"
      }
    });
  }
};
