// Placeholder entrypoint; the grammY webhook is mounted in phase 2.
export default {
  async fetch(): Promise<Response> {
    return new Response("ok");
  },
} satisfies ExportedHandler;
