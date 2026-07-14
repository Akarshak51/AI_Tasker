import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios.js';

export default function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval;
    async function load() {
      try {
        const { data } = await api.get(`/tasks/${id}`);
        setTask(data.task);
      } catch (err) {
        setError('Task not found.');
      }
    }
    load();
    interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (error) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted">{error}</div>;
  }
  if (!task) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 animate-fadeInUp">
      <Link to="/dashboard" className="text-sm text-accent hover:underline">
        ← Back to dashboard
      </Link>

      <div className="surface border border-theme rounded-2xl p-6 mt-4">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-xl font-extrabold">{task.title}</h1>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-accent-soft text-accent">
            {task.status}
          </span>
        </div>

        <p className="text-sm text-muted mb-1">Operation: <span className="text-accent">{task.operation}</span></p>
        <p className="text-sm text-muted mb-4">Created: {new Date(task.createdAt).toLocaleString()}</p>

        <div className="mb-4">
          <h3 className="font-semibold text-sm mb-1">Input</h3>
          <div className="bg-accent-soft rounded-xl p-3 text-sm break-words">{task.inputText}</div>
        </div>

        {task.result && (
          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-1">Result</h3>
            <div className="bg-accent-soft rounded-xl p-3 text-sm break-words">{task.result}</div>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-sm mb-1">Execution Logs</h3>
          <ul className="text-sm text-muted space-y-1 list-disc list-inside">
            {task.logs?.map((log, i) => (
              <li key={i}>{log}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
