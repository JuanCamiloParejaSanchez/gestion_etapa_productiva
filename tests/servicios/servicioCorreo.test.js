const servicioCorreo = require('../../src/modulos/aprendiz/servicios/servicioCorreo');

// Mock de nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: jest.fn().mockResolvedValue(true)
  }))
}));

const nodemailer = require('nodemailer');

describe('ServicioCorreo', () => {
  let mockTransporter;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar variables de entorno para tests
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'testpassword';
    process.env.NODE_ENV = 'test';

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: jest.fn().mockResolvedValue(true)
    };

    nodemailer.createTransport.mockReturnValue(mockTransporter);
    servicioCorreo.transporter = null; // Reset transporter
  });

  afterEach(() => {
    // Limpiar transporter después de cada test
    servicioCorreo.transporter = null;
  });

  describe('inicializar', () => {
    test('debe inicializar el transporter correctamente', () => {
      servicioCorreo.inicializar();

      expect(nodemailer.createTransport).toHaveBeenCalled();
      expect(servicioCorreo.transporter).toBeDefined();
    });

    test('debe configurar correctamente para Gmail', () => {
      servicioCorreo.inicializar();

      const config = nodemailer.createTransport.mock.calls[0][0];
      expect(config.host).toBe('smtp.gmail.com');
      expect(config.port).toBe(587);
      expect(config.secure).toBe(false);
      expect(config.requireTLS).toBe(true);
    });

    test('debe incluir configuración TLS para desarrollo', () => {
      process.env.NODE_ENV = 'development';
      servicioCorreo.inicializar();

      const config = nodemailer.createTransport.mock.calls[0][0];
      expect(config.tls).toBeDefined();
      expect(config.tls.rejectUnauthorized).toBe(false);
    });
  });

  describe('enviarCodigoVerificacion', () => {
    test('debe enviar código de verificación exitosamente', async () => {
      servicioCorreo.inicializar();
      const resultado = await servicioCorreo.enviarCodigoVerificacion('usuario@example.com', '123456');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      expect(resultado.messageId).toBe('test-message-id');

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.to).toBe('usuario@example.com');
      expect(mailOptions.subject).toContain('Código de Verificación');
      expect(mailOptions.html).toContain('123456');
    });

    test('debe incluir información de seguridad en el correo', async () => {
      servicioCorreo.inicializar();
      await servicioCorreo.enviarCodigoVerificacion('usuario@example.com', '123456');

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain('10 minutos');
      expect(mailOptions.html).toContain('No compartas este código');
    });

    test('debe lanzar error cuando falla el envío', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      servicioCorreo.transporter = mockTransporter;

      await expect(
        servicioCorreo.enviarCodigoVerificacion('usuario@example.com', '123456')
      ).rejects.toThrow('Error al enviar el código de verificación');
    });

    test('debe inicializar transporter si no existe', async () => {
      servicioCorreo.transporter = null;
      await servicioCorreo.enviarCodigoVerificacion('usuario@example.com', '123456');

      expect(nodemailer.createTransport).toHaveBeenCalled();
    });
  });

  describe('enviarCorreoRecuperacion', () => {
    test('debe enviar correo de recuperación exitosamente', async () => {
      servicioCorreo.inicializar();
      const resetUrl = 'https://example.com/reset/token123';
      
      const resultado = await servicioCorreo.enviarCorreoRecuperacion('usuario@example.com', resetUrl);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      expect(resultado.messageId).toBe('test-message-id');

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.to).toBe('usuario@example.com');
      expect(mailOptions.subject).toContain('Recuperación de Contraseña');
      expect(mailOptions.html).toContain(resetUrl);
    });

    test('debe incluir enlace de recuperación en el correo', async () => {
      servicioCorreo.inicializar();
      const resetUrl = 'https://example.com/reset/token123';
      
      await servicioCorreo.enviarCorreoRecuperacion('usuario@example.com', resetUrl);

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain('Restablecer Contraseña');
      expect(mailOptions.html).toContain(resetUrl);
      expect(mailOptions.html).toContain('1 hora');
    });

    test('debe lanzar error cuando falla el envío', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      servicioCorreo.transporter = mockTransporter;

      await expect(
        servicioCorreo.enviarCorreoRecuperacion('usuario@example.com', 'https://example.com/reset')
      ).rejects.toThrow('Error al enviar el correo de recuperación');
    });
  });

  describe('testConexionSMTP', () => {
    test('debe verificar conexión SMTP exitosamente', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      servicioCorreo.inicializar();

      await servicioCorreo.testConexionSMTP();

      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅'));
      
      consoleSpy.mockRestore();
    });

    test('debe manejar error de conexión SMTP', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));
      servicioCorreo.transporter = mockTransporter;

      await servicioCorreo.testConexionSMTP();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌'),
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('enviarResumenAlertas', () => {
    test('debe enviar resumen de alertas exitosamente', async () => {
      servicioCorreo.inicializar();
      const alertas = [
        { mensaje: 'Documento pendiente' },
        { mensaje: 'Bitácora atrasada' }
      ];

      await servicioCorreo.enviarResumenAlertas('usuario@example.com', alertas);

      expect(mockTransporter.sendMail).toHaveBeenCalled();

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.to).toBe('usuario@example.com');
      expect(mailOptions.subject).toContain('Alertas');
      expect(mailOptions.html).toContain('Documento pendiente');
      expect(mailOptions.html).toContain('Bitácora atrasada');
    });

    test('no debe enviar si no hay email', async () => {
      servicioCorreo.inicializar();
      
      await servicioCorreo.enviarResumenAlertas('', [{ mensaje: 'Test' }]);

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    test('no debe enviar si no hay alertas', async () => {
      servicioCorreo.inicializar();
      
      await servicioCorreo.enviarResumenAlertas('usuario@example.com', []);

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    test('no debe enviar si alertas no es un array', async () => {
      servicioCorreo.inicializar();
      
      await servicioCorreo.enviarResumenAlertas('usuario@example.com', null);

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    test('debe manejar errores silenciosamente', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      servicioCorreo.transporter = mockTransporter;

      await servicioCorreo.enviarResumenAlertas('usuario@example.com', [{ mensaje: 'Test' }]);

      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Formato de correos', () => {
    test('debe usar el formato correcto del remitente', async () => {
      servicioCorreo.inicializar();
      await servicioCorreo.enviarCodigoVerificacion('usuario@example.com', '123456');

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.from).toContain('SENA');
      expect(mailOptions.from).toContain(process.env.SMTP_USER);
    });

    test('debe incluir estilos CSS en los correos', async () => {
      servicioCorreo.inicializar();
      await servicioCorreo.enviarCodigoVerificacion('usuario@example.com', '123456');

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain('style=');
      expect(mailOptions.html).toContain('#39a900'); // Color SENA
    });

    test('debe incluir advertencia de correo automático', async () => {
      servicioCorreo.inicializar();
      await servicioCorreo.enviarCodigoVerificacion('usuario@example.com', '123456');

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain('correo automático');
      expect(mailOptions.html).toContain('no responder');
    });
  });
});
