import bcrypt from "bcrypt";

export const hashPassword = async (
    password: string,
    saltRounds: number = 10
): Promise<string> => {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        throw new Error(
            `Password hashing failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};

export const comparePassword = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        throw new Error(
            `Password comparison failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};
