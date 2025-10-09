# 🎨 Guía de Estilos del Sistema de Ordenamiento

## 📋 Descripción General

Esta documentación describe los estilos elegantes implementados para el sistema de ordenamiento de tablas, diseñados específicamente para mantener la coherencia visual con el diseño institucional del SENA.

## 🎯 Características Principales

### ✨ Diseño Elegante y Profesional
- **Gradientes institucionales**: Uso de los colores oficiales del SENA (#04324d y #39a900)
- **Animaciones suaves**: Transiciones fluidas con curvas de Bézier profesionales
- **Feedback visual inmediato**: Indicadores claros del estado de ordenamiento

### 🔄 Estados de Ordenamiento

#### 1. **Estado Normal** (.sortable-header)
- Fondo con gradiente sutil
- Efecto de barrido al hacer hover
- Icono circular con animación de escala

#### 2. **Estado Ascendente** (.sortable-header.sort-asc)
- Fondo verde institucional del SENA
- Icono rotado 180° para indicar ascendente
- Borde inferior verde

#### 3. **Estado Descendente** (.sortable-header.sort-desc)
- Fondo azul institucional del SENA
- Icono normal para indicar descendente
- Borde inferior azul

## 🎨 Componentes Estilizados

### 1. Encabezados de Columna
```css
.sortable-header {
    /* Gradiente elegante */
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    
    /* Animaciones suaves */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    /* Efecto de barrido */
    position: relative;
    overflow: hidden;
}
```

**Características:**
- Efecto de barrido con gradiente verde SENA
- Transformación sutil al hacer hover
- Indicador de línea inferior que se expande

### 2. Iconos de Ordenamiento
```css
.sort-icon {
    /* Diseño circular */
    border-radius: 50%;
    width: 28px;
    height: 28px;
    
    /* Efectos 3D */
    box-shadow: 0 4px 12px rgba(57, 169, 0, 0.25);
    
    /* Rotación sutil */
    transform: scale(1.1) rotate(5deg);
}
```

**Estados:**
- **Inactivo**: Opacidad reducida con borde transparente
- **Hover**: Escala aumentada con rotación sutil
- **Activo**: Fondo sólido con colores institucionales

### 3. Dropdown de Opciones
```css
.sort-dropdown {
    /* Diseño moderno */
    border-radius: 12px;
    backdrop-filter: blur(10px);
    
    /* Sombra elegante */
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    
    /* Borde superior colorido */
    background: linear-gradient(90deg, var(--secondary-color), var(--primary-color));
}
```

**Características:**
- Fondo translúcido con efecto de desenfoque
- Borde superior con gradiente institucional
- Animaciones escalonadas para elementos
- Efectos de hover individuales por opción

## 🎯 Elementos Interactivos

### Indicador de Estado Global
```html
<div class="sorting-indicator show">
    <i class="fas fa-sort-amount-up"></i>
    Ordenando por: Nombre (Ascendente)
</div>
```

### Botón de Reset
```html
<button class="reset-sorting-btn">
    <i class="fas fa-undo"></i>
    Resetear Ordenamiento
</button>
```

### Tooltips Informativos
```html
<div class="sort-icon" data-tooltip="Ordenar por este campo">
    <i class="fas fa-sort"></i>
</div>
```

## 📱 Responsividad

### Tablet (max-width: 768px)
- Iconos más pequeños (24x24px)
- Dropdown reposicionado para evitar desbordamiento
- Indicador de estado como elemento relativo

### Móvil (max-width: 480px)
- Texto de encabezados más pequeño
- Padding reducido en elementos
- Dropdown más estrecho

## 🎨 Paleta de Colores

| Color | Uso | Variable CSS |
|-------|-----|--------------|
| #04324d | Azul institucional SENA | `var(--primary-color)` |
| #39a900 | Verde institucional SENA | `var(--secondary-color)` |
| #f8f9fa | Fondo neutro | - |
| #6c757d | Texto secundario | - |

## ✨ Animaciones Incluidas

### 1. **Efecto de Barrido**
```css
@keyframes slideInFromLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
}
```

### 2. **Indicador de Carga**
```css
@keyframes loading-sweep {
    0% { background-position: -50% 0; }
    100% { background-position: 150% 0; }
}
```

### 3. **Pulso de Atención**
```css
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}
```

## 🔧 Implementación

Para usar estos estilos, asegúrate de:

1. **Incluir el archivo CSS**: `estilosBase.css` ya contiene todos los estilos
2. **Usar las clases correctas**: Aplica las clases `.sortable-header`, `.sort-icon`, etc.
3. **Implementar JavaScript**: Para manejar los estados `.sort-asc` y `.sort-desc`

## 📋 Ejemplo de Uso

```html
<th class="sortable-header sort-asc">
    <div class="header-content">
        <span class="header-text">Nombre del Aprendiz</span>
        <div class="sort-icon" data-tooltip="Ordenado ascendentemente">
            <i class="fas fa-sort-up"></i>
        </div>
    </div>
</th>
```

## 🎯 Notas Importantes

- **Accesibilidad**: Los tooltips mejoran la experiencia del usuario
- **Performance**: Las animaciones usan `transform` para mejor rendimiento
- **Consistencia**: Todos los colores respetan la identidad visual del SENA
- **Usabilidad**: Feedback visual claro en cada interacción

## 🚀 Mejoras Futuras Sugeridas

1. **Sonidos de feedback** para las interacciones
2. **Animaciones más complejas** para cambios de estado
3. **Temas alternativos** para diferentes contextos
4. **Integración con localStorage** para recordar preferencias

---

*Documentación creada para el Sistema de Gestión de Etapa Productiva - SENA*
