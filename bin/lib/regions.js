module.exports = {
  EU: {
    hostname: "web-sls.tera.gameforge.com",
    address: "79.110.94.195",
    port: 4566,
    pathname: ["/servers/list.uk", "/servers/list.de", "/servers/list.fr"],
    customServers: require("./res/servers-eu.json"),
    listenHostname: "127.0.0.11"
  },
  RU: {
    url: "http://launcher.tera-online.ru/launcher/sls/",
    hostname: "launcher.tera-online.ru",
    address: "91.225.237.3",
    port: 80,
    customServers: require("./res/servers-ru.json"),
    listenHostname: "127.0.0.12"
  },
  KR: {
    url: "http://tera.nexon.com/launcher/sls/servers/list.xml",
    hostname: "tera.nexon.com",
    port: 80,
    customServers: require("./res/servers-kr.json"),
    listenHostname: "127.0.0.13"
  },
  "KR-NAVER": {
    url: "http://tera.nexon.game.naver.com/launcher/sls/servers/list.xml",
    hostname: "tera.nexon.game.naver.com",
    port: 80,
    customServers: require("./res/servers-kr.json"),
    listenHostname: "127.0.0.20"
  },
  JP: {
    url: "https://tera.pmang.jp/game_launcher/server_list.xml?usn=0",
    hostname: "tera.pmang.jp",
    altHostnames: ["tera-hangame.pmang.jp"],
    port: 443,
    customServers: require("./res/servers-jp.json"),
    listenHostname: "127.0.0.14"
  },
  TW: {
    url: "http://tera.mangot5.com/game/tera/serverList.xml",
    hostname: "tera.mangot5.com",
    port: 80,
    customServers: require("./res/servers-tw.json"),
    listenHostname: "127.0.0.15"
  },
  TH: {
    url: "http://terasls.playwith.in.th/list.xml",
    hostname: "terasls.playwith.in.th",
    address: "103.80.216.189",
    port: 80,
    customServers: require("./res/servers-th.json"),
    listenHostname: "127.0.0.18"
  },
  SE: {
    url: "http://terasls.playwith.in.th/list.xml",
    hostname: "terasls.playwith.in.th",
    address: "103.80.216.189",
    port: 80,
    customServers: require("./res/servers-se.json"),
    listenHostname: "127.0.0.21"
  },
  "EU-TEST": {
    hostname: "devt2-web-sls.tera.gfsrv.net",
    address: "79.110.95.152",
    port: 4566,
    pathname: ["/servers/list.uk", "/servers/list.de", "/servers/list.fr"],
    customServers: require("./res/servers-eu-test.json"),
    listenHostname: "127.0.0.16"
  },
  "KR-TEST": {
    url: "http://tera.nexon.com/launcherOpenTest/sls/servers/list.xml",
    hostname: "tera.nexon.com",
    port: 80,
    customServers: require('./res/servers-kr-test.json'),
    listenHostname: "127.0.0.17"
  },
  "RU-TEST": {
    url: "http://ptr.tera-online.ru/launcher/sls/",
    hostname: "ptr.tera-online.ru",
    address: "91.225.237.2",
    port: 80,
    customServers: require("./res/servers-ru-test.json"),
    listenHostname: "127.0.0.19"
  },
  "PS4-NA": {
    console: true,
    customServers: require('./res/servers-ps4-na.json')
  },
  "PS4-EU": {
    console: true,
    customServers: require('./res/servers-ps4-eu.json')
  },
  "XBONE-NA": {
    console: true,
    customServers: require('./res/servers-xbone-na.json')
  },
  "XBONE-EU": {
    console: true,
    customServers: require('./res/servers-xbone-eu.json')
  }
};
