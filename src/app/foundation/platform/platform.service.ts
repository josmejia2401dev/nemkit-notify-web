import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService, ApiResponse, PaginatedResponse } from "../../core/services/api.service";
import { NotificationSummary } from "../../core/models/notify.models";

export interface PlatformOverview {
  companies: number;
  users: number;
  employees?: {
    total: number;
    active: number;
    inactive: number;
    archived: number;
    deleted: number;
    byRole: PlatformEmployeeRoleSummary[];
  };
  feedback: { open: number; total: number };
  notifications: NotificationSummary;
}

export interface PlatformEmployeeRoleSummary {
  role: string;
  total: number;
  active: number;
  inactive: number;
  archived: number;
}

export interface PlatformUser {
  id: number;
  fullName: string;
  email: string;
  roles: string[];
  userId: number | null;
  companyName: string;
  businessType?: string;
  employeeId: number | null;
  accountType: "company_owner" | "employee" | "unassigned_employee" | "super_admin";
  accountLabel: string;
  isOwner: boolean;
  isEmployee: boolean;
  isUnassigned: boolean;
  isSuperAdmin: boolean;
  recordStatus: string;
  role?: string;
  status?: "active" | "inactive";
  security?: {
    lastLoginAt?: string | null;
    lockedUntil?: string | null;
    mustChangePassword?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
  employees?: PlatformUser[];
}

export interface PlatformCompany {
  id: number;
  companyName: string;
  businessType?: string;
  ownerName: string;
  ownerEmail: string;
  recordStatus: string;
  createdAt?: string;
  memberCount: number;
}

export interface PlatformCompanyDetail {
  id: number;
  companyName: string;
  businessType?: string;
  recordStatus: string;
  owner: PlatformUser;
  employees: PlatformUser[];
  memberCount: number;
}

export interface PlatformEmployee {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  role: string;
  status: "active" | "inactive";
  recordStatus: string;
  userId: number;
  companyName: string;
  businessType?: string;
  createdAt?: string;
}

export type CompanyStatus = "active" | "inactive" | "archived";

/** Cliente de los endpoints de plataforma (solo super admin). */
@Injectable({ providedIn: "root" })
export class PlatformService {
  private api = inject(ApiService);

  overview(): Observable<ApiResponse<PlatformOverview>> {
    return this.api.get<PlatformOverview>("/sys/overview");
  }

  listUsers(params?: Record<string, unknown>): Observable<PaginatedResponse<PlatformUser>> {
    return this.api.get<PlatformUser[]>("/sys/users", params) as unknown as Observable<PaginatedResponse<PlatformUser>>;
  }

  getUser(id: number): Observable<ApiResponse<PlatformUser>> {
    return this.api.get<PlatformUser>(`/sys/users/${id}`);
  }

  listCompanies(params?: Record<string, unknown>): Observable<PaginatedResponse<PlatformCompany>> {
    return this.api.get<PlatformCompany[]>("/sys/companies", params) as unknown as Observable<PaginatedResponse<PlatformCompany>>;
  }

  getCompany(id: number): Observable<ApiResponse<PlatformCompanyDetail>> {
    return this.api.get<PlatformCompanyDetail>(`/sys/companies/${id}`);
  }

  /** Consumo de mensajes de una empresa por canal y estado. */
  consumption(id: number): Observable<ApiResponse<NotificationSummary>> {
    return this.api.get<NotificationSummary>(`/sys/companies/${id}/consumption`);
  }

  /** Activa, suspende o bloquea una empresa. */
  changeStatus(id: number, status: CompanyStatus): Observable<ApiResponse<PlatformCompany>> {
    return this.api.patch<PlatformCompany>(`/sys/companies/${id}/status`, { status });
  }

  /** Baja lógica de la empresa (conserva su historial). */
  removeCompany(id: number): Observable<ApiResponse<{ id: number }>> {
    return this.api.delete<{ id: number }>(`/sys/companies/${id}`);
  }

  listEmployees(params?: Record<string, unknown>): Observable<PaginatedResponse<PlatformEmployee>> {
    return this.api.get<PlatformEmployee[]>("/sys/employees", params) as unknown as Observable<PaginatedResponse<PlatformEmployee>>;
  }
}
