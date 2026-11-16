/**
 * Resolución del "home" (ruta inicial) según el rol principal del usuario.
 * El backend es quien autoriza de verdad; esto es navegación/UX.
 */

export type AppRole = "SUPERADMIN" | "ADMIN" | "USER";

const ROLE_HOME: Record<string, string> = {
  SUPERADMIN: "/superadmin",
  ADMIN: "/company",
  USER: "/company",
};

// Prioridad cuando un usuario tuviera varios roles (el más privilegiado gana).
const ROLE_PRIORITY: string[] = ["SUPERADMIN", "ADMIN", "USER"];

/** Rol efectivo (el de mayor prioridad que tenga el usuario). */
export function primaryRole(roles: string[] | undefined | null): string | null {
  if (!roles || roles.length === 0) return null;
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return null;
}

/** Ruta home del usuario según su rol principal. `/login` si no hay rol conocido. */
export function homeForRoles(roles: string[] | undefined | null): string {
  const role = primaryRole(roles);
  return (role && ROLE_HOME[role]) || "/login";
}
