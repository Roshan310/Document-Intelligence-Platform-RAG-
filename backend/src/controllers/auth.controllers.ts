import * as authService from "../services/auth.service";

export const register = async (req: any, res: any) => {
    const {email, password, role} = req.body;
    const result = await authService.register(email, password, role);
    res.status(201).json(result);
}

export const login = async (req: any , res: any) => {
    const {email, password} = req.body;
    const result = await authService.login(email, password);
    res.json(result);
}