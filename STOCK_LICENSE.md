# Biblioteca visual: fuentes y límites

406 entradas integradas: 155 gráficos originales (incluidas 93 composiciones de 31 temas en tres relaciones de aspecto), 249 láminas de banderas ISO de referencia y 2 fotografías CC0 verificadas el 28 de octubre de 2026. No son 406 temas distintos, ni 3000 fotografías. Faltan 2594 entradas para el objetivo de 3000; siguientes lotes requieren curación y verificación, no se generan en segundo plano.

## Originales
Los SVG de `stock.ts` y `stock-originals.ts` son gráficos estáticos originales, utilizables en este prototipo, no fotografías ni escudos oficiales. Los paisajes, edificios, aves, flores y carreta son ilustrativos, no representaciones oficiales o fotografías de lugares concretos. Las banderas civiles son Costa Rica (sin escudo, franjas 1:1:2:1:1, proporción 3:2), Francia, Alemania, Italia, Japón y Ucrania (3:2). No se incluye escudo nacional, logo MEP ni CTPMN. Antes de uso institucional la institución debe decidir si adopta estos gráficos.

## Fotografías
Las páginas originales se consultaron satisfactoriamente y muestran CC0 1.0; las descargas se decodificaron y optimizaron. No son fotografías de Costa Rica.

| Recurso | Autor | Fuente/licencia verificada | Archivo descargado |
|---|---|---|---|
| Lake Mountain Landscape | Bonnie Moreland | https://commons.wikimedia.org/wiki/File:Lake_Mountain_Landscape.jpg | Enlace Original file en esa página, optimizado a 1400×933 |
| Old architecture Mexico City | Pvt.Billinghurst | https://commons.wikimedia.org/wiki/File:Old_architecture_Mexico_City.jpg | https://upload.wikimedia.org/wikipedia/commons/8/88/Old_architecture_Mexico_City.jpg, 640×480 |

Licencia: https://creativecommons.org/publicdomain/zero/1.0/ . CC0 permite copiar, modificar y distribuir sin pedir autorización. Las fuentes y autores se conservan en las entradas y enlaces de la interfaz.

## Disponibilidad y privacidad
Los gráficos están en el código local y no dependen de terceros. Las fotografías son archivos propios de la aplicación mediante punteros `src/assets/catalog/*.asset.json`, servidos por el alojamiento habitual de Lovable; necesitan conexión en la primera carga. No se consultan bancos de imágenes ni proveedores durante la selección. Exportación incrusta los bytes de la foto en el arte para que no dependa de una URL externa al abrirlo. No se añadieron cuentas, servicios pagos o base de datos. Archivos del usuario siguen en su navegador y nunca se externalizan; el Estudio permanece aislado en memoria.

Favoritos y recientes guardan únicamente IDs en preferencias existentes. El catálogo muestra páginas de 48 miniaturas y permite filtrar por orientación. Los recursos no se duplican en IndexedDB ni se insertan en campañas hasta seleccionar una referencia estable.

## Banderas
249 países/territorios ISO 3166-1 del paquete flag-icons 7.6.0 (MIT, autor Panayiotis Lipiridis); licencia íntegra en `FLAG_LICENSE.md`. No significa 249 países soberanos. Nombres ES localizados con Intl.DisplayNames y nombres EN del paquete. SVG importados como constantes después de inspeccionar elementos permitidos, sin scripts, eventos, enlaces externos o foreignObject; no se acepta SVG del usuario. Láminas estandarizadas 4:3, no promesa de proporciones oficiales ni verificación diplomática de cada diseño vigente. Algunos países cambian sus banderas: verificar antes de uso institucional. Las seis banderas civiles originales anteriores permanecen intactas; no se recrean escudos. La bandera azul nueva es genérica y no acredita certificación Bandera Azul Ecológica.
