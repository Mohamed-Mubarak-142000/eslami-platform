import { can, type Action } from "@/domain";
import { services } from "./services";

export type AdminRoute = "moderation" | "verification";

const adminRouteActions = {
  moderation: "moderate",
  verification: "manage_verification",
} as const satisfies Record<AdminRoute, Action>;

export function canAccessAdminRoute(route: string): boolean {
  const action = adminRouteActions[route as AdminRoute];

  return action !== undefined && can(services.session.account, action);
}
