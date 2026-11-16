import { Component } from "@angular/core";
import { AppNavItem, ApplicationShellComponent } from "../../layout/application-shell.component";

/**
 * Shell del super administrador de plataforma. Menú propio de operación de la
 * plataforma (empresas, usuarios, reportes), sin las vistas de empresa.
 */
@Component({
  selector: "app-superadmin-shell",
  standalone: true,
  imports: [ApplicationShellComponent],
  templateUrl: "./superadmin-shell.component.html",
})
export class SuperadminShellComponent {
  navItems: AppNavItem[] = [
    { path: "/superadmin/dashboard", label: "Resumen", icon: "pi pi-chart-pie" },
    { path: "/superadmin/companies", label: "Empresas", icon: "pi pi-building" },
    { path: "/superadmin/users", label: "Usuarios del sistema", icon: "pi pi-users" },
    { path: "/superadmin/feedback-inbox", label: "Reportes de usuarios", icon: "pi pi-inbox" },
  ];
}
