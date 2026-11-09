import "./FilterTabs.css";

export interface FilterTab {
  key: string;
  label: string;
  count: number;
}

export function FilterTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: FilterTab[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="filter-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={
            "filter-tabs__tab" + (tab.key === active ? " filter-tabs__tab--active" : "")
          }
          onClick={() => onChange(tab.key)}
        >
          {tab.label} <span className="filter-tabs__count">({tab.count})</span>
        </button>
      ))}
    </div>
  );
}
