import createApp from './app';

const port = Number(process.env.PORT) || 3000;

const log = (message: string): void => {
  console.log(`[api] ${new Date().toISOString()} ${message}`);
};

const app = createApp();

const server = app.listen(port, '0.0.0.0', () => {
  log(`listening on 0.0.0.0:${port}`);
  log(`READY — open http://localhost:${port}`);
  log('try: curl http://localhost:3000/api/hotels?city=delhi');
});

server.on('error', (err) => {
  console.error(`[api] ${new Date().toISOString()} FAILED to start — ${err.message}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down');
  server.close(() => process.exit(0));
});
