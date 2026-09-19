Stack tecnologico del proyecto (version para LinkedIn)

Este e-commerce fue desarrollado con un enfoque fullstack en JavaScript/TypeScript, priorizando velocidad de entrega, mantenimiento simple y una experiencia de compra fluida.

Frontend:
Se construyo con Next.js 14, React 18 y App Router. Esta base permite renderizado eficiente, navegacion rapida y una arquitectura clara para escalar el sitio sin romper funcionalidades existentes. React aporta reutilizacion de componentes y manejo de estado para flujos clave, como carrito, cantidades y total en tiempo real.

TypeScript se utiliza para tipar productos, props y contratos de datos, reduciendo errores y haciendo mas seguros los cambios cuando crece el catalogo o la logica comercial.

En estilos, Tailwind CSS con PostCSS y Autoprefixer acelera la construccion de interfaces responsive y consistentes entre navegadores. React Icons suma iconografia clara en puntos de alta conversion, como el boton de carrito.

Backend:
Se implemento con Route Handlers de Next.js, integrando frontend y backend en el mismo repositorio. Esto reduce complejidad operativa, simplifica el despliegue y mejora la velocidad de iteracion del equipo.

La data de productos proviene de Google Sheets en formato CSV, parseada en servidor con PapaParse. Esta decision permite que perfiles no tecnicos actualicen inventario, precio o descripciones desde una planilla, sin depender de cambios de codigo.

Tambien se incluyo normalizacion de datos para precio, cantidad e imagenes, y una ruta proxy para resolver imagenes externas (incluyendo Google Drive), validar content-type y aplicar fallback cuando una URL falla. Con esto se evita romper la grilla de productos y se protege la experiencia visual.

Ademas, el uso de fetch con cache no-store prioriza datos actualizados en cada visita del cliente.

Resultado: un stack pragmatico, escalable y orientado a negocio, ideal para lanzar rapido y evolucionar hacia mas volumen, automatizacion y analitica.