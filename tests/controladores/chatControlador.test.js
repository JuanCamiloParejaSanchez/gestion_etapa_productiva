// tests/controladores/chatControlador.test.js
// Propósito: Tests para el controlador de chat

const chatControlador = require('../../src/modulos/compartido/controladores/chatControlador');

// Mock del pool de base de datos
jest.mock('../../src/configuracion/baseDatos', () => ({
  pool: {
    query: jest.fn(),
    execute: jest.fn()
  }
}));

const { pool } = require('../../src/configuracion/baseDatos');

describe('ChatControlador', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      session: {
        userId: 1,
        userRole: 'aprendiz'
      },
      body: {},
      params: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      render: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe('enviarMensaje', () => {
    test('debe enviar mensaje exitosamente', async () => {
      mockReq.body = {
        mensaje: 'Hola, este es un mensaje de prueba',
        destinatarioId: 2,
        destinatarioTipo: 'administrador'
      };

      pool.execute.mockResolvedValue([{ insertId: 1 }]);

      await chatControlador.enviarMensaje(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mensaje enviado correctamente'
      });
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO mensajes'),
        expect.any(Array)
      );
    });

    test('debe validar campos requeridos', async () => {
      mockReq.body = {
        mensaje: '', // Mensaje vacío
        destinatarioId: 2
      };

      await chatControlador.enviarMensaje(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Datos incompletos o inválidos'
        })
      );
    });

    test('debe manejar errores de base de datos', async () => {
      mockReq.body = {
        mensaje: 'Mensaje de prueba',
        destinatarioId: 2,
        destinatarioTipo: 'administrador'
      };

      pool.execute.mockRejectedValue(new Error('Error de BD'));

      await chatControlador.enviarMensaje(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('obtenerMensajesNoLeidos', () => {
    test('debe retornar mensajes no leídos', async () => {
      const mockMensajes = [
        {
          id: 1,
          mensaje: 'Mensaje no leído',
          remitente_id: 2,
          fecha_envio: new Date()
        }
      ];

      pool.execute.mockResolvedValue([mockMensajes]);

      await chatControlador.obtenerMensajesNoLeidos(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        mensajes: mockMensajes
      });
    });

    test('debe retornar array vacío si no hay mensajes', async () => {
      pool.execute.mockResolvedValue([[]]);

      await chatControlador.obtenerMensajesNoLeidos(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        mensajes: []
      });
    });
  });

  describe('obtenerHistorialMensajes', () => {
    test('debe retornar historial de mensajes entre dos usuarios', async () => {
      mockReq.params = {
        otroUsuarioId: 2,
        otroUsuarioTipo: 'administrador'
      };

      const mockMensajes = [
        {
          id: 1,
          mensaje: 'Mensaje 1',
          remitente_id: 1,
          destinatario_id: 2,
          fecha_envio: new Date()
        },
        {
          id: 2,
          mensaje: 'Mensaje 2',
          remitente_id: 2,
          destinatario_id: 1,
          fecha_envio: new Date()
        }
      ];

      pool.execute.mockResolvedValue([mockMensajes]);

      await chatControlador.obtenerHistorialMensajes(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        mensajes: mockMensajes
      });
    });
  });

  describe('marcarMensajeLeido', () => {
    test('debe marcar mensaje como leído', async () => {
      mockReq.params.id = 1;

      pool.execute.mockResolvedValue([{ affectedRows: 1 }]);

      await chatControlador.marcarMensajeLeido(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true
      });
    });

    test('debe retornar error si el mensaje no existe', async () => {
      mockReq.params.id = 999;

      pool.execute.mockResolvedValue([{ affectedRows: 0 }]);

      await chatControlador.marcarMensajeLeido(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Mensaje no encontrado o no autorizado'
        })
      );
    });
  });

  describe('obtenerConversaciones', () => {
    test('debe retornar lista de conversaciones', async () => {
      const mockConversaciones = [
        {
          otro_usuario_id: 2,
          otro_usuario_tipo: 'administrador',
          ultimo_mensaje: 'Último mensaje',
          fecha_ultimo_mensaje: new Date(),
          mensajes_no_leidos: 3
        }
      ];

      pool.execute.mockResolvedValue([mockConversaciones]);

      await chatControlador.obtenerConversaciones(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        conversaciones: mockConversaciones
      });
    });
  });

  describe('eliminarConversacion', () => {
    test('debe eliminar conversación exitosamente', async () => {
      mockReq.params = {
        otroUsuarioId: 2,
        otroUsuarioTipo: 'administrador'
      };

      pool.execute.mockResolvedValue([{ affectedRows: 5 }]); // 5 mensajes eliminados

      await chatControlador.eliminarConversacion(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Conversación eliminada correctamente'
      });
    });

    test('debe manejar error al eliminar conversación', async () => {
      mockReq.params = {
        otroUsuarioId: 2,
        otroUsuarioTipo: 'administrador'
      };

      pool.execute.mockRejectedValue(new Error('Error de BD'));

      await chatControlador.eliminarConversacion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('obtenerContadorMensajes', () => {
    test('debe retornar contador de mensajes no leídos', async () => {
      pool.execute.mockResolvedValue([[{ count: 7 }]]);

      await chatControlador.obtenerContadorMensajes(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 7
      });
    });

    test('debe retornar 0 si no hay mensajes no leídos', async () => {
      pool.execute.mockResolvedValue([[{ count: 0 }]]);

      await chatControlador.obtenerContadorMensajes(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 0
      });
    });
  });

  describe('buscarUsuarios', () => {
    test('debe buscar usuarios por nombre', async () => {
      mockReq.query.q = 'Juan';

      const mockUsuarios = [
        {
          id: 2,
          nombre_completo: 'Juan Pérez',
          tipo: 'administrador',
          email: 'juan@admin.com'
        }
      ];

      pool.execute.mockResolvedValue([mockUsuarios]);

      await chatControlador.buscarUsuarios(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        usuarios: mockUsuarios
      });
    });

    test('debe retornar array vacío si no hay resultados', async () => {
      mockReq.query.q = 'UsuarioInexistente';

      pool.execute.mockResolvedValue([[]]);

      await chatControlador.buscarUsuarios(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        usuarios: []
      });
    });
  });
});