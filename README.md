# SmartRec — Smart Product Recommendation System
## CS6905 Cloud Information Management Systems — Group 01

---

## Project Structure

```
smartrec/
├── backend/                          ← Node.js / Express REST API (port 5000)
│   ├── server.js                     ← Entry point
│   ├── db.js                         ← In-memory DB (simulates DynamoDB tables)
│   ├── package.json
│   ├── data/
│   │   ├── products.json             ← 194 products (from CSV)
│   │   ├── users.json                ← 5 demo users (seeded)
│   │   └── interactions.json         ← Interaction history (seeded)
│   ├── services/
│   │   ├── tfidf.service.js          ← TF-IDF + cosine similarity
│   │   ├── collaborative.service.js  ← Jaccard user-user filtering
│   │   └── popularity.service.js     ← Cold-start popularity scoring
│   ├── middleware/
│   │   └── auth.js                   ← JWT protect / optionalAuth / signToken
│   └── routes/
│       ├── auth.js                   ← Login, register, me, list users
│       ├── products.js               ← CRUD + search / filter / sort / paginate
│       ├── recommendations.js        ← All 3 algorithm endpoints
│       └── interactions.js           ← Record events, history, PIPEDA erasure
└── frontend/                         ← React + Vite (port 3000)
    ├── vite.config.js                ← Proxies /api → localhost:5000
    ├── index.html
    └── src/
        ├── App.jsx                   ← Root component + auth guard
        ├── main.jsx
        ├── index.css
        ├── context/
        │   └── AuthContext.jsx       ← Global auth state + user switching
        ├── services/
        │   └── api.js                ← All fetch calls (authAPI, productsAPI, recsAPI, …)
        ├── components/
        │   ├── ui.jsx                ← Stars, AlgoBadge, Spinner, Avatar, …
        │   ├── Header.jsx            ← Nav + demo user switcher
        │   ├── ProductCard.jsx       ← Product grid card (records view on click)
        │   └── DetailPanel.jsx       ← Product detail + similar products
        └── pages/
            ├── LoginPage.jsx         ← Auth form with demo account shortcuts
            ├── BrowsePage.jsx        ← Full catalog + sidebar filters + pagination
            ├── ForYouPage.jsx        ← Personalised feed (live from API)
            ├── HistoryPage.jsx       ← Interaction history + PIPEDA erasure
            ├── AlgorithmPage.jsx     ← Algorithm transparency dashboard
            └── SystemPage.jsx        ← AWS infra status + schema + security
```

---

## Quick Start

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
# → Running on http://localhost:5000
```

Verify it's up:
```bash
curl http://localhost:5000/health
curl http://localhost:5000/api
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Demo Accounts

All passwords are: **password**

| Email | User | Segment |
|-------|------|---------|
| alex@example.com | Alex Chen | tech-enthusiast |
| sarah@example.com | Sarah Miller | fashion-beauty |
| james@example.com | James Thompson | sports-outdoor |
| emma@example.com | Emma Davis | home-lifestyle |
| newuser@example.com | New User | cold-start (no history) |

Switch between users using the dropdown in the top-right corner.

---

## API Endpoints

### Authentication
```
POST /api/auth/login         { email, password } → { token, user }
POST /api/auth/register      { name, email, password } → { token, user }
GET  /api/auth/me            (Bearer token) → { user }
GET  /api/auth/users         → [users] (all demo users)
```

### Products
```
GET    /api/products                 ?category=&search=&sort=&page=&limit=
GET    /api/products/categories      → categories with counts
GET    /api/products/:id             → single product
POST   /api/products                 (auth) create product
PUT    /api/products/:id             (auth) update product
DELETE /api/products/:id             (auth) delete product
```

Sort options: `popularity | rating | price_asc | price_desc | discount`

### Recommendations
```
GET /api/recommendations/for-you/:userId      → personalised feed
GET /api/recommendations/similar/:productId   → TF-IDF similar products
GET /api/recommendations/popular              ?category=&limit=
GET /api/recommendations/algorithm-info/:userId → transparency data
```

### Interactions
```
POST   /api/interactions              (auth) { productId, interactionType }
GET    /api/interactions/:userId      (auth) → interaction history
DELETE /api/interactions/:id          (auth) delete single interaction
DELETE /api/interactions/user/:id/all (auth) PIPEDA erasure
```

`interactionType` values: `view` (weight 1) | `cart` (weight 2) | `purchase` (weight 3)

---

## Recommendation Algorithms

### 1. Content-Based Filtering (TF-IDF)
**Endpoint:** `GET /api/recommendations/similar/:productId`

Computes TF-IDF vectors for each product using title + description + category + tags + brand. Returns products ranked by cosine similarity to the source product.

```
tf(t,d)   = count(t in d) / total_terms(d)
idf(t)    = log((N+1) / (df(t)+1))
tfidf     = tf × idf
cosine(A,B) = (A·B) / (|A| × |B|)
```

### 2. Collaborative Filtering (User-User Jaccard)
**Endpoint:** `GET /api/recommendations/for-you/:userId`

Computes Jaccard similarity between user interaction sets, finds products liked by similar users that the target hasn't seen, and ranks by weighted aggregated score.

```
jaccard(A,B) = |A ∩ B| / |A ∪ B|
score(item)  = Σ similarity(user, neighbour) for neighbours who interacted with item
```

### 3. Popularity-Based Ranking (Cold Start)
**Endpoint:** `GET /api/recommendations/popular`

Fallback for users with no history. Scores products by `rating × log(stock + 1)`.

---

## How the Algorithm Selection Works

```
For-You endpoint decision tree:
  if user.interactions ≥ 3  → Collaborative Filtering
  if user.interactions 1-2  → Content-Based (from known items)
  if user.interactions = 0  → Cold Start: Popularity Ranking
```

---

## Security Controls (PIPEDA Compliant)

- **JWT Auth** — Cognito-style Bearer tokens, 7-day expiry
- **Bcrypt** — passwords hashed at cost 10
- **TLS** — enforced in production (HTTPS)
- **KMS + IAM** — per the AWS design (simulated locally)
- **PIPEDA erasure** — `DELETE /api/interactions/user/:id/all`
- **TTL fields** — interactions expire after 90 days, rec scores after 7 days

---

## Group Members
- Muhammad Wasiq Malik — 3777499
- Ashhad Ahmed Memon — 3785935
- Shantanu Latke — 3671879

Course: CS6905 · Instructor: Dr. Shadi Aljendi
