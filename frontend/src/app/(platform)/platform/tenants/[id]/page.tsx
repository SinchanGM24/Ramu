import { TenantDetailPage } from "@/features/platform/tenant-detail-page";

export default async function PlatformTenantDetailRoute({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <TenantDetailPage id={id} />;
}
