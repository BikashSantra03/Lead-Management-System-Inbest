"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const leads_1 = __importDefault(require("./routes/leads"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const app = (0, express_1.default)();
//middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ credentials: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)("combined"));
app.use(express_1.default.json());
//routes
app.use("/api/auth", auth_1.default);
app.use("/api/leads", leads_1.default);
//default API
app.get("/", (req, res) => {
    res.send("<h1>Server is up and running</h1>");
});
app.use(errorHandler_1.default);
exports.default = app;
