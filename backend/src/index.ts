import express from "express";
import dotenv from 'dotenv';
import userRoutes from "./routes/user.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.use("/api/users", userRoutes);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});