"use client";

import { CopyIcon, SparklesIcon } from "@mdevs/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Skill } from "@/lib/db/schema";

export function SkillShareModal({
  open,
  onOpenChange,
  sharingSkill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sharingSkill: Skill | null;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Partager la compétence</DialogTitle>
          <DialogDescription>
            Permet à d'autres utilisateurs d'importer ou de consulter votre
            skill.
          </DialogDescription>
        </DialogHeader>

        {sharingSkill && (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
              <div
                className="size-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: sharingSkill.color || "#6366f1" }}
              >
                <SparklesIcon className="size-4" />
              </div>
              <div>
                <span className="font-semibold text-xs block">
                  {sharingSkill.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {(sharingSkill.tools as string[])?.length || 0} outil(s)
                  inclus
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Payload JSON prêt à être partagé :
              </Label>
              <div className="relative">
                <Textarea
                  className="h-28 font-mono text-[11px] bg-muted/50"
                  readOnly
                  value={JSON.stringify(
                    {
                      color: sharingSkill.color,
                      description: sharingSkill.description,
                      icon: sharingSkill.icon,
                      instructions: sharingSkill.instructions,
                      name: sharingSkill.name,
                      parameters: sharingSkill.parameters,
                      tags: sharingSkill.tags,
                      tools: sharingSkill.tools,
                    },
                    null,
                    2
                  )}
                />
                <Button
                  className="absolute top-2 right-2 h-7 px-2 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(
                        {
                          color: sharingSkill.color,
                          description: sharingSkill.description,
                          icon: sharingSkill.icon,
                          instructions: sharingSkill.instructions,
                          name: sharingSkill.name,
                          parameters: sharingSkill.parameters,
                          tags: sharingSkill.tags,
                          tools: sharingSkill.tools,
                        },
                        null,
                        2
                      )
                    );
                    toast.success("JSON copié dans le presse-papier !");
                  }}
                  size="sm"
                  variant="secondary"
                >
                  <CopyIcon className="size-3 mr-1" />
                  Copier
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button">
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
