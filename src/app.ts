import express from 'express';
import healthRouter from './presentation/routes/health.route';

const app = express();

app.use(express.json());
app.use(healthRouter);

export default app;
