import mongoose, { Schema, Document } from "mongoose";
import { Material, ApprovalStatus } from "../types";

export interface IMaterial extends Material, Document {}

const materialSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  courseId: { type: String, required: true },
  courseCode: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploaderName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileHash: { type: String, required: true },
  fileSize: { type: String, required: true },
  approvalStatus: { type: String, enum: Object.values(ApprovalStatus), required: true },
  uploadedAt: { type: String, required: true },
  documentType: String,
  semester: String,
  solutionMarkdown: String,
  solutionGeneratedAt: String
});

export const MaterialModel = mongoose.model<IMaterial>("Material", materialSchema);
