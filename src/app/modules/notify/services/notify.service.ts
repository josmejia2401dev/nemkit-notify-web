import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService, ApiResponse } from "../../../core/services/api.service";
import {
  ApiKeyRecord,
  Channel,
  NotificationRecord,
  NotificationSummary,
  Pagination,
  Subscriber,
  TimePoint,
  Topic,
} from "../../../core/models/notify.models";

interface ApiList<T> {
  success: boolean;
  message: string;
  data: T[];
  metadata?: { pagination?: Pagination };
}

export type ListQuery = Record<string, string | number | undefined>;

@Injectable({ providedIn: "root" })
export class NotifyService {
  private api = inject(ApiService);

  // ── Temas ────────────────────────────────────────────────────────────
  listTopics(query?: ListQuery): Observable<ApiList<Topic>> {
    return this.api.get<Topic[]>("/company/topics", query) as unknown as Observable<ApiList<Topic>>;
  }

  createTopic(body: { name: string; slug?: string; description?: string }): Observable<ApiResponse<Topic>> {
    return this.api.post<Topic>("/company/topics", body);
  }

  updateTopic(id: number, body: { name?: string; slug?: string; description?: string }): Observable<ApiResponse<Topic>> {
    return this.api.put<Topic>(`/company/topics/${id}`, body);
  }

  deleteTopic(id: number): Observable<ApiResponse<{ id: number }>> {
    return this.api.delete<{ id: number }>(`/company/topics/${id}`);
  }

  // ── Suscriptores ─────────────────────────────────────────────────────
  listSubscribers(query?: ListQuery): Observable<ApiList<Subscriber>> {
    return this.api.get<Subscriber[]>("/company/subscribers", query) as unknown as Observable<ApiList<Subscriber>>;
  }

  createSubscriber(body: Record<string, unknown>): Observable<ApiResponse<Subscriber>> {
    return this.api.post<Subscriber>("/company/subscribers", body);
  }

  updateSubscriber(id: number, body: Record<string, unknown>): Observable<ApiResponse<Subscriber>> {
    return this.api.put<Subscriber>(`/company/subscribers/${id}`, body);
  }

  deleteSubscriber(id: number): Observable<ApiResponse<{ id: number }>> {
    return this.api.delete<{ id: number }>(`/company/subscribers/${id}`);
  }

  subscribeSubscriber(id: number, topicIds: number[]): Observable<ApiResponse<Subscriber>> {
    return this.api.post<Subscriber>(`/company/subscribers/${id}/topics`, { topicIds });
  }

  unsubscribeSubscriber(id: number, topicId: number): Observable<ApiResponse<Subscriber>> {
    return this.api.delete<Subscriber>(`/company/subscribers/${id}/topics/${topicId}`);
  }

  // ── API Keys ─────────────────────────────────────────────────────────
  listApiKeys(query?: ListQuery): Observable<ApiList<ApiKeyRecord>> {
    return this.api.get<ApiKeyRecord[]>("/company/api-keys", query) as unknown as Observable<ApiList<ApiKeyRecord>>;
  }

  createApiKey(name: string): Observable<ApiResponse<ApiKeyRecord>> {
    return this.api.post<ApiKeyRecord>("/company/api-keys", { name });
  }

  revokeApiKey(id: number): Observable<ApiResponse<{ id: number }>> {
    return this.api.delete<{ id: number }>(`/company/api-keys/${id}`);
  }

  // ── Historial y métricas ─────────────────────────────────────────────
  listNotifications(query?: ListQuery): Observable<ApiList<NotificationRecord>> {
    return this.api.get<NotificationRecord[]>("/company/notifications", query) as unknown as Observable<ApiList<NotificationRecord>>;
  }

  getNotification(id: number): Observable<ApiResponse<NotificationRecord>> {
    return this.api.get<NotificationRecord>(`/company/notifications/${id}`);
  }

  summary(): Observable<ApiResponse<NotificationSummary>> {
    return this.api.get<NotificationSummary>("/company/stats/summary");
  }

  timeseries(days = 30): Observable<ApiResponse<TimePoint[]>> {
    return this.api.get<TimePoint[]>("/company/stats/timeseries", { days });
  }


  channels(): Observable<ApiResponse<Record<Channel, boolean>>> {
    return this.api.get<Record<Channel, boolean>>("/company/stats/channels");
  }
}
