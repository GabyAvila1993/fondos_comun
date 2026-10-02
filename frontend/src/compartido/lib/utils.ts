export const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export const formatUserName = (user: { name?: string, email?: string } | null | undefined): string => {
  if (!user) return "Un miembro";
  if (user.name && !user.name.includes("@")) return user.name;
  if (user.email) return user.email.split("@")[0];
  if (user.name) return user.name.split("@")[0];
  return "Un miembro";
};

