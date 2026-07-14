const STATUS_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Running: 'bg-blue-100 text-blue-800 border-blue-200',
  Success: 'bg-green-100 text-green-800 border-green-200',
  Failed: 'bg-red-100 text-red-800 border-red-200',
};

const OPERATION_LABELS = {
  uppercase: 'Uppercase',
  lowercase: 'Lowercase',
  reverse_string: 'Reverse String',
  word_count: 'Word Count',
};

export default function TaskCard({ task, onRerun, onOpen }) {
  return (
    <div
      className="surface rounded-2xl p-5 border border-theme shadow-sm hover:shadow-md transition-shadow animate-fadeInUp cursor-pointer"
      onClick={() => onOpen?.(task)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold leading-snug">{task.title}</h3>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full border whitespace-nowrap ${
            STATUS_STYLES[task.status] || 'bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          {task.status}
        </span>
      </div>

      <p className="text-sm text-muted mb-3">
        Operation: <span className="text-accent font-medium">{OPERATION_LABELS[task.operation] || task.operation}</span>
      </p>

      <p className="text-sm text-muted line-clamp-2 mb-3">{task.inputText}</p>

      {task.result && (
        <div className="bg-accent-soft rounded-xl p-3 text-sm mb-3 break-words">
          <span className="font-semibold">Result: </span>
          {task.result}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted">
        <span>{new Date(task.createdAt).toLocaleString()}</span>
        {task.status === 'Failed' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRerun?.(task);
            }}
            className="text-accent font-semibold hover:underline"
          >
            Re-run
          </button>
        )}
      </div>
    </div>
  );
}
