import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NotifyService } from "../services/notify.service";
import { LimitsService } from "@nemkit/foundation-web";
import { AuthStore } from "@nemkit/foundation-web";
import { PlanLimitBannerComponent } from "@nemkit/foundation-web";

@Component({
  selector: "app-notify-settings",
  standalone: true,
  imports: [CommonModule, RouterLink, PlanLimitBannerComponent],
  templateUrl: "./notify-settings.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotifySettingsComponent implements OnInit {
  private notify = inject(NotifyService);
  private limitsService = inject(LimitsService);
  private store = inject(AuthStore);

  readonly user = this.store.user;
  readonly emailAvailable = signal<boolean | null>(null);

  readonly usage = this.limitsService.usage;
  readonly planName = computed(() => this.usage()?.plan.name ?? "Gratuito");
  readonly notificationLimit = computed(() => this.usage()?.limits["notifications"] ?? null);

  ngOnInit(): void {
    this.limitsService.load().subscribe({ error: () => undefined });
    this.notify.channels().subscribe({
      next: (response) => this.emailAvailable.set(Boolean(response.data?.email)),
      error: () => this.emailAvailable.set(null),
    });
  }
}
