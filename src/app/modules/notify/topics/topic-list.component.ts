import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { NotifyService } from "../services/notify.service";
import { LimitsService } from "../../../core/services/limits.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { NotificationService } from "../../../core/services/notification.service";
import { Topic } from "../../../core/models/notify.models";
import { DEFAULT_PAGE_SIZE, PaginationComponent } from "../../../shared/components/pagination/pagination.component";
import { PlanLimitBannerComponent } from "../../../shared/components/plan-limit-banner/plan-limit-banner.component";

interface TopicForm {
  id: number | null;
  name: string;
  slug: string;
  description: string;
}

const EMPTY_FORM: TopicForm = { id: null, name: "", slug: "", description: "" };

@Component({
  selector: "app-topic-list",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    PaginationComponent,
    PlanLimitBannerComponent,
  ],
  templateUrl: "./topic-list.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicListComponent implements OnInit {
  private notify = inject(NotifyService);
  private limitsService = inject(LimitsService);
  private confirm = inject(ConfirmService);
  private toasts = inject(NotificationService);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly rows = signal<Topic[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly saving = signal(false);
  readonly dialogVisible = signal(false);
  form: TopicForm = { ...EMPTY_FORM };

  search = "";

  readonly usage = this.limitsService.usage;
  readonly topicLimit = computed(() => this.usage()?.limits["topics"] ?? null);
  readonly planName = computed(() => this.usage()?.plan.name ?? "Gratuito");
  readonly canCreate = computed(() => (this.topicLimit()?.remaining ?? 1) > 0);

  ngOnInit(): void {
    this.load();
    this.limitsService.load().subscribe({ error: () => undefined });
  }

  load(): void {
    this.loading.set(true);
    this.notify
      .listTopics({ page: this.page(), limit: this.pageSize, search: this.search.trim() || undefined })
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
    this.form = { ...EMPTY_FORM };
    this.dialogVisible.set(true);
  }

  openEdit(topic: Topic): void {
    this.form = {
      id: topic.id,
      name: topic.name,
      slug: topic.slug,
      description: topic.description ?? "",
    };
    this.dialogVisible.set(true);
  }

  save(): void {
    const form = this.form;
    if (!form.name.trim()) return;

    this.saving.set(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || undefined,
    };
    const request = form.id
      ? this.notify.updateTopic(form.id, payload)
      : this.notify.createTopic(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.toasts.success(form.id ? "Tema actualizado" : "Tema creado");
        this.limitsService.load(true).subscribe({ error: () => undefined });
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  async remove(topic: Topic): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: "Eliminar tema",
      message: `"${topic.name}" dejará de estar disponible para nuevas suscripciones. El historial se conserva.`,
      confirmLabel: "Eliminar",
      severity: "danger",
    });
    if (!confirmed) return;

    this.notify.deleteTopic(topic.id).subscribe({
      next: () => {
        this.toasts.success("Tema eliminado");
        this.limitsService.load(true).subscribe({ error: () => undefined });
        this.load();
      },
    });
  }
}
