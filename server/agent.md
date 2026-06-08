# TDC Matchmaker — Agent Build Guide

> Give this entire file to your IDE agent (Cursor / Copilot / Windsurf).
> The project is already initialized with Prisma + PostgreSQL connected.
> Agent should build everything exactly as described below — no deviations.

---

## 1. What You Are Building

An internal CRM + matchmaking tool for **The Date Crew (TDC)**.  
Matchmakers log in, view their assigned clients, run a matching algorithm,
get AI-powered match scores, and send curated profiles to clients.

**Tech Stack:**

- Frontend: React (Vite)
- Backend: Node.js + Express
- ORM: Prisma
- Database: PostgreSQL (already connected)
- Auth: JWT + bcryptjs
- AI: Anthropic Claude API
- Package Manager: pnpm

---

## 2. Current Project State

The agent must assume the following is already done:

- `pnpm init` has been run
- Prisma is installed (`@prisma/client`, `prisma`)
- `prisma/schema.prisma` exists and is filled (schema below in Section 5)
- `DATABASE_URL` is set in `.env`
- Migration has been run (`npx prisma migrate dev --name init`)
- Prisma client is generated (`npx prisma generate`)

**Agent must NOT re-run init or re-create the schema. Start from file creation.**

---

## 3. Exact Folder & File Structure to Create

The agent must create every file listed here. Nothing more, nothing less.

```
tdc-matchmaker/
│
├── .env                          ← already exists, do not overwrite
│
├── prisma/
│   ├── schema.prisma             ← already exists, do not touch
│   └── seed.js                  ← CREATE THIS
│
├── server/
│   ├── package.json             ← CREATE THIS (add scripts + prisma seed config)
│   │
│   └── src/
│       ├── index.js             ← CREATE THIS (Express entry point)
│       │
│       ├── prisma/
│       │   └── client.js        ← CREATE THIS (shared Prisma instance)
│       │
│       ├── middleware/
│       │   └── authMiddleware.js ← CREATE THIS (JWT protect middleware)
│       │
│       ├── utils/
│       │   ├── matchingEngine.js ← CREATE THIS (scoring algorithm)
│       │   └── aiHelper.js      ← CREATE THIS (Claude API calls)
│       │
│       └── routes/
│           ├── auth.js          ← CREATE THIS
│           ├── customers.js     ← CREATE THIS
│           ├── pool.js          ← CREATE THIS
│           ├── matches.js       ← CREATE THIS
│           ├── ai.js            ← CREATE THIS
│           ├── sendMatch.js     ← CREATE THIS
│           ├── notes.js         ← CREATE THIS
│           └── dashboard.js     ← CREATE THIS
│
└── client/                      ← React frontend (build after backend works)
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── services/
        │   └── api.js           ← All axios calls
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── CustomerDetail.jsx
        │   └── Matches.jsx
        └── components/
            ├── CustomerCard.jsx
            ├── MatchCard.jsx
            ├── SendMatchModal.jsx
            └── NotesList.jsx
```

---

## 4. Dependencies to Install

### Server

```bash
cd server
pnpm add express bcryptjs jsonwebtoken dotenv cors
pnpm add -D nodemon
```

### Client

```bash
cd client
pnpm create vite@latest . --template react
pnpm add axios react-router-dom
```

---

## 5. Prisma Schema (already in prisma/schema.prisma — do not recreate)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Gender { male female other }
enum MaritalStatus { never_married divorced widowed separated }
enum WantKids { yes no maybe }
enum OpenToRelocate { yes no maybe }
enum OpenToPets { yes no maybe }
enum Diet { vegetarian non_vegetarian eggetarian vegan jain }
enum SmokingHabit { no occasionally yes }
enum DrinkingHabit { no occasionally yes }
enum FamilyType { nuclear joint extended }
enum Manglik { yes no dont_know }
enum HoroscopePreference { must_match preferred not_important }
enum CustomerStatus { new active matched on_hold paused closed }
enum MatchLabel { High_Potential Good_Match Possible_Match Low_Compatibility }
enum SentMatchStatus { sent viewed accepted rejected pending }

model Matchmaker {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String
  name      String
  email     String   @unique
  phone     String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  customers   Customer[]
  notes       Note[]
  sentMatches SentMatch[]

  @@map("matchmakers")
}

model Customer {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  firstName   String
  lastName    String
  gender      Gender
  dateOfBirth DateTime
  age         Int

  email  String  @unique
  phone  String

  country String @default("India")
  city    String
  state   String?

  height   Int?
  bodyType String?
  skinTone String?

  undergraduateCollege String?
  degree               String?
  postgraduateCollege  String?
  pgDegree             String?

  currentCompany String?
  designation    String?
  income         Int?

  maritalStatus  MaritalStatus  @default(never_married)
  siblings       Int            @default(0)
  familyType     FamilyType?
  motherTongue   String?
  languagesKnown String[]

  religion String?
  caste    String?
  subCaste String?
  manglik  Manglik?
  gotra    String?

  diet     Diet?
  smoking  SmokingHabit?
  drinking DrinkingHabit?

  wantKids       WantKids?
  openToRelocate OpenToRelocate?
  openToPets     OpenToPets?
  horoscopeMatch HoroscopePreference?

  partnerAgeMin         Int?
  partnerAgeMax         Int?
  partnerHeightMin      Int?
  partnerHeightMax      Int?
  partnerIncomeMin      Int?
  partnerReligionPref   String?
  partnerCastePref      String?
  casteBarred           Boolean    @default(false)
  partnerFamilyTypePref FamilyType?
  partnerDietPref       Diet?
  partnerSmokingPref    SmokingHabit?
  partnerDrinkingPref   DrinkingHabit?
  partnerRelocationPref OpenToRelocate?

  status               CustomerStatus @default(new)
  assignedMatchmakerId String
  assignedMatchmaker   Matchmaker     @relation(fields: [assignedMatchmakerId], references: [id])

  notes        Note[]
  sentMatches  SentMatch[]
  matchResults MatchResult[]

  @@index([assignedMatchmakerId])
  @@index([status])
  @@index([gender])
  @@index([city])
  @@index([religion])
  @@map("customers")
}

model PoolProfile {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  firstName   String
  lastName    String
  gender      Gender
  dateOfBirth DateTime
  age         Int

  email String  @unique
  phone String?

  country String @default("India")
  city    String
  state   String?

  height   Int?
  bodyType String?
  skinTone String?

  undergraduateCollege String?
  degree               String?
  postgraduateCollege  String?
  pgDegree             String?

  currentCompany String?
  designation    String?
  income         Int?

  maritalStatus  MaritalStatus @default(never_married)
  siblings       Int           @default(0)
  familyType     FamilyType?
  motherTongue   String?
  languagesKnown String[]

  religion String?
  caste    String?
  subCaste String?
  manglik  Manglik?
  gotra    String?

  diet     Diet?
  smoking  SmokingHabit?
  drinking DrinkingHabit?

  wantKids       WantKids?
  openToRelocate OpenToRelocate?
  openToPets     OpenToPets?
  horoscopeMatch HoroscopePreference?

  partnerAgeMin         Int?
  partnerAgeMax         Int?
  partnerReligionPref   String?
  partnerCastePref      String?
  partnerFamilyTypePref FamilyType?

  isActive    Boolean @default(true)
  profileNote String?

  sentMatches  SentMatch[]
  matchResults MatchResult[]

  @@index([gender])
  @@index([city])
  @@index([religion])
  @@index([age])
  @@index([income])
  @@map("pool_profiles")
}

model MatchResult {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  customerId    String
  customer      Customer    @relation(fields: [customerId], references: [id], onDelete: Cascade)

  poolProfileId String
  poolProfile   PoolProfile @relation(fields: [poolProfileId], references: [id], onDelete: Cascade)

  score  Int
  label  MatchLabel
  reason String

  ageCompatibility      Int?
  incomeCompatibility   Int?
  valuesAlignment       Int?
  locationCompatibility Int?
  casteReligionMatch    Int?
  lifestyleMatch        Int?
  educationMatch        Int?

  generatedBy String @default("algo")
  rank        Int?

  @@unique([customerId, poolProfileId])
  @@index([customerId])
  @@index([score])
  @@map("match_results")
}

model SentMatch {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  poolProfileId String
  poolProfile   PoolProfile @relation(fields: [poolProfileId], references: [id], onDelete: Cascade)

  matchmakerId String
  matchmaker   Matchmaker @relation(fields: [matchmakerId], references: [id])

  introMessage String
  emailSubject String  @default("TDC — We found someone special for you 💌")

  status   SentMatchStatus @default(sent)
  viewedAt DateTime?

  @@unique([customerId, poolProfileId])
  @@index([customerId])
  @@index([matchmakerId])
  @@map("sent_matches")
}

model Note {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  content String

  customerId   String
  customer     Customer   @relation(fields: [customerId], references: [id], onDelete: Cascade)

  matchmakerId String
  matchmaker   Matchmaker @relation(fields: [matchmakerId], references: [id])

  @@index([customerId])
  @@index([matchmakerId])
  @@map("notes")
}
```

---

## 6. Environment Variables (.env — already exists)

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/tdc_matchmaker"
PORT=5000
JWT_SECRET=tdc_super_secret_key_2024
AI_API_KEY=your_anthropic_key_here
NODE_ENV=development
```

---

## 7. File-by-File Code to Generate

---

### FILE: server/package.json

```json
{
  "name": "tdc-server",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  },
  "prisma": {
    "seed": "node ../prisma/seed.js"
  }
}
```

---

### FILE: server/src/index.js

```javascript
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes — import all
app.use("/api/auth", require("./routes/auth"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/pool", require("./routes/pool"));
app.use("/api/matches", require("./routes/matches"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/send-match", require("./routes/sendMatch"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/dashboard", require("./routes/dashboard"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "TDC API is running 🚀" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
```

---

### FILE: server/src/prisma/client.js

```javascript
const { PrismaClient } = require("@prisma/client");

const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

module.exports = prisma;
```

---

### FILE: server/src/middleware/authMiddleware.js

```javascript
const jwt = require("jsonwebtoken");
const prisma = require("../prisma/client");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please login.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const matchmaker = await prisma.matchmaker.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        isActive: true,
      },
    });

    if (!matchmaker || !matchmaker.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account not found or deactivated.",
      });
    }

    req.matchmaker = matchmaker;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({
          success: false,
          message: "Token expired. Please login again.",
        });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

module.exports = { protect };
```

---

### FILE: server/src/routes/auth.js

```javascript
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma/client");
const { protect } = require("../middleware/authMiddleware");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Username and password are required.",
        });
    }

    const matchmaker = await prisma.matchmaker.findUnique({
      where: { username },
    });

    if (!matchmaker || !matchmaker.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password." });
    }

    const isMatch = await bcrypt.compare(password, matchmaker.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password." });
    }

    res.json({
      success: true,
      token: generateToken(matchmaker.id),
      matchmaker: {
        id: matchmaker.id,
        name: matchmaker.name,
        username: matchmaker.username,
        email: matchmaker.email,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error.", error: error.message });
  }
});

// POST /api/auth/logout
router.post("/logout", protect, (req, res) => {
  res.json({ success: true, message: `Goodbye, ${req.matchmaker.name}!` });
});

module.exports = router;
```

---

### FILE: server/src/routes/customers.js

```javascript
const router = require("express").Router();
const prisma = require("../prisma/client");
const { protect } = require("../middleware/authMiddleware");

// All routes protected
router.use(protect);

// GET /api/customers
router.get("/", async (req, res) => {
  try {
    const { status, gender, city, search } = req.query;

    const where = {
      assignedMatchmakerId: req.matchmaker.id,
      ...(status && { status }),
      ...(gender && { gender }),
      ...(city && { city: { contains: city, mode: "insensitive" } }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        age: true,
        city: true,
        maritalStatus: true,
        status: true,
        gender: true,
        updatedAt: true,
        currentCompany: true,
        designation: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ success: true, count: customers.length, customers });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch customers.",
        error: error.message,
      });
  }
});

// GET /api/customers/:id
router.get("/:id", async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        notes: { orderBy: { createdAt: "desc" } },
        sentMatches: {
          include: { poolProfile: true },
          orderBy: { createdAt: "desc" },
        },
        matchResults: {
          include: { poolProfile: true },
          orderBy: { score: "desc" },
          take: 10,
        },
      },
    });

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }

    if (customer.assignedMatchmakerId !== req.matchmaker.id) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    res.json({ success: true, customer });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch customer.",
        error: error.message,
      });
  }
});

// POST /api/customers
router.post("/", async (req, res) => {
  try {
    const data = {
      ...req.body,
      assignedMatchmakerId: req.matchmaker.id,
      dateOfBirth: new Date(req.body.dateOfBirth),
    };

    const customer = await prisma.customer.create({ data });
    res
      .status(201)
      .json({ success: true, message: "Customer created.", customer });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists." });
    }
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create customer.",
        error: error.message,
      });
  }
});

// PUT /api/customers/:id
router.put("/:id", async (req, res) => {
  try {
    const existing = await prisma.customer.findUnique({
      where: { id: req.params.id },
    });
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    if (existing.assignedMatchmakerId !== req.matchmaker.id) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    const { assignedMatchmakerId, id, createdAt, ...updateData } = req.body;
    if (updateData.dateOfBirth)
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ success: true, message: "Customer updated.", customer });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update customer.",
        error: error.message,
      });
  }
});

// PATCH /api/customers/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "new",
      "active",
      "matched",
      "on_hold",
      "paused",
      "closed",
    ];

    if (!status || !validStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
    }

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { status },
      select: { id: true, firstName: true, lastName: true, status: true },
    });

    res.json({
      success: true,
      message: `Status updated to ${status}.`,
      customer,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update status.",
        error: error.message,
      });
  }
});

// DELETE /api/customers/:id
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.customer.findUnique({
      where: { id: req.params.id },
    });
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    if (existing.assignedMatchmakerId !== req.matchmaker.id) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Customer deleted." });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete customer.",
        error: error.message,
      });
  }
});

module.exports = router;
```

---

### FILE: server/src/routes/pool.js

```javascript
const router = require("express").Router();
const prisma = require("../prisma/client");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// GET /api/pool
router.get("/", async (req, res) => {
  try {
    const { gender, city, religion, minAge, maxAge } = req.query;

    const profiles = await prisma.poolProfile.findMany({
      where: {
        isActive: true,
        ...(gender && { gender }),
        ...(city && { city: { contains: city, mode: "insensitive" } }),
        ...(religion && {
          religion: { contains: religion, mode: "insensitive" },
        }),
        ...(minAge && { age: { gte: parseInt(minAge) } }),
        ...(maxAge && { age: { lte: parseInt(maxAge) } }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        age: true,
        city: true,
        gender: true,
        currentCompany: true,
        designation: true,
        income: true,
        religion: true,
        caste: true,
        maritalStatus: true,
        wantKids: true,
        openToRelocate: true,
        diet: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, count: profiles.length, profiles });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch pool.",
        error: error.message,
      });
  }
});

// GET /api/pool/:id
router.get("/:id", async (req, res) => {
  try {
    const profile = await prisma.poolProfile.findUnique({
      where: { id: req.params.id },
    });
    if (!profile)
      return res
        .status(404)
        .json({ success: false, message: "Profile not found." });
    res.json({ success: true, profile });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch profile.",
        error: error.message,
      });
  }
});

// POST /api/pool
router.post("/", async (req, res) => {
  try {
    const profile = await prisma.poolProfile.create({
      data: { ...req.body, dateOfBirth: new Date(req.body.dateOfBirth) },
    });
    res
      .status(201)
      .json({ success: true, message: "Profile added to pool.", profile });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists in pool." });
    }
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to add profile.",
        error: error.message,
      });
  }
});

module.exports = router;
```

---

### FILE: server/src/utils/matchingEngine.js

```javascript
// ─────────────────────────────────────────────────────────────
// Matching Engine — Gender-specific scoring algorithm
// Returns a score 0-100 and a label for each candidate
// ─────────────────────────────────────────────────────────────

const getLabel = (score) => {
  if (score >= 85) return "High_Potential";
  if (score >= 70) return "Good_Match";
  if (score >= 55) return "Possible_Match";
  return "Low_Compatibility";
};

// ── Score a male customer against female pool candidates ──────
const scoreMaleCustomer = (customer, candidate) => {
  let age = 0,
    income = 0,
    height = 0,
    kids = 0,
    religion = 0,
    caste = 0,
    diet = 0,
    location = 0,
    lifestyle = 0;

  // Age: candidate younger by 1-5 yrs = full, 6-8 = partial [20pts]
  const ageDiff = customer.age - candidate.age;
  if (ageDiff >= 1 && ageDiff <= 5) age = 20;
  else if (ageDiff > 5 && ageDiff <= 8) age = 12;
  else if (ageDiff === 0) age = 8;

  // Income: candidate earns less [15pts]
  if (candidate.income && customer.income) {
    if (candidate.income < customer.income) income = 15;
    else if (candidate.income <= customer.income * 1.1) income = 8;
  } else income = 8; // no data = neutral

  // Height: candidate shorter [10pts]
  if (candidate.height && customer.height) {
    if (candidate.height < customer.height) height = 10;
  } else height = 5;

  // Kids preference [20pts]
  if (candidate.wantKids && customer.wantKids) {
    if (candidate.wantKids === customer.wantKids) kids = 20;
    else if (candidate.wantKids === "maybe" || customer.wantKids === "maybe")
      kids = 10;
  } else kids = 10;

  // Religion [15pts]
  if (candidate.religion && customer.religion) {
    if (candidate.religion === customer.religion) religion = 15;
  } else religion = 8;

  // Caste [10pts]
  if (customer.casteBarred && candidate.caste && customer.caste) {
    if (candidate.caste === customer.caste) caste = 10;
    else caste = 0;
  } else caste = 5;

  // Diet [5pts]
  if (candidate.diet && customer.diet) {
    if (candidate.diet === customer.diet) diet = 5;
  } else diet = 3;

  // Location [5pts]
  if (candidate.city && customer.city) {
    if (candidate.city === customer.city) location = 5;
    else if (candidate.openToRelocate === "yes") location = 3;
  }

  // Lifestyle (smoking/drinking) [0pts bonus — quality check]
  if (customer.partnerSmokingPref && candidate.smoking) {
    if (candidate.smoking !== customer.partnerSmokingPref) lifestyle = -5;
  }

  const raw =
    age +
    income +
    height +
    kids +
    religion +
    caste +
    diet +
    location +
    lifestyle;
  const score = Math.max(0, Math.min(100, raw));

  return {
    score,
    label: getLabel(score),
    compatibilityBreakdown: {
      ageCompatibility: age,
      incomeCompatibility: income,
      valuesAlignment: kids,
      locationCompatibility: location,
      casteReligionMatch: religion + caste,
      lifestyleMatch: diet + lifestyle,
      educationMatch: 0,
    },
  };
};

// ── Score a female customer against male pool candidates ──────
const scoreFemaleCustomer = (customer, candidate) => {
  let profession = 0,
    relocation = 0,
    kids = 0,
    religion = 0,
    family = 0,
    education = 0,
    lifestyle = 0;

  // Profession compatibility [20pts]
  // Both in tech / both in finance / etc.
  const techKeywords = [
    "engineer",
    "developer",
    "software",
    "product",
    "data",
    "it",
    "tech",
  ];
  const financeKeywords = [
    "finance",
    "banking",
    "investment",
    "ca",
    "accountant",
    "analyst",
  ];
  const matchKeywords = (a, b, keywords) =>
    keywords.some((k) => a?.toLowerCase().includes(k)) &&
    keywords.some((k) => b?.toLowerCase().includes(k));

  const custDesig = customer.designation || "";
  const candDesig = candidate.designation || "";
  if (matchKeywords(custDesig, candDesig, techKeywords)) profession = 20;
  else if (matchKeywords(custDesig, candDesig, financeKeywords))
    profession = 20;
  else if (candidate.income >= (customer.income || 0)) profession = 12;
  else profession = 6;

  // Relocation alignment [15pts]
  if (candidate.openToRelocate && customer.openToRelocate) {
    if (candidate.openToRelocate === customer.openToRelocate) relocation = 15;
    else if (
      candidate.openToRelocate === "maybe" ||
      customer.openToRelocate === "maybe"
    )
      relocation = 8;
  } else relocation = 8;

  // Kids preference [20pts]
  if (candidate.wantKids && customer.wantKids) {
    if (candidate.wantKids === customer.wantKids) kids = 20;
    else if (candidate.wantKids === "maybe" || customer.wantKids === "maybe")
      kids = 10;
  } else kids = 10;

  // Religion [15pts]
  if (candidate.religion && customer.religion) {
    if (candidate.religion === customer.religion) religion = 15;
  } else religion = 8;

  // Family type [10pts]
  if (candidate.familyType && customer.partnerFamilyTypePref) {
    if (candidate.familyType === customer.partnerFamilyTypePref) family = 10;
    else family = 4;
  } else family = 6;

  // Education compatibility [10pts]
  const pgDegrees = ["mba", "ms", "mtech", "phd", "md"];
  const custHasPG = pgDegrees.some((d) =>
    customer.pgDegree?.toLowerCase().includes(d),
  );
  const candHasPG = pgDegrees.some((d) =>
    candidate.pgDegree?.toLowerCase().includes(d),
  );
  if (custHasPG && candHasPG) education = 10;
  else if (!custHasPG)
    education = 7; // customer doesn't need PG match
  else education = 4;

  // Lifestyle [10pts]
  let lScore = 5; // neutral base
  if (candidate.smoking === "no" && customer.partnerSmokingPref === "no")
    lScore += 2;
  if (candidate.drinking === "no" && customer.partnerDrinkingPref === "no")
    lScore += 3;
  if (candidate.diet === customer.partnerDietPref) lScore += 2;
  lifestyle = Math.min(lScore, 10);

  const raw =
    profession + relocation + kids + religion + family + education + lifestyle;
  const score = Math.max(0, Math.min(100, raw));

  return {
    score,
    label: getLabel(score),
    compatibilityBreakdown: {
      ageCompatibility: 0,
      incomeCompatibility: profession,
      valuesAlignment: kids,
      locationCompatibility: relocation,
      casteReligionMatch: religion,
      lifestyleMatch: lifestyle,
      educationMatch: education,
    },
  };
};

// ── Main export: score a customer against one candidate ───────
const scoreMatch = (customer, candidate) => {
  if (customer.gender === "male") {
    return scoreMaleCustomer(customer, candidate);
  } else {
    return scoreFemaleCustomer(customer, candidate);
  }
};

module.exports = { scoreMatch, getLabel };
```

---

### FILE: server/src/utils/aiHelper.js

```javascript
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.AI_API_KEY });

// ── Format profile into readable text for the prompt ─────────
const formatProfile = (p, label) =>
  `
${label}:
- Name: ${p.firstName} ${p.lastName}, Age: ${p.age}, City: ${p.city}
- Profession: ${p.designation || "N/A"} at ${p.currentCompany || "N/A"}
- Income: ${p.income ? `₹${(p.income / 100000).toFixed(1)} LPA` : "N/A"}
- Religion: ${p.religion || "N/A"}, Caste: ${p.caste || "N/A"}
- Wants Kids: ${p.wantKids || "N/A"}, Open to Relocate: ${p.openToRelocate || "N/A"}
- Diet: ${p.diet || "N/A"}, Smoking: ${p.smoking || "N/A"}, Drinking: ${p.drinking || "N/A"}
- Education: ${p.degree || "N/A"} from ${p.undergraduateCollege || "N/A"}
- Family Type: ${p.familyType || "N/A"}, Marital Status: ${p.maritalStatus || "N/A"}
`.trim();

// ── Get AI match score + reasoning ───────────────────────────
const getAIMatchScore = async (customer, poolProfile) => {
  const prompt = `
You are an expert Indian matrimonial matchmaker with 20 years of experience.
Analyze compatibility between these two profiles and return ONLY a valid JSON object.

${formatProfile(customer, "Client (looking for a match)")}

${formatProfile(poolProfile, "Potential Match")}

Return ONLY this JSON structure, no markdown, no explanation:
{
  "score": <integer 0-100>,
  "label": "<High Potential | Good Match | Possible Match | Low Compatibility>",
  "reason": "<2-3 warm, human sentences explaining why they are or aren't compatible>",
  "compatibilityBreakdown": {
    "ageCompatibility": <0-100>,
    "incomeCompatibility": <0-100>,
    "valuesAlignment": <0-100>,
    "locationCompatibility": <0-100>,
    "casteReligionMatch": <0-100>,
    "lifestyleMatch": <0-100>,
    "educationMatch": <0-100>
  }
}
`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text.trim();
  return JSON.parse(text);
};

// ── Generate personalized intro email ────────────────────────
const generateIntroMessage = async (customer, poolProfile) => {
  const prompt = `
You are a warm, professional Indian matrimonial matchmaker at The Date Crew.
Write a short, personalized intro message (3-4 sentences) to send to a client introducing a match.
Tone: warm, optimistic, professional. Do NOT be overly formal or use "Dear".
Focus on 2-3 genuine compatibility points. End with an invitation to review the profile.

Client: ${customer.firstName} ${customer.lastName}, ${customer.age}, ${customer.city}
Profession: ${customer.designation} at ${customer.currentCompany}

Match: ${poolProfile.firstName} ${poolProfile.lastName}, ${poolProfile.age}, ${poolProfile.city}  
Profession: ${poolProfile.designation} at ${poolProfile.currentCompany}
Religion: ${poolProfile.religion}, Caste: ${poolProfile.caste}
Wants Kids: ${poolProfile.wantKids}, Open to Relocate: ${poolProfile.openToRelocate}

Return ONLY the message text. No subject line. No labels. No markdown.
`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0].text.trim();
};

module.exports = { getAIMatchScore, generateIntroMessage };
```

Install the Anthropic SDK:

```bash
pnpm add @anthropic-ai/sdk
```

---

### FILE: server/src/routes/matches.js

```javascript
const router = require("express").Router();
const prisma = require("../prisma/client");
const { protect } = require("../middleware/authMiddleware");
const { scoreMatch } = require("../utils/matchingEngine");

router.use(protect);

// Helper: run scoring for all pool candidates for a customer
const runMatchingForCustomer = async (customer) => {
  const oppositeGender = customer.gender === "male" ? "female" : "male";

  const poolProfiles = await prisma.poolProfile.findMany({
    where: { gender: oppositeGender, isActive: true },
  });

  const results = poolProfiles.map((profile) => {
    const { score, label, compatibilityBreakdown } = scoreMatch(
      customer,
      profile,
    );
    return { profile, score, label, compatibilityBreakdown };
  });

  // Sort by score descending, assign ranks
  results.sort((a, b) => b.score - a.score);
  return results.map((r, i) => ({ ...r, rank: i + 1 }));
};

// GET /api/matches/:customerId
router.get("/:customerId", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const minScore = parseInt(req.query.minScore) || 50;

    const customer = await prisma.customer.findUnique({
      where: { id: req.params.customerId },
    });
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    if (customer.assignedMatchmakerId !== req.matchmaker.id) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    const scored = await runMatchingForCustomer(customer);
    const filtered = scored.filter((r) => r.score >= minScore).slice(0, limit);

    // Upsert results into DB (cache)
    await Promise.all(
      filtered.map((r) =>
        prisma.matchResult.upsert({
          where: {
            customerId_poolProfileId: {
              customerId: customer.id,
              poolProfileId: r.profile.id,
            },
          },
          update: {
            score: r.score,
            label: r.label,
            rank: r.rank,
            ...r.compatibilityBreakdown,
          },
          create: {
            customerId: customer.id,
            poolProfileId: r.profile.id,
            score: r.score,
            label: r.label,
            rank: r.rank,
            reason: `Score: ${r.score}. Computed by matching algorithm.`,
            ...r.compatibilityBreakdown,
            generatedBy: "algo",
          },
        }),
      ),
    );

    const matches = filtered.map((r) => ({
      rank: r.rank,
      profileId: r.profile.id,
      profile: r.profile,
      score: r.score,
      label: r.label,
      reason: `Compatibility score: ${r.score}/100`,
      compatibilityBreakdown: r.compatibilityBreakdown,
    }));

    res.json({
      success: true,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      totalMatches: matches.length,
      matches,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Matching failed.",
        error: error.message,
      });
  }
});

// GET /api/matches/:customerId/top
router.get("/:customerId/top", async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.customerId },
    });
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });

    const scored = await runMatchingForCustomer(customer);
    const top5 = scored.slice(0, 5);

    res.json({
      success: true,
      customerId: customer.id,
      matches: top5.map((r) => ({
        rank: r.rank,
        profileId: r.profile.id,
        profile: r.profile,
        score: r.score,
        label: r.label,
      })),
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to get top matches.",
        error: error.message,
      });
  }
});

// POST /api/matches/:customerId/refresh
router.post("/:customerId/refresh", async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.customerId },
    });
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });

    // Delete old results
    await prisma.matchResult.deleteMany({ where: { customerId: customer.id } });

    const scored = await runMatchingForCustomer(customer);

    await Promise.all(
      scored.slice(0, 30).map((r) =>
        prisma.matchResult.create({
          data: {
            customerId: customer.id,
            poolProfileId: r.profile.id,
            score: r.score,
            label: r.label,
            rank: r.rank,
            reason: `Score: ${r.score}. Refreshed by matchmaker.`,
            ...r.compatibilityBreakdown,
            generatedBy: "algo",
          },
        }),
      ),
    );

    res.json({
      success: true,
      message: "Matches refreshed.",
      totalMatches: scored.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to refresh matches.",
        error: error.message,
      });
  }
});

module.exports = router;
```

---

### FILE: server/src/routes/ai.js

```javascript
const router = require("express").Router();
const prisma = require("../prisma/client");
const { protect } = require("../middleware/authMiddleware");
const { getAIMatchScore, generateIntroMessage } = require("../utils/aiHelper");

router.use(protect);

// POST /api/ai/score
router.post("/score", async (req, res) => {
  try {
    const { customerId, matchProfileId } = req.body;
    if (!customerId || !matchProfileId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "customerId and matchProfileId are required.",
        });
    }

    const [customer, poolProfile] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.poolProfile.findUnique({ where: { id: matchProfileId } }),
    ]);

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    if (!poolProfile)
      return res
        .status(404)
        .json({ success: false, message: "Pool profile not found." });

    const result = await getAIMatchScore(customer, poolProfile);

    // Save AI result to DB
    await prisma.matchResult.upsert({
      where: {
        customerId_poolProfileId: { customerId, poolProfileId: matchProfileId },
      },
      update: { ...result, generatedBy: "ai" },
      create: {
        customerId,
        poolProfileId: matchProfileId,
        ...result,
        generatedBy: "ai",
      },
    });

    res.json({ success: true, customerId, matchProfileId, ...result });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "AI scoring failed.",
        error: error.message,
      });
  }
});

// POST /api/ai/intro
router.post("/intro", async (req, res) => {
  try {
    const { customerId, matchProfileId } = req.body;
    if (!customerId || !matchProfileId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "customerId and matchProfileId are required.",
        });
    }

    const [customer, poolProfile] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.poolProfile.findUnique({ where: { id: matchProfileId } }),
    ]);

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    if (!poolProfile)
      return res
        .status(404)
        .json({ success: false, message: "Pool profile not found." });

    const introMessage = await generateIntroMessage(customer, poolProfile);
    res.json({ success: true, customerId, matchProfileId, introMessage });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "AI intro generation failed.",
        error: error.message,
      });
  }
});

module.exports = router;
```

---

### FILE: server/src/routes/sendMatch.js

```javascript
const router = require("express").Router();
const prisma = require("../prisma/client");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// POST /api/send-match
router.post("/", async (req, res) => {
  try {
    const { customerId, matchedProfileId, introMessage } = req.body;
    if (!customerId || !matchedProfileId || !introMessage) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "customerId, matchedProfileId, and introMessage are required.",
        });
    }

    const [customer, poolProfile] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.poolProfile.findUnique({ where: { id: matchedProfileId } }),
    ]);

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    if (!poolProfile)
      return res
        .status(404)
        .json({ success: false, message: "Pool profile not found." });

    const sentMatch = await prisma.sentMatch.create({
      data: {
        customerId,
        poolProfileId: matchedProfileId,
        matchmakerId: req.matchmaker.id,
        introMessage,
      },
    });

    res.json({
      success: true,
      message: "Match sent successfully.",
      sentMatch,
      mockEmail: {
        to: customer.email,
        subject: `TDC — We found someone special for you 💌`,
        body: introMessage,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({
          success: false,
          message: "This profile has already been sent to this customer.",
        });
    }
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to send match.",
        error: error.message,
      });
  }
});

// GET /api/send-match/:customerId
router.get("/:customerId", async (req, res) => {
  try {
    const sentMatches = await prisma.sentMatch.findMany({
      where: { customerId: req.params.customerId },
      include: {
        poolProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            city: true,
            designation: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      customerId: req.params.customerId,
      totalSent: sentMatches.length,
      sentMatches,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch sent matches.",
        error: error.message,
      });
  }
});

module.exports = router;
```

---

### FILE: server/src/routes/notes.js

```javascript
const router = require("express").Router();
const prisma = require("../prisma/client");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// GET /api/notes/:customerId
router.get("/:customerId", async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { customerId: req.params.customerId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, customerId: req.params.customerId, notes });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch notes.",
        error: error.message,
      });
  }
});

// POST /api/notes/:customerId
router.post("/:customerId", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Note content cannot be empty." });
    }

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        customerId: req.params.customerId,
        matchmakerId: req.matchmaker.id,
      },
    });

    res.status(201).json({ success: true, message: "Note added.", note });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to add note.",
        error: error.message,
      });
  }
});

// DELETE /api/notes/:noteId
router.delete("/:noteId", async (req, res) => {
  try {
    await prisma.note.delete({ where: { id: req.params.noteId } });
    res.json({ success: true, message: "Note deleted." });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Note not found." });
    }
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete note.",
        error: error.message,
      });
  }
});

module.exports = router;
```

---

### FILE: server/src/routes/dashboard.js

```javascript
const router = require("express").Router();
const prisma = require("../prisma/client");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// GET /api/dashboard/stats
router.get("/stats", async (req, res) => {
  try {
    const id = req.matchmaker.id;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      totalCustomers,
      activeCustomers,
      matchedCustomers,
      onHoldCustomers,
      newCustomers,
      totalMatchesSent,
      matchesSentThisWeek,
      poolSize,
    ] = await Promise.all([
      prisma.customer.count({ where: { assignedMatchmakerId: id } }),
      prisma.customer.count({
        where: { assignedMatchmakerId: id, status: "active" },
      }),
      prisma.customer.count({
        where: { assignedMatchmakerId: id, status: "matched" },
      }),
      prisma.customer.count({
        where: { assignedMatchmakerId: id, status: "on_hold" },
      }),
      prisma.customer.count({
        where: { assignedMatchmakerId: id, status: "new" },
      }),
      prisma.sentMatch.count({ where: { matchmakerId: id } }),
      prisma.sentMatch.count({
        where: { matchmakerId: id, createdAt: { gte: oneWeekAgo } },
      }),
      prisma.poolProfile.count({ where: { isActive: true } }),
    ]);

    res.json({
      success: true,
      stats: {
        totalCustomers,
        activeCustomers,
        matchedCustomers,
        onHoldCustomers,
        newCustomers,
        totalMatchesSent,
        matchesSentThisWeek,
        poolSize,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch stats.",
        error: error.message,
      });
  }
});

module.exports = router;
```

---

### FILE: prisma/seed.js

```javascript
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Matchmakers ─────────────────────────────────────────────
  const hashed = await bcrypt.hash("tdc@2024", 10);

  const priya = await prisma.matchmaker.upsert({
    where: { username: "priya_matchmaker" },
    update: {},
    create: {
      username: "priya_matchmaker",
      password: hashed,
      name: "Priya Sharma",
      email: "priya@thedatecrew.com",
    },
  });

  await prisma.matchmaker.upsert({
    where: { username: "rahul_matchmaker" },
    update: {},
    create: {
      username: "rahul_matchmaker",
      password: hashed,
      name: "Rahul Verma",
      email: "rahul@thedatecrew.com",
    },
  });

  // ── Sample Customers (3 male, 3 female) ────────────────────
  const customers = [
    {
      firstName: "Arjun",
      lastName: "Mehta",
      gender: "male",
      dateOfBirth: new Date("1994-03-15"),
      age: 30,
      email: "arjun.mehta@gmail.com",
      phone: "+91-9876543210",
      city: "Mumbai",
      country: "India",
      height: 175,
      undergraduateCollege: "IIT Bombay",
      degree: "B.Tech Computer Science",
      currentCompany: "Goldman Sachs",
      designation: "Associate",
      income: 2500000,
      maritalStatus: "never_married",
      languagesKnown: ["Hindi", "English", "Marathi"],
      siblings: 1,
      religion: "Hindu",
      caste: "Brahmin",
      wantKids: "yes",
      openToRelocate: "yes",
      openToPets: "maybe",
      diet: "vegetarian",
      smoking: "no",
      drinking: "occasionally",
      familyType: "nuclear",
      motherTongue: "Hindi",
      manglik: "no",
      status: "active",
      assignedMatchmakerId: priya.id,
    },
    {
      firstName: "Rohit",
      lastName: "Sharma",
      gender: "male",
      dateOfBirth: new Date("1991-07-22"),
      age: 33,
      email: "rohit.sharma.tdc@gmail.com",
      phone: "+91-9123456789",
      city: "Delhi",
      country: "India",
      height: 180,
      undergraduateCollege: "Delhi University",
      degree: "B.Com",
      postgraduateCollege: "FMS Delhi",
      pgDegree: "MBA",
      currentCompany: "Deloitte",
      designation: "Senior Manager",
      income: 3200000,
      maritalStatus: "never_married",
      languagesKnown: ["Hindi", "English", "Punjabi"],
      siblings: 2,
      religion: "Hindu",
      caste: "Kshatriya",
      wantKids: "yes",
      openToRelocate: "maybe",
      openToPets: "no",
      diet: "non_vegetarian",
      smoking: "no",
      drinking: "occasionally",
      familyType: "joint",
      motherTongue: "Hindi",
      manglik: "no",
      status: "active",
      assignedMatchmakerId: priya.id,
    },
    {
      firstName: "Priya",
      lastName: "Nair",
      gender: "female",
      dateOfBirth: new Date("1996-11-10"),
      age: 28,
      email: "priya.nair.tdc@gmail.com",
      phone: "+91-9988776655",
      city: "Bangalore",
      country: "India",
      height: 162,
      undergraduateCollege: "BITS Pilani",
      degree: "B.E. Electronics",
      currentCompany: "Infosys",
      designation: "Senior Software Engineer",
      income: 1400000,
      maritalStatus: "never_married",
      languagesKnown: ["Malayalam", "English", "Hindi"],
      siblings: 1,
      religion: "Hindu",
      caste: "Nair",
      wantKids: "yes",
      openToRelocate: "yes",
      openToPets: "yes",
      diet: "non_vegetarian",
      smoking: "no",
      drinking: "no",
      familyType: "nuclear",
      motherTongue: "Malayalam",
      manglik: "dont_know",
      status: "new",
      assignedMatchmakerId: priya.id,
    },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { email: c.email },
      update: {},
      create: c,
    });
  }

  // ── Sample Pool Profiles ────────────────────────────────────
  // (Add 100+ by generating with AI — see guide)
  const pool = [
    {
      firstName: "Neha",
      lastName: "Kapoor",
      gender: "female",
      dateOfBirth: new Date("1997-05-20"),
      age: 27,
      email: "neha.kapoor.pool@gmail.com",
      phone: "+91-9876501234",
      city: "Mumbai",
      country: "India",
      height: 158,
      undergraduateCollege: "Symbiosis Pune",
      degree: "BBA",
      currentCompany: "Zomato",
      designation: "Product Manager",
      income: 1800000,
      maritalStatus: "never_married",
      languagesKnown: ["Hindi", "English"],
      siblings: 0,
      religion: "Hindu",
      caste: "Brahmin",
      wantKids: "yes",
      openToRelocate: "yes",
      openToPets: "maybe",
      diet: "vegetarian",
      smoking: "no",
      drinking: "no",
      familyType: "nuclear",
      motherTongue: "Hindi",
      manglik: "no",
      isActive: true,
    },
    {
      firstName: "Anjali",
      lastName: "Singh",
      gender: "female",
      dateOfBirth: new Date("1995-08-14"),
      age: 29,
      email: "anjali.singh.pool@gmail.com",
      phone: "+91-9812345678",
      city: "Delhi",
      country: "India",
      height: 160,
      undergraduateCollege: "Miranda House DU",
      degree: "B.Sc Psychology",
      postgraduateCollege: "TISS Mumbai",
      pgDegree: "MSW",
      currentCompany: "NGO Pratham",
      designation: "Program Manager",
      income: 900000,
      maritalStatus: "never_married",
      languagesKnown: ["Hindi", "English", "Urdu"],
      siblings: 1,
      religion: "Hindu",
      caste: "Rajput",
      wantKids: "maybe",
      openToRelocate: "yes",
      openToPets: "yes",
      diet: "eggetarian",
      smoking: "no",
      drinking: "occasionally",
      familyType: "joint",
      motherTongue: "Hindi",
      manglik: "no",
      isActive: true,
    },
    {
      firstName: "Karthik",
      lastName: "Iyer",
      gender: "male",
      dateOfBirth: new Date("1992-04-18"),
      age: 32,
      email: "karthik.iyer.pool@gmail.com",
      phone: "+91-9901234567",
      city: "Bangalore",
      country: "India",
      height: 172,
      undergraduateCollege: "NIT Trichy",
      degree: "B.Tech Mechanical",
      postgraduateCollege: "IIM Bangalore",
      pgDegree: "MBA",
      currentCompany: "McKinsey",
      designation: "Engagement Manager",
      income: 4200000,
      maritalStatus: "never_married",
      languagesKnown: ["Tamil", "English", "Hindi"],
      siblings: 1,
      religion: "Hindu",
      caste: "Iyer",
      wantKids: "yes",
      openToRelocate: "yes",
      openToPets: "no",
      diet: "vegetarian",
      smoking: "no",
      drinking: "occasionally",
      familyType: "nuclear",
      motherTongue: "Tamil",
      manglik: "no",
      isActive: true,
    },
  ];

  for (const p of pool) {
    await prisma.poolProfile.upsert({
      where: { email: p.email },
      update: {},
      create: p,
    });
  }

  console.log("✅ Seed complete!");
  console.log("");
  console.log("Login credentials:");
  console.log("  username: priya_matchmaker  password: tdc@2024");
  console.log("  username: rahul_matchmaker  password: tdc@2024");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run seed:

```bash
cd server
npx prisma db seed
```

---

## 8. All API Endpoints Reference

| #   | Method | Endpoint                           | Auth | Route File   |
| --- | ------ | ---------------------------------- | ---- | ------------ |
| 1   | POST   | `/api/auth/login`                  | No   | auth.js      |
| 2   | POST   | `/api/auth/logout`                 | Yes  | auth.js      |
| 3   | GET    | `/api/customers`                   | Yes  | customers.js |
| 4   | GET    | `/api/customers/:id`               | Yes  | customers.js |
| 5   | POST   | `/api/customers`                   | Yes  | customers.js |
| 6   | PUT    | `/api/customers/:id`               | Yes  | customers.js |
| 7   | PATCH  | `/api/customers/:id/status`        | Yes  | customers.js |
| 8   | DELETE | `/api/customers/:id`               | Yes  | customers.js |
| 9   | GET    | `/api/pool`                        | Yes  | pool.js      |
| 10  | GET    | `/api/pool/:id`                    | Yes  | pool.js      |
| 11  | POST   | `/api/pool`                        | Yes  | pool.js      |
| 12  | GET    | `/api/matches/:customerId`         | Yes  | matches.js   |
| 13  | GET    | `/api/matches/:customerId/top`     | Yes  | matches.js   |
| 14  | POST   | `/api/matches/:customerId/refresh` | Yes  | matches.js   |
| 15  | POST   | `/api/ai/score`                    | Yes  | ai.js        |
| 16  | POST   | `/api/ai/intro`                    | Yes  | ai.js        |
| 17  | POST   | `/api/send-match`                  | Yes  | sendMatch.js |
| 18  | GET    | `/api/send-match/:customerId`      | Yes  | sendMatch.js |
| 19  | GET    | `/api/notes/:customerId`           | Yes  | notes.js     |
| 20  | POST   | `/api/notes/:customerId`           | Yes  | notes.js     |
| 21  | DELETE | `/api/notes/:noteId`               | Yes  | notes.js     |
| 22  | GET    | `/api/dashboard/stats`             | Yes  | dashboard.js |

---

## 9. Test Order (Postman / Thunder Client)

Test in this exact order after seeding:

```
1. POST /api/auth/login          → copy token from response
2. GET  /api/dashboard/stats     → paste token as Bearer
3. GET  /api/customers           → should return seeded customers
4. GET  /api/customers/:id       → use an id from step 3
5. GET  /api/pool                → should return seeded pool profiles
6. GET  /api/matches/:customerId → get ranked matches for a customer
7. POST /api/ai/score            → send customerId + matchProfileId
8. POST /api/ai/intro            → get intro message
9. POST /api/send-match          → send the match with intro
10. GET /api/notes/:customerId   → check notes
11. POST /api/notes/:customerId  → add a note
```

---

## 10. Generate 100+ Pool Profiles

Use this prompt in Claude or ChatGPT, paste the result into seed.js or a `pool.json` file:

```
Generate 50 Indian female matrimonial profiles as a JSON array.
Each must have these exact fields with correct types:
firstName (string), lastName (string), gender ("female"),
dateOfBirth (ISO date string like "1997-05-20"), age (number 22-32),
email (unique string), phone (string), city (one of: Mumbai/Delhi/Bangalore/Hyderabad/Chennai/Pune/Kolkata),
country ("India"), state (string), height (number 150-168),
undergraduateCollege (string), degree (string),
postgraduateCollege (string or null), pgDegree (string or null),
currentCompany (string), designation (string), income (number 600000-2200000),
maritalStatus ("never_married" or "divorced"), siblings (number 0-3),
familyType ("nuclear" or "joint"), motherTongue (string),
languagesKnown (array of strings), religion (string),
caste (string), manglik ("yes","no","dont_know"),
wantKids ("yes","no","maybe"), openToRelocate ("yes","no","maybe"),
openToPets ("yes","no","maybe"), diet ("vegetarian","non_vegetarian","eggetarian","jain"),
smoking ("no","occasionally"), drinking ("no","occasionally","yes"),
isActive (true)

Make profiles diverse in profession, city, background.
Return ONLY valid JSON array. No explanation, no markdown.
```
