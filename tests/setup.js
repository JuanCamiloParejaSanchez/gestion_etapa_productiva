// Configuración global para tests
require('dotenv').config({ path: '.env.test' });

// Mock de logger para evitar logs en tests
jest.mock('../src/compartido/utilidades/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  expressLogger: jest.fn()
}));

// Configuración global de Jest
beforeAll(() => {
  // Configuración antes de todos los tests
});

afterAll(() => {
  // Limpieza después de todos los tests
});

beforeEach(() => {
  // Configuración antes de cada test
  jest.clearAllMocks();
});

afterEach(() => {
  // Limpieza después de cada test
});