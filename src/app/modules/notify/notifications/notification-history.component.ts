import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { DialogModule } from "primeng/dialog";
import { NotifyService } from "../services/notify.service";
import { Channel, DeliveryStatus, NotificationRecord } from "../../../core/models/notify.models";

const PAGE_SIZE = 10;

@Component({
  selector: "app-notification-history",
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, DialogModule],
  templateUrl: "./notification-history.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationHistoryComponent implements OnInit {
  private notify = inject(NotifyService);

  readonly pageSize = PAGE_SIZE;
  readonly rows = signal<NotificationRecord[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly selected = signal<NotificationRecord | null>(null);
  readonly detailVisible = signal(false);

  channel = "";
  status = "";
  from = "";
  to = "";
  search = "";

  readonly channelOptions = [
    { label: "Todos los canales", value: "" },
    { label: "Email", value: "email" },
    { label: "SMS", value: "sms" },
    { label: "WebPush", value: "webpush" },
  ];

  readonly statusOptions = [
    { label: "Todos los estados", value: "" },
    { label: "Enviado", value: "sent" },
    { label: "Fallido", value: "failed" },
    { label: "En cola", value: "queued" },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.notify
      .listNotifications({
        page: this.page(),
        limit: this.pageSize,
        channel: this.channel || undefined,
        status: this.status || undefined,
        search: this.search.trim() || undefined,
        from: this.from || undefined,
        to: this.to || undefined,
      })
      .subscribe({
        next: (response) => {
          this.rows.set(response.data ?? []);
          this.total.set(response.metadata?.pagination?.total ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize;
    this.page.set(Math.floor((event.first ?? 0) / rows) + 1);
    this.load();
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  resetFilters(): void {
    this.channel = "";
    this.status = "";
    this.from = "";
    this.to = "";
    this.search = "";
    this.applyFilters();
  }

  openDetail(row: NotificationRecord): void {
    this.selected.set(row);
    this.detailVisible.set(true);
  }

  channelLabel(channel: Channel): string {
    return { email: "Email", sms: "SMS", webpush: "WebPush" }[channel];
  }

  statusLabel(status: DeliveryStatus): string {
    return { sent: "Enviado", failed: "Fallido", queued: "En cola" }[status];
  }
}
