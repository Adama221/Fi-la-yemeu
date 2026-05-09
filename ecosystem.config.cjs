module.exports = {
  apps: [
    {
      name: "samabutik",
      script: "./dist/server.cjs",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "1G",
      restart_delay: 4000,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
