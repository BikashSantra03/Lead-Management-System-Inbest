import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import leadRoutes from "./routes/leads";
import errorHandler from "./middleware/errorHandler";

const app = express();

//middlewares
app.use(helmet());

app.use(cors({ credentials: true }));

app.use(cookieParser());

app.use(morgan("combined"));

app.use(express.json());

//routes
app.use("/api/auth", authRoutes);
// app.use("/api/leads", leadRoutes);

//default API
app.get("/", (req, res) => {
    res.send("<h1>Server is up and running</h1>");
});

app.use(errorHandler);

export default app;
