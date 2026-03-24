/**
 * Servicio de Correo Electrónico
 * Gestiona el envío de correos electrónicos del sistema usando Nodemailer
 */

const nodemailer = require('nodemailer');
const { logger } = require('../utilidades/logger');

/**
 * Configuración del transportador de correo
 */
let transporter = null;

/**
 * Inicializa el transportador de correo con la configuración del .env
 */
function inicializarTransportador() {
    if (transporter) {
        return transporter;
    }

    try {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true para puerto 465, false para otros puertos
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false // Para desarrollo, en producción debería ser true
            }
        });

        logger.info('Transportador de correo inicializado correctamente');
        return transporter;
    } catch (error) {
        logger.error('Error al inicializar transportador de correo:', error);
        return null;
    }
}

/**
 * Verifica la conexión con el servidor SMTP
 * @returns {Promise<boolean>} - true si la conexión es exitosa
 */
async function verificarConexion() {
    try {
        const trans = inicializarTransportador();
        if (!trans) {
            logger.warn('No se pudo inicializar el transportador de correo');
            return false;
        }

        await trans.verify();
        logger.info('Conexión SMTP verificada correctamente');
        return true;
    } catch (error) {
        logger.error('Error al verificar conexión SMTP:', error);
        return false;
    }
}

/**
 * Envía un correo electrónico genérico
 * @param {Object} opciones - Opciones del correo
 * @param {string} opciones.para - Destinatario del correo
 * @param {string} opciones.asunto - Asunto del correo
 * @param {string} opciones.texto - Texto plano del correo
 * @param {string} opciones.html - HTML del correo
 * @param {Array<Object>} [opciones.adjuntos] - Archivos adjuntos para el correo
 * @returns {Promise<Object>} - Resultado del envío
 */
async function enviarCorreo({ para, asunto, texto, html, adjuntos = [] }) {
    try {
        const trans = inicializarTransportador();
        if (!trans) {
            throw new Error('No se pudo inicializar el transportador de correo');
        }

        const mailOptions = {
            from: `"Sistema Etapa Productiva SENA" <${process.env.SMTP_USER}>`,
            to: para,
            subject: asunto,
            text: texto,
            html: html,
            attachments: adjuntos
        };

        const resultado = await trans.sendMail(mailOptions);
        
        logger.info('Correo enviado exitosamente', {
            para,
            asunto,
            messageId: resultado.messageId
        });

        return {
            success: true,
            messageId: resultado.messageId
        };
    } catch (error) {
        logger.error('Error al enviar correo:', {
            error: error.message,
            para,
            asunto
        });

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Envía un correo de notificación de documento aprobado
 * @param {Object} datos - Datos del correo
 * @param {string} datos.correoAprendiz - Email del aprendiz
 * @param {string} datos.nombreAprendiz - Nombre del aprendiz
 * @param {string} datos.tipoDocumento - Tipo de documento aprobado
 * @param {string} datos.retroalimentacion - Retroalimentación del tutor (opcional)
 * @param {boolean} datos.esReaprobacion - Si es una reaprobación
 * @param {string} datos.archivoAdjuntoPath - Ruta local del adjunto (opcional)
 * @param {string} datos.archivoAdjuntoNombre - Nombre del archivo adjunto (opcional)
 * @returns {Promise<Object>} - Resultado del envío
 */
async function enviarCorreoDocumentoAprobado({
    correoAprendiz,
    nombreAprendiz,
    tipoDocumento,
    retroalimentacion = null,
    esReaprobacion = false,
    archivoAdjuntoPath = null,
    archivoAdjuntoNombre = null
}) {
    const asunto = esReaprobacion 
        ? `✅ Documento reaprobado: ${tipoDocumento}`
        : `✅ Documento aprobado: ${tipoDocumento}`;

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    let mensajeRetroalimentacion = '';
    if (retroalimentacion) {
        mensajeRetroalimentacion = `
            <div style="background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
                <h3 style="color: #1976D2; margin-top: 0;">📝 Comentarios del Tutor:</h3>
                <p style="color: #555; white-space: pre-wrap;">${retroalimentacion}</p>
            </div>
        `;
    }

    const mensajeAdjunto = archivoAdjuntoPath
        ? `<p style="font-size: 14px; color: #0c5460; margin-top: 10px;"><strong>📎 Se adjunta un archivo de apoyo enviado por tu tutor(a).</strong></p>`
        : '';

    const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Documento Aprobado</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background-color: #28a745; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                        ✅ Documento Aprobado
                    </h1>
                </div>

                <!-- Body -->
                <div style="padding: 30px;">
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        Hola <strong>${nombreAprendiz}</strong>,
                    </p>

                    <p style="font-size: 16px; margin-bottom: 20px;">
                        ${esReaprobacion 
                            ? 'Tu documento ha sido <strong>reaprobado</strong> exitosamente por tu tutor(a).'
                            : 'Nos complace informarte que tu documento ha sido <strong>aprobado</strong> exitosamente por tu tutor(a).'
                        }
                    </p>

                    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #155724;">
                            <strong>📄 Documento:</strong> ${tipoDocumento}
                        </p>
                        <p style="margin: 10px 0 0 0; color: #155724;">
                            <strong>✅ Estado:</strong> Aprobado
                        </p>
                    </div>

                    ${mensajeRetroalimentacion}
                    ${mensajeAdjunto}

                    <p style="font-size: 16px; margin: 20px 0;">
                        ${retroalimentacion 
                            ? 'Tu tutor(a) ha dejado algunos comentarios sobre tu documento. Revísalos en el sistema.'
                            : 'Tu documento cumple con todos los requisitos. ¡Excelente trabajo!'
                        }
                    </p>

                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                        Este es un correo automático del Sistema de Gestión de Etapa Productiva del SENA.
                    </p>
                    <p style="font-size: 14px; color: #666; margin-top: 0;">
                        Por favor, no respondas a este correo.
                    </p>
                </hr>

                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0; font-size: 12px; color: #999;">
                        © ${new Date().getFullYear()} SENA - Servicio Nacional de Aprendizaje
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    const texto = `
Hola ${nombreAprendiz},

${esReaprobacion 
    ? 'Tu documento ha sido reaprobado exitosamente por tu tutor(a).'
    : 'Nos complace informarte que tu documento ha sido aprobado exitosamente por tu tutor(a).'
}

Documento: ${tipoDocumento}
Estado: Aprobado

${retroalimentacion ? `Comentarios del Tutor:\n${retroalimentacion}\n` : ''}
${archivoAdjuntoPath ? `Se adjunta un archivo de apoyo enviado por tu tutor(a).\n` : ''}

---
Este es un correo automático del Sistema de Gestión de Etapa Productiva del SENA.
Por favor, no respondas a este correo.
    `.trim();

    const adjuntos = archivoAdjuntoPath
        ? [{
            filename: archivoAdjuntoNombre || 'adjunto',
            path: archivoAdjuntoPath
        }]
        : [];

    return await enviarCorreo({
        para: correoAprendiz,
        asunto,
        texto,
        html,
        adjuntos
    });
}

/**
 * Envía un correo de notificación de documento rechazado
 * @param {Object} datos - Datos del correo
 * @param {string} datos.correoAprendiz - Email del aprendiz
 * @param {string} datos.nombreAprendiz - Nombre del aprendiz
 * @param {string} datos.tipoDocumento - Tipo de documento rechazado
 * @param {string} datos.retroalimentacion - Retroalimentación del tutor
 * @param {boolean} datos.esRerechazo - Si es un re-rechazo
 * @returns {Promise<Object>} - Resultado del envío
 */
async function enviarCorreoDocumentoRechazado({ correoAprendiz, nombreAprendiz, tipoDocumento, retroalimentacion, esRerechazo = false }) {
    const asunto = esRerechazo
        ? `❌ Documento rechazado nuevamente: ${tipoDocumento}`
        : `❌ Documento rechazado: ${tipoDocumento}`;

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Documento Rechazado</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background-color: #dc3545; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                        ⚠️ Documento Rechazado
                    </h1>
                </div>

                <!-- Body -->
                <div style="padding: 30px;">
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        Hola <strong>${nombreAprendiz}</strong>,
                    </p>

                    <p style="font-size: 16px; margin-bottom: 20px;">
                        ${esRerechazo
                            ? 'Lamentablemente, tu documento ha sido <strong>rechazado nuevamente</strong> por tu tutor(a).'
                            : 'Lamentablemente, tu documento <strong>no ha sido aprobado</strong> en esta ocasión.'
                        }
                    </p>

                    <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #721c24;">
                            <strong>📄 Documento:</strong> ${tipoDocumento}
                        </p>
                        <p style="margin: 10px 0 0 0; color: #721c24;">
                            <strong>❌ Estado:</strong> Rechazado
                        </p>
                    </div>

                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                        <h3 style="color: #856404; margin-top: 0;">📝 Retroalimentación del Tutor:</h3>
                        <p style="color: #856404; white-space: pre-wrap; margin-bottom: 0;">${retroalimentacion}</p>
                    </div>

                    <p style="font-size: 16px; margin: 20px 0;">
                        Por favor, revisa la retroalimentación de tu tutor(a), realiza las correcciones necesarias y vuelve a subir el documento.
                    </p>

                    <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #0c5460;">
                            💡 <strong>Tip:</strong> Asegúrate de leer cuidadosamente todos los comentarios antes de hacer las correcciones.
                        </p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                        Este es un correo automático del Sistema de Gestión de Etapa Productiva del SENA.
                    </p>
                    <p style="font-size: 14px; color: #666; margin-top: 0;">
                        Por favor, no respondas a este correo.
                    </p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0; font-size: 12px; color: #999;">
                        © ${new Date().getFullYear()} SENA - Servicio Nacional de Aprendizaje
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    const texto = `
Hola ${nombreAprendiz},

${esRerechazo
    ? 'Lamentablemente, tu documento ha sido rechazado nuevamente por tu tutor(a).'
    : 'Lamentablemente, tu documento no ha sido aprobado en esta ocasión.'
}

Documento: ${tipoDocumento}
Estado: Rechazado

Retroalimentación del Tutor:
${retroalimentacion}

Por favor, revisa la retroalimentación, realiza las correcciones necesarias y vuelve a subir el documento.

---
Este es un correo automático del Sistema de Gestión de Etapa Productiva del SENA.
Por favor, no respondas a este correo.
    `.trim();

    return await enviarCorreo({
        para: correoAprendiz,
        asunto,
        texto,
        html
    });
}

module.exports = {
    inicializarTransportador,
    verificarConexion,
    enviarCorreo,
    enviarCorreoDocumentoAprobado,
    enviarCorreoDocumentoRechazado
};
