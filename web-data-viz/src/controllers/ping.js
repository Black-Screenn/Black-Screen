const { createConnection } = require("node:net");

async function pingTcp(attempts = 10, timeout = 3000) {
  const results = [];

  const ip = process.env.DB_HOST;
  const port = parseInt(process.env.DB_PORT) || 3306;

  for (let i = 0; i < attempts; i++) {
    const start = performance.now();
    const socket = createConnection(port, ip);
    socket.setTimeout(timeout);

    const rtt = await new Promise((resolve) => {
      function finish(value) {
        socket.destroy();
        resolve(value);
      }
      socket.on("connect", () => finish(performance.now() - start));
      socket.on("timeout", () => finish(-1));
      socket.on("error", () => finish(-1));
    });

    results.push(rtt);
  }

  const ok = results.filter((r) => r >= 0);
  return {
    latencia: ok.length
      ? (ok.reduce((a, b) => a + b, 0) / ok.length).toFixed(2)
      : null,
    perda: (((attempts - ok.length) / attempts) * 100).toFixed(1),
  };
}
module.exports = {
  pingTcp,
};
