const chunks = [];
const _exitRegexSpaces = / +/g;
const _exitRegex = /\[(.+?)\]/;

function onNetStatExit(port) {
  const lines = Buffer.concat(chunks).toString().split("\n");

  for (let i = 0, len = lines.length; i < len; ++i)
    lines[i] = lines[i].trim().replace(_exitRegexSpaces, " ").split(" ");

  for (let i = 0, len = lines.length; i < len; ++i) {
    let line = lines[i];
    const isBlankTCP = line[0] === "TCP" && line[1] === "0.0.0.0:" + port && line[2] === "0.0.0.0:0";
    if (!isBlankTCP) continue;
    let proc;
    for (let j = 0; j < 3; ++j) {
      if (!lines[++i] || lines[i].length !== 1) break;
      if (proc = _exitRegex.exec(lines[i])) {
        proc = proc[1];
        break;
      }
    }
    console.log((proc || "unknown") + ":" + line[4]);
  }

  process.exit();
}

function handleDataStream(data) {
  chunks[chunks.length] = data;
}

function callNetStat(port) {
  let netstat = require("child_process").spawn("netstat", ["-abno", "-p", "TCP"]);
  netstat.stdout.on("data", handleDataStream);
  netstat.on("exit", () => { onNetStatExit(port); });
}

module.exports = callNetStat;
