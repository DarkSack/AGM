# AGM Diseño y Proyección

Sitio web y CMS del despacho de arquitectura **AGM Diseño y Proyección**.

Son dos productos en un mismo proyecto:

- **Sitio público** — una sola página, en español e inglés, pensada para
  posicionar orgánicamente y convertir visitas en solicitudes de cotización.
- **Panel privado** (`/admin`) — para que el despacho publique proyectos y
  cambie los textos sin tocar el código.

---

## Stack y por qué

| Pieza | Elección | Motivo |
|---|---|---|
| Framework | **Next.js 15** (App Router) | El requisito número uno era SEO. Next renderiza en el servidor y genera HTML estático: Google recibe la página completa, no un contenedor vacío que rellena JavaScript. Además su API de metadata cubre canonical, `hreflang`, Open Graph, `sitemap.xml` y `robots.txt` sin librerías extra. Astro habría servido para la parte pública, pero el encargo incluye un panel autenticado con formularios y subida de archivos: con Astro haría falta añadir un framework de islas igualmente. |
| Lenguaje | **TypeScript** en modo estricto | Con `strict`, `noUncheckedIndexedAccess` y `noUnusedLocals`. No hay un solo `any` en el código. |
| Estilos | **Tailwind CSS v4** | Tokens en CSS nativo (`@theme`), cero CSS-in-JS en tiempo de ejecución. La hoja final solo contiene las utilidades que se usan. |
| i18n | **next-intl** | Rutas traducidas reales (`/proyectos/x` y `/en/projects/x`), no un parámetro de idioma. El cambio de idioma es navegación del router, sin recargar. |
| Backend | **Supabase** | Autenticación, Postgres y almacenamiento de archivos en un solo proveedor, con capa gratuita suficiente para un despacho pequeño y **Row Level Security** en la base de datos. Firebase habría obligado a modelar el contenido en documentos; aquí el contenido es relacional y las políticas de seguridad viven junto a los datos, no en el código de la aplicación. |
| Validación | **zod** | El mismo esquema valida en el navegador y en el servidor, así que el mensaje que ve el usuario y la regla que se aplica no pueden divergir. |
| Animación | Ninguna librería | `IntersectionObserver` y transiciones CSS. Añadir 40 KB de JavaScript para un fundido no compensa. |

**Peso resultante:** 103 KB de JavaScript compartido; la portada suma 4 KB
propios. El titular del hero es texto —no una imagen— así que el LCP se pinta
con el HTML inicial.

---

## Puesta en marcha

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre <http://localhost:3000>.

**El sitio público funciona sin configurar nada.** Sin Supabase sirve el
contenido de `src/content/`, y el panel muestra las instrucciones de
configuración en lugar de fallar. Eso permite revisar y desplegar la web antes
de dar de alta el backend.

### Scripts

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción
npm run start      # sirve el build
npm run clean      # borra la caché de compilación (.next)
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

> **No ejecutes `npm run build` con `npm run dev` levantado.** Los dos escriben
> en el mismo directorio `.next`, y el build reemplaza los *chunks* que el
> servidor de desarrollo ya tiene cargados. El síntoma es un error en tiempo de
> ejecución del tipo `Cannot find module './vendor-chunks/…'`. Si ocurre: para
> el servidor, `npm run clean` y vuelve a arrancar. No indica ningún problema
> en el código.

---

## Configurar el backend (CMS)

### 1. Crear el proyecto en Supabase

En <https://supabase.com>, crea un proyecto y abre el **SQL Editor**. Pega y
ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql). Crea las
tablas, los tipos, las políticas RLS y el bucket de imágenes. Es idempotente:
se puede volver a ejecutar sin romper nada.

### 2. Variables de entorno

En **Project Settings → API** copia la URL y la clave `anon` a `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

La clave `anon` es pública por diseño y va en el navegador. Lo que protege los
datos son las políticas RLS, no el secreto de esa clave. **No pongas nunca la
clave `service_role` en este proyecto**: no la necesita.

### 3. Dar de alta al primer administrador

En **Authentication → Users → Add user**, crea el usuario con su correo y
contraseña, y marca **Auto Confirm User**: sin confirmar, el correo no puede
iniciar sesión y el login devuelve un error genérico de credenciales que
despista. Copia su UUID y ejecuta en el SQL Editor:

```sql
insert into public.profiles (id, email, full_name, role)
values ('UUID-DEL-USUARIO', 'correo@ejemplo.com', 'Nombre Apellido', 'admin')
on conflict (id) do update set role = 'admin';
```

Sin fila en `profiles` el usuario puede iniciar sesión pero no escribir nada:
todas las políticas exigen `internal.is_staff()`. Es lo que separa a un usuario
cualquiera de Supabase Auth del personal del despacho.

Ya puedes entrar en `/admin`.

---

## Qué se administra desde el panel

| Sección | Qué permite |
|---|---|
| **Inicio** | Cifras del sitio y última actualización. |
| **Proyectos** | Alta, edición y borrado. Publicar y despublicar desde el propio listado. Galería con subida múltiple, reordenación, portada y texto alternativo por imagen e idioma. Vista previa de borradores. |
| **Mensajes** | Solicitudes recibidas por el formulario, con marcado de leído. |
| **Servicios** | Crear, reordenar, activar/desactivar, cambiar icono y textos. |
| **Contenido** | Titular de portada, botones, presentación del despacho, método de trabajo y valores. |
| **Composición** | Qué bloques aparecen en la portada y en qué orden. |
| **Despacho** | Teléfono, correo, redes, dirección y horarios. |
| **SEO** | Título, descripción, palabras clave e imagen social, en los dos idiomas. |

Todo con los dos idiomas a la vista en cada campo, y un punto que indica si el
inglés ya está escrito: el fallo típico de un CMS bilingüe es publicar con la
traducción a medias sin darse cuenta.

---

## Seguridad

- **RLS activo en todas las tablas.** El público anónimo solo lee lo publicado.
  Un borrador no es accesible ni adivinando su URL ni llamando a la API.
- **Triple validación** en el formulario público: zod en el navegador, el mismo
  esquema zod en la ruta de API, y `CHECK` en Postgres.
- **Cada Server Action comprueba la sesión.** Una Server Action es un endpoint
  POST: el middleware no la cubre, así que la comprobación está junto a la
  operación.
- **Sin ejecución de código arbitrario desde el CMS.** Los bloques de contenido
  salen de un catálogo cerrado y cada tipo tiene su componente. No hay ningún
  campo que acepte HTML ni JavaScript, ni se usa `dangerouslySetInnerHTML` con
  datos de la base. Los destinos de los botones se filtran para que solo
  admitan anclas y rutas internas.
- **Subidas validadas en el servidor.** El bucket declara tipos MIME y tamaño
  máximo; la política de escritura exige ser personal del despacho. La
  validación del navegador solo sirve para dar el error antes.
- **Sin secretos en el frontend.** Solo variables `NEXT_PUBLIC_`, todas
  públicas por naturaleza.
- Formulario con trampa para bots y límite de envíos por IP.

---

## SEO

Implementado: metadata por idioma, canonical, `hreflang` con `x-default`,
Open Graph y Twitter Cards, `sitemap.xml` con alternativas de idioma,
`robots.txt`, y JSON-LD (`ProfessionalService` + `LocalBusiness`, `WebSite`,
`WebPage`, `CollectionPage`, y `BreadcrumbList` en las fichas de proyecto).

Esto construye la mejor base técnica posible. **No garantiza ninguna posición
concreta en Google**: el posicionamiento depende además del contenido, la
antigüedad del dominio, los enlaces entrantes y la competencia local.

### Dos decisiones deliberadas

**No se publica lo que no está confirmado.** Mientras `siteConfig.location`
tenga `verified: false`, la dirección y las coordenadas no se emiten en el
JSON-LD y `areaServed` se omite. Un dato inventado en datos estructurados no
solo no ayuda al SEO local: puede acarrear una acción manual de Google por
marcado engañoso.

**Los proyectos conceptuales no se atribuyen a AGM.** Se declaran como
`CreativeWork` con `creativeWorkStatus: "Concept"` y **sin** la propiedad
`creator`. En la interfaz llevan la etiqueta «Proyecto conceptual» y un aviso
explícito. Al crear un proyecto nuevo desde el panel, la casilla viene
desmarcada: los conceptuales son la excepción.

---

## Analítica

GA4 se carga solo si `NEXT_PUBLIC_GA_MEASUREMENT_ID` tiene un valor real
(el placeholder `G-XXXXXXXXXX` no cuenta). Eventos:

`whatsapp_click`, `phone_click`, `email_click`, `facebook_click`,
`quote_cta_click`, `projects_cta_click`, `project_view`, `contact_form_submit`,
`contact_form_error`, `language_change`, `theme_change`, `nav_click`.

Nunca se envía información personal: del formulario solo viaja el tipo de
proyecto, que es una categoría. Se desactivan las señales de Google y la
personalización de anuncios.

---

## Pendiente de recibir del cliente

Está todo marcado en el código con corchetes o con el comentario `VERIFICAR`:

1. **Dirección del despacho.** En la papelería aparece algo parecido a
   *Avenida Sierra Leona 424-B, Colonia Sierra Margarita, C.P. 45140*, pero no
   es legible con certeza en la imagen de referencia. El C.P. y la lada 33
   apuntan a Zapopan, Jalisco. **Hay que confirmarlo** antes de ponerlo en
   `src/config/site.ts` y cambiar `verified` a `true`.
2. **URL real de la página de Facebook.** Mientras sea `null`, el sitio muestra
   el nombre sin enlazarlo y no lo incluye en `sameAs`.
3. **Datos del arquitecto:** nombre, titulación y cédula.
4. **Fotografías reales.** Los proyectos actuales son propuestas conceptuales
   de demostración; las imágenes son dibujos de línea generados por
   `scripts/generate-placeholders.mjs`, no fotos de banco de imágenes. Se
   sustituyen subiendo fotos desde el panel.
5. **Aviso de privacidad.** El texto actual es un marcador y la página está en
   `noindex` hasta que se redacte.
6. **Horario de atención**, si se quiere publicar.

---

## Despliegue

Recomendado en **Vercel**, que es donde Next se despliega sin configuración.

1. Sube el repositorio a GitHub e impórtalo en Vercel.
2. En **Environment Variables** añade:
   - `NEXT_PUBLIC_SITE_URL` — el dominio real, con `https://` y sin barra final.
     Es lo que alimenta canonical, `hreflang`, sitemap y Open Graph: **si queda
     en `localhost`, el SEO no funciona**.
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID` cuando exista la propiedad de GA4.
   - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` cuando se verifique en Search
     Console.
3. Deploy. HTTPS y CDN vienen configurados.
4. En Search Console, da de alta el dominio y envía `/sitemap.xml`.
5. En Supabase → **Authentication → URL Configuration**, añade el dominio en
   *Site URL* y en *Redirect URLs*, o el enlace de recuperación de contraseña
   apuntará a `localhost`.

---

## Estructura

```
src/
├─ app/
│  ├─ (site)/[locale]/     sitio público (portada, fichas, aviso legal)
│  ├─ (admin)/admin/       panel privado
│  ├─ api/contact/         recepción del formulario
│  ├─ sitemap.ts · robots.ts
│  └─ globals.css          tokens y sistema de diseño
├─ components/
│  ├─ layout/              navbar, menú móvil, pie, tema, idioma
│  ├─ sections/            hero, sobre, servicios, proyectos, método, valores, contacto
│  ├─ blocks/              catálogo de bloques y su renderizador
│  ├─ admin/               interfaz del panel
│  ├─ seo/                 JSON-LD
│  └─ ui/                  primitivos compartidos
├─ config/site.ts          punto único de configuración editable
├─ content/                contenido por defecto y semilla del CMS
├─ data/                   lecturas públicas + mapeo de la base de datos
├─ lib/
│  ├─ admin/               auth, esquemas, consultas y Server Actions
│  ├─ supabase/            clientes de navegador, servidor y anónimo
│  └─ seo.ts · analytics.ts · validation.ts
├─ i18n/                   rutas traducidas y configuración de next-intl
├─ messages/               es.json · en.json
└─ types/content.ts        modelo de contenido
```

Dos *root layouts* separados por grupo de ruta: el panel no carga las
traducciones ni el serif editorial del sitio público, y el sitio público no
carga nada del panel.

---

## Preparado para crecer

El modelo de contenido admite sin reescrituras: blog o noticias (tabla propia
con el mismo patrón), casos de estudio, testimonios, más categorías de
proyecto, páginas individuales de servicio y más idiomas (basta añadirlos a
`LOCALES` y crear su fichero de mensajes). Los roles `admin` y `editor` ya
están en la base de datos con el punto de control en `assertAdmin()`.
