module.exports = {
  apps: [
    {
      name: 'backend-prod',
      script: './dist/main.js',
      cwd: '/home/azureuser/apps/production/backend',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '/home/azureuser/apps/production/backend/.env',
      error_file: '/home/azureuser/apps/production/logs/backend-error.log',
      out_file: '/home/azureuser/apps/production/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};

