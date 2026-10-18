import { ReactNode } from "react";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileNavigation } from "./mobile-navigation";
export function AppShell({ children }: { children: ReactNode }) {
	return (
		<>
			<DesktopSidebar />
			<MobileNavigation />
			<main
				id="konten-utama"
				className="min-h-screen bg-[#f8f5ed] px-4 py-6 pb-24 sm:px-7 lg:ml-72 lg:px-10 lg:py-10 lg:pb-10"
			>
				<div className="mx-auto w-full max-w-7xl">{children}</div>
			</main>
		</>
	);
}
