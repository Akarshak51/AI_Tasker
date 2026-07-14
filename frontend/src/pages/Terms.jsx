export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 animate-fadeInUp">
      <h1 className="text-3xl font-extrabold mb-6">Terms &amp; Conditions</h1>
      <div className="surface border border-theme rounded-2xl p-6 space-y-4 text-sm text-muted leading-relaxed">
        <p>
          By creating an account and using the AI Task Processing Platform, you agree to submit
          only lawful input text for processing and to keep your account credentials confidential.
        </p>
        <p>
          Tasks you submit are processed asynchronously by background workers. While we take
          reasonable measures to ensure reliability, we do not guarantee zero downtime or
          instantaneous processing for every task.
        </p>
        <p>
          Your data (account details and task history) is stored to provide the service and is not
          sold to third parties. You may request deletion of your account and associated data at
          any time.
        </p>
        <p>
          This platform is provided &quot;as is&quot; for evaluation and demonstration purposes, without
          warranties of any kind, express or implied.
        </p>
      </div>
    </div>
  );
}
