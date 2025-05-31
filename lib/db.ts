import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db/schema';

const connectionString = process.env.DATABASE_URL!;

// for query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema }); 