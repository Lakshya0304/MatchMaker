# TDC Matchmaker Dashboard — Full API Specification

> **Project:** The Date Crew — Internal Matchmaker Tool  
> **Stack:** React (Frontend) + Node.js/Express (Backend)  
> **Data:** Static JSON / Mock DB (can be swapped to Firebase/MongoDB)  
> **AI:** Anthropic Claude API or OpenAI API  
> **Base URL (local):** `http://localhost:5000/api`  
> **Base URL (prod):** `https://your-render-app.onrender.com/api`

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Environment Variables](#environment-variables)
3. [Data Models / Schemas](#data-models--schemas)
4. [Auth APIs](#1-auth-apis)
5. [Customer APIs](#2-customer-apis)
6. [Match Pool APIs](#3-match-pool-apis)
7. [Matching Engine APIs](#4-matching-engine-apis)
8. [AI APIs](#5-ai-apis)
9. [Send Match APIs](#6-send-match-apis)
10. [Notes APIs](#7-notes-apis)
11. [Dashboard Stats API](#8-dashboard-stats-api)
12. [Error Handling](#error-handling)
13. [Matching Logic Detail](#matching-logic-detail)
14. [Dummy Data Generation Guide](#dummy-data-generation-guide)

---

## Project Structure

```
tdc-matchmaker/
├── client/                   # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CustomerDetail.jsx
│   │   │   └── Matches.jsx
│   │   ├── components/
│   │   │   ├── CustomerCard.jsx
│   │   │   ├── MatchCard.jsx
│   │   │   ├── SendMatchModal.jsx
│   │   │   └── NotesList.jsx
│   │   ├── services/
│   │   │   └── api.js        # All axios calls to backend
│   │   └── App.jsx
│   └── package.json
│
├── server/                   # Node.js + Express backend
│   ├── routes/
│   │   ├── auth.js
│   │   ├── customers.js
│   │   ├── pool.js
│   │   ├── matches.js
│   │   ├── ai.js
│   │   ├── sendMatch.js
│   │   ├── notes.js
│   │   └── dashboard.js
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT verification
│   ├── data/
│   │   ├── customers.json     # Matchmaker's client list
│   │   └── pool.json          # 100+ dummy profiles
│   ├── utils/
│   │   ├── matchingEngine.js  # Core matching logic
│   │   └── aiHelper.js        # Claude/OpenAI calls
│   ├── index.js               # Express entry point
│   └── package.json
│
└── README.md
```

---

## Environment Variables

Create a `.env` file in `/server`:

```env
PORT=5000
JWT_SECRET=your_super_secret_key_here
AI_API_KEY=your_anthropic_or_openai_api_key
AI_PROVIDER=anthropic              # or "openai"
NODE_ENV=development
```

---

## Data Models / Schemas

### Matchmaker (Login User)

```json
{
  "id": "m001",
  "username": "priya_matchmaker",
  "password": "hashed_password",
  "name": "Priya Sharma",
  "assignedCustomerIds": ["c001", "c002", "c003"]
}
```

### Customer Profile (Full Biodata)

```json
{
  "id": "c001",
  "firstName": "Arjun",
  "lastName": "Mehta",
  "gender": "male",
  "dateOfBirth": "1994-03-15",
  "age": 30,
  "country": "India",
  "city": "Mumbai",
  "height": 175,
  "email": "arjun.mehta@gmail.com",
  "phone": "+91-9876543210",
  "undergraduateCollege": "IIT Bombay",
  "degree": "B.Tech Computer Science",
  "postgraduateCollege": "IIM Ahmedabad",
  "pgDegree": "MBA",
  "income": 2500000,
  "currentCompany": "Goldman Sachs",
  "designation": "Associate",
  "maritalStatus": "never_married",
  "languagesKnown": ["Hindi", "English", "Marathi"],
  "siblings": 1,
  "caste": "Brahmin",
  "religion": "Hindu",
  "wantKids": "yes",
  "openToRelocate": "yes",
  "openToPets": "maybe",
  "diet": "vegetarian",
  "smoking": "no",
  "drinking": "occasionally",
  "familyType": "nuclear",
  "motherTongue": "Hindi",
  "horoscopeMatch": "preferred",
  "manglik": "no",
  "skinTone": "wheatish",
  "bodyType": "athletic",
  "partnerAgeMin": 25,
  "partnerAgeMax": 30,
  "partnerIncomePreference": "no_preference",
  "status": "active",
  "assignedMatchmakerId": "m001",
  "createdAt": "2024-01-10T10:00:00Z",
  "updatedAt": "2024-06-01T10:00:00Z"
}
```

**Status Tag Options:** `new` | `active` | `matched` | `on_hold` | `paused` | `closed`

**Marital Status Options:** `never_married` | `divorced` | `widowed` | `separated`

### Pool Profile (Match Candidate)

Same schema as Customer Profile but with an additional field:

```json
{
  ...same fields as Customer,
  "isPoolProfile": true
}
```

### Match Result Object

```json
{
  "profileId": "p045",
  "customerId": "c001",
  "score": 87,
  "label": "High Potential",
  "reason": "Both are engineers in metro cities, share views on having kids, and are open to relocation.",
  "compatibilityBreakdown": {
    "ageCompatibility": 90,
    "incomeCompatibility": 85,
    "valuesAlignment": 92,
    "locationCompatibility": 80,
    "casteReligionMatch": 95
  },
  "generatedAt": "2024-06-01T10:00:00Z"
}
```

### Note Object

```json
{
  "id": "n001",
  "customerId": "c001",
  "matchmakerId": "m001",
  "content": "Client prefers someone from Delhi or Mumbai. Not open to long distance.",
  "createdAt": "2024-06-01T10:00:00Z"
}
```

### Sent Match Log Object

```json
{
  "id": "sm001",
  "customerId": "c001",
  "matchedProfileId": "p045",
  "introMessage": "Arjun, meet Neha — she's a product manager at Flipkart...",
  "sentAt": "2024-06-01T10:00:00Z",
  "sentBy": "m001",
  "status": "sent"
}
```

---

## 1. Auth APIs

### POST `/api/auth/login`

Authenticate a matchmaker and return a JWT token.

**Request Body:**

```json
{
  "username": "priya_matchmaker",
  "password": "password123"
}
```

**Success Response — 200:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "matchmaker": {
    "id": "m001",
    "name": "Priya Sharma",
    "username": "priya_matchmaker"
  }
}
```

**Error Response — 401:**

```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

**Implementation Notes:**

- Use `bcrypt` to hash and compare passwords
- JWT expires in `7d`
- Store token in `localStorage` on frontend
- Hardcode 2-3 matchmaker accounts for demo purposes

---

### POST `/api/auth/logout`

Invalidate the session (frontend clears token).

**Headers:** `Authorization: Bearer <token>`

**Success Response — 200:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. Customer APIs

> All customer routes require `Authorization: Bearer <token>` header.  
> Middleware: `authMiddleware.js` — verifies JWT and attaches `req.matchmaker`

---

### GET `/api/customers`

Get all customers assigned to the logged-in matchmaker.

**Headers:** `Authorization: Bearer <token>`

**Query Params (optional):**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status: `active`, `matched`, `new`, etc. |
| `gender` | string | Filter by gender: `male`, `female` |
| `city` | string | Filter by city |
| `search` | string | Search by name |

**Example:** `GET /api/customers?status=active&gender=male`

**Success Response — 200:**

```json
{
  "success": true,
  "count": 12,
  "customers": [
    {
      "id": "c001",
      "firstName": "Arjun",
      "lastName": "Mehta",
      "age": 30,
      "city": "Mumbai",
      "maritalStatus": "never_married",
      "status": "active",
      "gender": "male",
      "updatedAt": "2024-06-01T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/customers/:id`

Get full biodata for a single customer.

**Headers:** `Authorization: Bearer <token>`

**Params:** `id` — customer ID (e.g., `c001`)

**Success Response — 200:**

```json
{
  "success": true,
  "customer": {
    "id": "c001",
    "firstName": "Arjun",
    "lastName": "Mehta",
    "gender": "male",
    "dateOfBirth": "1994-03-15",
    "age": 30,
    "country": "India",
    "city": "Mumbai",
    "height": 175,
    "email": "arjun.mehta@gmail.com",
    "phone": "+91-9876543210",
    "undergraduateCollege": "IIT Bombay",
    "degree": "B.Tech Computer Science",
    "income": 2500000,
    "currentCompany": "Goldman Sachs",
    "designation": "Associate",
    "maritalStatus": "never_married",
    "languagesKnown": ["Hindi", "English"],
    "siblings": 1,
    "caste": "Brahmin",
    "religion": "Hindu",
    "wantKids": "yes",
    "openToRelocate": "yes",
    "openToPets": "maybe",
    "diet": "vegetarian",
    "smoking": "no",
    "drinking": "occasionally",
    "familyType": "nuclear",
    "motherTongue": "Hindi",
    "manglik": "no",
    "status": "active",
    "assignedMatchmakerId": "m001"
  }
}
```

**Error Response — 404:**

```json
{
  "success": false,
  "message": "Customer not found"
}
```

---

### POST `/api/customers`

Add a new customer to the matchmaker's list.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Full customer object (see schema above, without `id`, `createdAt`, `updatedAt`)

**Success Response — 201:**

```json
{
  "success": true,
  "message": "Customer created successfully",
  "customer": {
    "id": "c013",
    ...
  }
}
```

---

### PUT `/api/customers/:id`

Update a customer's full profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Any fields to update (partial update supported)

```json
{
  "city": "Bangalore",
  "designation": "Senior Associate",
  "income": 3000000
}
```

**Success Response — 200:**

```json
{
  "success": true,
  "message": "Customer updated successfully",
  "customer": { ...updatedCustomerObject }
}
```

---

### PATCH `/api/customers/:id/status`

Update only the status tag of a customer.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "status": "matched"
}
```

**Valid status values:** `new` | `active` | `matched` | `on_hold` | `paused` | `closed`

**Success Response — 200:**

```json
{
  "success": true,
  "message": "Status updated to matched",
  "customerId": "c001",
  "status": "matched"
}
```

---

### DELETE `/api/customers/:id`

Remove a customer from the system.

**Headers:** `Authorization: Bearer <token>`

**Success Response — 200:**

```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

---

## 3. Match Pool APIs

> The pool contains 100+ opposite-gender dummy profiles used as potential matches.

---

### GET `/api/pool`

Get all profiles in the match pool.

**Headers:** `Authorization: Bearer <token>`

**Query Params (optional):**
| Param | Type | Description |
|-------|------|-------------|
| `gender` | string | `male` or `female` |
| `city` | string | Filter by city |
| `religion` | string | Filter by religion |
| `minAge` | number | Minimum age |
| `maxAge` | number | Maximum age |

**Success Response — 200:**

```json
{
  "success": true,
  "count": 107,
  "profiles": [
    {
      "id": "p001",
      "firstName": "Neha",
      "lastName": "Kapoor",
      "age": 27,
      "city": "Delhi",
      "gender": "female",
      "currentCompany": "Flipkart",
      "designation": "Product Manager",
      "income": 1800000,
      "religion": "Hindu",
      "caste": "Kshatriya",
      "maritalStatus": "never_married"
    }
  ]
}
```

---

### GET `/api/pool/:id`

Get full profile of one pool candidate.

**Headers:** `Authorization: Bearer <token>`

**Success Response — 200:**

```json
{
  "success": true,
  "profile": { ...fullProfileObject }
}
```

---

### POST `/api/pool`

Add a new profile to the match pool.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Full profile object (same schema as customer, with `isPoolProfile: true`)

**Success Response — 201:**

```json
{
  "success": true,
  "message": "Profile added to pool",
  "profile": { "id": "p108", ...rest }
}
```

---

## 4. Matching Engine APIs

> The core of the product. Runs scoring logic and returns ranked matches.

---

### GET `/api/matches/:customerId`

Run the matching algorithm for a customer and return all ranked matches.

**Headers:** `Authorization: Bearer <token>`

**Query Params (optional):**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 20 | Max number of matches to return |
| `minScore` | number | 50 | Minimum score threshold |

**Example:** `GET /api/matches/c001?limit=10&minScore=70`

**Success Response — 200:**

```json
{
  "success": true,
  "customerId": "c001",
  "customerName": "Arjun Mehta",
  "totalMatches": 8,
  "matches": [
    {
      "rank": 1,
      "profileId": "p045",
      "profile": {
        "id": "p045",
        "firstName": "Neha",
        "lastName": "Kapoor",
        "age": 27,
        "city": "Mumbai",
        "gender": "female",
        "designation": "UX Designer",
        "currentCompany": "Zomato",
        "income": 1600000,
        "religion": "Hindu",
        "caste": "Brahmin",
        "wantKids": "yes",
        "openToRelocate": "yes"
      },
      "score": 87,
      "label": "High Potential",
      "reason": "Strong compatibility on family values, religion, and career goals. Both are open to relocation and want kids.",
      "compatibilityBreakdown": {
        "ageCompatibility": 90,
        "incomeCompatibility": 85,
        "valuesAlignment": 92,
        "locationCompatibility": 80,
        "casteReligionMatch": 95
      }
    },
    {
      "rank": 2,
      "profileId": "p012",
      "score": 74,
      "label": "Good Match",
      "reason": "Compatible on most parameters. Minor mismatch on relocation preference.",
      ...
    }
  ]
}
```

**Score Labels:**
| Score Range | Label |
|-------------|-------|
| 85 - 100 | High Potential |
| 70 - 84 | Good Match |
| 55 - 69 | Possible Match |
| Below 55 | Low Compatibility |

---

### GET `/api/matches/:customerId/top`

Return only the top 5 matches for quick display.

**Headers:** `Authorization: Bearer <token>`

**Success Response — 200:** Same structure as above but `matches` array limited to 5 items.

---

### POST `/api/matches/:customerId/refresh`

Re-run the matching algorithm (call this after a customer's profile is updated).

**Headers:** `Authorization: Bearer <token>`

**Success Response — 200:**

```json
{
  "success": true,
  "message": "Matches refreshed successfully",
  "customerId": "c001",
  "totalMatches": 9,
  "matches": [ ...updatedMatchArray ]
}
```

---

## 5. AI APIs

> Calls Anthropic Claude API (or OpenAI) to enhance match scoring and generate intros.

---

### POST `/api/ai/score`

Send two profiles to the AI and get a match score, label, and reasoning.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "customerId": "c001",
  "matchProfileId": "p045"
}
```

**Backend Logic (in `aiHelper.js`):**

```javascript
// Build a prompt like:
const prompt = `
You are an expert Indian matrimonial matchmaker.
Analyze compatibility between these two profiles and return a JSON object.

Profile A (Client):
- Name: Arjun Mehta, Age: 30, City: Mumbai
- Profession: Associate at Goldman Sachs, Income: 25 LPA
- Religion: Hindu, Caste: Brahmin
- Wants Kids: Yes, Open to Relocate: Yes
- Diet: Vegetarian, Smoking: No

Profile B (Potential Match):
- Name: Neha Kapoor, Age: 27, City: Mumbai
- Profession: UX Designer at Zomato, Income: 16 LPA
- Religion: Hindu, Caste: Brahmin
- Wants Kids: Yes, Open to Relocate: Yes
- Diet: Vegetarian, Smoking: No

Return ONLY a JSON object with these fields:
{
  "score": <number 0-100>,
  "label": "<High Potential | Good Match | Possible Match | Low Compatibility>",
  "reason": "<2-3 sentence human-readable reason>",
  "compatibilityBreakdown": {
    "ageCompatibility": <0-100>,
    "incomeCompatibility": <0-100>,
    "valuesAlignment": <0-100>,
    "locationCompatibility": <0-100>,
    "casteReligionMatch": <0-100>
  }
}
`;
```

**Success Response — 200:**

```json
{
  "success": true,
  "customerId": "c001",
  "matchProfileId": "p045",
  "score": 87,
  "label": "High Potential",
  "reason": "Arjun and Neha share the same religion, caste, and dietary preferences, creating a strong cultural foundation. Both are career-driven professionals in Mumbai who want children and are open to relocation. A highly promising match.",
  "compatibilityBreakdown": {
    "ageCompatibility": 90,
    "incomeCompatibility": 85,
    "valuesAlignment": 92,
    "locationCompatibility": 100,
    "casteReligionMatch": 95
  }
}
```

**Error Response — 500:**

```json
{
  "success": false,
  "message": "AI service error",
  "error": "API rate limit exceeded"
}
```

---

### POST `/api/ai/intro`

Generate a short, personalized intro email for the matchmaker to send to a client.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "customerId": "c001",
  "matchProfileId": "p045"
}
```

**Backend Prompt:**

```javascript
const prompt = `
You are a warm and professional Indian matrimonial matchmaker.
Write a short, personalized intro message (3-4 sentences) that a matchmaker would send to their client introducing a potential match.

Client: Arjun Mehta, 30, Mumbai, Associate at Goldman Sachs
Match: Neha Kapoor, 27, Mumbai, UX Designer at Zomato

The tone should be warm, optimistic, and professional. Do not be overly formal.
Focus on 2-3 genuine compatibility points. End with an invitation to review the profile.
`;
```

**Success Response — 200:**

```json
{
  "success": true,
  "customerId": "c001",
  "matchProfileId": "p045",
  "introMessage": "Hi Arjun! We'd like to introduce you to Neha, a 27-year-old UX Designer at Zomato based right here in Mumbai. Like you, Neha comes from a Hindu Brahmin family, follows a vegetarian lifestyle, and is excited about starting a family. We think you two could have a wonderful connection — take a look at her full profile and let us know if you'd like us to take this forward!"
}
```

---

## 6. Send Match APIs

> Simulates sending a match to a client via email (mock/toast for now).

---

### POST `/api/send-match`

Trigger a match send — logs the action and returns a confirmation (mock email).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "customerId": "c001",
  "matchedProfileId": "p045",
  "introMessage": "Hi Arjun! We'd like to introduce you to Neha..."
}
```

**Success Response — 200:**

```json
{
  "success": true,
  "message": "Match sent successfully",
  "sentMatch": {
    "id": "sm001",
    "customerId": "c001",
    "matchedProfileId": "p045",
    "introMessage": "Hi Arjun! We'd like to introduce you to Neha...",
    "sentAt": "2024-06-01T10:00:00Z",
    "sentBy": "m001",
    "status": "sent"
  },
  "mockEmail": {
    "to": "arjun.mehta@gmail.com",
    "subject": "TDC — We found someone special for you 💌",
    "body": "Hi Arjun! We'd like to introduce you to Neha..."
  }
}
```

**Error Response — 400:**

```json
{
  "success": false,
  "message": "Match already sent to this customer for this profile"
}
```

---

### GET `/api/send-match/:customerId`

Get all matches that have been sent to a specific customer.

**Headers:** `Authorization: Bearer <token>`

**Success Response — 200:**

```json
{
  "success": true,
  "customerId": "c001",
  "totalSent": 3,
  "sentMatches": [
    {
      "id": "sm001",
      "matchedProfileId": "p045",
      "matchName": "Neha Kapoor",
      "introMessage": "Hi Arjun...",
      "sentAt": "2024-06-01T10:00:00Z",
      "status": "sent"
    }
  ]
}
```

---

## 7. Notes APIs

> Quick notes a matchmaker records after calls/meetings with a customer.

---

### GET `/api/notes/:customerId`

Get all notes for a customer, sorted newest first.

**Headers:** `Authorization: Bearer <token>`

**Success Response — 200:**

```json
{
  "success": true,
  "customerId": "c001",
  "notes": [
    {
      "id": "n001",
      "content": "Arjun prefers someone from a Brahmin family in Mumbai or Delhi.",
      "createdAt": "2024-06-01T10:00:00Z"
    },
    {
      "id": "n002",
      "content": "Had a 30 min call. He is ready to meet within 2-3 weeks.",
      "createdAt": "2024-05-28T14:00:00Z"
    }
  ]
}
```

---

### POST `/api/notes/:customerId`

Add a new note for a customer.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "content": "Client met profile p045 over coffee. Positive response. Following up next week."
}
```

**Success Response — 201:**

```json
{
  "success": true,
  "message": "Note added",
  "note": {
    "id": "n003",
    "customerId": "c001",
    "content": "Client met profile p045 over coffee...",
    "createdAt": "2024-06-05T11:00:00Z"
  }
}
```

---

### DELETE `/api/notes/:noteId`

Delete a note by its ID.

**Headers:** `Authorization: Bearer <token>`

**Success Response — 200:**

```json
{
  "success": true,
  "message": "Note deleted successfully"
}
```

---

## 8. Dashboard Stats API

> Summary stats for the matchmaker's home dashboard.

---

### GET `/api/dashboard/stats`

Returns summary stats for the logged-in matchmaker.

**Headers:** `Authorization: Bearer <token>`

**Success Response — 200:**

```json
{
  "success": true,
  "stats": {
    "totalCustomers": 18,
    "activeCustomers": 10,
    "matchedCustomers": 4,
    "onHoldCustomers": 2,
    "newCustomers": 2,
    "totalMatchesSent": 27,
    "matchesSentThisWeek": 5,
    "poolSize": 107
  }
}
```

---

## Error Handling

All errors follow this standard format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error detail (dev mode only)"
}
```

**HTTP Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (missing/invalid fields) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (not your resource) |
| 404 | Not Found |
| 500 | Internal Server Error |

**Global Error Middleware (`index.js`):**

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});
```

---

## Matching Logic Detail

### For Male Customers (match with women)

Score each female pool profile on these weighted criteria:

```javascript
function scoreMaleCustomer(customer, candidate) {
  let score = 0;

  // 1. Age — candidate must be younger (strict) [20 pts]
  if (candidate.age < customer.age) {
    const ageDiff = customer.age - candidate.age;
    if (ageDiff >= 1 && ageDiff <= 5) score += 20;
    else if (ageDiff > 5 && ageDiff <= 8) score += 12;
  }

  // 2. Income — candidate earns less (soft preference) [15 pts]
  if (candidate.income < customer.income) score += 15;
  else if (candidate.income <= customer.income * 1.1) score += 8;

  // 3. Height — candidate shorter [10 pts]
  if (candidate.height < customer.height) score += 10;

  // 4. Kids preference match [20 pts]
  if (candidate.wantKids === customer.wantKids) score += 20;
  else if (candidate.wantKids === "maybe" || customer.wantKids === "maybe")
    score += 10;

  // 5. Religion match [15 pts]
  if (candidate.religion === customer.religion) score += 15;

  // 6. Caste match (optional — respect customer's preference) [10 pts]
  if (customer.casteImportant && candidate.caste === customer.caste)
    score += 10;
  else if (!customer.casteImportant) score += 5; // neutral

  // 7. Diet match [5 pts]
  if (candidate.diet === customer.diet) score += 5;

  // 8. Relocation compatibility [5 pts]
  if (candidate.openToRelocate === "yes") score += 5;
  else if (candidate.openToRelocate === "maybe") score += 2;

  return Math.min(score, 100);
}
```

### For Female Customers (match with men)

More holistic — values-driven scoring:

```javascript
function scoreFemaleCustomer(customer, candidate) {
  let score = 0;

  // 1. Profession compatibility [20 pts]
  // (e.g., both in tech, or complementary fields)
  const professionScore = getProfessionCompatibility(customer, candidate);
  score += professionScore;

  // 2. Relocation alignment [15 pts]
  if (candidate.openToRelocate === customer.openToRelocate) score += 15;
  else if (
    candidate.openToRelocate === "maybe" ||
    customer.openToRelocate === "maybe"
  )
    score += 7;

  // 3. Kids preference [20 pts]
  if (candidate.wantKids === customer.wantKids) score += 20;
  else if (candidate.wantKids === "maybe" || customer.wantKids === "maybe")
    score += 10;

  // 4. Religion match [15 pts]
  if (candidate.religion === customer.religion) score += 15;

  // 5. Family type preference [10 pts]
  if (candidate.familyType === customer.partnerFamilyTypePreference)
    score += 10;

  // 6. Education level compatibility [10 pts]
  const eduScore = getEducationCompatibility(customer, candidate);
  score += eduScore;

  // 7. Smoking/drinking lifestyle [10 pts]
  if (candidate.smoking === customer.smokingPreference) score += 5;
  if (candidate.drinking === customer.drinkingPreference) score += 5;

  return Math.min(score, 100);
}
```

---

## Dummy Data Generation Guide

Use this prompt in Claude or ChatGPT to generate `pool.json`:

```
Generate 60 Indian female matrimonial profiles as a JSON array.
Each profile must include all these fields:
id (p001-p060), firstName, lastName, gender ("female"), dateOfBirth, age (22-32),
country ("India"), city (mix of Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Pune, Kolkata),
height (150-170 cm), email, phone, undergraduateCollege, degree, income (600000-2500000),
currentCompany, designation, maritalStatus ("never_married" or "divorced"),
languagesKnown (array), siblings (0-3), caste, religion (mostly Hindu, some Muslim/Christian/Sikh),
wantKids (yes/no/maybe), openToRelocate (yes/no/maybe), openToPets (yes/no/maybe),
diet (vegetarian/non-vegetarian/eggetarian), smoking (no/occasionally),
drinking (no/occasionally/yes), familyType (nuclear/joint), motherTongue,
manglik (yes/no/dont_know), isPoolProfile: true

Make the profiles realistic and diverse in profession, background, and values.
Return valid JSON only, no explanations.
```

Generate 50 male profiles using the same prompt with `gender: "male"` and `age: 25-38`.

---

## Sample Login Credentials (Demo)

```
Username: priya_matchmaker
Password: tdc@2024

Username: rahul_matchmaker
Password: tdc@2024
```

---

## API Summary

| #   | Method | Endpoint                           | Auth Required |
| --- | ------ | ---------------------------------- | ------------- |
| 1   | POST   | `/api/auth/login`                  | No            |
| 2   | POST   | `/api/auth/logout`                 | Yes           |
| 3   | GET    | `/api/customers`                   | Yes           |
| 4   | GET    | `/api/customers/:id`               | Yes           |
| 5   | POST   | `/api/customers`                   | Yes           |
| 6   | PUT    | `/api/customers/:id`               | Yes           |
| 7   | PATCH  | `/api/customers/:id/status`        | Yes           |
| 8   | DELETE | `/api/customers/:id`               | Yes           |
| 9   | GET    | `/api/pool`                        | Yes           |
| 10  | GET    | `/api/pool/:id`                    | Yes           |
| 11  | POST   | `/api/pool`                        | Yes           |
| 12  | GET    | `/api/matches/:customerId`         | Yes           |
| 13  | GET    | `/api/matches/:customerId/top`     | Yes           |
| 14  | POST   | `/api/matches/:customerId/refresh` | Yes           |
| 15  | POST   | `/api/ai/score`                    | Yes           |
| 16  | POST   | `/api/ai/intro`                    | Yes           |
| 17  | POST   | `/api/send-match`                  | Yes           |
| 18  | GET    | `/api/send-match/:customerId`      | Yes           |
| 19  | GET    | `/api/notes/:customerId`           | Yes           |
| 20  | POST   | `/api/notes/:customerId`           | Yes           |
| 21  | DELETE | `/api/notes/:noteId`               | Yes           |
| 22  | GET    | `/api/dashboard/stats`             | Yes           |

**Total: 22 APIs | 1 public, 21 protected**
