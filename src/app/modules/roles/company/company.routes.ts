import { Routes } from "@angular/router";
import { CompanyShellComponent } from "./shell/company-shell.component";
import { roleGuard } from "../../../core/guards/role.guard";
import { foundationProfileRoutes } from "../../../foundation/profile/profile.routes";
import { foundationFeedbackRoutes } from "../../../foundation/feedback/feedback.routes";

/** Portal de la empresa: autogestión de temas, suscriptores, envíos y API Keys. */
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
        path: "topics",
        loadComponent: () =>
          import("../../notify/topics/topic-list.component").then(
            (m) => m.TopicListComponent,
          ),
      },
      {
        path: "subscribers",
        loadComponent: () =>
          import("../../notify/subscribers/subscriber-list.component").then(
            (m) => m.SubscriberListComponent,
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
