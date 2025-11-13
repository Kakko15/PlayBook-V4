import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'PlayBook API is running successfully!',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superAdminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(port, () => {
  console.log(`[PlayBook] Backend server is running at http://localhost:${port}`);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '[WARNING] Supabase keys are not set. Please create a .env file based on .env.example'
    );
  } else {
    console.log('\x1b[32m%s\x1b[0m', '[PlayBook] Supabase client connected.');
  }
});