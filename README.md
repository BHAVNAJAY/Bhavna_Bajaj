# BFHL — Node Hierarchy Analyzer

Full-stack solution for the SRM Full Stack Engineering Challenge.

## Project Structure

```
bfhl-project/
├── backend/
│   ├── index.js          ← Express API (POST /bfhl)
│   ├── package.json
│   └── render.yaml       ← Render deployment config
└── frontend/
    └── index.html        ← Single-page frontend
```

---

## ⚡ Step 1 — Update Your Credentials

Open `backend/index.js` and replace lines 7–9:

```js
const USER_ID = "nirmal_arunkumar_DDMMYYYY"; // e.g. johndoe_17091999
const EMAIL_ID = "yourname@srm.edu.in";
const ROLL_NUMBER = "YOUR_ROLL_NUMBER";
```

---

## ⚡ Step 2 — Test Locally

```bash
cd backend
npm install
node index.js
# Server starts on http://localhost:3000

# Test:
curl -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello"]}'
```

---

## ⚡ Step 3 — Push to GitHub

```bash
git init
git add .
git commit -m "feat: BFHL full stack challenge"
git remote add origin https://github.com/YOUR_USERNAME/bfhl-challenge.git
git push -u origin main
```

---

## ⚡ Step 4 — Deploy Backend on Render (free)

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. **Root Directory:** `backend`
4. **Build Command:** `npm install`
5. **Start Command:** `node index.js`
6. Click Deploy
7. Your URL will be: `https://bfhl-api-xxxx.onrender.com`

---

## ⚡ Step 5 — Deploy Frontend on Netlify (free)

1. Go to [netlify.com](https://netlify.com) → Add new site → Deploy manually
2. Drag and drop the `frontend/` folder
3. Your URL will be: `https://random-name.netlify.app`

---

## ⚡ Step 6 — Connect Frontend to Backend

Open `frontend/index.html` and optionally set the default API URL,
OR just type it into the API Configuration box on the page when it loads.

---

## Submission Checklist

- [ ] Backend URL responds to POST /bfhl (test with curl above)
- [ ] Frontend loads and can call the API
- [ ] GitHub repo is public
- [ ] CORS enabled (already done in index.js)
- [ ] No hardcoded responses

---

## API Example

**POST** `/bfhl`

```json
{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello", "G->H", "G->H"]
}
```

**Response:**
```json
{
  "user_id": "yourname_ddmmyyyy",
  "email_id": "your@email.com",
  "college_roll_number": "ROLLNO",
  "hierarchies": [...],
  "invalid_entries": ["hello"],
  "duplicate_edges": ["G->H"],
  "summary": {
    "total_trees": 1,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```
