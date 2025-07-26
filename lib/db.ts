import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db/schema';

// Try multiple connection URLs in order of preference
const connectionString = 
  process.env.POSTGRES_URL_NON_POOLING || 
  process.env.POSTGRES_PRISMA_URL || 
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('Database connection string is not defined. Please check your environment variables.');
}

console.log('🔗 Attempting to connect to database...')

// for query purposes
const queryClient = postgres(connectionString, {
  ssl: 'require',
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  // Add connection retry and better error handling
  connection: {
    application_name: 'quardcubelabs_app'
  },
  onnotice: () => {}, // Ignore notices
  debug: process.env.NODE_ENV === 'development'
});

export const db = drizzle(queryClient, { schema }); 