import { Icon, type IconName } from "@/components/ui/Icon";

interface Props {
  active: string;
  onNavigate: (item: string) => void;
}

const items: { label: string; icon: IconName }[] = [
  { label: "Learning Path", icon: "book" },
  { label: "Active Quest", icon: "bolt" },
  { label: "Progress", icon: "chart" },
  { label: "Achievements", icon: "trophy" },
  { label: "Settings", icon: "settings" },
];

export function SideRail({ active, onNavigate }: Props) {
  return (
    <nav className="side-rail" aria-label="Dashboard sections">
      {items.map((item) => (
        <button key={item.label} className={active === item.label ? "is-active" : ""} onClick={() => onNavigate(item.label)} aria-label={item.label} title={item.label}>
          <Icon name={item.icon} />
        </button>
      ))}
    </nav>
  );
}
