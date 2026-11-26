import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { NotifyService } from "../services/notify.service";
import { LimitsService } from "../../../core/services/limits.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { NotificationService } from "../../../core/services/notification.service";
import { Subscriber, Topic } from "../../../core/models/notify.models";
import { DEFAULT_PAGE_SIZE, PaginationComponent } from "../../../shared/components/pagination/pagination.component";
import { PlanLimitBannerComponent } from "../../../shared/components/plan-limit-banner/plan-limit-banner.component";

interface SubscriberForm {
  id: number | null;
  externalId: string;
  email: string;
  locale: string;
  topicIds: number[];
}

const EMPTY_FORM: SubscriberForm = {
  id: null,
  externalId: "",
  email: "",
  locale: "es",
  topicIds: [],
};

@Component({
  selector: "app-subscriber-list",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    PaginationComponent,
    PlanLimitBannerComponent,
  ],
  templateUrl: "./subscriber-list.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriberListComponent implements OnInit {
  private notify = inject(NotifyService);
  private limitsService = inject(LimitsService);
  private confirm = inject(ConfirmService);
  private toasts = inject(NotificationService);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly rows = signal<Subscriber[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly saving = signal(false);
  readonly dialogVisible = signal(false);
  readonly topics = signal<Topic[]>([]);

  form: SubscriberForm = { ...EMPTY_FORM };
  search = "";

  readonly usage = this.limitsService.usage;
  readonly subscriberLimit = computed(() => this.usage()?.limits["subscribers"] ?? null);
  readonly planName = computed(() => this.usage()?.plan.name ?? "Gratuito");
  readonly canCreate = computed(() => (this.subscriberLimit()?.remaining ?? 1) > 0);
  readonly topicNames = computed(
    () => new Map(this.topics().map((topic) => [topic.id, topic.name])),
  );

  ngOnInit(): void {
    this.load();
    this.loadTopics();
    this.limitsService.load().subscribe({ error: () => undefined });
  }

  load(): void {
    this.loading.set(true);
    this.notify
      .listSubscribers({ page: this.page(), limit: this.pageSize, search: this.search.trim() || undefined })
      .subscribe({
        next: (response) => {
          this.rows.set(response.data ?? []);
          this.total.set(response.metadata?.pagination?.total ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  loadTopics(): void {
    this.notify.listTopics({ page: 1, limit: 100 }).subscribe({
      next: (response) => this.topics.set(response.data ?? []),
      error: () => this.topics.set([]),
    });
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  openCreate(): void {
    this.form = { ...EMPTY_FORM, topicIds: [] };
    this.dialogVisible.set(true);
  }

  openEdit(subscriber: Subscriber): void {
    this.form = {
      id: subscriber.id,
      externalId: subscriber.externalId,
      email: subscriber.email ?? "",
      locale: subscriber.locale ?? "es",
      topicIds: [...(subscriber.topicIds ?? [])],
    };
    this.dialogVisible.set(true);
  }

  toggleTopic(topicId: number, checked: boolean): void {
    const current = new Set(this.form.topicIds);
    if (checked) current.add(topicId);
    else current.delete(topicId);
    this.form = { ...this.form, topicIds: [...current] };
  }

  isSubscribed(topicId: number): boolean {
    return this.form.topicIds.includes(topicId);
  }

  save(): void {
    if (!this.form.externalId.trim()) return;

    this.saving.set(true);
    const payload = {
      externalId: this.form.externalId.trim(),
      email: this.form.email.trim(),
      locale: this.form.locale.trim() || "es",
    };

    if (this.form.id) {
      this.update(payload, this.form.id);
    } else {
      this.create(payload);
    }
  }

  private create(payload: Record<string, unknown>): void {
    this.notify.createSubscriber(payload).subscribe({
      next: (response) => {
        const topicIds = this.form.topicIds;
        if (topicIds.length) {
          this.notify.subscribeSubscriber(response.data.id, topicIds).subscribe({
            next: () => this.afterSave("Suscriptor creado"),
            error: () => this.afterSave("Suscriptor creado (sin temas)"),
          });
          return;
        }
        this.afterSave("Suscriptor creado");
      },
      error: () => this.saving.set(false),
    });
  }

  private update(payload: Record<string, unknown>, id: number): void {
    this.notify.updateSubscriber(id, payload).subscribe({
      next: () => {
        const current = this.form.topicIds;
        const original = this.rows().find((row) => row.id === id)?.topicIds ?? [];
        const added = current.filter((topicId) => !original.includes(topicId));
        const removed = original.filter((topicId) => !current.includes(topicId));

        const requests = [
          ...(added.length ? [this.notify.subscribeSubscriber(id, added)] : []),
          ...removed.map((topicId) => this.notify.unsubscribeSubscriber(id, topicId)),
        ];
        if (!requests.length) {
          this.afterSave("Suscriptor actualizado");
          return;
        }
        let pending = requests.length;
        const done = () => {
          pending -= 1;
          if (pending === 0) this.afterSave("Suscriptor actualizado");
        };
        requests.forEach((request) => request.subscribe({ next: done, error: done }));
      },
      error: () => this.saving.set(false),
    });
  }

  private afterSave(message: string): void {
    this.saving.set(false);
    this.dialogVisible.set(false);
    this.toasts.success(message);
    this.limitsService.load(true).subscribe({ error: () => undefined });
    this.load();
  }

  async remove(subscriber: Subscriber): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: "Eliminar suscriptor",
      message: `Se dará de baja a "${subscriber.externalId}". El historial de envíos se conserva.`,
      confirmLabel: "Eliminar",
      severity: "danger",
    });
    if (!confirmed) return;

    this.notify.deleteSubscriber(subscriber.id).subscribe({
      next: () => {
        this.toasts.success("Suscriptor eliminado");
        this.limitsService.load(true).subscribe({ error: () => undefined });
        this.load();
      },
    });
  }

  topicLabel(topicId: number): string {
    return this.topicNames().get(topicId) ?? `#${topicId}`;
  }
}
