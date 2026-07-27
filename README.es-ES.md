<div align="center">

# IAmNotYourFan

### Encuentra cuentas de X/Twitter que sigues y que no te siguen de vuelta, luego revísalas, expórtalas o deja de seguirlas desde un panel local.

[![License: MIT](https://img.shields.io/badge/License-MIT-e0a33a.svg?style=flat-square)](#license)
[![Preact](https://img.shields.io/badge/Preact-10-673AB8?style=flat-square&logo=preact&logoColor=white)](https://preactjs.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Local first](https://img.shields.io/badge/Data-local%20first-62d6d0?style=flat-square)](#privacy-and-safety)
[![Latest release](https://img.shields.io/github/v/release/0xKoller/IAmNotYourFan?style=flat-square&color=e0a33a)](https://github.com/0xKoller/IAmNotYourFan/releases)

[Página del Proyecto](https://0xkoller.github.io/IAmNotYourFan/) · [Última Versión](https://github.com/0xKoller/IAmNotYourFan/releases/latest) · [Reportar un Problema](https://github.com/0xKoller/IAmNotYourFan/issues)

</div>

---

## ¿Qué es?

`IAmNotYourFan` es una herramienta local, para pegar en la consola, destinada a la limpieza de seguidos en X/Twitter.

Escanea tu página de **Siguiendo**, detecta quiénes te siguen de vuelta y abre un panel de pantalla completa donde puedes buscar, filtrar, ordenar, verificar cuentas inactivas y, opcionalmente, dejar de seguir cuentas una por una o en lotes aleatorios lentos.

Útil para:

- Encontrar no seguidores en X/Twitter.
- Limpiar cuentas que sigues y que no te siguen de vuelta.
- Revisar mutuales frente a seguimientos no recíprocos.
- Auditar cuentas inactivas antes de decidir a quién dejar de seguir.
- Ejecutar todo localmente sin subir tu lista de seguidos a ningún lugar.

---

## Características

| Característica | Qué hace |
|---|---|
| Eres un fan | Muestra cuentas que sigues y que no te siguen de vuelta. |
| Mejores amigos | Muestra seguimientos mutuos. |
| Buscar, filtrar, ordenar | Filtra por nombre de usuario, nombre visible, relación, actividad u orden de clasificación. |
| Escaneo de inactividad | Verifica la actividad visible reciente utilizando tu sesión actual de X en el navegador. |
| Unfollow individual | Deja de seguir directamente desde una tarjeta de resultado con un clic de confirmación. |
| Unfollow masivo | Selecciona cuentas y deja de seguirlas en lotes aleatorios. |
| Controles de seguridad | Pausar, reanudar, detener, límite máximo por ejecución, retrasos aleatorios por usuario y por lote. |
| Persistencia local | Mantiene el estado del escaneo/unfollow localmente durante 24 horas para evitar repeticiones accidentales. |
| Exportar | Exporta los no seguidores descubiertos como JSON o CSV. |
| Prioridad local | Sin backend, sin analíticas, sin inicio de sesión de cuenta, sin subida de lista de seguidos. |

---

## Página del Proyecto

Abre la página pública del proyecto aquí:

https://0xkoller.github.io/IAmNotYourFan/

La página explica qué hace la herramienta y contiene enlaces a este repositorio y a las versiones.

---

## Inicio Rápido

Construye el script de consola pegable localmente:

```bash
pnpm install
pnpm build:console
pnpm make:console-bundle
```

Luego ejecútalo en tu cuenta real de X:

1. Abre tu página de seguidos de X: `https://x.com/TUUSUARIO/following`.
2. Abre las DevTools y luego la pestaña Console.
3. Pega el contenido completo de `dist/iamnotyourfan-full-console.js`.
4. Espera mientras el script se desplaza y recopila tu lista de seguidos.
5. Revisa el panel.

Probado en cuentas reales con más de `950` seguidos.

---

## Cómo funciona el Unfollow

Las acciones de dejar de seguir se ejecutan desde tu navegador utilizando tu sesión autenticada actual de X.

Unfollow individual:

- Haz clic en `Unfollow` en una tarjeta.
- Haz clic de nuevo para confirmar.
- La tarjeta permanece visible con una etiqueta de `Unfollowed`.

Unfollow masivo:

- Haz clic en las tarjetas para seleccionar cuentas.
- Inicia `Mass unfollow selected`.
- La ejecución procesa los usuarios seleccionados en lotes.
- Los valores predeterminados son conservadores: `10` por lote, `2-10s` entre usuarios, `5-45s` entre lotes, `50` máximo por ejecución.
- Puedes pausar, reanudar, detener o editar los ajustes de tiempo.

Importante: los retrasos aleatorios reducen la frecuencia de ráfagas, pero no pueden garantizar que X no limite (throttle), restrinja o bloquee tu cuenta. Usa las acciones de unfollow bajo tu propio riesgo.

---

## Privacidad y Seguridad

Todo se ejecuta localmente en tu navegador.

- Sin servidor.
- Sin analíticas.
- Sin inicio de sesión de cuenta externa.
- Sin subida de lista de seguidos.
- Las cookies y cabeceras de la sesión de X permanecen en tu navegador.

Debido a que esto depende de los internos web de X/Twitter, la aplicación puede dejar de funcionar cuando X cambie su DOM, rutas de API, IDs de operación, límites de tasa o sistemas de seguridad de cuenta.

---

## Desarrollo

```bash
pnpm dev           # panel en modo previsualización local con datos falsos
pnpm dev:landing   # página de aterrizaje en modo desarrollo
pnpm build         # build web de producción
pnpm build:console # build para modo consola
pnpm make:console-bundle
```

Archivos principales:

- `src/components/Scanning.tsx` - Interfaz de usuario del panel.
- `src/utils/x-selectors.ts` - Selectores de recolección del DOM de X.
- `src/utils/x-api.ts` - Ayudantes locales de la API de X.
- `src/utils/unfollow.ts` - Controlador de unfollow individual y por lotes.
- `src/utils/activity-scan.ts` - Escaneo de cuentas inactivas.

---

## Stack Tecnológico

- Preact
- Vite
- TypeScript
- Sass

---

## Palabras Clave

herramienta unfollow X, herramienta unfollow Twitter, no seguidores X, no seguidores Twitter, encontrar quién no sigue de vuelta, dejar de seguir no seguidores, unfollow masivo X, unfollow masivo Twitter, limpieza de seguidos, herramienta de navegador local.

---

## Contribución

Los issues y PRs son bienvenidos. X cambia a menudo, por lo que las correcciones de selectores, descubrimiento de API, comportamiento de throttling y regresiones de UI son especialmente útiles.

---

## Créditos

Inspirado en [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) de David Arroyo.

## Licencia

[MIT](LICENSE) © [0xKoller](https://x.com/0xKoller)
