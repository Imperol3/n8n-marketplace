import 'dotenv/config';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../server/auth';
import { log } from '../server/vite';

async function updateAdminCredentials(newPassword: string, newEmail?: string) {
  try {
    const hashedPassword = await hashPassword(newPassword);
    
    await db.update(users)
      .set({ 
        password: hashedPassword,
        ...(newEmail ? { email: newEmail } : {})
      })
      .where(eq(users.username, 'admin'));

    log('Admin credentials updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    process.exit(1);
  }
}

// Get password from command line argument
const newPassword = process.argv[2];
const newEmail = process.argv[3];

if (!newPassword) {
  console.error('Please provide a new password as an argument');
  console.log('Usage: npm run update-admin <new-password> [new-email]');
  process.exit(1);
}

updateAdminCredentials(newPassword, newEmail);
