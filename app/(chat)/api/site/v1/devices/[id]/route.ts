import { type NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const authHeader = req.headers.get("authorization") || "";
    const userAgent = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for") || "";
    const res = await fetch(`https://mai.val.run/v1/devices/${id}`, {
      body: JSON.stringify(body),
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "User-Agent": userAgent,
        "X-Forwarded-For": ip,
      },
      method: "PUT",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Erreur proxy de mise à jour" },
      { status: 500 }
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
    const userAgent = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for") || "";
    const res = await fetch(`https://mai.val.run/v1/devices/${id}`, {
      headers: {
        Authorization: authHeader,
        "User-Agent": userAgent,
        "X-Forwarded-For": ip,
      },
      method: "DELETE",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Erreur proxy de suppression" },
      { status: 500 }
    );
  }
}
