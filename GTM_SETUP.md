# Configuracion GTM + GA4 para Picor

## Estado actual del sitio

El sitio ya carga el contenedor de Google Tag Manager `GTM-W92XXRSR`.

- Contenedor configurado en `analytics-config.js`
- Carga de GTM y envio de eventos a `dataLayer` en `analytics.js`
- `noscript` agregado en `index.html` y `flyer-b2b.html`

No necesitas tocar mas codigo para empezar a medir en GA4. Lo que falta ahora es configurar las etiquetas dentro de GTM y vincularlas a tu Measurement ID de GA4.

## Lo que necesitas antes de entrar a GTM

1. Tu acceso a Google Tag Manager con el contenedor `GTM-W92XXRSR`.
2. Tu acceso a Google Analytics 4.
3. El Measurement ID de tu flujo web de GA4, con formato `G-XXXXXXXXXX`.

## Como obtener tu Measurement ID de GA4

1. Entra a Google Analytics.
2. Abre la propiedad correcta del sitio.
3. Ve a `Administrador`.
4. En la columna de la propiedad, entra a `Flujos de datos`.
5. Abre el flujo web de `picor.com.ar`.
6. Copia el `Measurement ID`, que se ve como `G-XXXXXXXXXX`.

## Configuracion exacta en GTM

### Paso 1: crear la etiqueta base de GA4

1. Entra a Google Tag Manager.
2. Abre el contenedor `GTM-W92XXRSR`.
3. Ve a `Tags`.
4. Haz clic en `New`.
5. Nombre sugerido: `GA4 - Google tag - Base`.
6. En `Tag Configuration`, elige `Google tag`.
7. En `Tag ID`, pega tu Measurement ID `G-...`.
8. En `Triggering`, elige `All Pages`.
9. Guarda.

Si tu interfaz no muestra `Google tag` y te aparece la opcion vieja, usa `Google Analytics: GA4 Configuration` con el mismo `G-...` y `All Pages`.

### Paso 2: crear las variables de Data Layer

Crea estas variables una por una.

1. Ve a `Variables`.
2. En `User-Defined Variables`, haz clic en `New`.
3. Elige `Data Layer Variable`.
4. Crea cada una con estos nombres.

Variables recomendadas:

- `DLV - event_category` -> Data Layer Variable Name: `event_category`
- `DLV - event_label` -> Data Layer Variable Name: `event_label`
- `DLV - link_url` -> Data Layer Variable Name: `link_url`
- `DLV - link_text` -> Data Layer Variable Name: `link_text`
- `DLV - lead_type` -> Data Layer Variable Name: `lead_type`
- `DLV - client_type` -> Data Layer Variable Name: `client_type`
- `DLV - page_title` -> Data Layer Variable Name: `page_title`
- `DLV - page_location` -> Data Layer Variable Name: `page_location`

No cambies el nombre exacto de esas claves. Asi llegan desde el sitio.

### Paso 3: crear un trigger para los eventos custom del sitio

1. Ve a `Triggers`.
2. Haz clic en `New`.
3. Nombre sugerido: `CE - Picor custom events`.
4. Tipo de trigger: `Custom Event`.
5. En `Event name`, escribe esta regex:

```text
^(cta_click|file_download|press_click|contact_click|social_click|messaging_intent)$
```

6. Marca la opcion para usar regex si la interfaz la muestra.
7. Guarda.

> **CAMBIO DE NOMBRE DE EVENTO - 2026-08-11, hay que actualizar el contenedor.**
>
> El evento `generate_lead` se renombro a `messaging_intent`. El motivo esta en el Handbook
> §26: un evento se nombra por el momento que se puede *verificar*. Ese evento se dispara
> cuando el visitante SALE hacia WhatsApp: lo vemos irse y nunca sabemos si llego. Llamarlo
> `generate_lead` reportaba una conversion con un margen de error que nadie puede estimar.
>
> **El trigger de arriba filtra por nombre exacto.** Hasta que publiques el contenedor con la
> regex nueva, esos eventos dejan de llegar a GA4. Los dos cambios - subir el sitio y publicar
> el contenedor - van juntos.
>
> Las propiedades (`lead_type`, `client_type`) no cambiaron, asi que las variables de Data Layer
> del Paso 2 siguen funcionando sin tocarlas.
>
> **Los cuatro meses ya registrados como `generate_lead` no se pueden reclasificar.** No hay otra
> fuente para reconstruirlos. En GA4 quedan como estan; a partir del cambio, la serie nueva es la
> que se puede leer.

### Paso 4: crear una etiqueta unica para enviar todos esos eventos a GA4

1. Ve a `Tags`.
2. Haz clic en `New`.
3. Nombre sugerido: `GA4 - Event - Picor custom events`.
4. En `Tag Configuration`, elige `Google Analytics: GA4 Event` si esa opcion existe.
5. Si la interfaz nueva te ofrece `Google tag` + `Event`, usa esa variante.
6. En el campo de configuracion base, selecciona la etiqueta `GA4 - Google tag - Base` o el `Google tag` base que creaste antes.
7. En `Event Name`, pon la variable integrada `{{Event}}`.
8. Agrega estos parametros de evento:

| Parameter Name | Value |
| --- | --- |
| event_category | {{DLV - event_category}} |
| event_label | {{DLV - event_label}} |
| link_url | {{DLV - link_url}} |
| link_text | {{DLV - link_text}} |
| lead_type | {{DLV - lead_type}} |
| client_type | {{DLV - client_type}} |
| page_title | {{DLV - page_title}} |
| page_location | {{DLV - page_location}} |

9. En `Triggering`, selecciona `CE - Picor custom events`.
10. Guarda.

Con una sola etiqueta te llevas todos los eventos del sitio a GA4.

### Paso 5: probar antes de publicar

1. En GTM, haz clic en `Preview`.
2. Ingresa la URL del sitio.
3. Se abrira Tag Assistant.
4. Verifica que en `Summary` aparezcan estos eventos cuando interactuas con la pagina:
   - `cta_click`
   - `file_download`
   - `press_click`
   - `contact_click`
   - `social_click`
   - `messaging_intent`
5. Haz clic sobre cada evento y verifica que dispare la etiqueta `GA4 - Event - Picor custom events`.
6. Revisa que los parametros lleguen completos.

### Paso 6: publicar

1. En GTM, haz clic en `Submit`.
2. Pon un nombre como `GA4 base + Picor events`.
3. Publica.

### Paso 7: validar en GA4

1. Abre GA4.
2. Ve a `Reports` -> `Realtime`.
3. En otra pestaña, navega el sitio y haz clic en algunos CTAs.
4. Confirma que ves los eventos llegar.

## Como marcar conversiones o key events en GA4

**Este sitio no tiene ninguna conversion que pueda marcarse como key event, y eso no es un
descuido: es lo que hay.** Handbook §26 lo dice sin rodeos - un evento se nombra por el momento
que se puede *verificar*, y lo que pasa fuera del sitio (en WhatsApp, en un scheduler, en una
pagina de pago) se puede ver **partir** y nunca **llegar**.

`messaging_intent` es exactamente eso: una salida. Marcarlo como key event produce un numero de
conversion inflado por un margen que nadie puede estimar, presentado con la misma confianza que
uno real. **Es una intencion, se llama asi, y no se designa como la conversion principal.**

Una conversion real de este sitio existe el dia que haya un receptor que **persista** la consulta
en un sistema del negocio antes de cualquier salto a WhatsApp (esta registrado como OPEN-02 en
`docs/open-definitions.md`). Ese dia el evento se llama `contact_form_submitted`, se dispara
contra la respuesta del receptor, y **ese** se marca como key event.

Mientras tanto, lo util y honesto:

1. Marca `messaging_intent` como key event **solo si** entendes que mide intencion, no cierre, y
   lo reportas con ese nombre.
2. Leelo siempre **en par** con el volumen de conversaciones reales que llegan a WhatsApp. La
   diferencia entre los dos es la tasa de abandono en el salto, y es la unica forma de estimar
   cuanto sobra en el numero de arriba.

## Mapa exacto de eventos del sitio

### 1. `cta_click`

Se dispara en estos elementos:

- `hero_restaurante`
- `hero_formatos_disponibles`
- `b2b_solicitar_informacion`
- `b2c_quiero_probarlo`
- `sticky_whatsapp`
- `floating_whatsapp`
- `flyer_whatsapp`

Parametros enviados:

- `event_category`: `engagement`
- `event_label`: uno de los labels listados arriba
- `link_url`: href del enlace
- `link_text`: texto visible del enlace
- `page_title`
- `page_location`

### 2. `file_download`

Se dispara en:

- `ficha_tecnica_pdf`

Parametros enviados:

- `event_category`: `engagement`
- `event_label`: `ficha_tecnica_pdf`
- `link_url`
- `link_text`
- `page_title`
- `page_location`

### 3. `press_click`

Se dispara en:

- `clarin_rural`
- `gobierno_salta`

Parametros enviados:

- `event_category`: `engagement`
- `event_label`: el medio clickeado
- `link_url`
- `link_text`
- `page_title`
- `page_location`

### 4. `contact_click`

Se dispara en:

- `email_contacto`
- `whatsapp_contacto`

Parametros enviados:

- `event_category`: `engagement`
- `event_label`
- `link_url`
- `link_text`
- `page_title`
- `page_location`

### 5. `social_click`

Se dispara en:

- `instagram`
- `whatsapp_footer`

Parametros enviados:

- `event_category`: `engagement`
- `event_label`
- `link_url`
- `link_text`
- `page_title`
- `page_location`

### 6. `messaging_intent`

**Intencion, no resultado.** Se dispara cuando el visitante sale hacia WhatsApp. Antes se llamaba
`generate_lead`; ver la nota del Paso 3.

Se dispara en dos casos:

#### Lead por formulario principal

Parametros enviados:

- `lead_type`: `contact_form`
- `client_type`: valor del select
  - `restaurante`
  - `distribuidor`
  - `kimchi`
  - `dietética`
  - `foodie`
  - `desconocido`
- `page_title`
- `page_location`

#### Lead por lista de espera de tienda online

Parametros enviados:

- `lead_type`: `store_waitlist`
- `page_title`
- `page_location`

## Recomendacion de lectura en GA4

Si quieres un minimo operativo y util, revisa estas metricas:

1. `messaging_intent` como **intencion de contacto**, nunca como conversion cerrada.
2. `file_download` para medir interes comercial serio.
3. `cta_click` segmentado por `event_label` para ver que CTA empuja mas.
4. `client_type` dentro de `messaging_intent` para entender si te llegan mas restaurantes, distribuidores o foodies.
5. La diferencia entre `messaging_intent` y las conversaciones que realmente abris en WhatsApp.
   Ese numero no esta en GA4 y hay que contarlo a mano, pero es el unico que dice cuanto de lo de
   arriba se perdio en el salto.

## Ejemplo de lectura practica

Si en GA4 ves esto:

- muchos `cta_click`
- muchos `contact_click`
- pocos `messaging_intent`

Entonces el problema no esta en atraccion sino en el cierre del contacto o en el flujo de WhatsApp.

Si ves esto:

- muchos `file_download`
- `messaging_intent` con `client_type=restaurante`

Entonces la propuesta B2B esta funcionando bien y la ficha tecnica probablemente esta ayudando al cierre.

## Si quieres una configuracion aun mejor

El siguiente paso recomendable seria crear en GTM una segunda etiqueta o variables extra para capturar:

1. scroll profundo
2. envio del formulario con mas detalle
3. clicks a anchors internos por seccion
4. vista del flyer como landing separada

Eso ya seria optimizacion, no setup minimo.