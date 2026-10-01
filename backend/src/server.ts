import { createApp } from './app.js';
import { config } from './config.js';

createApp().listen(config.port, () => {
  console.log(`EcoIA API rodando em http://localhost:${config.port}/api`);
  console.log(`Banco de dados (JSON): ${config.dbFile}`);
});
