import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { PlatformService, PlatformCompany } from "../platform.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { NotificationService } from "../../../core/services/notification.service";
import { DEFAULT_PAGE_SIZE, PaginationComponent } from "../../../shared/components/pagination/pagination.component";

const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  inactive: "Suspendida",
  archived: "Bloqueada",
  deleted: "Eliminada",
};

@Component({
  selector: "app-superadmin-companies",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  templateUrl: "./superadmin-companies.component.html",
})
export class SuperadminCompaniesComponent implements OnInit {
  readonly pageSize = DEFAULT_PAGE_SIZE;
  private platform = inject(PlatformService);
  private confirm = inject(ConfirmService);
  private toasts = inject(NotificationService);

  companies = signal<PlatformCompany[]>([]);
  loading = signal(true);
  page = signal(1);
  pageCount = signal(1);
  total = signal(0);
  search = "";

  ngOnInit(): void {
    this.load();
  }

  reload(): void {
    this.page.set(1);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.platform.listCompanies({
      page: this.page(),
      limit: this.pageSize,
      search: this.search.trim() || undefined,
    }).subscribe({
      next: (response) => {
        const pagination = response.metadata?.pagination;
        const totalPages = Math.max(1, pagination?.totalPages ?? 1);
        if (this.page() > totalPages) {
          this.page.set(totalPages);
          this.load();
          return;
        }
        this.companies.set(response.data ?? []);
        this.total.set(pagination?.total ?? 0);
        this.pageCount.set(totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToPage(next: number): void {
    if (next < 1 || next > this.pageCount()) return;
    this.page.set(next);
    this.load();
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  statusClass(status: string): string {
    if (status === "active") return "notify-tag notify-tag--sent";
    if (status === "inactive") return "notify-tag notify-tag--queued";
    return "notify-tag notify-tag--failed";
  }

  async toggleStatus(company: PlatformCompany): Promise<void> {
    const next = company.recordStatus === "active" ? "inactive" : "active";
    const confirmed = await this.confirm.ask({
      title: next === "active" ? "Activar empresa" : "Suspender empresa",
      message: next === "active"
        ? `"${company.companyName}" podrá iniciar sesión y usar el API de nuevo.`
        : `"${company.companyName}" no podrá iniciar sesión ni enviar notificaciones hasta reactivarla.`,
      confirmLabel: next === "active" ? "Activar" : "Suspender",
      severity: next === "active" ? "info" : "warn",
    });
    if (!confirmed) return;

    this.platform.changeStatus(company.id, next).subscribe({
      next: () => {
        this.toasts.success(next === "active" ? "Empresa activada" : "Empresa suspendida");
        this.load();
      },
    });
  }
}
