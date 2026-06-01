export interface UploadedDocument {
  id: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  userId: number;
}

export interface ListDocumentsResponse {
  documents: UploadedDocument[];
} 