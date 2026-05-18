# Aaron and Electra's private space...

A private two-person writing tracker for logging writing progress, viewing charts, and syncing entries through a Neon PostgreSQL database.

## Documentation

Project documentation lives in `docs/`:

- [Product Requirements](docs/PRODUCT.md)
- [Design Guide](docs/DESIGN.md)
- [Data Model](docs/DATA_MODEL.md)
- [API Specification](docs/API.md)
- [Implementation Notes](docs/IMPLEMENTATION.md)
- [Project Overview (README)](docs/README.md)

## Environment

Required runtime variables:

- `PASSCODE` - shared app passcode used for entry and session signing. Default fallback is `5947`.
- `DATABASE_URL` - Neon PostgreSQL pooled connection string.

The server also accepts `POSTGRES_URL` as a fallback for Vercel/Neon integrations.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Type-check the project
- `npm run db:push` - Push the Drizzle schema to Neon

## Deployment

The app is deployed on Vercel as a Vite static frontend plus an Express API exported from `api/[...path].ts`. The backend is optimized for serverless environments using the Neon serverless driver. Static assets, favicon, Apple touch icon, and PWA icons are generated from `public/smeemo.png`.
