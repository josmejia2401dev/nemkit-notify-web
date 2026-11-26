import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ChartModule } from "primeng/chart";
import { SelectButtonModule } from "primeng/selectbutton";
import { FormsModule } from "@angular/forms";
import { NotifyService } from "../services/notify.service";
import { LimitsService } from "../../../core/services/limits.service";
import { Channel, NotificationSummary, TimePoint } from "../../../core/models/notify.models";
import { PlanLimitBannerComponent } from "../../../shared/components/plan-limit-banner/plan-limit-banner.component";

type ChannelFilter = Channel | "all";

const DAY_MS = 24 * 60 * 60 * 1000;

@Component({
  selector: "app-notify-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ChartModule,
    SelectButtonModule,
    PlanLimitBannerComponent,
  ],
  templateUrl: "./notify-dashboard.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotifyDashboardComponent implements OnInit {
  private notify = inject(NotifyService);
  private limitsService = inject(LimitsService);

  readonly summary = signal<NotificationSummary | null>(null);
  readonly loading = signal(true);
  readonly days = signal(30);
  readonly channel = signal<ChannelFilter>("all");

  readonly channelList: Channel[] = ["email", "sms", "webpush"];

  readonly dayOptions = [
    { label: "7 días", value: 7 },
    { label: "30 días", value: 30 },
    { label: "90 días", value: 90 },
  ];

  readonly channelOptions = [
    { label: "Todos", value: "all" },
    { label: "Email", value: "email" },
    { label: "SMS", value: "sms" },
    { label: "WebPush", value: "webpush" },
  ];

  private series = signal<TimePoint[]>([]);

  readonly usage = this.limitsService.usage;
  readonly notificationLimit = computed(() => this.usage()?.limits["notifications"] ?? null);
  readonly planName = computed(() => this.usage()?.plan.name ?? "Gratuito");

  readonly chartData = computed(() => {
    const channel = this.channel();
    const days = this.days();
    const buckets = new Map<string, { sent: number; failed: number }>();

    for (let index = days - 1; index >= 0; index -= 1) {
      buckets.set(this.dayKey(new Date(Date.now() - index * DAY_MS)), { sent: 0, failed: 0 });
    }

    for (const point of this.series()) {
      if (channel !== "all" && point.channel !== channel) continue;
      const bucket = buckets.get(point.day);
      if (!bucket) continue;
      if (point.status === "sent") bucket.sent += point.count;
      if (point.status === "failed") bucket.failed += point.count;
    }

    return {
      labels: [...buckets.keys()].map((day) => day.slice(5)),
      datasets: [
        {
          label: "Enviados",
          data: [...buckets.values()].map((value) => value.sent),
          backgroundColor: "#3B7FEA",
          borderRadius: 4,
        },
        {
          label: "Fallidos",
          data: [...buckets.values()].map((value) => value.failed),
          backgroundColor: "#F08A7E",
          borderRadius: 4,
        },
      ],
    };
  });

  readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#A6B3AB", boxWidth: 12, boxHeight: 12 },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: "#7D8A82" },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { color: "#7D8A82", precision: 0 },
        grid: { color: "rgba(30, 42, 36, .55)" },
      },
    },
  };

  ngOnInit(): void {
    this.loadSummary();
    this.loadSeries();
    this.limitsService.load().subscribe({ error: () => undefined });
  }

  loadSummary(): void {
    this.loading.set(true);
    this.notify.summary().subscribe({
      next: (response) => {
        this.summary.set(response.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadSeries(): void {
    this.notify.timeseries(this.days()).subscribe({
      next: (response) => this.series.set(response.data ?? []),
      error: () => this.series.set([]),
    });
  }

  changeDays(days: number): void {
    this.days.set(days);
    this.loadSeries();
  }

  changeChannel(channel: ChannelFilter): void {
    this.channel.set(channel);
  }

  channelLabel(channel: Channel): string {
    return { email: "Email", sms: "SMS", webpush: "WebPush" }[channel];
  }

  private dayKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
