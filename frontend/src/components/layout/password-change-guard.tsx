"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authSessionQueryOptions } from "@/features/auth/session";

export function PasswordChangeGuard({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const session = useQuery(authSessionQueryOptions);

	useEffect(() => {
		if (session.data?.mustChangePassword && pathname !== "/app/settings/profile") {
			router.replace("/app/settings/profile?gantiSandi=1");
		}
	}, [pathname, router, session.data?.mustChangePassword]);

	return <>{children}</>;
}
