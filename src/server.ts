import app from "./app";
import dotenv from "dotenv";
import chalk from "chalk";
import prisma from "./config/database";

dotenv.config();

const PORT = process.env.PORT || 3000; // Updated default to 3000

async function startServer() {
    try {
        await prisma.$connect(); // Connect to MongoDB via Prisma
        console.log(chalk.magenta("MongoDB connected via Prisma"));
        app.listen(PORT, () => {
            console.log(chalk.blue(`Server running on port ${PORT}`));
        });
    } catch (error) {
        console.error(chalk.red("Failed to start server:", error));
        process.exit(1);
    }
}

startServer();
