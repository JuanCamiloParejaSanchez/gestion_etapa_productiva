const express = require('express');
const router = express.Router();
const registroAdministradorControlador = require('../controladores/registroAdministradorControlador');

// Mostrar formulario de registro
router.get('/registro-administrador', registroAdministradorControlador.mostrarFormulario);
router.get('/registrar-administrador', registroAdministradorControlador.mostrarFormulario); // Alias para consistencia

// Verificar duplicados de correo o número de identificación
router.post('/verificar-duplicado-admin', registroAdministradorControlador.verificarDuplicado);

// Procesar registro
router.post('/registrar-administrador', registroAdministradorControlador.registrarAdministrador);

module.exports = router;
