import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL as string;
const adapter = new PrismaPg({ connectionString });

const prisma = (global as any).prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') (global as any).prisma = prisma;

export default prisma;
