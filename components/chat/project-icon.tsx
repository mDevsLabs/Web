import {
  BookOpen,
  Brain,
  Briefcase,
  Code,
  Database,
  FileText,
  FlaskConical,
  Folder,
  Globe,
  Layers,
  Lightbulb,
  type LucideProps,
  Rocket,
  Sparkles,
  Target,
  Terminal,
  Zap,
} from "lucide-react";
import type React from "react";

export type ProjectIconName =
  | "folder"
  | "briefcase"
  | "rocket"
  | "brain"
  | "book"
  | "lightbulb"
  | "target"
  | "flask"
  | "file-text"
  | "zap"
  | "code"
  | "sparkles"
  | "layers"
  | "terminal"
  | "globe"
  | "database";

export const PROJECT_ICON_LIST: {
  id: ProjectIconName;
  label: string;
  icon: React.ComponentType<LucideProps>;
}[] = [
  { icon: Folder, id: "folder", label: "Dossier" },
  { icon: Briefcase, id: "briefcase", label: "Travail" },
  { icon: Rocket, id: "rocket", label: "Projet" },
  { icon: Brain, id: "brain", label: "IA" },
  { icon: BookOpen, id: "book", label: "Savoir" },
  { icon: Lightbulb, id: "lightbulb", label: "Idée" },
  { icon: Target, id: "target", label: "Objectif" },
  { icon: FlaskConical, id: "flask", label: "Recherche" },
  { icon: FileText, id: "file-text", label: "Document" },
  { icon: Zap, id: "zap", label: "Rapide" },
  { icon: Code, id: "code", label: "Code" },
  { icon: Sparkles, id: "sparkles", label: "Créativité" },
  { icon: Layers, id: "layers", label: "Organisation" },
  { icon: Terminal, id: "terminal", label: "Terminal" },
  { icon: Globe, id: "globe", label: "Web" },
  { icon: Database, id: "database", label: "Données" },
];

export const PROJECT_ICON_KEYS = PROJECT_ICON_LIST.map((item) => item.id);

export function ProjectIcon({
  name,
  className = "size-4",
  style,
}: {
  name?: string | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  switch (name) {
    case "briefcase":
    case "💼":
      return <Briefcase className={className} style={style} />;
    case "rocket":
    case "🚀":
      return <Rocket className={className} style={style} />;
    case "brain":
    case "🧠":
      return <Brain className={className} style={style} />;
    case "book":
    case "📚":
      return <BookOpen className={className} style={style} />;
    case "lightbulb":
    case "💡":
      return <Lightbulb className={className} style={style} />;
    case "target":
    case "🎯":
      return <Target className={className} style={style} />;
    case "flask":
    case "🔬":
      return <FlaskConical className={className} style={style} />;
    case "file-text":
    case "📝":
      return <FileText className={className} style={style} />;
    case "zap":
    case "⚡":
      return <Zap className={className} style={style} />;
    case "code":
    case "💻":
      return <Code className={className} style={style} />;
    case "sparkles":
    case "✨":
      return <Sparkles className={className} style={style} />;
    case "layers":
      return <Layers className={className} style={style} />;
    case "terminal":
      return <Terminal className={className} style={style} />;
    case "globe":
    case "🌐":
      return <Globe className={className} style={style} />;
    case "database":
    case "🗄️":
      return <Database className={className} style={style} />;
    default:
      return <Folder className={className} style={style} />;
  }
}
