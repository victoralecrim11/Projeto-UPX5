import { config } from '../config.js';
import { resetDatabase } from './store.js';

resetDatabase();
console.log(`Banco restaurado com os dados de demonstração em ${config.dbFile}`);
