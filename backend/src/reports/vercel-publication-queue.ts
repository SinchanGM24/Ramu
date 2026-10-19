export const reportPublicationTopic = "ramu-report-publication";

export type ReportPublicationQueueMessage = {
  jobId: string;
  itemId: string;
  schoolId: string;
};

export async function enqueuePublicationMessages(
  messages: ReportPublicationQueueMessage[],
) {
  if (process.env.VERCEL !== "1" || !messages.length) return;
  const { send } = await import("@vercel/queue");
  await Promise.all(
    messages.map((message) =>
      send(reportPublicationTopic, message, {
        idempotencyKey: message.itemId,
        retentionSeconds: 86_400,
      }),
    ),
  );
}
