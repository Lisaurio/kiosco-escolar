const app = require('./src/backend/app');
const os = require('os');

const PORT = process.env.PORT || 3000;

function getNetworkIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

app.listen(PORT, '0.0.0.0', () => {
  const ip = getNetworkIP();
  console.log('============================================');
  console.log('  KIOSCO ESCOLAR - PWA');
  console.log('============================================');
  console.log(`  Local:     http://localhost:${PORT}`);
  console.log(`  Red:       http://${ip}:${PORT}`);
  console.log('============================================');
  console.log('  Mostrá http://${ip}:${PORT} en tu celular');
  console.log('  (misma red WiFi)');
  console.log('============================================');
});
