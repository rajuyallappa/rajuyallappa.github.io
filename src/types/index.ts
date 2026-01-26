// Skill category type for profile
export interface SkillCategory {
  category: string;
  items: string[];
}
// Tab types
export interface Tab {
  id: string;
  title: string;
  icon: string;
  component: string;
  closable: boolean;
}

// File tree types
export interface FileTreeItem {
  id: string;
  name: string;
  type: "file" | "folder";
  icon?: string;
  children?: FileTreeItem[];
  component?: string;
  expanded?: boolean;
}

// Terminal types
export interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "system" | "info";
  content: string | React.ReactNode;
  timestamp: Date;
}

export interface ParsedCommand {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

export interface CommandOutput {
  content: string | React.ReactNode;
  type: "success" | "error" | "info";
}

// Theme types
export type Theme = "dark" | "light";

// Chat types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Layout types
export interface PanelSize {
  sidebar: number;
  terminal: number;
}
