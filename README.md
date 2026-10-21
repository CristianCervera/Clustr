# Clustr

App (móvil y escritorio) que reparte una lista de personas —solteros y matrimonios— en grupos equilibrados
según tus criterios, y los exporta a PDF, imagen o texto para compartirlos.

Vue 3 + TypeScript + Pinia + vue-router + vue-i18n + Tailwind CSS 4 + Vitest. API en [`../clustr-back`](../clustr-back).

## Arrancar

```bash
# en ../clustr-back
npm install && npm run dev        # API en :3100

# aquí
npm install
cp .env.example .env              # opcional: VITE_API_URL, VITE_GOOGLE_CLIENT_ID
npm run dev                       # http://localhost:5180
```

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (en WSL sobre `/mnt/c` sondea los cambios) |
| `npm test` | Tests con Vitest |
| `npm run typecheck` | `vue-tsc` |
| `npm run build` | Comprueba tipos y genera `dist/` |

## Vistas

- **Crear** — nombre del reparto, participantes y criterios (nº de grupos o personas por grupo, matrimonios
  juntos/separados, equilibrar sexo, estado civil y edad, repartir a los ocasionales). Al generar, el reparto se guarda
  directamente (sin nombre, «Grupos del <fecha>») y se abre.
- **Grupos** — lista de repartos guardados. Cada reparto se puede retocar (mover personas, poner nombre a cada grupo,
  volver a generar con las mismas personas y criterios), renombrar, exportar (PDF, PNG, texto, compartir) o borrar.
- **Personas** — búsqueda, filtros (solteros, casados, ocasionales), alta y edición, e importación desde Excel con vista
  previa. Al añadir «Pepe y Pepa» se crean dos personas casadas entre sí. Un matrimonio comparte la asistencia: marcar a
  uno como ocasional (o habitual) marca también al otro.
- **Perfil** — datos, estadísticas, idioma, apariencia, contraseña, exportar a Excel, borrar datos y cuenta.

## Excel

Una persona por fila; la primera fila, cabeceras. Columnas: **Nombre** (obligatoria), Apellidos, Teléfono, Email y
Cónyuge. Las cabeceras se aceptan en español, inglés, italiano y francés; otras columnas se ignoran.
Quien tiene «Cónyuge» está casado y queda siempre vinculado a su pareja, para que vayan juntos en los grupos. La pareja
se busca por nombre completo (o solo por el nombre si no hay dudas); si no tiene fila propia, se añade a la lista.
Un matrimonio escrito en una sola fila («Jorge y Amparo», también con «e», «and», «et», «&», «+» o «/») se separa en
dos personas casadas entre sí, con los mismos apellidos o, si vienen de dos en dos («García y López»), uno para cada una.
Descarga la plantilla desde la propia importación o desde Perfil.

## Diseño

- Tokens en `src/assets/main.css`, sacados del logo: azul de los nodos para las acciones, verde agua para los
  vínculos entre matrimonios y azul noche para el texto. Contrastes AA comprobados en claro y oscuro.
- Barra de pestañas flotante con material translúcido (se vuelve opaca con «reducir transparencia»).
- El rasgo propio: en cada grupo corre el «hilo» del logo, un nodo por persona y un trazo que une a cada
  matrimonio; el mismo lenguaje se repite en el PDF y en la imagen exportada.
- Respeta el tamaño de texto del sistema (rem), «reducir movimiento» y «aumentar contraste».
- La apariencia por defecto es «Automático» (sigue al sistema); claro y oscuro se pueden forzar desde Perfil.

## Despliegue (Render)

`render.yaml` publica el front como Static Site gratuito. En Render: **New → Blueprint** y elige este repositorio.
Pide `VITE_API_URL` (dirección de la API terminada en `/api`) y `VITE_GOOGLE_CLIENT_ID`. Son valores de
compilación: si cambian, hay que volver a desplegar. Cada push a `main` vuelve a desplegar.
