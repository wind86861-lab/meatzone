module.exports = {
  apps: [
    // ── Production ─────────────────────────────────────────────────────────────
    {
      name: 'vipstroy',
      script: './server/index.js',
      cwd: './',
      // Use 'max' for cluster mode (CPU count) or set a fixed number.
      // Keep at 1 if the Telegram bot runs inside the same process (polling mode).
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      exp_backoff_restart_delay: 100,
      restart_delay: 3000,
      max_restarts: 20,
      min_uptime: '10s',
      kill_timeout: 8000,
      listen_timeout: 10000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      // Load .env automatically
      node_args: '-r dotenv/config',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DOTENV_CONFIG_PATH: './.env',
      },
    },

    // ── Development (optional: pm2 start ecosystem.config.js --env development) ─
    {
      name: 'vipstroy-dev',
      script: './server/index.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: ['server'],
      watch_delay: 1000,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      max_memory_restart: '300M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-dev-error.log',
      out_file: './logs/pm2-dev-out.log',
      merge_logs: true,
      node_args: '-r dotenv/config',
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
        DOTENV_CONFIG_PATH: './.env',
      },
    },
  ],
}
