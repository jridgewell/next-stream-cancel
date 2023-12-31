import { IncomingMessage, ServerResponse } from "http";
import { pipeline } from "stream";
import { Readable } from "../../readable";

export const config = {
  supportsResponseStreaming: true,
  runtime: "nodejs",
};

let readable: ReturnType<typeof Readable> | undefined;

export default function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  // Pages API requests have already consumed the body.
  // This is so we don't confuse the request close with the connection close.

  const write = new URL(req.url!, "http://localhost/").searchParams.get(
    "write"
  );
  // The 2nd request should render the stats. We don't use a query param
  // because edge rendering will create a different bundle for that.
  if (write) {
    const r = (readable = Readable("/api/node-api", +write!));
    res.on("close", () => {
      console.log("/api/node-api: res close");
      r.abort();
    });
    return new Promise((resolve) => {
      pipeline(r.stream, res, () => {
        resolve();
        res.end();
      });
    });
  }

  const old = readable!;
  readable = undefined;
  return old.finished.then((i) => {
    res.end(`${i}`);
  });
}
