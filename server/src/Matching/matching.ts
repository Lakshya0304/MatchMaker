import { Router } from "express";
import prisma from "../prisma";
import { OpenRouter } from "@openrouter/sdk";

const matchingRoutes = Router();

// 1. Gather all available API keys from your environment configuration
const API_KEYS = [
  process.env.OPENROUTER_API_KEY1,
  process.env.OPENROUTER_API_KEY2,
].filter(Boolean) as string[];

/**
 * @route   GET /api/matching/evaluate/:clientId
 * @desc    Get AI-ranked matching candidates (Checks DB Cache first, falls back to OpenRouter via Key Rotation)
 * @access  Protected (Requires Login)
 */
matchingRoutes.get("/evaluate/:clientId", async (req, res) => {
  const clientId = parseInt(req.params.clientId);

  if (isNaN(clientId)) {
    return res.status(400).json({ error: "Invalid client ID parameter." });
  }

  try {
    // TIER 1 CACHE LOOKUP: Check if matches already exist in the DB
    const cachedMatches = await prisma.match.findMany({
      where: { clientId: clientId },
      include: { candidate: true },
    });

    // If cache hits, serve it instantly without using any API keys
    if (cachedMatches.length > 0) {
      const formattedResults = cachedMatches.map((m) => ({
        id: m.candidate.id,
        name: `${m.candidate.firstName} ${m.candidate.lastName}`,
        gender: m.candidate.gender,
        age: m.candidate.dateOfBirth,
        city: m.candidate.city,
        heightCm: m.candidate.heightCm,
        designation: m.candidate.designation,
        annualIncomeInr: m.candidate.annualIncomeInr.toString(),
        religion: m.candidate.religion,
        dietPreference: m.candidate.dietPreference,
        compatibilityScore: m.compatibilityScore,
        explanation: m.explanation,
        emailIntroSnippet: m.emailIntroSnippet,
        status: m.status,
      }));

      formattedResults.sort(
        (a, b) => b.compatibilityScore - a.compatibilityScore,
      );
      return res.status(200).json(formattedResults);
    }

    // TIER 2 CACHE MISS: Execute the key-switching pipeline
    const results = await runMatchingPipeline(clientId);
    return res.status(200).json(results);
  } catch (error: any) {
    console.error("❌ OpenRouter Matching Engine Error:", error);
    return res.status(error.status || 500).json({
      error: error.message || "Matchmaking execution pipeline failed.",
    });
  }
});

/**
 * Core matching evaluation logic with integrated API Key Rotation Failover.
 * Returns enriched match results for a given client.
 * Optional `filter` text is appended to the system prompt to bias AI.
 */
async function runMatchingPipeline(clientId: number, filter?: string) {
  // 2. Grab target customer profile data
  const targetClient = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!targetClient) {
    throw new Error("Target client profile not found.");
  }

  const oppositeGender = targetClient.gender === "Male" ? "Female" : "Male";
  let candidatePool = [];

  // 3. Core Heuristic Database Filtration Pass
  if (targetClient.gender === "Male") {
    candidatePool = await prisma.client.findMany({
      where: {
        isDummy: true,
        gender: oppositeGender,
        dateOfBirth: { gt: targetClient.dateOfBirth },
        heightCm: { lt: targetClient.heightCm },
        annualIncomeInr: { lt: targetClient.annualIncomeInr },
        wantKids: targetClient.wantKids,
      },
      take: 10,
    });
  } else {
    candidatePool = await prisma.client.findMany({
      where: {
        isDummy: true,
        gender: oppositeGender,
        religion: targetClient.religion,
        openToRelocate: targetClient.openToRelocate,
      },
      take: 10,
    });
  }

  if (candidatePool.length === 0) {
    return [];
  }

  // 4. Serialize records cleanly for token transmission
  const candidatesForAI = candidatePool.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    age: c.dateOfBirth,
    city: c.city,
    profession: c.designation,
    incomeLPA: `${Number(c.annualIncomeInr) / 100000} LPA`,
    diet: c.dietPreference,
    familyValues: c.familyValues,
  }));

  // 5. Build system prompts targeting Indian matchmaking scenarios
  let systemPrompt = `
    You are an expert elite matchmaking coordinator for an upscale Indian Matrimonial Agency.
    Analyze compatibility between the Target Client and the provided Candidate array.

    Target Client Baseline:
    - Diet Lifestyle: ${targetClient.dietPreference}
    - Family Values Blueprint: ${targetClient.familyValues}
    - Current Professional Role: ${targetClient.designation}

    You must respond strictly with a valid JSON object matching this structural layout:
    {
      "evaluations": [
        {
          "candidateId": 1,
          "score": 95,
          "explanation": "State clear reasons why they match professional, diet, or lifestyle preferences.",
          "emailIntro": "Write a short, professional, highly captivating email intro snippet introducing this candidate to the client."
        }
      ]
    }
  `;

  if (filter && filter.trim()) {
    systemPrompt += `\nAdditional preferences: ${filter.trim()}`;
  }

  if (!process.env.MODEL) {
    throw new Error("Model environment parameter is not defined.");
  }

  if (API_KEYS.length === 0) {
    throw new Error(
      "No OpenRouter API keys were detected in the system environment properties.",
    );
  }

  // 6. API KEY ROTATION LOOP: Cycles keys sequentially if rate-limits or quota restrictions trigger
  let response;
  let requestSuccessful = false;

  for (let i = 0; i < API_KEYS.length; i++) {
    const currentKey = API_KEYS[i];

    try {
      console.log(
        `🤖 Attempting AI Matchmaking Evaluation using API Key Slot #${i + 1}`,
      );

      // Initialize an isolated client instance using the current key slot
      const temporaryClient = new OpenRouter({ apiKey: currentKey });

      response = await temporaryClient.chat.send({
        chatRequest: {
          model: process.env.MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(candidatesForAI) },
          ],
          responseFormat: { type: "json_object" },
        },
      });

      requestSuccessful = true;
      console.log(
        `✅ Successfully generated matches using API Key Slot #${i + 1}`,
      );
      break; // Success! Exit key switching loop early
    } catch (error: any) {
      const errCode = error?.statusCode || error?.status || 500;

      // If code is 429 (Rate Limit) or 401/403 (Invalid/Expired key quotas), step to next key slot
      if (errCode === 429 || errCode === 401 || errCode === 403) {
        console.warn(
          `⚠️ API Key Slot #${i + 1} failed with Status ${errCode}. Swapping to backup token...`,
        );
        continue;
      }

      // Re-throw internal processing errors immediately (syntax errors, prompt typos)
      throw error;
    }
  }

  if (!requestSuccessful || !response) {
    const errorResponse: any = new Error(
      "All registered OpenRouter API key configurations are currently rate-limited or exhausted.",
    );
    errorResponse.status = 429;
    throw errorResponse;
  }

  const content = response?.choices?.[0]?.message?.content;
  const parsedContent = content ? JSON.parse(content) : {};
  const aiEvaluations = parsedContent?.evaluations || [];

  // 7. Store new evaluations in the database bulk
  const matchDataToSave = candidatePool.map((candidate) => {
    const matchInsight =
      aiEvaluations.find((item: any) => item.candidateId === candidate.id) ||
      {};
    return {
      clientId: clientId,
      candidateId: candidate.id,
      compatibilityScore: matchInsight.score || 70,
      explanation:
        matchInsight.explanation ||
        "Meets baseline quantitative criteria constraints.",
      emailIntroSnippet:
        matchInsight.emailIntro ||
        "We identified an exceptional profile that aligns well with your preferences.",
      status: "Suggested",
    };
  });

  await prisma.match.createMany({
    data: matchDataToSave,
    skipDuplicates: true,
  });

  // 8. Map final local array payload to match expected structure on frontend
  const enrichedResults = candidatePool.map((candidate) => {
    const savedInfo = matchDataToSave.find(
      (m) => m.candidateId === candidate.id,
    )!;
    return {
      id: candidate.id,
      name: `${candidate.firstName} ${candidate.lastName}`,
      gender: candidate.gender,
      age: candidate.dateOfBirth,
      city: candidate.city,
      heightCm: candidate.heightCm,
      designation: candidate.designation,
      annualIncomeInr: candidate.annualIncomeInr.toString(),
      religion: candidate.religion,
      dietPreference: candidate.dietPreference,
      compatibilityScore: savedInfo.compatibilityScore,
      explanation: savedInfo.explanation,
      emailIntroSnippet: savedInfo.emailIntroSnippet,
      status: savedInfo.status,
    };
  });

  enrichedResults.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  return enrichedResults;
}

/**
 * @route   POST /api/matching/rematch/:clientId
 * @desc    Clears previous matching records and forces a fresh generation pass
 * @access  Protected (Requires Login)
 */
matchingRoutes.post("/rematch/:clientId", async (req, res) => {
  const clientId = parseInt(req.params.clientId);
  if (isNaN(clientId)) {
    return res.status(400).json({ error: "Invalid client ID parameter." });
  }
  try {
    await prisma.match.deleteMany({ where: { clientId } });

    const { filter } = req.body as { filter?: string };
    const results = await runMatchingPipeline(clientId, filter);
    return res.status(200).json(results);
  } catch (error: any) {
    console.error("❌ Rematch execution error:", error);
    return res.status(error.status || 500).json({
      error: error.message || "Rematch execution failed.",
    });
  }
});

export default matchingRoutes;

// import { Router } from "express";
// import prisma from "../prisma";
// import { OpenRouter } from "@openrouter/sdk";

// const matchingRoutes = Router();

// const openRouterClient = new OpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY,
// });
// // httpReferer: "http://localhost:3000",
// // appTitle: "The Date Crew Matchmaker Panel",

// /**
//  * @route   GET /api/matching/evaluate/:clientId
//  * @desc    Get AI-ranked matching candidates using OpenRouter specifications
//  * @access  Protected (Requires Login)
//  */
// matchingRoutes.get("/evaluate/:clientId", async (req, res) => {
//   const clientId = parseInt(req.params.clientId);

//   if (isNaN(clientId)) {
//     return res.status(400).json({ error: "Invalid client ID parameter." });
//   }

//   try {
//     // 1. Grab target customer baseline data
//     const targetClient = await prisma.client.findUnique({
//       where: { id: clientId },
//     });

//     if (!targetClient) {
//       return res
//         .status(404)
//         .json({ error: "Target client profile not found." });
//     }

//     const oppositeGender = targetClient.gender === "Male" ? "Female" : "Male";
//     let candidatePool = [];

//     // 2. TIER 1: Core Heuristic Database Filtration
//     if (targetClient.gender === "Male") {
//       // MALE CONSTRAINTS: Younger, lower income, shorter, same child outlook
//       candidatePool = await prisma.client.findMany({
//         where: {
//           isDummy: true, // Target only the 100 simulator profiles
//           gender: oppositeGender,
//           dateOfBirth: { gt: targetClient.dateOfBirth },
//           heightCm: { lt: targetClient.heightCm },
//           annualIncomeInr: { lt: targetClient.annualIncomeInr },
//           wantKids: targetClient.wantKids,
//         },
//         take: 10,
//       });
//     } else {
//       // FEMALE CONSTRAINTS: Religion alignment and relocation compatibility
//       candidatePool = await prisma.client.findMany({
//         where: {
//           isDummy: true,
//           gender: oppositeGender,
//           religion: targetClient.religion,
//           openToRelocate: targetClient.openToRelocate,
//         },
//         take: 10,
//       });
//     }

//     if (candidatePool.length === 0) {
//       return res.status(200).json([]);
//     }

//     // 3. Serialize records cleanly for token transmission
//     const candidatesForAI = candidatePool.map((c) => ({
//       id: c.id,
//       name: `${c.firstName} ${c.lastName}`,
//       age: c.dateOfBirth,
//       city: c.city,
//       profession: c.designation,
//       incomeLPA: `${Number(c.annualIncomeInr) / 100000} LPA`,
//       diet: c.dietPreference,
//       familyValues: c.familyValues,
//     }));

//     // 4. Build system prompts targeting Indian matchmaking scenarios
//     const systemPrompt = `
//       You are an expert elite matchmaking coordinator for an upscale Indian Matrimonial Agency.
//       Analyze compatibility between the Target Client and the provided Candidate array.

//       Target Client Baseline:
//       - Diet Lifestyle: ${targetClient.dietPreference}
//       - Family Values Blueprint: ${targetClient.familyValues}
//       - Current Professional Role: ${targetClient.designation}

//       You must respond strictly with a valid JSON object matching this structural layout:
//       {
//         "evaluations": [
//           {
//             "candidateId": 1,
//             "score": 95,
//             "explanation": "State clear reasons why they match professional, diet, or lifestyle preferences.",
//             "emailIntro": "Write a short, professional, highly captivating email intro snippet introducing this candidate to the client."
//           }
//         ]
//       }
//     `;
//     if (!process.env.MODEL) {
//       return res.status(500).json({ error: "Model is not defined." });
//     }

//     // 5. Query OpenRouter's API using an optimized smart model
//     const response = await openRouterClient.chat.send({
//       chatRequest: {
//         model: process.env.MODEL,
//         // model: "google/gemma-4-31b-it:free", // Free OpenRouter model
//         messages: [
//           { role: "system", content: systemPrompt },
//           { role: "user", content: JSON.stringify(candidatesForAI) },
//         ],
//         responseFormat: { type: "json_object" }, // Enforces structured JSON output
//       },
//     });

//     const content = response?.choices?.[0]?.message?.content;
//     const parsedContent = content ? JSON.parse(content) : {};
//     const aiEvaluations = parsedContent?.evaluations || [];

//     // 6. Merge OpenRouter semantic data with underlying database info
//     const enrichedResults = candidatePool.map((candidate) => {
//       const matchInsight =
//         aiEvaluations.find((item) => item.candidateId === candidate.id) || {};
//       return {
//         id: candidate.id,
//         name: `${candidate.firstName} ${candidate.lastName}`,
//         gender: candidate.gender,
//         age: candidate.dateOfBirth,
//         city: candidate.city,
//         heightCm: candidate.heightCm,
//         designation: candidate.designation,
//         annualIncomeInr: candidate.annualIncomeInr.toString(),
//         religion: candidate.religion,
//         dietPreference: candidate.dietPreference,

//         // OpenRouter Enriched fields
//         compatibilityScore: matchInsight.score || 70,
//         explanation:
//           matchInsight.explanation ||
//           "Meets baseline quantitative criteria constraints.",
//         emailIntroSnippet:
//           matchInsight.emailIntro ||
//           "We identified an exceptional profile that aligns well with your preferences.",
//       };
//     });

//     // Sort showing the best matching records first
//     enrichedResults.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

//     return res.status(200).json(enrichedResults);
//   } catch (error) {
//     console.error("❌ OpenRouter Matching Engine Error:", error);
//     return res
//       .status(500)
//       .json({ error: "Matchmaking execution pipeline failed." });
//   }
// });

// export default matchingRoutes;
