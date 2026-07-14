import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai_task_platform';
  await mongoose.connect(uri);
  console.log('[db] MongoDB connected');
}
