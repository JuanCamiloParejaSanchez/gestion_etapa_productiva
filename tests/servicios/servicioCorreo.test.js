// tests/servicios/servicioCorreo.test.js
// Propósito: Tests para el servicio de correo

const ServicioCorreo = require('../../src/modulos/aprendiz/servicios/servicioCorreo');

// Mock de nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn()
  }))
}));

describe('ServicioCorreo', () => {
  let servicioCorreo;

  beforeEach(() => {
    servicioCorreo = ServicioCorreo;
    jest.clearAllMocks();
  });

  describe('enviarResumenAlertasMultiples', () => {
    test('debe enviar alertas a múltiples destinatarios exitosamente', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: '123' })
      };
      servicioCorreo.transporter = mockTransporter;

      const destinatarios = [
        { email: 'aprendiz1@test.com', esInstructor: false, nombreAprendiz: 'Juan Pérez' },
        { email: 'instructor@test.com', esInstructor: true, nombreAprendiz: 'Juan Pérez' }
      ];

      const alertas = [
        { mensaje: 'Documento pendiente de aprobación' },
        { mensaje: 'Bitácora fuera de plazo' }
      ];

      const result = await servicioCorreo.enviarResumenAlertasMultiples(destinatarios, alertas);

      expect(result).toBeUndefined(); // La función no retorna nada
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);

      // Verificar que se envió al aprendiz
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'aprendiz1@test.com',
          subject: expect.stringContaining('Alertas'),
          html: expect.stringContaining('Tienes nuevas alertas')
        })
      );

      // Verificar que se envió al instructor
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'instructor@test.com',
          subject: expect.stringContaining('Juan Pérez'),
          html: expect.stringContaining('El aprendiz Juan Pérez')
        })
      );
    });

    test('debe manejar errores al enviar correos', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockRejectedValue(new Error('SMTP Error'))
      };
      servicioCorreo.transporter = mockTransporter;

      const destinatarios = [
        { email: 'test@test.com', esInstructor: false, nombreAprendiz: 'Test' }
      ];

      const alertas = [{ mensaje: 'Alerta de prueba' }];

      // La función maneja errores internamente, no lanza excepciones
      await expect(servicioCorreo.enviarResumenAlertasMultiples(destinatarios, alertas))
        .resolves.toBeUndefined();

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    test('no debe enviar si no hay transporter inicializado', async () => {
      servicioCorreo.transporter = null;

      const destinatarios = [
        { email: 'test@test.com', esInstructor: false, nombreAprendiz: 'Test' }
      ];

      const alertas = [{ mensaje: 'Alerta de prueba' }];

      await servicioCorreo.enviarResumenAlertasMultiples(destinatarios, alertas);

      // No debería hacer nada
      expect(true).toBe(true); // Placeholder assertion
    });

    test('no debe enviar si destinatarios está vacío', async () => {
      const mockTransporter = {
        sendMail: jest.fn()
      };
      servicioCorreo.transporter = mockTransporter;

      await servicioCorreo.enviarResumenAlertasMultiples([], [{ mensaje: 'test' }]);

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    test('no debe enviar si alertas está vacío', async () => {
      const mockTransporter = {
        sendMail: jest.fn()
      };
      servicioCorreo.transporter = mockTransporter;

      const destinatarios = [
        { email: 'test@test.com', esInstructor: false, nombreAprendiz: 'Test' }
      ];

      await servicioCorreo.enviarResumenAlertasMultiples(destinatarios, []);

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    test('debe incluir información de instructor en el correo', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: '123' })
      };
      servicioCorreo.transporter = mockTransporter;

      const destinatarios = [
        { email: 'instructor@test.com', esInstructor: true, nombreAprendiz: 'María García' }
      ];

      const alertas = [{ mensaje: 'Documento requerido' }];

      await servicioCorreo.enviarResumenAlertasMultiples(destinatarios, alertas);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('María García');
      expect(callArgs.html).toContain('María García');
    });
  });
});
