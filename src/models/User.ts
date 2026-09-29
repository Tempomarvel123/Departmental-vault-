import mongoose, { Schema, Document } from "mongoose";
import { User, UserRole } from "../types";

export interface IUser extends User, Document {}

const userSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  level: String,
  department: { type: String, required: true },
  matricOrStaffNumber: { type: String, required: true },
  registeredCourseIds: [String],
  createdAt: { type: String, required: true }
});

export const UserModel = mongoose.model<IUser>("User", userSchema);
