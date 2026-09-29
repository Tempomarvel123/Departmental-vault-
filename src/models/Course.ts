import mongoose, { Schema, Document } from "mongoose";
import { Course } from "../types";

export interface ICourse extends Course, Document {}

const courseSchema = new Schema({
  courseCode: { type: String, required: true },
  courseTitle: { type: String, required: true },
  level: { type: String, required: true },
  semester: { type: String, enum: ["1st", "2nd"], required: true },
  lecturerId: { type: String, required: true },
  lecturerName: { type: String, required: true }
});

export const CourseModel = mongoose.model<ICourse>("Course", courseSchema);
