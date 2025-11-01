# PDF Generator Service

Servizio Node.js per generare PDF dei listini prezzi usando Puppeteer.

## Installazione

```bash
cd server/pdf-generator
npm install
```

## Avvio

```bash
npm start
```

Il servizio sarà disponibile su `http://localhost:3001`

## Endpoint

### POST /api/generate-price-list-pdf

Genera un PDF del listino prezzi.

**Request Body:**
```json
{
  "priceListData": {
    "id": "...",
    "name": "...",
    "created_at": "...",
    "customer": { ... },
    "price_list_items": [ ... ],
    ...
  }
}
```

**Response:**
- Content-Type: `application/pdf`
- Body: File PDF binario

### GET /health

Health check endpoint.

## Deployment

Il servizio può essere deployato su:
- Render
- Railway
- Heroku
- Vercel Serverless Functions (con adattamenti)
- Server proprio

Ricorda di impostare la variabile d'ambiente `PORT` se necessario.

