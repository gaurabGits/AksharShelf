const AVATAR_COLORS = [
  "from-indigo-500 to-violet-500",
  "from-pink-500 to-rose-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-blue-500",
];

export function getAvatarGradient(name = "") {
  if (!name || typeof name !== "string") return AVATAR_COLORS[0];
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] ?? AVATAR_COLORS[0];
}

export default getAvatarGradient;
