import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/environment.js';
import securityHeaders from './middlewares/securityHeaders.js';
import errorHandler from './middlewares/errorHandler.js';
import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => {
    console.error('Database connection failed. Ensuring application fails closed or logs errors correctly.');
    console.error(err.message);
  });

const app = express();
const PORT = config.PORT;
const HOST = config.HOST;

const allowedOrigins = [
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(cookieParser());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(securityHeaders);

app.use('/api', apiRoutes);

// Serve static assets
const distPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.use(errorHandler);

if (process.env.NODE_ENV === 'production') {
  app.listen(PORT, () => {
    console.log(`CivicPilot Backend listening securely on port ${PORT}`);
  });
} else {
  app.listen(PORT, HOST, () => {
    console.log(`CivicPilot Backend listening securely on http://${HOST}:${PORT}`);
  });
}