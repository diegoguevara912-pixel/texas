# ADR-0004: El autolote es un producto independiente de la fábrica

**Estado:** Aceptado · **Fecha:** 2026-10-21 (decidido el 2026-10-20) · **Decide:** Diego Guevara

## Contexto
El autolote necesita backend, base de datos, panel administrativo con cuentas y showroom 3D; la fábrica produce sitios estáticos para hosting compartido.

## Decisión
- Autolote Ultra Premium 3D no usa la Fábrica Web Signature ni Signature Studio.
- Pila: Node.js + Express, React + Vite, three.js (React Three Fiber), MySQL en Hostinger y SQLite en local, migraciones con Knex. Sin Supabase ni Firebase por defecto.
- No se inventan vehículos, precios, testimonios, tasas ni cuentas bancarias: los 7 vehículos DEMO son ficticios y se quitan antes de publicar; los pagos con tarjeta están inactivos.

## Consecuencias
- Publicarlo exige un plan de Hostinger con «Node.js Web App» (pendiente de confirmar en hPanel) o reescribir el backend en PHP.
