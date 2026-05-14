module.exports = {
  apps : [{
    name: "samabutik-app",
    script: "dist/server.cjs",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    instances: 1,
    exec_mode: "fork",
    max_memory_restart: "1G",
    autorestart: true,
    watch: false,
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss"
  }]
};
