import express, { Express } from 'express';
import hotelsRouter from './routes/hotels';
import suppliersRouter from './routes/suppliers';

export const createApp = (): Express => {
  const app = express();

  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({ message: 'Hotel Offer Orchestrator' });
  });

  app.use(hotelsRouter);
  app.use(suppliersRouter);

  return app;
};

export default createApp;
