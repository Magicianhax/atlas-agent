type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

class SSEManager {
  private clients: SSEClient[] = [];

  addClient(controller: ReadableStreamDefaultController): string {
    const id = crypto.randomUUID();
    this.clients.push({ id, controller });
    return id;
  }

  removeClient(id: string) {
    this.clients = this.clients.filter((c) => c.id !== id);
  }

  broadcast(event: string, data: unknown) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoded = new TextEncoder().encode(message);

    this.clients = this.clients.filter((client) => {
      try {
        client.controller.enqueue(encoded);
        return true;
      } catch {
        return false;
      }
    });
  }

  get clientCount() {
    return this.clients.length;
  }
}

// Use globalThis to ensure the singleton is shared across all Next.js route bundles
const globalForSSE = globalThis as unknown as { __sseManager?: SSEManager };
if (!globalForSSE.__sseManager) {
  globalForSSE.__sseManager = new SSEManager();
}
export const sseManager = globalForSSE.__sseManager;
