import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import TaskCard from '../components/TaskCard.jsx';

const OPERATIONS = [
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'reverse_string', label: 'Reverse String' },
  { value: 'word_count', label: 'Word Count' },
];

function useInterval(callback, delay) {
  useEffect(() => {
    if (delay === null) return undefined;
    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [callback, delay]);
}

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', inputText: '', operation: 'uppercase' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const showForm = searchParams.get('new') === '1';

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data.tasks);
    } catch (err) {
      setError('Could not load tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern
    fetchTasks();
  }, [fetchTasks]);

  // Light polling so Pending/Running tasks reflect worker progress without a manual refresh.
  useInterval(fetchTasks, 4000);

  const kpis = useMemo(() => {
    const total = tasks.length;
    const success = tasks.filter((t) => t.status === 'Success').length;
    const running = tasks.filter((t) => t.status === 'Running' || t.status === 'Pending').length;
    const failed = tasks.filter((t) => t.status === 'Failed').length;
    return { total, success, running, failed };
  }, [tasks]);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    if (!form.title || !form.inputText) {
      setError('Title and input text are required.');
      return;
    }
    setCreating(true);
    try {
      await api.post('/tasks', form);
      setForm({ title: '', inputText: '', operation: 'uppercase' });
      setSearchParams({});
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create task.');
    } finally {
      setCreating(false);
    }
  }

  async function handleRerun(task) {
    await api.post(`/tasks/${task._id}/rerun`);
    fetchTasks();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 animate-fadeInUp">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Dashboard</h1>
          <p className="text-sm text-muted">Create tasks and track their processing status in real time.</p>
        </div>
        <button
          onClick={() => setSearchParams(showForm ? {} : { new: '1' })}
          className="bg-accent text-white font-semibold rounded-xl px-4 py-2 hover:opacity-90 transition-opacity"
        >
          {showForm ? 'Close' : '+ New Task'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Tasks" value={kpis.total} color="text-accent" />
        <KpiCard label="In Progress" value={kpis.running} color="text-blue-500" />
        <KpiCard label="Succeeded" value={kpis.success} color="text-green-500" />
        <KpiCard label="Failed" value={kpis.failed} color="text-red-500" />
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="surface border border-theme rounded-2xl p-6 mb-8 animate-popIn">
          <h2 className="font-bold mb-4">Create a new AI task</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium block mb-1">Task Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border border-theme rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="e.g. Normalize customer feedback"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Operation Type</label>
              <select
                value={form.operation}
                onChange={(e) => setForm((f) => ({ ...f, operation: e.target.value }))}
                className="w-full border border-theme rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {OPERATIONS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium block mb-1">Input Text</label>
            <textarea
              value={form.inputText}
              onChange={(e) => setForm((f) => ({ ...f, inputText: e.target.value }))}
              rows={4}
              className="w-full border border-theme rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Paste the text you want processed..."
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-accent text-white font-semibold rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {creating ? 'Queuing task...' : 'Run Task'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center text-muted py-16">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-muted py-16 surface border border-theme rounded-2xl">
          No tasks yet. Click &quot;+ New Task&quot; to create your first one.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onRerun={handleRerun}
              onOpen={(t) => navigate(`/tasks/${t._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div className="surface border border-theme rounded-2xl p-4 text-center">
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}
