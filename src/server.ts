import app from "./app";
import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  // Use chalk to style the log message
  console.log(chalk.blue(`Server running on port ${PORT}`));
});
