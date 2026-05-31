import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
} from "sequelize";
import { sequelize } from "../config/database";

export class User extends Model<
    InferAttributes<User>,
    InferCreationAttributes<User>
> {
    declare id: CreationOptional<number>;
    declare email: string;
    declare password: string;
    declare role: CreationOptional<"admin" | "user">;
    declare isBlocked: CreationOptional<boolean>;
    declare avatarUrl: CreationOptional<string | null>;
    declare isVerified: CreationOptional<boolean>;
    declare verificationToken: CreationOptional<string | null>;
    declare verificationExpiresAt: CreationOptional<Date | null>;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        }, 
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        }, 
        role: {
            type: DataTypes.ENUM('admin', 'user'),
            defaultValue: "user",
            allowNull: false,
        },
        isBlocked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        avatarUrl: {
            type: DataTypes.STRING(512),
            allowNull: true,
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        verificationToken: {
            type: DataTypes.STRING(128),
            allowNull: true,
            unique: true,
        },
        verificationExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "User", 
    }
)
