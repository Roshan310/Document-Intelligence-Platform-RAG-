import { Document } from "../models/document.model";

export const listUploadedDocuments = async () => {
    return await Document.findAll({
        order: [["createdAt", "DESC"]],
    });
};