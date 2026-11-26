import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { PlatformService, PlatformCompanyDetail, CompanyStatus } from "../platform.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { NotificationService } from "../../../core/services/notification.service";
import { Channel, NotificationSummary } from "../../../core/models/notify.models";

const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  inactive: "Suspendida",
  archived: "Bloqueada",
  deleted: "Eliminada",
};

@Component({
  selector: "app-superadmin-company-detail",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./superadmin-company-detail.component.html",
})
export class SuperadminCompanyDetailComponent implements OnInit {
  private platform = inject(PlatformService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirm = inject(ConfirmService);
  private toasts = inject(NotificationService);

  company = signal<PlatformCompanyDetail | null>(null);
  consumption = signal<NotificationSummary | null>(null);
  loading = signal(true);
  saving = signal(false);

  readonly channelList: Channel[] = ["email"];

  private get companyId(): number {
    return Number(this.route.snapshot.paramMap.get("id"));
  }

  ngOnInit(): void {
    this.load();
    this.loadConsumption();
  }

  load(): void {
    this.loading.set(true);
    this.platform.getCompany(this.companyId).subscribe({
      next: (response) => {
        this.company.set(response.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadConsumption(): void {
    this.platform.consumption(this.companyId).subscribe({
      next: (response) => this.consumption.set(response.data),
      error: () => this.consumption.set(null),
    });
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  statusClass(status: string): string {
    if (status === "active") return "notify-tag notify-tag--sent";
    if (status === "inactive") return "notify-tag notify-tag--queued";
    return "notify-tag notify-tag--failed";
  }

  channelLabel(channel: Channel): string {
    return { email: "Email" }[channel];
  }

  async changeStatus(status: CompanyStatus): Promise<void> {
    const company = this.company();
    if (!company || company.recordStatus === status) return;

    const confirmed = await this.confirm.ask({
      title: `Cambiar estado a ${this.statusLabel(status).toLowerCase()}`,
      message: `"${company.companyName}" pasará a estado ${this.statusLabel(status).toLowerCase()}. El acceso al portal y al API depende de este estado.`,
      confirmLabel: "Cambiar estado",
      severity: status === "active" ? "info" : "warn",
    });
    if (!confirmed) return;

    this.saving.set(true);
    this.platform.changeStatus(company.id, status).subscribe({
      next: () => {
        this.saving.set(false);
        this.toasts.success("Estado actualizado");
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  async removeCompany(): Promise<void> {
    const company = this.company();
    if (!company) return;

    const confirmed = await this.confirm.ask({
      title: "Eliminar empresa",
      message: `"${company.companyName}" se dará de baja lógica. El historial de envíos se conserva y la cuenta deja de funcionar.`,
      confirmLabel: "Eliminar",
      severity: "danger",
    });
    if (!confirmed) return;

    this.saving.set(true);
    this.platform.removeCompany(company.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.toasts.success("Empresa eliminada");
        this.router.navigateByUrl("/superadmin/companies");
      },
      error: () => this.saving.set(false),
    });
  }
}
