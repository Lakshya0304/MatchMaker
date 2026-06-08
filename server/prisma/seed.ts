import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL as string;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Initiating database seed with Prisma...');

  // 1. Wipe out existing historical logs to maintain a clean slate
  await prisma.note.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.matchmaker.deleteMany({});
  console.log('🗑️  Cleared existing database entries.');

  // 2. Seed default login credentials for the internal panel
  const plainTextPassword = 'Password123!';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(plainTextPassword, saltRounds);

  await prisma.matchmaker.create({
    data: {
      name: 'MatchMaker',
      email: 'matchmaker@thedatecrew.com',
      passwordHash: passwordHash,
    },
  });
  console.log(`✅ Default Matchmaker account created. Email: matchmaker@thedatecrew.com | Password: ${plainTextPassword}`);

  // Data pools for generating variations of Indian profiles
  const maleFirstNames   = ['Aarav', 'Vihaan', 'Vivaan', 'Arjun', 'Aditya', 'Rahul', 'Rohit', 'Dev', 'Karan', 'Kabir', 'Rohan', 'Aman', 'Vikram', 'Rudra', 'Kunwar'];
  const femaleFirstNames = ['Diya', 'Isha', 'Ananya', 'Sanya', 'Riya', 'Kavya', 'Pooja', 'Neha', 'Meera', 'Priya', 'Anushka', 'Sneha', 'Tanvi', 'Simran', 'Aanya'];
  const lastNames        = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Mehta', 'Joshi', 'Nair', 'Iyer', 'Singh', 'Kapoor', 'Chatterjee', 'Deshmukh', 'Bajaj'];
  const cities           = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'];
  const colleges         = ['IIT Bombay', 'BITS Pilani', 'Delhi University', 'IIM Ahmedabad', 'SRCC Delhi', 'VIT Vellore'];
  const degrees          = ['B.Tech Computer Science', 'MBA Finance', 'B.Com Honours', 'B.Des', 'M.Tech Data Science'];
  const companies        = ['Google', 'Microsoft', 'TCS', 'Infosys', 'Zomato', 'Reliance', 'McKinsey', 'Accenture'];
  const designations     = ['Software Engineer', 'Product Manager', 'Data Analyst', 'Management Consultant', 'UI/UX Designer', 'HR Specialist'];
  const religions        = ['Hindu', 'Sikh', 'Muslim', 'Christian', 'Jain'];
  const castes           = ['Brahmin', 'Kshatriya', 'Vaishya', 'Maratha', 'Khatri', 'Aggarwal', 'Arora'];
  const diets            = ['Pure Veg', 'Eggetarian', 'Non-Veg', 'Jain'];
  const preferenceOptions = ['Yes', 'No', 'Maybe'];

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  type ClientCreateInput = Parameters<typeof prisma.client.create>[0]['data'];
  const generatedProfiles: ClientCreateInput[] = [];

  // 3. Generate 50 Male Dummy Pool Profiles
  console.log('🔄 Constructing 50 Male simulation profiles...');
  for (let i = 1; i <= 50; i++) {
    const firstName   = pick(maleFirstNames);
    const lastName    = pick(lastNames);
    const calculatedAge = Math.floor(Math.random() * (35 - 25 + 1)) + 25; // 25-35
    const incomeLPA   = Math.floor(Math.random() * (35 - 8 + 1)) + 8;     // 8–35 LPA

    generatedProfiles.push({
      isDummy:         true,
      firstName,
      lastName,
      gender:          'Male',
      dateOfBirth:     new Date(2026 - calculatedAge, 4, 12),
      heightCm:        Math.floor(Math.random() * (185 - 170 + 1)) + 170,
      maritalStatus:   'Never Married',
      email:           `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@tdc-pool.com`,
      phoneNumber:     `9812345${String(i).padStart(3, '0')}`,
      country:         'India',
      city:            pick(cities),
      ugCollege:       pick(colleges),
      degree:          pick(degrees),
      currentCompany:  pick(companies),
      designation:     pick(designations),
      annualIncomeInr: BigInt(incomeLPA * 100000),
      religion:        pick(religions),
      caste:           pick(castes),
      motherTongue:    'Hindi',
      dietPreference:  pick(diets),
      manglikStatus:   'No',
      familyValues:    'Moderate',
      siblings:        '1 younger brother',
      wantKids:        pick(preferenceOptions),
      openToRelocate:  pick(preferenceOptions),
      openToPets:      pick(preferenceOptions),
      journeyStatus:   'Searching Matches',
    });
  }

  // 4. Generate 50 Female Dummy Pool Profiles
  console.log('🔄 Constructing 50 Female simulation profiles...');
  for (let i = 1; i <= 50; i++) {
    const firstName   = pick(femaleFirstNames);
    const lastName    = pick(lastNames);
    const calculatedAge = Math.floor(Math.random() * (32 - 22 + 1)) + 22; // 22-32
    const incomeLPA   = Math.floor(Math.random() * (28 - 6 + 1)) + 6;     // 6–28 LPA

    generatedProfiles.push({
      isDummy:         true,
      firstName,
      lastName,
      gender:          'Female',
      dateOfBirth:     new Date(2026 - calculatedAge, 8, 24),
      heightCm:        Math.floor(Math.random() * (168 - 152 + 1)) + 152,
      maritalStatus:   'Never Married',
      email:           `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 50}@tdc-pool.com`,
      phoneNumber:     `9876543${String(i).padStart(3, '0')}`,
      country:         'India',
      city:            pick(cities),
      ugCollege:       pick(colleges),
      degree:          pick(degrees),
      currentCompany:  pick(companies),
      designation:     pick(designations),
      annualIncomeInr: BigInt(incomeLPA * 100000),
      religion:        pick(religions),
      caste:           pick(castes),
      motherTongue:    'Hindi',
      dietPreference:  pick(diets),
      manglikStatus:   'No',
      familyValues:    'Moderate',
      siblings:        '1 elder sister',
      wantKids:        pick(preferenceOptions),
      openToRelocate:  pick(preferenceOptions),
      openToPets:      pick(preferenceOptions),
      journeyStatus:   'Searching Matches',
    });
  }

  // Bulk insert using createMany for optimal performance
  await prisma.client.createMany({ data: generatedProfiles });
  console.log('✅ 100 Balanced Dummy Profiles injected successfully!');

  // 5. Create Active Managed Clients (isDummy = false) — visible on the main dashboard panel
  console.log('👥 Seeding active dashboard client profiles...');

  await prisma.client.create({
    data: {
      isDummy:         false,
      firstName:       'Rahul',
      lastName:        'Kapoor',
      gender:          'Male',
      dateOfBirth:     new Date(1995, 2, 14),
      heightCm:        178,
      maritalStatus:   'Never Married',
      email:           'rahul.kapoor@example.com',
      phoneNumber:     '9999912345',
      country:         'India',
      city:            'Mumbai',
      ugCollege:       'IIT Bombay',
      degree:          'B.Tech Mechanical',
      currentCompany:  'FinTech Solutions',
      designation:     'Senior Product Manager',
      annualIncomeInr: BigInt(2400000),
      religion:        'Hindu',
      caste:           'Kshatriya',
      motherTongue:    'Hindi',
      dietPreference:  'Pure Veg',
      manglikStatus:   'No',
      familyValues:    'Moderate',
      siblings:        'None',
      wantKids:        'Yes',
      openToRelocate:  'Maybe',
      openToPets:      'Yes',
      journeyStatus:   'Profile Verified',
    },
  });

  await prisma.client.create({
    data: {
      isDummy:         false,
      firstName:       'Priya',
      lastName:        'Sharma',
      gender:          'Female',
      dateOfBirth:     new Date(1997, 6, 21),
      heightCm:        163,
      maritalStatus:   'Never Married',
      email:           'priya.sharma@example.com',
      phoneNumber:     '9999954321',
      country:         'India',
      city:            'Delhi',
      ugCollege:       'Delhi University',
      degree:          'MBA Marketing',
      currentCompany:  'Creative Agency',
      designation:     'Marketing Director',
      annualIncomeInr: BigInt(1800000),
      religion:        'Hindu',
      caste:           'Brahmin',
      motherTongue:    'Hindi',
      dietPreference:  'Eggetarian',
      manglikStatus:   'No',
      familyValues:    'Liberal',
      siblings:        '1 brother',
      wantKids:        'Maybe',
      openToRelocate:  'Yes',
      openToPets:      'No',
      journeyStatus:   'Searching Matches',
    },
  });

  console.log('🎉 Seeding operations completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error executing database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
