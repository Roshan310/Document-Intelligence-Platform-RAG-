import {Router} from "express";
import * as authController from "../controllers/auth.controllers";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();


router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/verify-email", authController.verifyEmail);
router.get("/verification-success", authController.verificationSuccess);
router.patch("/users/:id/block", requireAuth, requireRole("admin"), authController.blockUser);
router.patch("/users/:id/unblock", requireAuth, requireRole("admin"), authController.unblockUser);


export default router;
