import type { OAuthProviderKind } from "../modelCatalog";

export type SettingsNavId =
  | "general"
  | "appearance"
  | "editor"
  | "plan"
  | "team"
  | "bots"
  | "agents"
  | "models"
  | "plugins"
  | "rules"
  | "tools"
  | "indexing"
  | "autoUpdate"
  | "browser";

export function IconSlidersNav({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
      <circle cx="9" cy="6" fill="var(--void-bg-0)" r="2" />
      <circle cx="15" cy="12" fill="var(--void-bg-0)" r="2" />
      <circle cx="11" cy="18" fill="var(--void-bg-0)" r="2" />
    </svg>
  );
}

export function IconShieldNav({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M12 3 5 6v5c0 4.5 2.7 8.6 7 10 4.3-1.4 7-5.5 7-10V6l-7-3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9.5 12 2 2 3.5-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChip({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect height="8" rx="2" width="16" x="4" y="8" />
      <path d="M9 12h.01M15 12h.01" strokeLinecap="round" />
    </svg>
  );
}

export function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconCodexLogo({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24">
      <path
        d="M19.503 0H4.496A4.496 4.496 0 000 4.496v15.007A4.496 4.496 0 004.496 24h15.007A4.496 4.496 0 0024 19.503V4.496A4.496 4.496 0 0019.503 0z"
        fill="#fff"
      />
      <path
        d="M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z"
        fill="url(#ref-settings-codex-logo-fill)"
      />
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="ref-settings-codex-logo-fill"
          x1="12"
          x2="12"
          y1="3"
          y2="21"
        >
          <stop stopColor="#B1A7FF" />
          <stop offset=".5" stopColor="#7A9DFF" />
          <stop offset="1" stopColor="#3941FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconClaudeLogo({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24">
      <path
        d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"
        fill="#D97757"
        fillRule="nonzero"
      />
    </svg>
  );
}

export function IconAntigravityLogo({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 64 59">
      <path
        d="M0,0 L8,0 L14,4 L19,14 L27,40 L32,50 L36,54 L35,59 L30,59 L22,52 L11,35 L6,33 L-1,34 L-6,39 L-14,52 L-22,59 L-28,59 L-27,53 L-22,47 L-17,34 L-10,12 L-5,3 Z "
        fill="#3789F9"
        transform="translate(28,0)"
      />
      <path
        d="M0,0 L8,0 L14,4 L19,14 L25,35 L21,34 L16,29 L11,26 L7,20 L7,18 L2,16 L-3,15 L-8,18 L-12,19 L-9,9 L-4,2 Z "
        fill="#6D80D8"
        transform="translate(28,0)"
      />
      <path
        d="M0,0 L8,0 L14,4 L19,14 L20,19 L13,15 L10,12 L3,10 L-1,8 L-7,7 L-4,2 Z "
        fill="#D78240"
        transform="translate(28,0)"
      />
      <path
        d="M0,0 L5,1 L10,4 L12,9 L1,8 L-5,13 L-10,21 L-13,26 L-16,26 L-9,5 L-4,2 Z M6,7 Z "
        fill="#3294CC"
        transform="translate(25,14)"
      />
      <path
        d="M0,0 L5,2 L10,10 L12,18 L5,14 L1,10 L0,4 L-3,3 L0,2 Z "
        fill="#E45C49"
        transform="translate(36,1)"
      />
      <path
        d="M0,0 L9,1 L12,3 L12,5 L7,6 L4,8 L-1,11 L-5,12 L-2,2 Z "
        fill="#90AE64"
        transform="translate(21,7)"
      />
      <path
        d="M0,0 L5,1 L5,4 L-2,7 L-7,11 L-11,10 L-9,5 L-4,2 Z "
        fill="#53A89A"
        transform="translate(25,14)"
      />
      <path
        d="M0,0 L5,0 L16,9 L17,13 L12,12 L8,9 L8,7 L4,5 L0,2 Z "
        fill="#B5677D"
        transform="translate(33,11)"
      />
      <path
        d="M0,0 L6,0 L14,6 L19,11 L23,12 L22,15 L15,12 L10,8 L10,6 L4,5 Z "
        fill="#778998"
        transform="translate(27,12)"
      />
      <path
        d="M0,0 L4,2 L-11,17 L-12,14 L-5,4 Z "
        fill="#3390DF"
        transform="translate(26,21)"
      />
      <path
        d="M0,0 L2,1 L-4,5 L-9,9 L-13,13 L-14,10 L-13,7 L-6,4 L-3,1 Z "
        fill="#3FA1B7"
        transform="translate(27,18)"
      />
      <path
        d="M0,0 L4,0 L9,5 L13,6 L12,9 L5,6 L0,2 Z "
        fill="#8277BB"
        transform="translate(37,18)"
      />
      <path
        d="M0,0 L5,1 L7,6 L-2,5 Z M1,4 Z "
        fill="#4989CF"
        transform="translate(30,17)"
      />
      <path
        d="M0,0 L5,1 L2,3 L-3,6 L-7,7 L-6,3 Z "
        fill="#71B774"
        transform="translate(23,12)"
      />
      <path
        d="M0,0 L7,1 L9,7 L5,6 L0,1 Z "
        fill="#6687E9"
        transform="translate(44,28)"
      />
      <path
        d="M0,0 L7,0 L5,1 L5,3 L8,4 L4,5 L-2,4 Z "
        fill="#C7AF38"
        transform="translate(23,3)"
      />
      <path
        d="M0,0 L8,0 L8,3 L4,4 L-4,3 Z "
        fill="#EF842A"
        transform="translate(28,0)"
      />
      <path
        d="M0,0 L7,4 L7,6 L10,6 L11,10 L4,6 L0,2 Z "
        fill="#CD5D67"
        transform="translate(37,9)"
      />
      <path
        d="M0,0 L5,2 L9,8 L8,11 L2,3 L0,2 Z "
        fill="#F35241"
        transform="translate(36,1)"
      />
      <path
        d="M0,0 L8,2 L9,6 L4,5 L0,2 Z "
        fill="#A667A2"
        transform="translate(41,18)"
      />
      <path
        d="M0,0 L9,1 L8,3 L-2,3 Z "
        fill="#A4B34C"
        transform="translate(21,7)"
      />
      <path
        d="M0,0 L2,0 L7,5 L8,7 L3,6 L0,2 Z "
        fill="#617FCF"
        transform="translate(35,18)"
      />
      <path
        d="M0,0 L5,2 L8,7 L4,5 L0,2 Z "
        fill="#9D7784"
        transform="translate(33,11)"
      />
      <path
        d="M0,0 L6,2 L6,4 L0,3 Z "
        fill="#BC7F59"
        transform="translate(31,7)"
      />
    </svg>
  );
}

export function OAuthProviderMark({ provider }: { provider: OAuthProviderKind }) {
  if (provider === "codex") {
    return (
      <IconCodexLogo className="ref-settings-oauth-login-icon ref-settings-oauth-login-icon--codex" />
    );
  }
  if (provider === "claude") {
    return (
      <IconClaudeLogo className="ref-settings-oauth-login-icon ref-settings-oauth-login-icon--claude" />
    );
  }
  return (
    <IconAntigravityLogo className="ref-settings-oauth-login-icon ref-settings-oauth-login-icon--antigravity" />
  );
}

export function IconBack({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M19 12H5M12 19l-7-7 7-7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPlug({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M12 22v-6M9 8V2M15 8V2M12 16a4 4 0 00-4-4V8h8v4a4 4 0 00-4 4z"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconEditor({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M4 20h4l10-10a2 2 0 0 0-4-4L4 16v4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m13.5 6.5 4 4" strokeLinecap="round" />
    </svg>
  );
}

export function IconBotNav({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect height="11" rx="3" width="14" x="5" y="8" />
      <path
        d="M12 3v3M8 13h.01M16 13h.01M9 19v2M15 19v2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconTeamNav({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <circle cx="7" cy="9" r="2" />
      <circle cx="12" cy="7" r="2" />
      <circle cx="17" cy="9" r="2" />
      <path
        d="M4 18a3 3 0 0 1 6 0M9 18a3 3 0 0 1 6 0M14 18a3 3 0 0 1 6 0"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconListChecks({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="m4 7 2 2 3-3M4 17 6 19 9 16M13 7h7M13 17h7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconDatabase({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v14c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
    </svg>
  );
}

export function IconPuzzle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M10 5a2 2 0 1 1 4 0v1h3a1 1 0 0 1 1 1v3h-1a2 2 0 1 0 0 4h1v3a1 1 0 0 1-1 1h-3v-1a2 2 0 1 0-4 0v1H7a1 1 0 0 1-1-1v-3h1a2 2 0 1 0 0-4H6V7a1 1 0 0 1 1-1h3V5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBrowserNav({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect height="16" rx="2" width="18" x="3" y="4" />
      <path d="M3 8h18" strokeLinecap="round" />
      <circle cx="12" cy="14" r="3.25" />
      <path d="M8.75 14h6.5M12 10.75v6.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconBarChart({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
    </svg>
  );
}

export function IconSunNav({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function navIcon(id: SettingsNavId) {
  switch (id) {
    case "general":
      return <IconSlidersNav />;
    case "appearance":
      return <IconSunNav />;
    case "editor":
      return <IconEditor />;
    case "agents":
      return <IconShieldNav />;
    case "bots":
      return <IconBotNav />;
    case "models":
      return <IconChip />;
    case "rules":
      return <IconListChecks />;
    case "tools":
      return <IconPlug />;
    case "indexing":
      return <IconDatabase />;
    case "autoUpdate":
      return (
        <svg
          aria-hidden
          fill="none"
          height="16"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="16"
        >
          <path
            d="M21 12a9 9 0 1 1-6.2-8.6M21 3v5h-5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "browser":
      return <IconBrowserNav />;
    case "plugins":
      return <IconPuzzle />;
    case "plan":
      return <IconBarChart />;
    case "team":
      return <IconTeamNav />;
    default:
      return <IconSlidersNav />;
  }
}
