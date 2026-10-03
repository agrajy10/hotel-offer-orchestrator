import express, { Express } from 'express';
import suppliersRouter from './routes/suppliers';

export const createApp = (): Express => {
  const app = express();

  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({ message: 'Hotel Offer Orchestrator' });
  });

  app.use(suppliersRouter);

  return app;
};

export default createApp;
