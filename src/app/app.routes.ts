import { Routes } from "@angular/router";
import { foundationAuthRoutes } from "./foundation/auth/auth.routes";
import { rootRedirectGuard } from "./core/guards/root-redirect.guard";
import { platformRoutes } from "./foundation/platform/platform.routes";
import { companyRoutes } from "./modules/roles/company/company.routes";

export const routes: Routes = [
  ...foundationAuthRoutes,
  ...platformRoutes,
  ...companyRoutes,
  { path: "", canActivate: [rootRedirectGuard], children: [] },
  { path: "**", redirectTo: "" },
];
