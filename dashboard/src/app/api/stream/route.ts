import { sseManager } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let clientId: string;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      clientId = sseManager.addClient(controller);

      // Send initial connection event
      const msg = `event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`;
      controller.enqueue(encoder.encode(msg));

      // Keep connection alive with heartbeat every 15 seconds
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch {
          if (heartbeat) clearInterval(heartbeat);
        }
      }, 15_000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      sseManager.removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
