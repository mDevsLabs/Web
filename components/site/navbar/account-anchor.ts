export function handleAccountAnchorClick(pathname: string, id: string): void {
  if (pathname !== "/account") return;

  const element = document.getElementById(id);
  if (element) {
    const y = element.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ behavior: "smooth", top: y });
  }
}
