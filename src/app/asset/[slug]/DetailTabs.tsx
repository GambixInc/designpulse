"use client";
import { useState, type ReactNode } from "react";

export default function DetailTabs({
  tabs,
}: {
  tabs: { label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(0);
  return (
    <div className="mt-10">
      <div className="flex gap-1 border-b border-line" role="tablist">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={`px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors ${
              active === i
                ? "border-ink text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-6">{tabs[active].content}</div>
    </div>
  );
}
