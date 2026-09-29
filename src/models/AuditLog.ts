import mongoose, { Schema, Document } from "mongoose";
import { AuditLog, UserRole } from "../types";

export interface IAuditLog extends AuditLog, Document {}

const auditLogSchema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userRole: { type: String, enum: Object.values(UserRole), required: true },
  action: { type: String, required: true },
  details: String,
  ipAddress: { type: String, required: true },
  device: { type: String, required: true },
  timestamp: { type: String, required: true }
});

export const AuditLogModel = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
