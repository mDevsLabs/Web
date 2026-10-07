// Les compteurs dépendent de la version et du canal, jamais du numéro global Actions.
export function releaseChannel(event, branch) {
  if (event === "pull_request") {
    return "pr";
  }
  return branch === "main" ? "stable" : "beta";
}
export function validateReleaseVersion(version) {
  if (
    typeof version !== "string" ||
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)
  ) {
    throw new Error("Version package.json invalide pour une release.");
  }
  return version;
}
export function nextReleaseTag(version, channel, tags) {
  validateReleaseVersion(version);
  if (!["stable", "beta", "pr"].includes(channel)) {
    throw new Error("Canal de release invalide.");
  }
  const prefix = `${channel}.${version}`;
  if (channel === "stable") {
    if (tags.includes(prefix)) {
      throw new Error(
        "La release " +
          prefix +
          " existe déjà. Augmentez la version du package.json avant de publier sur main."
      );
    }
    return prefix;
  }
  let largest = 0;
  for (const tag of tags) {
    if (!tag.startsWith(`${prefix}-`)) {
      continue;
    }
    const suffix = tag.slice(prefix.length + 1);
    if (/^[1-9]\d*$/.test(suffix)) {
      largest = Math.max(largest, Number(suffix));
    }
  }
  return `${prefix}-${largest + 1}`;
}
export function releaseTitle(tag) {
  return tag
    .replace(/^stable\./, "Stable ")
    .replace(/^beta\./, "Beta ")
    .replace(/^pr\./, "PR ");
}
