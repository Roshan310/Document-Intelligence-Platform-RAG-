import { sequelize } from "../config/database";
import { Chunk } from "../models/chunk.model";
import { Document } from "../models/document.model";

export const listUploadedDocuments = async () => {
    return await Document.findAll({
        order: [["createdAt", "DESC"]],
    });
};

export const deleteUploadedDocument = async (documentId: number) => {
    return await sequelize.transaction(async (transaction) => {
        const document = await Document.findByPk(documentId, {
            transaction,
        });

        if (!document) {
            return null;
        }

        await Chunk.destroy({
            where: {
                documentId,
            },
            transaction,
        });

        await document.destroy({
            transaction,
        });

        return document;
    });
};