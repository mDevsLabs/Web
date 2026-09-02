import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";

const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 Mo / fichier (limite par message imposée côté client)

// Types exécutables par le navigateur — refusés même s'ils passent le filtre text/*|image/*
const BLOCKED_UPLOAD_TYPES = ["text/html", "text/javascript", "image/svg+xml"];

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "La taille du fichier doit être inférieure à 50 Mo",
    })
    .refine(
      (file) => {
        if (!file.type) {
          return true; // fallback si mime manquant (certains navigateurs)
        }
        if (BLOCKED_UPLOAD_TYPES.includes(file.type)) {
          return false;
        }
        return (
          ALLOWED_UPLOAD_TYPES.includes(file.type) ||
          file.type.startsWith("image/") ||
          file.type.startsWith("text/") ||
          file.type === "application/pdf" ||
          file.type === "application/json"
        );
      },
      {
        message: "File type should be image, PDF or text",
      }
    ),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.issues
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const filename = (formData.get("file") as File).name;
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    // Namespace par utilisateur + suffixe unique : deux utilisateurs ne peuvent
    // pas s'écraser mutuellement les fichiers sur le blob public.
    const blobKey = `uploads/${session.user.id}/${nanoid()}-${safeName}`;
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await put(blobKey, fileBuffer, {
        access: "public",
      });

      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
