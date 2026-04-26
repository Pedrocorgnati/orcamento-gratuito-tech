import * as Lucide from "lucide-react";
import { type ComponentType } from "react";

type IconProps = { className?: string };

export function SolutionIcon({
  iconKey,
  className,
}: {
  iconKey: string;
  className?: string;
}) {
  const registry = Lucide as unknown as Record<string, ComponentType<IconProps>>;
  const Icon = registry[iconKey] ?? Lucide.Box;
  return <Icon className={className} aria-hidden="true" />;
}
