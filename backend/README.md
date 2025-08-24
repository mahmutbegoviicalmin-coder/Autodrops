# ClothingDS Backend - Printify Integration

Kompletna backend implementacija sa Printify API integracijom, autentifikacijom i enkriptovanim čuvanjem API ključeva.

## 🚀 Brza instalacija

### 1. Instaliraj dependencies

```bash
cd backend
npm install
```

### 2. Postavi environment varijable

Kopiraj `env.example` u `.env` i popuni vrijednosti:

```bash
cp env.example .env
```

Uredi `.env` fajl:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret (generiši random string)
JWT_SECRET="your-super-secret-jwt-key-here-change-this-in-production"

# Encryption Key for API Keys (tačno 32 karaktera)
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# Server
PORT=5000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL="http://localhost:3002"

# Printify API Base URL
PRINTIFY_API_URL="https://api.printify.com/v1"
```

### 3. Postavi bazu podataka

```bash
# Generiši Prisma client
npm run db:generate

# Kreiraj bazu i tabele
npm run db:push

# (Opcionalno) Otvori Prisma Studio za pregled baze
npm run db:studio
```

### 4. Pokreni server

```bash
# Development mode sa auto-restart
npm run dev

# Production mode
npm start
```

Server će biti dostupan na: **http://localhost:5000**

## 📡 API Endpoints

### Autentifikacija

```http
POST /api/auth/register    # Registracija korisnika
POST /api/auth/login       # Login korisnika
GET  /api/auth/me          # Trenutni korisnik
PUT  /api/auth/profile     # Ažuriranje profila
PUT  /api/auth/password    # Promjena lozinke
```

### Printify Integration

```http
POST /api/printify/connect              # Poveži Printify API ključ
POST /api/printify/disconnect           # Prekini konekciju
GET  /api/printify/status               # Status konekcije

GET  /api/printify/products             # Lista proizvoda
GET  /api/printify/products/:id         # Specifičan proizvod
POST /api/printify/create-product       # Kreiraj proizvod
POST /api/printify/upload-design        # Upload dizajna

GET  /api/printify/orders               # Lista narudžbi
GET  /api/printify/catalog              # Printify katalog
GET  /api/printify/catalog/:blueprintId # Blueprint detalji

PUT  /api/printify/shop                 # Ažuriraj shop
```

## 🔐 Sigurnost

### API Ključevi
- Svi Printify API ključevi su **enkriptovani** prije čuvanja u bazi
- Koristi se AES-256-CBC enkripcija
- Svaki korisnik ima svoj enkriptovan API ključ

### Autentifikacija
- JWT tokeni sa 7-dnevnim rokom isteka
- Bcrypt hashing za lozinke (12 rounds)
- Middleware za provjeru autentifikacije

### Rate Limiting
- 100 zahtjeva po IP adresi na 15 minuta
- Helmet.js za dodatnu sigurnost

## 🗄️ Baza podataka

### Tabele

**users**
- id, email, password, name
- printifyApiKey (enkriptovan)
- printifyShopId
- subscriptionPlan, subscriptionStatus

**printify_products**
- Keš Printify proizvoda
- Povezano sa korisnicima

**printify_orders**
- Keš Printify narudžbi
- Povezano sa korisnicima

## 🛠️ Development

### Korisne komande

```bash
# Restartuj bazu (briše sve podatke!)
npx prisma db push --force-reset

# Generiši novi migration
npx prisma migrate dev --name naziv_migracije

# Seed bazu sa test podacima
npx prisma db seed

# Prisma Studio (GUI za bazu)
npm run db:studio
```

### Environment varijable za development

```env
JWT_SECRET="dev-jwt-secret-change-in-production"
ENCRYPTION_KEY="dev-encryption-key-32-chars-long"
```

## 🧪 Testiranje API-ja

### 1. Registracija

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Poveži Printify (koristi token iz login response-a)

```bash
curl -X POST http://localhost:5000/api/printify/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"apiKey":"your-printify-api-key"}'
```

## 📋 Printify API Ključ

### Kako dobiti Printify API ključ:

1. Idi na [Printify.com](https://printify.com) i uloguj se
2. Idi u **My Account → API**
3. Klikni **"Generate new token"**
4. Kopiraj API token
5. Koristi ga u `/api/printify/connect` endpoint-u

## 🚨 Produkcija

### Environment varijable za produkciju

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="super-secure-random-string-here"
ENCRYPTION_KEY="exactly-32-character-key-here!"
FRONTEND_URL="https://yourdomain.com"
```

### Preporučena konfiguracija

- Koristi PostgreSQL umjesto SQLite
- Postavi SSL certifikate
- Koristi reverse proxy (nginx)
- Implementiraj logging (Winston)
- Dodaj monitoring (PM2)

## 🔧 Troubleshooting

### Česti problemi

**"Invalid API key"**
- Provjeri da li je Printify API ključ valjan
- Provjeri da li imaš pristup Printify API-ju

**"Encryption error"**
- ENCRYPTION_KEY mora biti tačno 32 karaktera
- Provjeri da li je postavljen u .env fajlu

**"Database connection failed"**
- Pokreni `npm run db:push`
- Provjeri DATABASE_URL u .env fajlu

**"CORS error"**
- Provjeri FRONTEND_URL u .env fajlu
- Pokreni frontend na istom URL-u
