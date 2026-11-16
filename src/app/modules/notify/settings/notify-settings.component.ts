import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NotifyService } from "../services/notify.service";
import { LimitsService } from "../../../core/services/limits.service";
import { NotificationService } from "../../../core/services/notification.service";
import { AuthStore } from "../../../core/store/auth.store";
import { Channel } from "../../../core/models/notify.models";
import { PlanLimitBannerComponent } from "../../../shared/components/plan-limit-banner/plan-limit-banner.component";

type ChannelAvailability = Record<Channel, boolean>;

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
  private toasts = inject(NotificationService);
  private store = inject(AuthStore);

  readonly user = this.store.user;
  readonly availability = signal<ChannelAvailability | null>(null);
  readonly publicKey = signal("");
  readonly enabling = signal(false);
  readonly subscription = signal<string>("");

  readonly usage = this.limitsService.usage;
  readonly planName = computed(() => this.usage()?.plan.name ?? "Gratuito");
  readonly notificationLimit = computed(() => this.usage()?.limits["notifications"] ?? null);

  readonly channels: { key: Channel; label: string; icon: string }[] = [
    { key: "email", label: "Email", icon: "pi pi-envelope" },
    { key: "sms", label: "SMS", icon: "pi pi-mobile" },
    { key: "webpush", label: "WebPush", icon: "pi pi-bell" },
  ];

  ngOnInit(): void {
    this.limitsService.load().subscribe({ error: () => undefined });
    this.notify.channels().subscribe({
      next: (response) => this.availability.set(response.data),
      error: () => this.availability.set(null),
    });
    this.notify.webpushPublicKey().subscribe({
      next: (response) => this.publicKey.set(response.data?.publicKey ?? ""),
      error: () => this.publicKey.set(""),
    });
  }

  isAvailable(channel: Channel): boolean {
    return this.availability()?.[channel] ?? false;
  }

  /** Registra el service worker y suscribe este navegador a WebPush. */
  async enableWebPush(): Promise<void> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      this.toasts.warn("WebPush no disponible", "Este navegador no soporta notificaciones push.");
      return;
    }
    if (!this.publicKey()) {
      this.toasts.warn("WebPush sin configurar", "El servidor no tiene claves VAPID.");
      return;
    }

    this.enabling.set(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        this.toasts.warn("Permiso denegado", "Habilita las notificaciones en el navegador.");
        return;
      }

      await navigator.serviceWorker.register("/notify-sw.js");
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.publicKey()),
      }));

      this.subscription.set(JSON.stringify(subscription.toJSON(), null, 2));
      this.toasts.success("Dispositivo listo", "Copia la suscripción y pégala en el campo WebPush del suscriptor.");
    } catch {
      this.toasts.error("No se pudo activar", "Revisa los permisos del navegador e inténtalo de nuevo.");
    } finally {
      this.enabling.set(false);
    }
  }

  /** Muestra una notificación local para verificar el permiso y el service worker. */
  async testNotification(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("Nemkit Notify", {
        body: "Las notificaciones funcionan en este dispositivo.",
        icon: "/favicon.svg",
        data: { url: "/company/settings" },
      });
    } catch {
      this.toasts.warn("No se pudo mostrar", "Activa primero las notificaciones en este navegador.");
    }
  }

  async copySubscription(): Promise<void> {    try {
      await navigator.clipboard.writeText(this.subscription());
      this.toasts.success("Suscripción copiada");
    } catch {
      this.toasts.warn("No se pudo copiar", "Selecciona el texto manualmente.");
    }
  }

  async copyPublicKey(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.publicKey());
      this.toasts.success("Clave pública copiada");
    } catch {
      this.toasts.warn("No se pudo copiar", "Selecciona el texto manualmente.");
    }
  }

  /** Convierte la clave VAPID base64url al formato binario que exige el navegador. */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(base64);
    const output = new Uint8Array(raw.length);
    for (let index = 0; index < raw.length; index += 1) {
      output[index] = raw.charCodeAt(index);
    }
    return output;
  }
}
