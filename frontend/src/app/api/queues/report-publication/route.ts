import { handleCallback } from "@vercel/queue";
import { processNextServerlessPublication } from "../../../../../../backend/src/http/serverless-handler";

export const runtime = "nodejs";
export const maxDuration = 60;

type PublicationMessage = {
	jobId: string;
	itemId: string;
	schoolId: string;
};

const callback = handleCallback<PublicationMessage>(
	async () => {
		await processNextServerlessPublication();
	},
	{
		retry: (_error, metadata) => {
			if (metadata.deliveryCount >= 3) return { acknowledge: true };
			return { afterSeconds: Math.min(2 ** metadata.deliveryCount * 10, 300) };
		},
	},
);

export async function POST(request: Request) {
	return callback({ request });
}
