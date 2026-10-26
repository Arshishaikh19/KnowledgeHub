import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { connectDB } from './config/db';
import { initStorage } from './config/storage';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  // 1. Initialize local storage directory
  initStorage();

  // 2. Start Express server immediately
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🧠 KnowledgeHub Express API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Docs:   http://localhost:${PORT}/api/documents`);
    console.log(`====================================================`);
  });

  // 3. Connect to MongoDB (IPv4 127.0.0.1)
  await connectDB();
}

startServer();
