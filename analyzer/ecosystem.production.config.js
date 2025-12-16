module.exports = {
  apps: [
    {
      name: "analyzer-prod",
      script: "./server",
      cwd: "/home/ubuntu/apps/production/analyzer",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env: {
        PORT: 8080,
        SHARED_WORKSPACE_PATH: "/tmp/shared/workspaces",
        RUST_LOG: "info",
        PATH: "/home/ubuntu/.cargo/bin:/usr/local/bin:/usr/bin:/bin",
      },
      error_file: "/home/ubuntu/apps/production/logs/analyzer-error.log",
      out_file: "/home/ubuntu/apps/production/logs/analyzer-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      min_uptime: "10s",
      max_restarts: 10,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
