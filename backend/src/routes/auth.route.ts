import {Router} from "express";
import * as authController from "../controllers/auth.controllers";

const router = Router();


router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/verify-email", authController.verifyEmail);
router.get("/verification-success", authController.verificationSuccess);


export default router;
