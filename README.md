# Girls Love Play — Nueva versión

Sitio generado con Eleventy (11ty). HTML real, sin depender de JavaScript
para que el contenido exista — pensado para SEO, rendimiento y monetización.

## Cómo probarlo en tu computadora

1. Instalar [Node.js](https://nodejs.org) (versión LTS).
2. Abrir una terminal dentro de esta carpeta.
3. Ejecutar: `npm install`
4. Ejecutar: `npm start`
5. Abrir en el navegador la dirección que aparezca (normalmente `http://localhost:8080`).

## Cómo generar el sitio final (lo que hace Cloudflare automáticamente)

`npm run build`

Esto crea la carpeta `_site/` con el sitio ya armado en HTML puro.

## Estructura

- `src/` → todo el contenido y las plantillas fuente.
- `src/_layouts/` → moldes (base, serie, artículo).
- `src/_includes/` → piezas reutilizables (header, footer, tarjetas).
- `src/_data/` → datos globales (banners, OST, comunidad, etc.).
- `src/series/`, `src/noticias/`, `src/mundo-gl/` → contenido de ejemplo,
  se reemplaza más adelante con Decap CMS.
- `src/css/` y `src/js/` → estilos y scripts organizados por función.

## Próximos pasos (según el plan acordado)

1. Revisar visualmente esta base y ajustar diseño.
2. Cargar contenido real de prueba.
3. Integrar Decap CMS (`src/admin/`).
4. Conectar con Cloudflare Pages para el despliegue automático.
