import { cn } from "@/lib/utils"
import { Loader2Icon } from "@mdevs/icons";

// L'interface est monolingue français (AGENTS.md §7). Les libellés lus par un
// lecteur d'écran ne font pas exception : "Loading" était annoncé en anglais
// dans chaque indicateur de chargement.
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon role="status" aria-label="Chargement" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }