import { hashPassword } from "./../src/utils/index";
import { PrismaClient } from "@prisma/client";
import logger from "../src/utils/logger";

const prisma = new PrismaClient();

async function main() {
    // Create Admin user (only if no admin exists)
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount === 0) {
        const hashedAdminPassword = await hashPassword("admin123", 12); //give the password here

        // Give Admin's data here to create the Admin
        await prisma.user.create({
            data: {
                email: "admin@example.com",
                name: "Admin User",
                role: "ADMIN",
                password: hashedAdminPassword,
            },
        });

        logger.info("Admin user created successfully", {
            email: "admin@example.com",
            role: "ADMIN",
        });
    } else {
        logger.info("Admin user already exists, skipping creation", {
            role: "ADMIN",
        });
    }
}

main()
    .then(async () => {
        logger.info("Database seeding completed successfully");
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        logger.error("Error seeding database", {
            error: e.message,
            stack: e.stack,
        });
        await prisma.$disconnect();
        process.exit(1);
    });
