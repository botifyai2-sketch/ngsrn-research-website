import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: UserRole = "VIEWER"
) {
  const passwordHash = await bcrypt.hash(password, 12)
  
  return await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
    },
  })
}

export async function createDefaultAdminUser() {
  const adminEmail = "admin@ngsrn.org"
  
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })
  
  if (existingAdmin) {
    console.log("Admin user already exists")
    return existingAdmin
  }
  
  // Create admin user
  const adminUser = await createUser(
    adminEmail,
    "admin123", // Default password - should be changed in production
    "NGSRN Administrator",
    "ADMIN"
  )
  
  console.log("Created admin user:", adminEmail)
  return adminUser
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}