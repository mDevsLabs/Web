"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import type { UserPluginView } from "@/lib/plugins/user-plugin-input";
import { fetcher } from "@/lib/utils";
import { UserPluginForm } from "../../../user-plugin-form";

export function UserPluginEditor() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { data, isLoading } = useSWR<{ plugin: UserPluginView }>(
    params.id ? `/api/user-plugins/${params.id}` : null,
    fetcher
  );

  useEffect(() => {
    const error = search.get("error");
    if (error) {
      toast.error(error);
    }
    if (search.get("connected") === "1") {
      toast.success("Plugin connecté.");
    }
  }, [search]);

  if (isLoading) {
    return (
      <p className="px-4 py-10 text-sm text-muted-foreground">Chargement…</p>
    );
  }
  if (!data?.plugin) {
    return (
      <p className="px-4 py-10 text-sm text-muted-foreground">
        Plugin introuvable.
      </p>
    );
  }
  return <UserPluginForm initial={data.plugin} />;
}
