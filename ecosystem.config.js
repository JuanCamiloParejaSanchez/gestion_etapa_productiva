module.exports = {
  apps: [
    {
      name: 'gestion-etapa-productiva',
      script: 'src/servidor.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      // Configuración de reinicio automático
      restart_delay: 4000,
      max_restarts: 5,
      min_uptime: '10s',
      // Configuración de cluster (para producción)
      exec_mode: 'fork', // Cambiar a 'cluster' para múltiples instancias
      // Variables de entorno específicas
      env_development: {
        LOG_LEVEL: 'debug',
        WATCH_FILES: true
      }
    },
    {
      name: 'gestion-etapa-productiva-dev',
      script: 'src/servidor.js',
      instances: 1,
      autorestart: true,
      watch: ['src', 'views', 'public'],
      ignore_watch: ['node_modules', 'logs', 'tests', 'docs'],
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        LOG_LEVEL: 'debug'
      },
      error_file: './logs/pm2-dev-error.log',
      out_file: './logs/pm2-dev-out.log',
      log_file: './logs/pm2-dev-combined.log',
      // Configuración especial para desarrollo
      watch_options: {
        followSymlinks: false,
        usePolling: true,
        interval: 1000
      },
      // Reinicio automático en cambios
      restart_delay: 1000
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/gestion-etapa-productiva.git',
      path: '/var/www/gestion-etapa-productiva',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};