import {Router} from "express";
import * as authController from "../controllers/auth.controllers";
import { requireAuth, requireRole } from "../middlewares/auth";


const router = Router();


router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/verify-email", authController.verifyEmail);
router.get("/verification-success", authController.verificationSuccess);
router.patch("/password", requireAuth, authController.updatePassword);

//these are for admins only
router.get("/users", requireAuth, requireRole("admin"), authController.listUsers);
router.patch("/users/:id/block", requireAuth, requireRole("admin"), authController.blockUser);
router.patch("/users/:id/unblock", requireAuth, requireRole("admin"), authController.unblockUser);


export default router;
