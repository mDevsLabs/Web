import type { ComponentType } from "react";
import type { TeamRoleType } from "./hooks/useTeamSession";
import {
  IconRoleBackend,
  IconRoleCustom,
  IconRoleFrontend,
  IconRoleLead,
  IconRoleQa,
  IconRoleResearcher,
  IconRoleReviewer,
} from "./icons";
import { buildTeamAvatarSeed } from "./teamAvatarSeed";
import {
  pickTeamRoleAvatarUrl,
  TEAM_ROLE_AVATAR_IMAGE_URLS,
} from "./teamRoleAvatarUrls";

type IconProps = { className?: string };

const ROLE_ICON_MAP: Record<string, ComponentType<IconProps>> = {
  backend: IconRoleBackend,
  frontend: IconRoleFrontend,
  qa: IconRoleQa,
  researcher: IconRoleResearcher,
  reviewer: IconRoleReviewer,
  team_lead: IconRoleLead,
};

/**
 * Resolve the icon for a team role.
 * Checks assignmentKey first (for specific custom roles like "researcher"),
 * then falls back to roleType, then to the generic custom icon.
 */
function resolveIcon(
  roleType: TeamRoleType,
  assignmentKey?: string
): ComponentType<IconProps> {
  if (assignmentKey && ROLE_ICON_MAP[assignmentKey]) {
    return ROLE_ICON_MAP[assignmentKey]!;
  }
  return ROLE_ICON_MAP[roleType] ?? IconRoleCustom;
}

/**
 * Resolve the CSS modifier class.
 * Custom roles with a known assignmentKey get their own color class.
 */
function resolveAvatarClass(
  roleType: TeamRoleType,
  assignmentKey?: string
): string {
  if (roleType === "custom" && assignmentKey && ROLE_ICON_MAP[assignmentKey]) {
    return assignmentKey;
  }
  return roleType;
}

type Props = {
  roleType: TeamRoleType;
  assignmentKey?: string;
  /** Optional fallback when no stable assignmentKey is available. */
  avatarSeed?: string;
  small?: boolean;
};

export function TeamRoleAvatar({
  roleType,
  assignmentKey,
  avatarSeed,
  small,
}: Props) {
  const Icon = resolveIcon(roleType, assignmentKey);
  const modifier = resolveAvatarClass(roleType, assignmentKey);
  const seed = buildTeamAvatarSeed({ assignmentKey, avatarSeed, roleType });
  const imageSrc = pickTeamRoleAvatarUrl(seed, TEAM_ROLE_AVATAR_IMAGE_URLS);
  const cls = [
    "ref-team-expert-avatar",
    imageSrc
      ? "ref-team-expert-avatar--photo"
      : `ref-team-expert-avatar--${modifier}`,
    small && "ref-team-avatar-sm",
  ]
    .filter(Boolean)
    .join(" ");
  if (imageSrc) {
    return (
      <span className={cls}>
        <img alt="" draggable={false} src={imageSrc} />
      </span>
    );
  }
  return (
    <span className={cls}>
      <Icon />
    </span>
  );
}
