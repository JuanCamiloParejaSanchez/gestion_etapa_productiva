// Ruta: src/modulos/aprendiz/servicios/servicioCorreo.js
// Propósito: Maneja el envío de correos electrónicos para toda la aplicación

const nodemailer = require('nodemailer');
require('dotenv').config();

const servicioCorreo = {
    transporter: null,

    inicializar() {
        const config = {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        };

        // Configuración específica para Gmail
        if (process.env.SMTP_HOST === 'smtp.gmail.com') {
            config.secure = false; // Gmail usa STARTTLS en puerto 587
            config.requireTLS = true;
            config.tls = {
                ciphers: 'SSLv3',
                rejectUnauthorized: false // Solo para desarrollo
            };
        }

        // Configuración para desarrollo (permitir certificados autofirmados)
        if (process.env.NODE_ENV === 'development') {
            config.tls = {
                ...config.tls,
                rejectUnauthorized: false
            };
        }

        this.transporter = nodemailer.createTransport(config);
    },

    /**
     * Envía un código de verificación por correo electrónico
     * @param {string} email - Email del destinatario
     * @param {string} codigo - Código de verificación
     * @returns {Promise<Object>} Resultado del envío
     */
    async enviarCodigoVerificacion(email, codigo) {
        if (!this.transporter) {
            this.inicializar();
        }

        const mailOptions = {
            from: `"SENA - Centro de Servicios de Salud" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Código de Verificación - SENA Etapa Productiva',
            html: `
                <div style="font-family: Arial, sans-serif; padding:20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #39a900;">Código de Verificación</h2>
                    <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar:</p>
                    
                    <div style="margin: 30px text-align: center;">
                        <div style="background-color: #f8f9fa; 
                                    border: 2px solid #39a900; 
                                    border-radius: 10px; 
                                    padding: 20px; 
                                    display: inline-block;
                                    font-size: 24px; 
                                    font-weight: bold; 
                                    letter-spacing: 5px; 
                                    color: #39a900;">
                            ${codigo}
                        </div>
                    </div>
                    
                    <p><strong>Importante:</strong></p>
                    <ul>
                        <li>Este código expirará en 10 minutos por motivos de seguridad.</li>
                        <li>No compartas este código con nadie.</li>
                        <li>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</li>
                    </ul>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">
                        Este es un correo automático del Sistema de Gestión de Etapa Productiva - SENA.<br>
                        Por favor no responder a este mensaje.
                    </p>
                </div>
            `
        };

        try {
            const resultado = await this.transporter.sendMail(mailOptions);
            return resultado;
        } catch (error) {
            console.error('Error al enviar código de verificación:', error);
            throw new Error('Error al enviar el código de verificación');
        }
    },

    async enviarCorreoRecuperacion(email, resetUrl) {
        if (!this.transporter) {
            this.inicializar();
        }

        const mailOptions = {
            from: `"SENA - Centro de Servicios de Salud" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Recuperación de Contraseña - SENA Etapa Productiva',
            html: `
                <div style="font-family: Arial, sans-serif; padding:20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #39a900;">Recuperación de Contraseña</h2>
                    <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
                    <div style="margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #39a900; 
                                  color: white; 
                                  padding: 12px 25px; 
                                  text-decoration: none; 
                                  border-radius: 5px;
                                  display: inline-block;">
                            Restablecer Contraseña
                        </a>
                    </div>
                    <p>Este enlace expirará en 1 hora por motivos de seguridad.</p>
                    <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">
                        Este es un correo automático del Sistema de Gestión de Etapa Productiva - SENA.<br>
                        Por favor no responder a este mensaje.
                    </p>
                </div>
            `
        };

        try {
            const resultado = await this.transporter.sendMail(mailOptions);
            return resultado;
        } catch (error) {
            console.error('Error al enviar correo de recuperación:', error);
            throw new Error('Error al enviar el correo de recuperación');
        }
    },

    /**
     * Prueba la conexión SMTP y loguea el resultado
     */
    async testConexionSMTP() {
        if (!this.transporter) {
            this.inicializar();
        }
        try {
            await this.transporter.verify();
            console.log('✅ Conexión SMTP exitosa.');
        } catch (error) {
            console.error('❌ Error de conexión SMTP:', error);
        }
    },

    async enviarResumenAlertas(email, alertas) {
        if (!this.transporter) {
            this.inicializar();
        }
        if (!email || !Array.isArray(alertas) || alertas.length === 0) return;
        const htmlAlertas = alertas.map(a => `<li>${a.mensaje}</li>`).join('');
        const mailOptions = {
            from: `"SENA - Centro de Servicios de Salud" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Alertas de tu etapa productiva - SENA',
            html: `
                <div style="font-family: Arial, sans-serif; padding:20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #39a900;">Tienes nuevas alertas en tu etapa productiva</h2>
                    <ul style="font-size: 16px; color: #333;">
                        ${htmlAlertas}
                    </ul>
                    <p style="color: #666; font-size: 12px;">
                        Este es un correo automático del Sistema de Gestión de Etapa Productiva - SENA.<br>
                        Por favor no responder a este mensaje.
                    </p>
                </div>
            `
        };
        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error al enviar correo de alertas:', error);
        }
    },

    /**
     * Envía un resumen de alertas a múltiples destinatarios con mensajes personalizados
     * @param {Array<Object>} destinatarios - Array de objetos {email, esInstructor, nombreAprendiz}
     * @param {Array} alertas - Array de objetos de alertas
     * @returns {Promise<void>}
     */
    async enviarResumenAlertasMultiples(destinatarios, alertas) {
        if (!this.transporter) {
            this.inicializar();
        }
        if (!destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0 || !Array.isArray(alertas) || alertas.length === 0) return;

        const htmlAlertas = alertas.map(a => `<li>${a.mensaje}</li>`).join('');

        // Verificar si hay instructor en los destinatarios
        const hayInstructor = destinatarios.some(dest => dest.esInstructor);

        for (const destinatario of destinatarios) {
            const { email, esInstructor, nombreAprendiz } = destinatario;

            const subject = esInstructor
                ? `Alertas de ${nombreAprendiz} en su etapa productiva - SENA`
                : 'Alertas de tu etapa productiva - SENA';

            const htmlContent = esInstructor
                ? `
                    <div style="font-family: Arial, sans-serif; padding:20px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #39a900;">El aprendiz ${nombreAprendiz} tiene nuevas alertas en su etapa productiva</h2>
                        <ul style="font-size: 16px; color: #333;">
                            ${htmlAlertas}
                        </ul>
                        <p style="color: #666; font-size: 12px;">
                            Este es un correo automático del Sistema de Gestión de Etapa Productiva - SENA.<br>
                            Por favor no responder a este mensaje.
                        </p>
                    </div>
                `
                : `
                    <div style="font-family: Arial, sans-serif; padding:20px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #39a900;">Tienes nuevas alertas en tu etapa productiva</h2>
                        <ul style="font-size: 16px; color: #333;">
                            ${htmlAlertas}
                        </ul>
                        ${hayInstructor ? `
                            <div style="background-color: #e8f5e8; border: 1px solid #4caf50; border-radius: 5px; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; color: #2e7d32; font-size: 14px;">
                                    <strong>ℹ️ Información:</strong> Se ha enviado una copia de este correo a tu instructor(a) responsable de etapa productiva para que pueda apoyarte en la resolución de estas alertas.
                                </p>
                            </div>
                        ` : ''}
                        <p style="color: #666; font-size: 12px;">
                            Este es un correo automático del Sistema de Gestión de Etapa Productiva - SENA.<br>
                            Por favor no responder a este mensaje.
                        </p>
                    </div>
                `;

            const mailOptions = {
                from: `"SENA - Centro de Servicios de Salud" <${process.env.SMTP_USER}>`,
                to: email,
                subject: subject,
                html: htmlContent
            };

            try {
                await this.transporter.sendMail(mailOptions);
                console.log(`Correo enviado a ${email} (${esInstructor ? 'instructor' : 'aprendiz'}) para ${nombreAprendiz}`);
            } catch (error) {
                console.error(`Error al enviar correo a ${email}:`, error);
            }
        }
    }
};

module.exports = servicioCorreo;