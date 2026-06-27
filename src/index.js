export default {
  async fetch(request, env, ctx) {
    const isClient = true; // Принудительно отдаем JSON

    const configs = [
      { addr: "de-new.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", pk: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", sid: "abbcd128", name: "🇩🇪 Германия" },
      { addr: "se-new.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", pk: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", sid: "abbcd128", name: "🇸🇪 Швеция" },
      { addr: "pl.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "sun9-35.userapi.com", pk: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", sid: "abbcd128", name: "🇵🇱 Польша" },
      { addr: "ru.datanode-internal.net", port: 443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "sun9-38.userapi.com", pk: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", sid: "abbcd128", name: "🇷🇺 Россия" },
      { addr: "hole3.datanode-internal.net", port: 9443, id: "9d5e7e04-53e4-4d98-bb26-236c907078a5", serverName: "ads.x5.ru", pk: "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", sid: "abbcd128", name: "🇩🇪 LTE #1" }
    ];

    const fullJson = configs.map(c => ({
      "tag": c.name,
      "protocol": "vless",
      "settings": {
        "vnext": [{
          "address": c.addr,
          "port": c.port,
          "users": [{
            "id": c.id,
            "encryption": "none",
            "flow": "xtls-rprx-vision"
          }]
        }]
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "show": false,
          "fingerprint": "qq",
          "serverName": c.serverName,
          "publicKey": c.pk,
          "shortId": c.sid,
          "spiderX": "/"
        }
      },
      "mux": { "enabled": false }
    }));

    return new Response(JSON.stringify(fullJson), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "subscription-userinfo": "upload=0; download=383331401728; total=0; expire=1899589200",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
