addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Настоящий JavaScript-объект. Никаких проблем с кавычками и слэшами.
  const configsObj = [
    {
      "protocol": "vless",
      "remarks": "🇩🇪 Германия⚡",
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "fingerprint": "qq",
          "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
          "serverName": "ads.x5.ru",
          "shortId": "abbcd128"
        }
      },
      "settings": {
        "address": "de-new.datanode-internal.net",
        "encryption": "none",
        "flow": "xtls-rprx-vision",
        "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        "level": 8,
        "port": 443
      }
    },
    {
      "protocol": "vless",
      "remarks": "🇸🇪 Швеция⚡",
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "fingerprint": "qq",
          "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
          "serverName": "ads.x5.ru",
          "shortId": "abbcd128"
        }
      },
      "settings": {
        "address": "se-new.datanode-internal.net",
        "encryption": "none",
        "flow": "xtls-rprx-vision",
        "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        "level": 8,
        "port": 443
      }
    },
    {
      "protocol": "vless",
      "remarks": "🇵🇱 Польша",
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "fingerprint": "qq",
          "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
          "serverName": "sun9-35.userapi.com",
          "shortId": "abbcd128"
        }
      },
      "settings": {
        "address": "pl.datanode-internal.net",
        "encryption": "none",
        "flow": "xtls-rprx-vision",
        "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        "level": 8,
        "port": 443
      }
    },
    {
      "protocol": "vless",
      "remarks": "🇷🇺 Россия",
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "fingerprint": "qq",
          "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
          "serverName": "sun9-38.userapi.com",
          "shortId": "abbcd128"
        }
      },
      "settings": {
        "address": "ru.datanode-internal.net",
        "encryption": "none",
        "flow": "xtls-rprx-vision",
        "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        "level": 8,
        "port": 443
      }
    },
    {
      "protocol": "vless",
      "remarks": "🇩🇪 LTE #1 ⚡",
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "fingerprint": "qq",
          "publicKey": "r6lN34m1nN-xQZ458j5NPD5xJ3_QBF2bGzY4KJEo4ic",
          "serverName": "ads.x5.ru",
          "shortId": "abbcd128"
        }
      },
      "settings": {
        "address": "hole3.datanode-internal.net",
        "encryption": "none",
        "flow": "xtls-rprx-vision",
        "id": "9d5e7e04-53e4-4d98-bb26-236c907078a5",
        "level": 8,
        "port": 9443
      }
    },
    {
      "protocol": "vless",
      "remarks": "🇵🇱 LTE #2 ",
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "fingerprint": "firefox",
          "publicKey": "noOR7PAxYWRRrbQywDahrBlTkbNuNFkMLCPcX-wfa5TY",
          "serverName": "a.wb.ru",
          "shortId": "086007"
        }
      },
      "settings": {
        "address": "178.250.242.194",
        "encryption": "none",
        "flow": "xtls-rprx-vision",
        "id": "b92337e0-6819-4f17-a3cc-f860b138b27a",
        "level": 8,
        "port": 6443
      }
    },
    {
      "protocol": "vless",
      "remarks": "🇳🇱 LTE #3 ",
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "fingerprint": "firefox",
          "publicKey": "grRXV9R0CYdwQX8R4S1qfMde1b8g6Ejr1UZCxM5-PkM",
          "serverName": "api.ok.ru",
          "shortId": "3efa66e0"
        }
      },
      "settings": {
        "address": "178.250.242.194",
        "encryption": "none",
        "flow": "xtls-rprx-vision",
        "id": "7573908b-d981-4153-92aa-33ee2d22144c",
        "level": 8,
        "port": 443
      }
    }
  ];

  // Преобразуем объект в идеальную строку JSON без ошибок кодирования
  const cleanJson = JSON.stringify(configsObj);

  const newHeaders = new Headers();
  newHeaders.set("Content-Type", "application/json; charset=utf-8");
  
  // Название: Ultra VPN 🏳️
  newHeaders.set("profile-title", "base64:VWx0cmEgVlBOIPCfh7Y=");
  
  // Статистика: 357 ГБ / ∞ / Окончание 13.03.2030
  newHeaders.set("subscription-userinfo", "upload=0; download=383331401728; total=0; expire=1899589200");
  newHeaders.set("profile-update-interval", "1");
  newHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(cleanJson, {
    status: 200,
    headers: newHeaders
  });
}
