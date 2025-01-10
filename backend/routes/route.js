import express from "express";
import { signin,signup,updateInfo,getUser } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();
// router.get("check-auth",authMiddleware);

//signup route
router.post("/signup", signup);
//signin route
router.post("/signin", signin);

//update info route
router.put("updateInfo", authMiddleware, updateInfo);

//get user route
router.get("getUser", getUser);
export default router;
