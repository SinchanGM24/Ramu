export type PlatformSession = {
	userId: string;
	email: string;
	role: "SUPER_ADMIN";
	mustChangePassword: boolean;
};

export type PlatformActivity = {
	id: string;
	action: string;
	entityType: string;
	createdAt: string;
};

export type PlatformOverview = {
	activeTenants: number;
	suspendedTenants: number;
	activeAccounts: number;
	suspendedAccounts: number;
	recentActivity: PlatformActivity[];
};

export type Tenant = {
	id: string;
	name: string;
	slug: string;
	tenant_status: "ACTIVE" | "SUSPENDED";
	created_at: string;
	admin_name: string | null;
	admin_email: string | null;
	student_count: number;
	account_count: number;
	subscription_plan: string | null;
	subscription_status: string | null;
};

export type PlatformAccount = {
	id: string;
	name: string;
	email: string;
	school_id: string;
	school_name: string;
	role: "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL";
	is_active: boolean;
	created_at: string;
};

export type TenantDetail = {
	id: string;
	name: string;
	slug: string;
	address: string | null;
	phone: string | null;
	status: "ACTIVE" | "SUSPENDED";
	createdAt: string;
	admin: { id: string; name: string; email: string; isActive: boolean } | null;
	studentCount: number;
	accountCount: number;
	subscription: { plan: string; status: string } | null;
};

export type Paginated<T> = {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
};
