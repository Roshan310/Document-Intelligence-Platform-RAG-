import { User } from "../models/user.model";

export const createUser = async (email: string, hashedPassword: string, role: string) => {
    return await User.create({email, hashedPassword, role});
}

export const findUserByemail = async(email: string) => {
    return await User.findOne({where: { email }});
}