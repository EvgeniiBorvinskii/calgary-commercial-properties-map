module.exports = {
  apps: [
    {
      name: 'calgary-properties',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3052',
      cwd: '/srv/calgary.ypilo.com',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3052,
        HOSTNAME: '0.0.0.0'
      }
    },
    {
      name: 'calgary-update-cron',
      script: './scripts/update-properties-optimized.js',
      cwd: '/srv/calgary.ypilo.com',
      cron_restart: '0 0,12 * * *', // 00:00 и 12:00 каждый день
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
