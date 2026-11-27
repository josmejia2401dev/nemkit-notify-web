import { Component } from "@angular/core";
import {
  AppNavItem,
  ApplicationShellComponent,
} from "@nemkit/foundation-web";

/** Shell del portal de empresa. Menú propio de notificaciones. */
@Component({
  selector: "app-company-shell",
  standalone: true,
  imports: [ApplicationShellComponent],
  templateUrl: "./company-shell.component.html",
})
export class CompanyShellComponent {
  navItems: AppNavItem[] = [
    { path: "/company/dashboard", label: "Resumen", icon: "pi pi-chart-line" },
    { path: "/company/notifications", label: "Historial", icon: "pi pi-send" },
    { path: "/company/api-keys", label: "API Keys", icon: "pi pi-key" },
    { path: "/company/settings", label: "Configuración", icon: "pi pi-cog" },
  ];
}
