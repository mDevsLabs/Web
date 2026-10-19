import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  activeProjects,
  allProjects,
  publicArchivedProjects,
} from "@/lib/projects-data";
import { navLinks } from "@/components/navbar/navigation-config";
import { getProjectPresentation } from "@/components/projects/project-presentation";

describe("public project catalogue", () => {
  it("keeps the five active project names in their published order", () => {
    expect(activeProjects.map(({ name }) => name)).toEqual([
      "Web",
      "Vibe",
      "Coder",
      "CLI",
      "Pulse",
    ]);
  });

  it("numbers the active projects sequentially from 01", () => {
    expect(activeProjects.map(({ number }) => number)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
    ]);
  });

  it("publishes only the three selected archives", () => {
    expect(publicArchivedProjects.map(({ id }) => id)).toEqual([
      "msearch",
      "openprovider",
      "snob",
    ]);
  });

  it("preserves historical archives outside the public list", () => {
    expect(allProjects.length).toBeGreaterThan(
      activeProjects.length + publicArchivedProjects.length,
    );
    expect(allProjects.some(({ id }) => id === "mai-legacy")).toBe(true);
  });

  it("removes the team page so /about resolves as not found", () => {
    expect(existsSync(join(process.cwd(), "app/about/page.tsx"))).toBe(false);
  });

  it("does not expose development status on active project data", () => {
    expect(activeProjects.every((project) => project.label === undefined)).toBe(true);
  });

  it("lists the projects in the navbar in the same published order", () => {
    const projectsLink = navLinks.find((link) => link.name === "Projets");
    if (!projectsLink?.subitems) throw new Error("Menu Projets absent de la configuration");

    const [overview, ...rest] = projectsLink.subitems;
    expect(overview.href).toBe("/projects");
    expect(rest.map((item) => item.href)).toEqual(
      activeProjects.map((project) => project.link ?? `/projects/${project.id}`)
    );
  });

  it("gives every active project a distinct icon and tagline", () => {
    const taglines = new Set(activeProjects.map((project) => project.tagline));
    expect(taglines.size).toBe(activeProjects.length);

    for (const project of activeProjects) {
      expect(project.iconKey, `${project.id} sans icône`).toBeTruthy();
      const presentation = getProjectPresentation(project);
      expect(presentation.icon, `${project.id} sans icône résolue`).toBeTruthy();
    }
  });

  it("keeps every project page reachable from the catalogue", () => {
    for (const project of activeProjects) {
      const page = join(process.cwd(), "app/projects", project.id, "page.tsx");
      expect(existsSync(page), `page projet manquante : ${project.id}`).toBe(true);
    }
  });

  it("never reintroduces a release-candidate badge in the public data", () => {
    const serialized = JSON.stringify(allProjects);
    expect(serialized).not.toMatch(/release candidate/i);
  });
});
