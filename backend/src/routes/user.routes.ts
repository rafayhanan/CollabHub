import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
    res.json({ message: "Sample User Route" });
});

export default router;