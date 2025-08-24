# 🚀 Vercel Deployment Guide za AutoDrops

## ✅ Što sam sve pripremio za tebe:

### 1. **Serverless API funkcije** (`/api/` folder)
- `api/auth.js` - Login, register, profile
- `api/products.js` - CJ Dropshipping integracija
- `api/affiliate.js` - Affiliate sistem

### 2. **Production konfiguracija**
- `vercel.json` - Vercel routing i build config
- Promijenjeni API endpoints u frontend servicesima
- Optimizovani build scripts

### 3. **Environment template**
- `vercel-env-template.txt` - Sve potrebne env varijable

---

## 🔧 GitHub Setup (korak-po-korak):

### Korak 1: Kreiraj GitHub repo
```bash
# U tvom PROJEKT4 direktoriju
git init
git add .
git commit -m "Initial commit for Vercel deployment"
```

### Korak 2: Kreiraj repo na GitHub.com
1. Idi na github.com
2. Klikni "New repository" 
3. Ime repo: `autodrops` ili kako hoćeš
4. **NE** dodavaj README, .gitignore ili license
5. Klikni "Create repository"

### Korak 3: Linkuj lokalni projekt sa GitHub
```bash
# Kopiraj URL sa GitHub stranice
git remote add origin https://github.com/TVOJ-USERNAME/TVOJ-REPO-NAME.git
git branch -M main
git push -u origin main
```

---

## 🌐 Vercel Deploy:

### Korak 1: Konektuj GitHub sa Vercel
1. Idi na **vercel.com**
2. Sign up sa GitHub accountom
3. Klikni "New Project"
4. Import tvoj GitHub repo

### Korak 2: Configure project
- **Framework Preset**: Vite
- **Root Directory**: `./` (ostavi kao default)
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`

### Korak 3: Environment Variables
U Vercel dashboardu → Project Settings → Environment Variables, dodaj sve iz `vercel-env-template.txt`:

**Osnovne (obavezne):**
```
DATABASE_URL=postgresql://host:port/database
JWT_SECRET=neki-random-string-123
CJ_ACCESS_TOKEN=tvoj-cj-token
NODE_ENV=production
```

**Firebase (obavezne za auth):**
```
VITE_FIREBASE_API_KEY=tvoj-api-key
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-id
```

### Korak 4: Deploy!
Klikni "Deploy" - Vercel će automatski:
- Instaliraj dependencies
- Build frontend
- Deploy serverless funkcije
- Dati ti URL: `https://your-app.vercel.app`

---

## 🗄️ Database Setup:

### Opcija 1: Supabase (preporučeno - besplatno)
1. Idi na **supabase.com**
2. New Project → PostgreSQL database
3. Kopiraj connection string
4. Dodaj kao `DATABASE_URL` u Vercel

### Opcija 2: PlanetScale (MySQL - besplatno)
1. Idi na **planetscale.com** 
2. New Database
3. Kopiraj connection string

### Opcija 3: Railway (PostgreSQL - $5/mjesec)
1. Idi na **railway.app**
2. New Project → Provision PostgreSQL

---

## ⚡ Post-Deploy Tasks:

### 1. Database migracione
```bash
# Dopo deploy, u Vercel Function Logs ili lokalno:
npx prisma migrate deploy
npx prisma generate
```

### 2. Test API endpoints
- `https://your-app.vercel.app/api/auth?action=register`
- `https://your-app.vercel.app/api/products?action=search`
- `https://your-app.vercel.app/api/affiliate?action=stats`

### 3. Update environment URLs
U Vercel environment variables, promijeni:
```
FRONTEND_URL=https://your-actual-vercel-url.vercel.app
CORS_ORIGIN=https://your-actual-vercel-url.vercel.app
```

---

## 🔄 Redeploy Process:

Za buduće promjene:
```bash
git add .
git commit -m "Update features"
git push
```
Vercel će automatski redeploy!

---

## 🐛 Troubleshooting:

### Build fails:
- Provjeri da li su sve dependencies u `package.json`
- Provjeri TypeScript errore lokalno: `npm run build`

### API ne radi:
- Provjeri environment variables u Vercel
- Provjeri Function Logs u Vercel dashboard

### Database ne radi:
- Provjeri `DATABASE_URL` format
- Provjeri da li je database accessible

---

## 💰 Troškovi:

- **Vercel**: Besplatno do 100GB bandwidth/mjesec
- **Supabase**: Besplatno do 500MB storage
- **Firebase**: Besplatno do 50K reads/day

**Ukupno**: €0-5/mjesec za malu do srednju aplikaciju!

---

## 🎯 Šta radiš sada:

1. **Setup GitHub** (10 min)
2. **Deploy na Vercel** (5 min) 
3. **Setup database** (10 min)
4. **Test aplikaciju** (5 min)

**Ukupno**: ~30 minuta i gotov si! 🎉
