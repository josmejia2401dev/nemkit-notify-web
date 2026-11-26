import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { PlatformService, PlatformOverview } from "../platform.service";
import { Channel } from "../../../core/models/notify.models";

@Component({
  selector: "app-superadmin-dashboard",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./superadmin-dashboard.component.html",
  styleUrl: "./superadmin-dashboard.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminDashboardComponent implements OnInit {
  private platform = inject(PlatformService);

  data = signal<PlatformOverview | null>(null);
  loading = signal(true);

  readonly channelList: Channel[] = ["email"];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.platform.overview().subscribe({
      next: (response) => {
        this.data.set(response.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  channelLabel(channel: Channel): string {
    return { email: "Email" }[channel];
  }
}
