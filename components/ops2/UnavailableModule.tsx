export function UnavailableModule({
  title,
  reason,
}: {
  title: string;
  reason: string;
}) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-text-primary mb-2">{title}</h1>
      <p className="text-sm text-text-muted max-w-xl">
        This module is not connected to live data. Fake operational rows are not shown.
      </p>
      <p className="text-sm text-text-secondary mt-3">{reason}</p>
    </div>
  );
}
