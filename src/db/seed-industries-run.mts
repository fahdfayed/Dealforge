import "dotenv/config";
import { seedIndustries } from "./seed-industries";

const result = await seedIndustries();
console.log(`Seeded ${result.industries} industries and ${result.packs} packs.`);
