import { AppShell } from "@/components/layout/app-shell";
import { PasswordChangeGuard } from "@/components/layout/password-change-guard";
export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<PasswordChangeGuard>
			<AppShell>{children}</AppShell>
		</PasswordChangeGuard>
	);
}
