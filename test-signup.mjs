import crypto from 'crypto';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { teamMembers, sessions } from './src/db/schema.js';

const sqlite = new Database('./data/dealforge.db');
const db = drizzle(sqlite);

async function testSignup() {
  try {
    const email = `test-${Date.now()}@example.com`;
    const name = 'Test User';
    const password = 'password123';
    
    console.log('Testing signup with:', { email, name });
    
    // Hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
    const passwordHash = `${salt}:${hash}`;
    
    const userId = crypto.randomUUID();
    const now = Date.now();
    
    console.log('Inserting user...');
    await db.insert(teamMembers).values({
      id: userId,
      email,
      name,
      role: 'viewer',
      status: 'active',
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });
    
    console.log('User created:', userId);
    
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
    
    console.log('Creating session...');
    await db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId,
      token: sessionToken,
      expiresAt,
      createdAt: Math.floor(Date.now() / 1000),
    });
    
    console.log('✅ Signup successful!');
    console.log('Session token:', sessionToken.slice(0, 16) + '...');
  } catch (error) {
    console.error('❌ Signup failed:', error);
    if (error.message) console.error('Message:', error.message);
  } finally {
    sqlite.close();
  }
}

testSignup();
