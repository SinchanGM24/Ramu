import { PlatformShell } from "@/features/platform/platform-shell";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
	return <PlatformShell>{children}</PlatformShell>;
}
