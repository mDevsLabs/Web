import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const authHeader = req.headers.get("authorization") || "";
    const res = await fetch(`https://mai.val.run/v1/projects/${id}`, {
      headers: { Authorization: authHeader },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    const staticProjects: Record<string, any> = {
      cli: {
        category: "Developer Tools",
        description:
          "Discussions et séances de codage dans le terminal CLI via mAI.",
        is_public: true,
        label: "Bêta",
        name: "CLI",
        project_id: "cli",
        status: "beta",
      },
      coder: {
        category: "Developer Tools",
        description:
          "IDE IA de nouvelle génération avec agents IA autonomes, orchestration multi-modèles et support natif des outils MCP.",
        is_public: true,
        label: "Bêta",
        name: "Coder",
        project_id: "coder",
        status: "beta",
      },
      mai: {
        category: "AI Suite",
        description: "Ancienne interface web de mAI.",
        is_public: true,
        label: "Archivé",
        name: "mAI Web (Legacy)",
        project_id: "mai",
        status: "archived",
      },
      msearch: {
        category: "Search Engine",
        description:
          "Moteur de recherche sémantique et d'indexation vectorielle.",
        is_public: true,
        label: "Archivé",
        name: "mSearch",
        project_id: "msearch",
        status: "archived",
      },
      office: {
        category: "Productivity",
        description: "Création de documents et présentations avec mAI.",
        is_public: true,
        label: "Archivé",
        name: "Office",
        project_id: "office",
        status: "archived",
      },
      openprovider: {
        category: "API Gateway",
        description:
          "Hub universel d'agrégation et de routage d'API et modèles LLM.",
        is_public: true,
        label: "Archivé",
        name: "OpenProvider",
        project_id: "openprovider",
        status: "archived",
      },
      pulse: {
        category: "Extensions",
        description:
          "Ensemble d'extensions pour diverses applications pour discuter avec mAI directement.",
        is_public: true,
        label: "Bêta",
        name: "Pulse",
        project_id: "pulse",
        status: "beta",
      },
      snob: {
        category: "Games",
        description: "Jeu vidéo du style Block Blast.",
        is_public: true,
        label: "Archivé",
        name: "Snob",
        project_id: "snob",
        status: "archived",
      },
      web: {
        category: "Web Application",
        description:
          "Application d'IA en ligne web directement et simplement pour discuter avec l'IA mAI.",
        is_public: true,
        label: "Bêta",
        name: "Web",
        project_id: "web",
        status: "beta",
      },
    };
    const key = id.toLowerCase();
    const p = staticProjects[key] || {
      description: "Description du projet",
      is_public: true,
      name: "Projet " + id,
      project_id: id,
    };
    return NextResponse.json({ project: p });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const authHeader = req.headers.get("authorization") || "";
    const res = await fetch(`https://mai.val.run/v1/projects/${id}`, {
      body: JSON.stringify(body),
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      method: "PUT",
    });
    const data = await res.json().catch(() => null);
    if (data === null) {
      return NextResponse.json(
        {
          error: {
            code: "upstream_error",
            message: "Réponse invalide du service projets.",
          },
        },
        { status: 502 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    // Ne jamais simuler un succès : la mise à jour n'a pas été appliquée
    return NextResponse.json(
      {
        error: {
          code: "upstream_unavailable",
          message: "Service projets indisponible.",
        },
      },
      { status: 502 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const authHeader = req.headers.get("authorization") || "";
    const res = await fetch(`https://mai.val.run/v1/projects/${id}`, {
      headers: { Authorization: authHeader },
      method: "DELETE",
    });
    const data = await res.json().catch(() => null);
    if (data === null) {
      return NextResponse.json(
        {
          error: {
            code: "upstream_error",
            message: "Réponse invalide du service projets.",
          },
        },
        { status: 502 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    // Ne jamais simuler un succès : la suppression n'a pas été appliquée
    return NextResponse.json(
      {
        error: {
          code: "upstream_unavailable",
          message: "Service projets indisponible.",
        },
      },
      { status: 502 }
    );
  }
}
