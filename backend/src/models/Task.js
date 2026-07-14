import mongoose from 'mongoose';

const OPERATIONS = ['uppercase', 'lowercase', 'reverse_string', 'word_count'];
const STATUSES = ['Pending', 'Running', 'Success', 'Failed'];

const taskSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    inputText: { type: String, required: true },
    operation: { type: String, enum: OPERATIONS, required: true },
    status: { type: String, enum: STATUSES, default: 'Pending', index: true },
    result: { type: String, default: null },
    logs: [{ type: String }],
    startedAt: { type: Date },
    finishedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexing strategy: owner+status is the hottest query (dashboard list per user),
// createdAt supports recent-first pagination and TTL-style archival queries.
taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ createdAt: -1 });

export const TASK_OPERATIONS = OPERATIONS;
export const TASK_STATUSES = STATUSES;
export default mongoose.model('Task', taskSchema);
