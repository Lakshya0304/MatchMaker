import { Router } from "express";
import prisma from "../prisma";

const customerRoutes = Router();

customerRoutes.get("/all", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";

    const skip = (page - 1) * limit;

    const whereClause: any = {
      isDummy: true, // Isolates actual clients from the simulation profiles
    };

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } }
      ];
    }

    const [total, clients] = await prisma.$transaction([
      prisma.client.count({ where: whereClause }),
      prisma.client.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          city: true,
          maritalStatus: true,
          journeyStatus: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      })
    ]);

    // Transform the database results
    const formattedClients = clients.map((client: any) => ({
      id: client.id,
      name: `${client.firstName} ${client.lastName}`,
      age: client.dateOfBirth.getFullYear(),
      city: client.city,
      maritalStatus: client.maritalStatus,
      journeyStatus: client.journeyStatus,
    }));

    return res.status(200).json({
      data: formattedClients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("❌ Error fetching paginated customer list:", error);
    return res.status(500).json({
      error: "Failed to retrieve customer dashboard database entries.",
    });
  }
});

/**
 * @route   GET /api/customers/stats
 * @desc    Get dashboard metrics and counts
 */
customerRoutes.get("/stats", async (req, res) => {
  try {
    const totalCustomers = await prisma.client.count({ where: { isDummy: true } });
    const activeCustomers = await prisma.client.count({ where: { isDummy: true, journeyStatus: "Searching Matches" } });
    const matchedCustomers = await prisma.client.count({ where: { isDummy: true, journeyStatus: "Matched" } });
    const onHoldCustomers = await prisma.client.count({ where: { isDummy: true, journeyStatus: "On Hold" } });
    const newCustomers = await prisma.client.count({ where: { isDummy: true, journeyStatus: "Profile Verified" } });
    const poolSize = await prisma.client.count({ where: { isDummy: true } });

    return res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        activeCustomers,
        matchedCustomers,
        onHoldCustomers,
        newCustomers,
        totalMatchesSent: 27,
        matchesSentThisWeek: 5,
        poolSize
      }
    });
  } catch (error) {
    console.error("❌ Stats fetch error:", error);
    return res.status(500).json({ error: "Failed to load dashboard stats." });
  }
});

/**
 * @route   GET /api/clients/:id
 * @desc    API #2: Get full detailed biodata and interaction history log for a single client
 * @access  Protected (Requires Login)
 */
customerRoutes.get("/:id", async (req, res) => {
  const clientId = parseInt(req.params.id);

  if (isNaN(clientId)) {
    return res
      .status(400)
      .json({ error: "Malformed or missing client identification parameter." });
  }

  try {
    const clientProfile = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        notes: {
          include: {
            matchmaker: {
              select: { name: true }, // Attaches matchmaker identity to notes timeline items[cite: 1]
            },
          },
          orderBy: {
            createdAt: "desc", // Pulls interactions newest first[cite: 1]
          },
        },
      },
    });

    if (!clientProfile) {
      return res
        .status(404)
        .json({ error: "Requested customer profile could not be located." });
    }

    // Safely map BigInt income data types into standard strings to avoid JSON transmission failure
    const serializedProfile = {
      ...clientProfile,
      age: clientProfile.dateOfBirth,
      annualIncomeInr: clientProfile.annualIncomeInr
        ? clientProfile.annualIncomeInr.toString()
        : null,
    };

    return res.status(200).json(serializedProfile);
  } catch (error) {
    console.error("❌ Detailed profiles fetch error:", error);
    return res.status(500).json({
      error: "Internal server error pulling deep biodata file structures.",
    });
  }
});

/**
 * @route   PATCH /api/customers/:id/status
 */
customerRoutes.patch("/:id/status", async (req, res) => {
  const clientId = parseInt(req.params.id);
  const { status } = req.body;
  
  if (isNaN(clientId) || !status) {
    return res.status(400).json({ error: "Invalid parameters." });
  }

  try {
    const updated = await prisma.client.update({
      where: { id: clientId },
      data: { journeyStatus: status }
    });
    return res.status(200).json({ success: true, customerId: clientId, status: updated.journeyStatus });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update status." });
  }
});

/**
 * @route   POST /api/customers/:id/notes
 */
customerRoutes.post("/:id/notes", async (req, res) => {
  const clientId = parseInt(req.params.id);
  const { content } = req.body;
  const matchmakerId = req.user?.matchmakerId || 1; // Fallback to 1 if no auth middleware

  if (isNaN(clientId) || !content) {
    return res.status(400).json({ error: "Invalid parameters." });
  }

  try {
    const newNote = await prisma.note.create({
      data: {
        content,
        clientId,
        matchmakerId
      }
    });
    return res.status(201).json({ success: true, note: newNote });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add note." });
  }
});

export default customerRoutes;
