import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { NotifyService } from "../services/notify.service";
import { LimitsService } from "@nemkit/foundation-web";
import { ConfirmService } from "@nemkit/foundation-web";
import { NotificationService } from "@nemkit/foundation-web";
import { ApiKeyRecord } from "../../../core/models/notify.models";
import { DEFAULT_PAGE_SIZE, PaginationComponent } from "@nemkit/foundation-web";
import { PlanLimitBannerComponent } from "@nemkit/foundation-web";

@Component({
  selector: "app-api-key-list",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    PaginationComponent,
    PlanLimitBannerComponent,
  ],
  templateUrl: "./api-key-list.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiKeyListComponent implements OnInit {
  private notify = inject(NotifyService);
  private limitsService = inject(LimitsService);
  private confirm = inject(ConfirmService);
  private toasts = inject(NotificationService);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly rows = signal<ApiKeyRecord[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly saving = signal(false);
  readonly dialogVisible = signal(false);
  readonly revealed = signal<Set<number>>(new Set());

  name = "";
  search = "";

  readonly emailExample = `curl -X POST https://TU-API/api/v1/notify/notifications/email \
  -H "api-key: nk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "to": "cliente@example.com",
    "toName": "Cliente",
    "subject": "Tu código de verificación es 482910",
    "text": "Tu código OTP es: 482910. Expira en 5 minutos.",
    "html": "<h3>Tu código de verificación</h3><p>Usa este código: <strong>482910</strong></p>"
  }'`;



  readonly usage = this.limitsService.usage;
  readonly apiKeyLimit = computed(() => this.usage()?.limits["apiKeys"] ?? null);
  readonly planName = computed(() => this.usage()?.plan.name ?? "Gratuito");
  readonly canCreate = computed(() => (this.apiKeyLimit()?.remaining ?? 1) > 0);

  ngOnInit(): void {
    this.load();
    this.limitsService.load().subscribe({ error: () => undefined });
  }

  load(): void {
    this.loading.set(true);
    this.notify
      .listApiKeys({ page: this.page(), limit: this.pageSize, search: this.search.trim() || undefined })
      .subscribe({
        next: (response) => {
          this.rows.set(response.data ?? []);
          this.total.set(response.metadata?.pagination?.total ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  openCreate(): void {
    this.name = "";
    this.dialogVisible.set(true);
  }

  save(): void {
    if (!this.name.trim()) return;
    this.saving.set(true);
    this.notify.createApiKey(this.name.trim()).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.revealed.update((set) => new Set(set).add(response.data.id));
        this.toasts.success("API key creada", "Cópiala y guárdala: puedes verla de nuevo cuando quieras.");
        this.limitsService.load(true).subscribe({ error: () => undefined });
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  toggleReveal(id: number): void {
    this.revealed.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isRevealed(id: number): boolean {
    return this.revealed().has(id);
  }

  displayKey(record: ApiKeyRecord): string {
    if (this.isRevealed(record.id)) return record.key;
    return `${record.key.slice(0, 12)}••••••${record.key.slice(-4)}`;
  }


  async copyEmailExample(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.emailExample);
      this.toasts.success("Ejemplo copiado", "Reemplaza la URL y la API key antes de usarlo.");
    } catch {
      this.toasts.warn("No se pudo copiar", "Selecciona el ejemplo manualmente.");
    }
  }

  async copy(record: ApiKeyRecord): Promise<void> {
    try {
      await navigator.clipboard.writeText(record.key);
      this.toasts.success("API key copiada");
    } catch {
      this.toasts.warn("No se pudo copiar", "Revela la clave y cópiala manualmente.");
    }
  }

  async revoke(record: ApiKeyRecord): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: "Revocar API key",
      message: `"${record.name}" dejará de autenticar peticiones inmediatamente.`,
      confirmLabel: "Revocar",
      severity: "danger",
    });
    if (!confirmed) return;

    this.notify.revokeApiKey(record.id).subscribe({
      next: () => {
        this.toasts.success("API key revocada");
        this.limitsService.load(true).subscribe({ error: () => undefined });
        this.load();
      },
    });
  }
}
