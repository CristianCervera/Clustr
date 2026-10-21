# Novedades

## 0.12.0

- **Elegir a los responsables.** En Crear, la sección Responsables tiene tres opciones: Ninguno, Al azar o Elegir. Con
  Elegir se marcan en una lista; sale un grupo por responsable y el resto se reparte entre ellos.
- **El matrimonio va junto.** Al marcar a una persona casada se marca también su cónyuge, y los dos encabezan el mismo
  grupo.
- La sección Responsables sube justo debajo de Participantes, porque decide cuántos grupos salen.

## 0.11.0

- **Renombrar y eliminar desde la lista.** En Grupos, cada reparto tiene un botón «⋯» con Renombrar y Eliminar reparto
  (con confirmación), sin tener que abrirlo.
- La lista de repartos ya no lleva la flecha «›»: la tarjeta se sigue abriendo al pulsarla.

## 0.10.0

- **Loader propio.** Mientras hay peticiones en curso sale arriba una cápsula con el logo animado: los nodos llegan
  sueltos, se agrupan en la «C» y el hilo los une, como hace la app con las personas. No aparece en las peticiones
  rápidas (menos de 300 ms) y, si algo tarda más de 4 s, avisa: «Tarda más de lo normal…».
- Con «reducir movimiento», los nodos no se mueven: se iluminan uno tras otro.

## 0.9.0

- **Un responsable en cada grupo.** Crear tiene un interruptor nuevo: el primero de cada grupo queda como cabeza y, si es
  un matrimonio, los dos. Se recuerda como el resto de criterios. «Volver a generar» mantiene a los responsables.
- **Repartir por cabezas pregunta por los matrimonios.** «No separar»: un matrimonio del grupo elegido encabeza junto un
  mismo grupo y el cónyuge de un cabeza va con él. «Separar»: cada uno encabeza su grupo y los matrimonios van en grupos
  distintos. El número de grupos de cada opción se actualiza al elegir.

## 0.8.0

- **Repartir por cabezas.** En el menú «⋯» de un reparto, elige un grupo: cada una de sus personas encabeza un grupo
  nuevo y el resto se reparte entre ellos con los mismos criterios. Se crea un reparto aparte («… · por cabezas») y el
  original no cambia. Con «matrimonios juntos», el cónyuge de un cabeza va con él; con «separados», a otro grupo.
- **Marca de cabeza.** El cabeza sale el primero de su grupo, en negrita y con la etiqueta «Cabeza», también en el PDF,
  la imagen y el texto.
- **Volver a generar** un reparto por cabezas mezcla solo al resto: cada cabeza sigue al frente de su grupo.

## 0.7.0

- **Mover a un matrimonio junto.** Al cambiar de grupo a una persona casada cuyo cónyuge está en el reparto, la app
  pregunta «¿Mover también a Amparo?»: «Mover a los dos» se los lleva juntos, «Solo Jorge» mueve solo a esa persona y
  Escape no mueve a nadie. Si el cónyuge ya está en ese grupo, no pregunta.

## 0.6.0

- **Reparto en móviles pequeños.** A 320 px (iPhone SE) el botón «⋯» para renombrar o borrar un reparto se salía de la
  pantalla; ahora Exportar se queda en icono y caben las tres acciones.
- **Teclado.** El Tabulador ya no se escapa de las hojas ni de las alertas; Escape en una alerta sobre una ficha cierra
  solo la alerta y el foco vuelve a donde estaba; los menús se recorren con las flechas y los controles segmentados son
  una sola parada de Tab que cambia con las flechas.
- **Tarjetas de grupo alineadas.** El resumen («6 personas · 3 H · 3 M») va siempre bajo el nombre, así todas las
  tarjetas de una fila empiezan a la misma altura (también en la imagen y el PDF).
- **Modo oscuro.** El segmento elegido se distingue del resto.
- **Personas.** «Casada con Jorge» en vez de «Casado/a» cuando se sabe el sexo; los detalles largos terminan en «…» y la
  lista ya no desborda a 320 px.

## 0.5.0

- **Nombre del reparto al crear.** Crear pide el nombre (si se deja vacío, «Grupos del <fecha>») y, al generar, el
  reparto se guarda directamente y se abre.
- **Grupos muestra todos los repartos.** La pestaña es ahora la lista de repartos guardados, con los nombres de sus
  grupos, para elegir el que quieres ver.
- **Repartos editables.** En cada reparto se puede mover a una persona de grupo, volver a generar con las mismas personas
  y criterios, cambiar el nombre, exportar o borrar.
- **Nombre de cada grupo.** El lápiz junto a «Grupo N» le pone un nombre, que también sale al exportar en PDF, imagen o
  texto. Los nombres largos se recortan sin descuadrar la tarjeta.

## 0.4.0

- **Matrimonios al añadir a mano.** Escribir «Pepe y Pepa» en el nombre crea dos personas casadas entre sí (el sexo y la
  edad se completan después en la ficha de cada una).
- **Un matrimonio comparte la asistencia.** Marcar a uno como ocasional (o habitual) marca también a su cónyuge; la ficha
  lo avisa.

## 0.3.0

- **Excel: matrimonios en una sola fila.** Si una fila trae a los dos en el nombre («Jorge y Amparo», también con «e»,
  «and», «et», «&», «+» o «/»), se importan como dos personas casadas entre sí. Comparten los apellidos o, si vienen de
  dos en dos («García y López»), se reparten.
- Asistencia ocasional: se marca en la ficha de cada persona y, al crear los grupos, los ocasionales se reparten para que
  ningún grupo se quede cojo.
- El contador de matrimonios del perfil cuenta parejas, no personas casadas.
