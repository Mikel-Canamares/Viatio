# Modelo de dominio

## Entidades principales (Mermaid classDiagram)
```mermaid
classDiagram
  class Viaje {
    +string id
    +string usuarioId
    +string destino
    +string fechaInicio
    +string fechaFin
    +string moneda
    +number presupuesto
    +boolean archived
    +boolean isShared
    +string firestoreId
  }

  class DiaViaje {
    +string id
    +string viajeId
    +string fecha
    +string notas
  }

  class Reserva {
    +string id
    +string viajeId
    +string diaId
    +string categoria
    +string nombre
    +string fechaInicio
    +string fechaFin
    +number precio
    +string moneda
    +string firestoreId
  }

  class Lugar {
    +string id
    +string viajeId
    +string diaId
    +string nombre
    +string categoria
    +string googlePlaceId
    +number latitud
    +number longitud
  }

  class Documento {
    +string id
    +string viajeId
    +string nombre
    +string categoria
    +string rutaArchivo
    +string firestoreId
  }

  class Gasto {
    +string id
    +string viajeId
    +string diaId
    +string reservaId
    +string categoria
    +number monto
    +string moneda
  }

  class EventoPersonalizado {
    +string id
    +string viajeId
    +string diaId
    +string nombre
    +string categoria
    +string horaInicio
    +string horaFin
  }

  Viaje "1" --> "many" DiaViaje
  Viaje "1" --> "many" Reserva
  Viaje "1" --> "many" Lugar
  Viaje "1" --> "many" Documento
  Viaje "1" --> "many" Gasto
  Viaje "1" --> "many" EventoPersonalizado
  DiaViaje "1" --> "many" Reserva
  DiaViaje "1" --> "many" Lugar
  DiaViaje "1" --> "many" EventoPersonalizado
  Reserva "1" --> "many" Gasto
  Documento "many" --> "many" Reserva : reservas_documentos
```

## Glosario funcional
- **Viaje**: entidad raíz con destino, fechas y configuración.
- **Día de viaje**: segmentación temporal del itinerario.
- **Reserva**: confirmación de transporte/hotel/comida/actividad.
- **Lugar**: POI/ubicación asociada al viaje.
- **Documento**: archivo adjunto (billetes, PDFs).
- **Gasto**: registro financiero asociado al viaje.
- **Evento personalizado**: actividad en agenda creada por el usuario.


