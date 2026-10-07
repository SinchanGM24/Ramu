import { ReactNode } from "react";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileTopbar } from "./mobile-topbar";
export function AppShell({children}:{children:ReactNode}) {return <><DesktopSidebar/><MobileTopbar/><main className="min-h-screen bg-[#f8faf9] px-4 py-6 pb-24 sm:px-7 lg:ml-64 lg:px-10 lg:py-10 lg:pb-10">{children}</main><MobileBottomNav/></>}
