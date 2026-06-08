import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import prisma from "../prisma";

const authRoutes = Router();

authRoutes.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    // 2. Query database for the matching matchmaker record
    const matchmaker = await prisma.matchmaker.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // 3. Fallback safely if user doesn't exist
    if (!matchmaker) {
      return res.status(401).json({
        error: "Invalid email or password credentials.",
      });
    }

    // 4. Compare incoming text password with stored bcrypt hash
    const isMatch = await bcrypt.compare(password, matchmaker.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid email or password credentials.",
      });
    }

    // 5. Generate secure JWT token containing the matchmaker metadata
    const tokenPayload = {
      matchmakerId: matchmaker.id,
      name: matchmaker.name,
      email: matchmaker.email,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET as string,
      { expiresIn: "8h" }, // Token expires at shift end (8 hours)
    );

    return res.status(200).json({
      message: "Login authenticated successfully.",
      token,
      matchmaker: {
        id: matchmaker.id,
        name: matchmaker.name,
        email: matchmaker.email,
      },
    });
  } catch (error) {
    console.error("❌ Login pipeline server fault:", error);
    return res.status(500).json({
      error: "Internal server error occurred during login authentication.",
    });
  }
});

export default authRoutes;
