export type Channel = "email";
export type DeliveryStatus = "sent" | "failed";
export type CompanyStatus = "active" | "inactive" | "archived";

export interface ChannelSummary {
  sent: number;
  failed: number;
  total: number;
}

export interface NotificationSummary {
  total: number;
  sent: number;
  failed: number;
  errorRate: number;
  channels: Record<Channel, ChannelSummary>;
}

export interface TimePoint {
  day: string;
  channel: Channel;
  status: DeliveryStatus;
  count: number;
}

export interface DeliveryError {
  code?: string | null;
  message?: string | null;
}

export interface NotificationRecord {
  id: number;
  channel: Channel;
  destination: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  status: DeliveryStatus;
  error?: DeliveryError;
  provider?: string | null;
  providerMessageId: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface ApiKeyRecord {
  id: number;
  name: string;
  key: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
