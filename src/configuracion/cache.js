const redis = require('redis');

// Configuración de Redis
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis connection refused');
            return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            console.error('Redis max attempts reached');
            return undefined;
        }
        // Reintentar en milisegundos
        return Math.min(options.attempt * 100, 3000);
    }
});

// Eventos de Redis
redisClient.on('connect', () => {
    console.log('✅ Conectado a Redis');
});

redisClient.on('error', (err) => {
    console.error('❌ Error de Redis:', err);
});

redisClient.on('ready', () => {
    console.log('✅ Redis listo para usar');
});

redisClient.on('end', () => {
    console.log('🔌 Conexión a Redis cerrada');
});

// Función para verificar si Redis está disponible
const isRedisAvailable = () => {
    return redisClient.connected;
};

// Cache wrapper
const Cache = {
    // Obtener valor del cache
    async get(key) {
        try {
            if (!isRedisAvailable()) {
                console.warn('Redis no disponible, omitiendo cache');
                return null;
            }
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Error obteniendo de cache:', error);
            return null;
        }
    },

    // Establecer valor en cache
    async set(key, value, ttl = 3600) {
        try {
            if (!isRedisAvailable()) {
                console.warn('Redis no disponible, omitiendo cache');
                return false;
            }
            await redisClient.setex(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error guardando en cache:', error);
            return false;
        }
    },

    // Eliminar clave del cache
    async del(key) {
        try {
            if (!isRedisAvailable()) {
                return false;
            }
            await redisClient.del(key);
            return true;
        } catch (error) {
            console.error('Error eliminando de cache:', error);
            return false;
        }
    },

    // Limpiar todo el cache
    async flush() {
        try {
            if (!isRedisAvailable()) {
                return false;
            }
            await redisClient.flushall();
            return true;
        } catch (error) {
            console.error('Error limpiando cache:', error);
            return false;
        }
    },

    // Obtener o establecer (cache miss)
    async getOrSet(key, getterFn, ttl = 3600) {
        let cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }

        const fresh = await getterFn();
        if (fresh !== null && fresh !== undefined) {
            await this.set(key, fresh, ttl);
        }

        return fresh;
    }
};

// Función para cerrar conexión de Redis
const closeRedis = async () => {
    try {
        if (redisClient.connected) {  // Verificar si está conectado
            await redisClient.quit();
            console.log('🔌 Redis desconectado correctamente');
        } else {
            console.log('🔌 Redis ya estaba desconectado');
        }
    } catch (error) {
        console.error('Error cerrando Redis:', error);
    }
};

// Manejar cierre de aplicación
process.on('SIGINT', async () => {
    await closeRedis();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeRedis();
    process.exit(0);
});

module.exports = {
    redisClient,
    Cache,
    isRedisAvailable,
    closeRedis
};