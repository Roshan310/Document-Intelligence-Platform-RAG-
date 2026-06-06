import { Op } from "sequelize";
import { User } from "../models/user.model";

export const createUser = async (
    email: string,
    password: string,
    role: "admin" | "user",
    avatarUrl: string,
    verificationToken: string,
    verificationExpiresAt: Date
) => {
    return await User.create({
        email,
        password,
        role,
        avatarUrl,
        isVerified: false,
        verificationToken,
        verificationExpiresAt,
    });
};

export const findUserByEmail = async (email: string) => {
    return await User.findOne({ where: { email } });
};

export const findUserById = async (id: number) => {
    return await User.findByPk(id);
};

export const listUsersExceptId = async (userId: number) => {
    return await User.findAll({
        where: {
            id: {
                [Op.ne]: userId,
            },
        },
        order: [["id", "ASC"]],
    });
};

export const setUserBlockedStatus = async (id: number, isBlocked: boolean) => {
    await User.update(
        {
            isBlocked,
        },
        {
            where: { id },
        }
    );

    return await User.findByPk(id);
};

export const updateUserPassword = async (id: number, password: string) => {
    await User.update(
        {
            password,
        },
        {
            where: { id },
        }
    );

    return await User.findByPk(id);
};

export const findUserByVerificationToken = async (verificationToken: string) => {
    return await User.findOne({ where: { verificationToken } });
};

export const markUserAsVerified = async (id: number) => {
    await User.update(
        {
            isVerified: true,
            verificationToken: null,
            verificationExpiresAt: null,
        },
        {
            where: { id },
        }
    );

    return await User.findByPk(id);
};
