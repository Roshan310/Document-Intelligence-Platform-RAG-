import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as repo from "../repositories/user.repo";

const JWT_SECRET = process.env.JWT_SECRET!;

const generateToekn = (user: {id: number; role: string}) => 
    jwt.sign({id: user.id, role: user.role}, JWT_SECRET, {
        expiresIn: '24h',
    });


export const register = async (email: string, password: string, role?: string) => {
    const existing = await repo.findUserByemail(email);
    if (existing) {
        return "User already exists";
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role ?? "user";
    
    const user = await repo.createUser(email, hashedPassword, userRole);
    const token = generateToekn(user);
    return {user, token};

}

export const login = async (email: string, password: string) => {
    const user = await repo.findUserByemail(email);
    if (!user) {
        return "Invalid credentials";
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
        return "Invalid credentials";
    }

    const token = generateToekn(user);
    return {token};
}