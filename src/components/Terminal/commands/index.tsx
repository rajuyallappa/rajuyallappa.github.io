import { profile } from "../../../data/profile";
import type { CommandOutput, FileTreeItem } from "../../../types";

interface ParsedCommand {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

function parseCommand(input: string): ParsedCommand {
  const parts = input.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 1; i < parts.length; i++) {
    if (parts[i].startsWith("--")) {
      const flag = parts[i].slice(2);
      if (parts[i + 1] && !parts[i + 1].startsWith("-")) {
        flags[flag] = parts[i + 1];
        i++;
      } else {
        flags[flag] = true;
      }
    } else if (!parts[i].startsWith("-")) {
      args.push(parts[i]);
    }
  }

  return { command, args, flags };
}

const helpCommand = (): CommandOutput => ({
  content: `Available commands:
  
  help              Show this help message
  about             Display bio and introduction
  skills            Show technical skills (--list for detailed view)
  experience        Show work experience
  projects          List projects (--filter <tag> to filter)
  contact           Show contact information
  github            Show GitHub profile link
  education         Show education background
  publications      Show published articles
  awards            Show awards and recognition
  certifications    Show certifications
  clear             Clear terminal
  
  Navigation:
  ↑/↓               Navigate command history
  Tab               Auto-complete commands`,
  type: "info",
});

const aboutCommand = (): CommandOutput => ({
  content: `
👋 Hi, I'm ${profile.personal.name}!

${profile.summary}

📍 Location: ${profile.personal.location}
📧 Email: ${profile.personal.email}
🔗 LinkedIn: ${profile.personal.linkedin}
🐙 GitHub: ${profile.personal.github}

Type 'skills' to see my technical skills
Type 'experience' to view my work history
Type 'projects' to see what I've built`,
  type: "success",
});

const skillsCommand = (
  flags: Record<string, string | boolean>
): CommandOutput => {
  if (flags.list) {
    const skillsList = profile.skillCategories
      .map(
        (cat) => `
${cat.category}:
  ${cat.items.join(", ")}`
      )
      .join("\n");

    return {
      content: `
📊 Technical Skills
${skillsList}`,
      type: "success",
    };
  }

  // Show summary view
  const summary = profile.skillCategories
    .slice(0, 4)
    .map((cat) => `${cat.category}: ${cat.items.slice(0, 3).join(", ")}...`)
    .join("\n");

  return {
    content: `
📊 Skills Overview

${summary}

Use 'skills --list' for detailed view with all categories`,
    type: "success",
  };
};

const experienceCommand = (): CommandOutput => {
  const expList = profile.experience
    .map(
      (exp) => `
┌─ ${exp.company} ${exp.current ? "(Current)" : ""}
│  ${exp.role}
│  ${exp.location} | ${exp.period}
│
│  Highlights:
${exp.highlights
  .slice(0, 3)
  .map((h) => `│  • ${h.slice(0, 80)}${h.length > 80 ? "..." : ""}`)
  .join("\n")}
│
│  Tech: ${exp.technologies.join(", ")}
└────────────────────────────────────────`
    )
    .join("\n");

  return {
    content: `
💼 Work Experience
${expList}`,
    type: "success",
  };
};

const projectsCommand = (
  flags: Record<string, string | boolean>
): CommandOutput => {
  let projects = profile.projects;

  if (flags.filter && typeof flags.filter === "string") {
    const filterTag = flags.filter.toLowerCase();
    projects = projects.filter((p) =>
      p.tags.some((t) => t.toLowerCase().includes(filterTag))
    );
  }

  if (projects.length === 0) {
    return {
      content: `No projects found matching filter: ${flags.filter}`,
      type: "error",
    };
  }

  const projectList = projects
    .map(
      (p) => `
📁 ${p.name}
   ${p.description}
   Tags: ${p.tags.join(", ")}
   ${p.github ? `GitHub: ${p.github}` : ""}
   ${p.website ? `Website: ${p.website}` : ""}`
    )
    .join("\n");

  return {
    content: `
🚀 Projects
${projectList}

Use 'projects --filter <tag>' to filter (e.g., 'projects --filter ai')`,
    type: "success",
  };
};

const contactCommand = (): CommandOutput => ({
  content: `
📬 Contact Information

📧 Email: ${profile.personal.email}
📱 Phone: ${profile.personal.phone}
💼 LinkedIn: ${profile.personal.linkedin}
🐙 GitHub: ${profile.personal.github}
📍 Location: ${profile.personal.location}

🟢 Currently open to new opportunities!`,
  type: "success",
});

const githubCommand = (): CommandOutput => ({
  content: `
🐙 GitHub Profile

Username: rajuyallappa
URL: ${profile.personal.github}

Featured Repositories:
${profile.projects
  .filter((p) => p.github)
  .map((p) => `  • ${p.name}: ${p.github}`)
  .join("\n")}

Opening GitHub profile...`,
  type: "info",
});

const educationCommand = (): CommandOutput => {
  const eduList = profile.education
    .map(
      (edu) => `
🎓 ${edu.degree}
   ${edu.institution}, ${edu.location}
   ${edu.period}`
    )
    .join("\n");

  return {
    content: `
📚 Education
${eduList}`,
    type: "success",
  };
};

const publicationsCommand = (): CommandOutput => {
  const pubList = profile.publications
    .map(
      (pub) => `
📝 ${pub.title}
   Type: ${pub.type}
   URL: ${pub.url}`
    )
    .join("\n");

  return {
    content: `
📰 Publications
${pubList}`,
    type: "success",
  };
};

const awardsCommand = (): CommandOutput => {
  const awardList = profile.awards
    .map(
      (award) => `
🏆 ${award.company}
   ${award.description}`
    )
    .join("\n");

  return {
    content: `
🏅 Awards & Recognition
${awardList}`,
    type: "success",
  };
};

const certificationsCommand = (): CommandOutput => {
  const certList = profile.certifications
    .map((cert) => `  📜 ${cert.name}`)
    .join("\n");

  return {
    content: `
🎖️ Certifications

${certList}`,
    type: "success",
  };
};

export async function executeCommand(
  input: string,
  onOpenTab: (item: FileTreeItem) => void
): Promise<CommandOutput> {
  const { command, flags } = parseCommand(input);

  switch (command) {
    case "help":
      return helpCommand();
    case "about":
      return aboutCommand();
    case "skills":
      return skillsCommand(flags);
    case "experience":
      return experienceCommand();
    case "projects":
      return projectsCommand(flags);
    case "contact":
      return contactCommand();
    case "github":
      window.open(profile.personal.github, "_blank");
      return githubCommand();
    case "education":
      return educationCommand();
    case "publications":
      return publicationsCommand();
    case "awards":
      return awardsCommand();
    case "certifications":
      return certificationsCommand();
    case "open": {
      // Open a section as a tab
      const sectionMap: Record<string, FileTreeItem> = {
        about: {
          id: "about",
          name: "about.md",
          type: "file",
          component: "about",
        },
        skills: {
          id: "skills",
          name: "skills.json",
          type: "file",
          component: "skills",
        },
        experience: {
          id: "experience",
          name: "experience.tsx",
          type: "file",
          component: "experience",
        },
        projects: {
          id: "projects-list",
          name: "index.tsx",
          type: "file",
          component: "projects",
        },
        contact: {
          id: "contact",
          name: "contact.sh",
          type: "file",
          component: "contact",
        },
      };
      const section = (flags.section as string) || "about";
      if (sectionMap[section]) {
        onOpenTab(sectionMap[section]);
        return { content: `Opening ${section}...`, type: "info" };
      }
      return { content: `Unknown section: ${section}`, type: "error" };
    }
    default:
      return {
        content: `Command not found: ${command}. Type 'help' for available commands.`,
        type: "error",
      };
  }
}
