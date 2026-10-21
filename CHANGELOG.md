# Novedades

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
