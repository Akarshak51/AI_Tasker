import Task, { TASK_OPERATIONS } from '../models/Task.js';
import { enqueueTask } from '../queue/taskQueue.js';

export async function createTask(req, res, next) {
  try {
    const { title, inputText, operation } = req.body;

    if (!title || !inputText || !operation) {
      return res.status(400).json({ message: 'title, inputText and operation are required' });
    }
    if (!TASK_OPERATIONS.includes(operation)) {
      return res.status(400).json({ message: `operation must be one of: ${TASK_OPERATIONS.join(', ')}` });
    }

    const task = await Task.create({
      owner: req.user.id,
      title,
      inputText,
      operation,
      status: 'Pending',
      logs: ['Task created and queued'],
    });

    await enqueueTask(task._id);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

export async function listTasks(req, res, next) {
  try {
    const tasks = await Task.find({ owner: req.user.id }).sort({ createdAt: -1 }).limit(200);
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req, res, next) {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ task });
  } catch (err) {
    next(err);
  }
}

export async function rerunTask(req, res, next) {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.status = 'Pending';
    task.result = null;
    task.logs.push('Task re-queued by user');
    task.startedAt = undefined;
    task.finishedAt = undefined;
    await task.save();

    await enqueueTask(task._id);
    res.json({ task });
  } catch (err) {
    next(err);
  }
}
