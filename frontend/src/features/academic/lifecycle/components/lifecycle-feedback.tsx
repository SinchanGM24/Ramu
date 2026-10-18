export function LifecycleFeedback({ error, notice }: { error: string; notice: string }) {
	return (
		<>
			{error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
			{notice && (
				<p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>
			)}
		</>
	);
}
