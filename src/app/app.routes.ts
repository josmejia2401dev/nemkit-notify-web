import { Routes } from "@angular/router";
import {
  createFoundationAuthRoutes,
  FOUNDATION_PRODUCT_PRESETS,
  platformRoutes,
  rootRedirectGuard,
} from "@nemkit/foundation-web";
import { companyRoutes } from "./modules/roles/company/company.routes";

export const routes: Routes = [
  ...createFoundationAuthRoutes(FOUNDATION_PRODUCT_PRESETS.notify),
  ...platformRoutes,
  ...companyRoutes,
  { path: "", canActivate: [rootRedirectGuard], children: [] },
  { path: "**", redirectTo: "" },
];
