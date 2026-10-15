import express from 'express';
import cors from 'cors';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'focusdeck-api' });
});

app.use('/api', routes);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`FocusDeck API listening on http://localhost:${config.port}`);
});
