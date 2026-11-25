# Nemkit Notify Web

Portal Angular 19 para operar el servicio de notificaciones (`nemkit-notify-api`): temas, suscriptores, historial de entregas, API Keys y WebPush.

Reutiliza el foundation de autenticación (login, registro, guards, interceptor de tokens, estados de carga y notificaciones) y sustituye las pantallas funcionales por las del dominio de notificaciones.

## Desarrollo

```bash
npm ci
npm start
```

La aplicación abre en `http://localhost:4300` y consume `http://localhost:4001/api/v1/notify`.

## Producción

```bash
npm run build
```

La URL de API de producción se define en `src/environments/environment.prod.ts`.
