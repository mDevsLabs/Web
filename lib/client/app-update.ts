// Un déploiement ne doit interrompre ni réponse IA, ni saisie, ni édition.
export function canApplyAppUpdate(document: Document): boolean {
  if (document.visibilityState !== "visible") return false;
  if (
    document.querySelector(
      '[data-app-update-blocked="true"], [role="dialog"], [role="alertdialog"]'
    )
  )
    return false;
  if (document.querySelector('[contenteditable="true"]')) return false;
  const fields = document.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement
  >("input, textarea");
  for (const field of fields) {
    if (field.disabled || field.readOnly || field.type === "hidden") continue;
    if (field.type === "file" && (field as HTMLInputElement).files?.length)
      return false;
    if (field.tagName === "TEXTAREA" && field.value.trim()) return false;
    if (field.tagName === "INPUT") {
      const input = field as HTMLInputElement;
      if (input.type === "checkbox" || input.type === "radio") {
        if (input.checked !== input.defaultChecked) return false;
      } else if (input.type !== "file" && input.value.trim()) {
        // React actualise parfois defaultValue avec value pour les champs contrôlés.
        return false;
      }
    }
  }
  return true;
}
