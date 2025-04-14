# Generador de Vouchers con Código QR y Código de Barras

Este proyecto permite a los clientes generar vouchers automáticos con *etiquetas personalizadas* que incluyen código QR y código de barras, listos para ser enviados por correo. La herramienta está pensada para facilitar la entrega de comprobantes digitales tras una compra o registro, automatizando todo el flujo desde una hoja de cálculo.


# ¿Cómo funciona?

1. El cliente **pega su base de datos** en una hoja de Google Sheets.
2. Da clic al botón **“Generar Voucher”** desde un menú personalizado.
3. El sistema genera automáticamente:
   - Una etiqueta con código QR y de barras.
   - Un voucher en PDF con datos del cliente.
4. El **voucher es enviado por correo electrónico** junto con un mensaje de agradecimiento por su compra o participación.


# Tecnologías utilizadas

- Google Sheets
- Google Apps Script
- Generación de códigos QR y de barras
- Gmail API (para envío automático de correos)
- HTML + CSS (plantilla del voucher)

# ¿Qué contiene el correo que recibe el cliente?

- Voucher personalizado en PDF
- Mensaje de agradecimiento
- Datos de su transacción o registro


# Archivos del repositorio

- `generador-etiquetas.gs`: Script principal con toda la lógica
- `plantilla.html`: Estructura del voucher con QR/barra incrustado
- `README.md`: Este documento


# Desarrollado por

*Anthtonny Marcelo Rojas*  
Desarrollador orientado a automatización con Google Apps Script  
🔗 [LinkedIn](https://www.linkedin.com/in/anthonny-marcelo-rojas-b66b22311/)  
📂 [Más proyectos en GitHub](https://github.com/AMarceloRojas)

