const app = require('./src/backend/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Kiosco Escolar iniciado en http://localhost:${PORT}`);
});
