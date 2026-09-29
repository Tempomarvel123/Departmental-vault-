import mongoose, { Schema, Document } from "mongoose";
import { DownloadLog } from "../types";

export interface IDownloadLog extends DownloadLog, Document {}

const downloadLogSchema = new Schema({
  materialId: { type: String, required: true },
  materialTitle: { type: String, required: true },
  courseCode: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  timestamp: { type: String, required: true }
});

export const DownloadLogModel = mongoose.model<IDownloadLog>("DownloadLog", downloadLogSchema);
