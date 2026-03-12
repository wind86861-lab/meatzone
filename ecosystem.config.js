module.exports = {
  apps: [{
    name: 'pneumax',
    script: './server/index.js',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '400M',
    exp_backoff_restart_delay: 100,
    restart_delay: 3000,
    max_restarts: 20,
    min_uptime: '10s',
    kill_timeout: 5000,
    listen_timeout: 8000,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
