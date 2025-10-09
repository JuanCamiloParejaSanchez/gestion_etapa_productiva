const express = require('express');
const router = express.Router();
const registroAdministradorControlador = require('../controladores/registroAdministradorControlador');

// Mostrar formulario de registro
router.get('/registro-administrador', registroAdministradorControlador.mostrarFormulario);
router.get('/registrar-administrador', registroAdministradorControlador.mostrarFormulario); // Alias para consistencia

// Procesar registro
router.post('/registrar-administrador', registroAdministradorControlador.registrarAdministrador);

module.exports = router;
