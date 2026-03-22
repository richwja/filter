interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900 tracking-heading">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5">{children}</div>
    </section>
  );
}
