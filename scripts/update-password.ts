import 'dotenv/config';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../server/auth';
import { log } from '../server/vite';

async function updateUserPassword(email: string, newPassword: string) {
  try {
    // First check if the user exists
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    const hashedPassword = await hashPassword(newPassword);
    
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email));

    log(`Password updated successfully for user: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Please provide both email and new password as arguments');
  console.log('Usage: npm run update-password <email> <new-password>');
  process.exit(1);
}

updateUserPassword(email, newPassword);
