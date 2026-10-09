import { BookOpenIcon, BrainIcon, BriefcaseIcon, CameraIcon, ChartLineIcon, CloudIcon, CodeIcon, CpuIcon, DatabaseIcon, FileTextIcon, GlobeIcon, GraduationCapIcon, HeadsetIcon, HeartIcon, LightbulbIcon, MessageCircleIcon, MusicIcon, PaletteIcon, PenLineIcon, RocketIcon, ScaleIcon, ShieldIcon, SparklesIcon, TargetIcon, WalletIcon, WrenchIcon, ZapIcon } from "@mdevs/icons";
import { BotGlyph, type BotGlyphProps } from "@/components/agents/bot-avatar";

/**
 * Composant d'icône du registre.
 *
 * Le sous-ensemble des props que les appelants utilisent réellement
 * (`className`, `color`, `size`, `style`). Le registre n'a plus besoin d'être
 * typé `React.ComponentType<any>` depuis que l'entrée « bot » est rendue par `BotGlyph` —
 * `public/icons/bot.webp`, la même identité que partout ailleurs. Ce type
 * décrit le CONTRAT commun aux deux familles d'icônes, pas Lucide.
 */
export type AgentIconComponent = (props: BotGlyphProps) => React.ReactNode;

/** Central icon-name → component registry (agents, skills, chats). */
export const AGENT_ICON_REGISTRY: Record<string, AgentIconComponent> = {
  book: BookOpenIcon,
  bot: BotGlyph,
  brain: BrainIcon,
  briefcase: BriefcaseIcon,
  camera: CameraIcon,
  chart: ChartLineIcon,
  cloud: CloudIcon,
  code: CodeIcon,
  cpu: CpuIcon,
  database: DatabaseIcon,
  file: FileTextIcon,
  globe: GlobeIcon,
  graduation: GraduationCapIcon,
  headset: HeadsetIcon,
  heart: HeartIcon,
  lightbulb: LightbulbIcon,
  message: MessageCircleIcon,
  music: MusicIcon,
  palette: PaletteIcon,
  pen: PenLineIcon,
  rocket: RocketIcon,
  scale: ScaleIcon,
  shield: ShieldIcon,
  sparkles: SparklesIcon,
  target: TargetIcon,
  wallet: WalletIcon,
  wrench: WrenchIcon,
  zap: ZapIcon,
};

export function resolveAgentIcon(name?: string | null): AgentIconComponent {
  return (name && AGENT_ICON_REGISTRY[name]) || SparklesIcon;
}
