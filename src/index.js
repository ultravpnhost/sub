export default {
  async fetch(request, env, ctx) {
    const configsObj = [
      {
        "outbounds": [
          {
            "protocol": "vless",
            "tag": "proxy",
            "streamSettings": {
              "network": "tcp",
              "security": "reality",
              "realitySettings": { "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", "serverName": "ads.x5.ru", "shortId": "abbcd128" }
            },
            "settings": { "address": "de-new.datanode-internal.net", "port": 443, "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5", "flow": "xtls-rprx-vision" }
          }
        ],
        "remarks": "🇩🇪 Германия"
      },
      {
        "outbounds": [
          {
            "protocol": "vless",
            "tag": "proxy",
            "streamSettings": {
              "network": "tcp",
              "security": "reality",
              "realitySettings": { "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic", "serverName": "ads.x5.ru", "shortId": "abbcd128" }
            },
            "settings": { "address": "se-new.datanode-internal.net", "port": 443, "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5", "flow": "xtls-rprx-vision" }
          }
        ],
        "remarks": "🇸🇪 Швеция"
      }
    ];

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    // Данные подписки в заголовках:
    headers.set("profile-notice", "Ultra VPN Plus — всё работает.");
    headers.set("subscription-userinfo", "upload=0; download=383331401728; total=5497558138880; expire=1899589200");

    return new Response(JSON.stringify(configsObj), { status: 200, headers });
  }
};
