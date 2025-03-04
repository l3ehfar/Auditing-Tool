module.exports = {
  apps: [
    {
      name: 'auditing',
      script: 'serve',
      env: {
        PM2_SERVE_PATH: './auditing/build',
        PM2_SERVE_PORT: 3004,
        PM2_SERVE_SPA: true,
        PM2_SERVE_HOMEPAGE: '/index.html',
      },
    },
    {
      name: 'auditing/api',
      script: 'npm',
      args: 'run backend',
      cwd: './auditing',
      env: {
        DEBUG: true,
        NODE_ENV: 'production',
        PORT: 3034,
        MONGODB_URL: 'mongodb://127.0.0.1:27017/auditing',
      },
    },
  ],
};
