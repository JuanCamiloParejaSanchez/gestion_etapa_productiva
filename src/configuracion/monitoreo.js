/* Ruta: src/configuracion/monitoreo.js */
/* Propósito: Sistema de monitoreo y métricas de aplicación */

const os = require('os');
const { logger } = require('../compartido/utilidades/logger');

// Métricas de aplicación
class MetricasApp {
    constructor() {
        this.metricas = {
            requests: {
                total: 0,
                porRuta: new Map(),
                porMetodo: new Map(),
                errores: 0,
                tiempoRespuesta: []
            },
            database: {
                conexionesActivas: 0,
                consultasTotal: 0,
                consultasLentas: 0,
                tiempoConsultas: []
            },
            memoria: {
                usoActual: 0,
                picos: [],
                liberaciones: 0
            },
            sistema: {
                uptime: 0,
                cpu: 0,
                memoriaLibre: 0
            }
        };

        // Iniciar monitoreo periódico
        this.iniciarMonitoreo();
    }

    // Middleware para rastrear requests
    middlewareRequest(req, res, next) {
        const inicio = Date.now();
        const ruta = req.route ? req.route.path : req.path;
        const metodo = req.method;

        // Incrementar contador total
        this.metricas.requests.total++;

        // Rastrear por ruta
        const claveRuta = `${metodo} ${ruta}`;
        this.metricas.requests.porRuta.set(
            claveRuta,
            (this.metricas.requests.porRuta.get(claveRuta) || 0) + 1
        );

        // Rastrear por método
        this.metricas.requests.porMetodo.set(
            metodo,
            (this.metricas.requests.porMetodo.get(metodo) || 0) + 1
        );

        // Monitorear respuesta
        res.on('finish', () => {
            const duracion = Date.now() - inicio;

            // Registrar tiempo de respuesta
            this.metricas.requests.tiempoRespuesta.push(duracion);

            // Mantener solo últimas 1000 mediciones
            if (this.metricas.requests.tiempoRespuesta.length > 1000) {
                this.metricas.requests.tiempoRespuesta.shift();
            }

            // Contar errores
            if (res.statusCode >= 400) {
                this.metricas.requests.errores++;
            }

            // Log de requests lentos
            if (duracion > 5000) { // 5 segundos
                logger.warn('Request lento detectado', {
                    metodo,
                    ruta,
                    duracion,
                    statusCode: res.statusCode,
                    ip: req.ip
                });
            }
        });

        next();
    }

    // Actualizar métricas de base de datos
    actualizarMetricaBD(tipo, valor) {
        switch (tipo) {
            case 'conexion_activa':
                this.metricas.database.conexionesActivas = valor;
                break;
            case 'consulta_ejecutada':
                this.metricas.database.consultasTotal++;
                if (valor > 1000) { // Consulta lenta (>1s)
                    this.metricas.database.consultasLentas++;
                }
                this.metricas.database.tiempoConsultas.push(valor);
                if (this.metricas.database.tiempoConsultas.length > 100) {
                    this.metricas.database.tiempoConsultas.shift();
                }
                break;
        }
    }

    // Monitoreo de memoria
    monitorearMemoria() {
        const usoMemoria = process.memoryUsage();
        const usoMB = Math.round(usoMemoria.heapUsed / 1024 / 1024);

        this.metricas.memoria.usoActual = usoMB;

        // Detectar picos de memoria
        if (this.metricas.memoria.picos.length === 0 ||
            usoMB > Math.max(...this.metricas.memoria.picos)) {
            this.metricas.memoria.picos.push(usoMB);
            if (this.metricas.memoria.picos.length > 10) {
                this.metricas.memoria.picos.shift();
            }
        }

        // Alerta si uso de memoria es alto
        if (usoMB > 500) { // 500MB
            logger.warn('Uso alto de memoria detectado', {
                usoMB,
                limite: 500
            });
        }

        return usoMB;
    }

    // Monitoreo del sistema
    monitorearSistema() {
        this.metricas.sistema.uptime = process.uptime();
        this.metricas.sistema.cpu = os.loadavg()[0]; // Load average 1min
        this.metricas.sistema.memoriaLibre = Math.round(os.freemem() / 1024 / 1024); // MB

        // Alertas del sistema
        if (this.metricas.sistema.cpu > 2) {
            logger.warn('CPU alta detectada', {
                cpu: this.metricas.sistema.cpu,
                limite: 2
            });
        }

        if (this.metricas.sistema.memoriaLibre < 100) { // Menos de 100MB
            logger.warn('Memoria baja en el sistema', {
                memoriaLibre: this.metricas.sistema.memoriaLibre,
                limite: 100
            });
        }
    }

    // Iniciar monitoreo periódico
    iniciarMonitoreo() {
        // Monitoreo cada 30 segundos
        setInterval(() => {
            this.monitorearMemoria();
            this.monitorearSistema();
        }, 30000);

        // Log de métricas cada 5 minutos
        setInterval(() => {
            this.logMetricasPeriodicas();
        }, 5 * 60 * 1000);
    }

    // Log de métricas periódicas
    logMetricasPeriodicas() {
        const tiempoPromedioRespuesta = this.calcularPromedio(this.metricas.requests.tiempoRespuesta);
        const tiempoPromedioBD = this.calcularPromedio(this.metricas.database.tiempoConsultas);

        logger.info('Métricas periódicas', {
            requests: {
                total: this.metricas.requests.total,
                errores: this.metricas.requests.errores,
                tiempoPromedioRespuesta: Math.round(tiempoPromedioRespuesta),
                rutasMasUsadas: Array.from(this.metricas.requests.porRuta.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
            },
            database: {
                conexionesActivas: this.metricas.database.conexionesActivas,
                consultasTotal: this.metricas.database.consultasTotal,
                consultasLentas: this.metricas.database.consultasLentas,
                tiempoPromedioConsultas: Math.round(tiempoPromedioBD)
            },
            memoria: {
                usoActual: this.metricas.memoria.usoActual,
                picoMaximo: Math.max(...this.metricas.memoria.picos)
            },
            sistema: {
                uptime: Math.round(this.metricas.sistema.uptime / 3600), // horas
                cpu: this.metricas.sistema.cpu.toFixed(2),
                memoriaLibre: this.metricas.sistema.memoriaLibre
            }
        });
    }

    // Calcular promedio de array
    calcularPromedio(arr) {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    // Obtener métricas actuales
    obtenerMetricas() {
        return {
            timestamp: new Date().toISOString(),
            ...this.metricas,
            calculados: {
                tiempoPromedioRespuesta: this.calcularPromedio(this.metricas.requests.tiempoRespuesta),
                tiempoPromedioBD: this.calcularPromedio(this.metricas.database.tiempoConsultas),
                tasaError: this.metricas.requests.total > 0 ?
                    (this.metricas.requests.errores / this.metricas.requests.total) * 100 : 0,
                picoMemoriaMaximo: Math.max(...this.metricas.memoria.picos) || 0
            }
        };
    }

    // Resetear métricas
    resetearMetricas() {
        this.metricas = {
            requests: {
                total: 0,
                porRuta: new Map(),
                porMetodo: new Map(),
                errores: 0,
                tiempoRespuesta: []
            },
            database: {
                conexionesActivas: 0,
                consultasTotal: 0,
                consultasLentas: 0,
                tiempoConsultas: []
            },
            memoria: {
                usoActual: 0,
                picos: [],
                liberaciones: 0
            },
            sistema: {
                uptime: 0,
                cpu: 0,
                memoriaLibre: 0
            }
        };

        logger.info('Métricas reseteadas');
    }
}

// Instancia global de métricas
const metricasApp = new MetricasApp();

// Health check endpoint
function healthCheck(req, res) {
    const metricas = metricasApp.obtenerMetricas();

    // Verificar estado del sistema
    const estado = {
        status: 'healthy',
        timestamp: metricas.timestamp,
        uptime: metricas.sistema.uptime,
        memoria: {
            uso: metricas.memoria.usoActual,
            pico: metricas.calculados.picoMemoriaMaximo
        },
        database: {
            conexiones: metricas.database.conexionesActivas,
            consultas: metricas.database.consultasTotal
        },
        requests: {
            total: metricas.requests.total,
            errores: metricas.requests.errores,
            tiempoPromedio: Math.round(metricas.calculados.tiempoPromedioRespuesta)
        }
    };

    // Verificar condiciones de unhealthy
    if (metricas.memoria.usoActual > 800 || // 800MB
        metricas.calculados.tasaError > 10 || // 10% errores
        metricas.database.conexionesActivas > 50) { // Demasiadas conexiones
        estado.status = 'unhealthy';
        res.status(503);
    }

    res.json(estado);
}

// Middleware de health check con métricas detalladas
function metricsEndpoint(req, res) {
    const metricas = metricasApp.obtenerMetricas();

    // Verificar autenticación básica
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ error: 'Autenticación requerida' });
    }

    // Aquí se podría agregar verificación de credenciales
    // Por ahora, solo devolvemos las métricas

    res.json(metricas);
}

// Función para alertas automáticas
function verificarAlertas() {
    const metricas = metricasApp.obtenerMetricas();

    const alertas = [];

    // Alerta de memoria alta
    if (metricas.memoria.usoActual > 600) {
        alertas.push({
            tipo: 'memoria_alta',
            nivel: 'warning',
            mensaje: `Uso de memoria alto: ${metricas.memoria.usoActual}MB`,
            valor: metricas.memoria.usoActual
        });
    }

    // Alerta de tasa de error alta
    if (metricas.calculados.tasaError > 5) {
        alertas.push({
            tipo: 'tasa_error_alta',
            nivel: 'error',
            mensaje: `Tasa de error alta: ${metricas.calculados.tasaError.toFixed(2)}%`,
            valor: metricas.calculados.tasaError
        });
    }

    // Alerta de CPU alta
    if (metricas.sistema.cpu > 1.5) {
        alertas.push({
            tipo: 'cpu_alta',
            nivel: 'warning',
            mensaje: `Uso de CPU alto: ${metricas.sistema.cpu.toFixed(2)}`,
            valor: metricas.sistema.cpu
        });
    }

    // Alerta de conexiones de BD altas
    if (metricas.database.conexionesActivas > 20) {
        alertas.push({
            tipo: 'conexiones_bd_altas',
            nivel: 'warning',
            mensaje: `Conexiones de BD altas: ${metricas.database.conexionesActivas}`,
            valor: metricas.database.conexionesActivas
        });
    }

    // Log de alertas
    alertas.forEach(alerta => {
        logger.warn('Alerta del sistema', alerta);
    });

    return alertas;
}

// Iniciar verificación periódica de alertas
setInterval(verificarAlertas, 60000); // Cada minuto

module.exports = {
    MetricasApp,
    metricasApp,
    healthCheck,
    metricsEndpoint,
    verificarAlertas
};