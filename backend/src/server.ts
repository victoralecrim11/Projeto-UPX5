import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

// Só inicia o servidor localmente se NÃO estiver na Vercel
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`EcoIA API rodando em http://localhost:${config.port}/api`);
    console.log(`Banco de dados (JSON): ${config.dbFile}`);
  });
}

// Exporta a app para a Vercel conseguir processar os pedidos
export default app;