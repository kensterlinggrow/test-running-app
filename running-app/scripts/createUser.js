import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const newUser = await prisma.user.create({
      data: {
        email: 'test@example.com', // Replace with desired email
        password: 'securepassword', // Replace with desired password
      },
    });
    console.log('User created:', newUser);
  } catch (error) {
    console.error('Error creating user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();