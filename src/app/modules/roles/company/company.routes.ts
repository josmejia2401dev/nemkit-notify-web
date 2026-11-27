import { Routes } from "@angular/router";
import { CompanyShellComponent } from "./shell/company-shell.component";
import { roleGuard } from "@nemkit/foundation-web";
import { foundationProfileRoutes } from "@nemkit/foundation-web";
import { foundationFeedbackRoutes } from "@nemkit/foundation-web";

/** Portal de la empresa: historial, API Keys, estadísticas y ajustes. */
export const companyRoutes: Routes = [
  {
    path: "company",
    canActivate: [roleGuard(["ADMIN", "USER"])],
    component: CompanyShellComponent,
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        loadComponent: () =>
          import("../../notify/dashboard/notify-dashboard.component").then(
            (m) => m.NotifyDashboardComponent,
          ),
      },
      {
        path: "notifications",
        loadComponent: () =>
          import("../../notify/notifications/notification-history.component").then(
            (m) => m.NotificationHistoryComponent,
          ),
      },
      {
        path: "api-keys",
        loadComponent: () =>
          import("../../notify/api-keys/api-key-list.component").then(
            (m) => m.ApiKeyListComponent,
          ),
      },
      {
        path: "settings",
        loadComponent: () =>
          import("../../notify/settings/notify-settings.component").then(
            (m) => m.NotifySettingsComponent,
          ),
      },
      ...foundationProfileRoutes,
      ...foundationFeedbackRoutes,
    ],
  },
];
