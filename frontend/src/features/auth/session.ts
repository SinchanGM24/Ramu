import { api } from "@/lib/api";

export type AuthSession = {
	userId: string;
	schoolId: string;
	role: "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL";
	email: string;
};

export const authSessionQueryKey = ["session"] as const;

export function getAuthSession() {
	return api<AuthSession>("/auth/session");
}

export const authSessionQueryOptions = {
	queryKey: authSessionQueryKey,
	queryFn: getAuthSession,
	staleTime: 5 * 60_000,
	refetchOnWindowFocus: false,
	retry: false,
};
