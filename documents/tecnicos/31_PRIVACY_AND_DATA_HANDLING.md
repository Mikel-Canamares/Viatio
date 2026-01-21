# Privacidad y manejo de datos

## Datos personales tratados (según modelos)
- **Identidad**: UID, email, displayName (Firebase Auth).
- **Viajes**: destino, fechas, notas, presupuesto.
- **Reservas**: datos de vuelos/hotel, confirmaciones, ubicaciones.
- **Ubicación**: latitud/longitud de lugares.
- **Documentos**: archivos adjuntos (tickets, PDFs).

## Retención y acceso
- **PENDIENTE / TODO**: política de retención en Firestore/Storage.
- **PENDIENTE / TODO**: política de acceso/roles en viajes compartidos.

## Minimización de datos
- Usar solo campos necesarios en Firestore.
- Evitar almacenar datos sensibles no requeridos.

## Guidance GDPR (si aplica)
- Implementar consentimiento explícito para tratamiento de datos.
- Proveer mecanismo de exportación y borrado.
- Documentar base legal y tiempos de retención.


