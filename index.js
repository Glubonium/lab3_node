"use strict";

import { createServer, request as _request } from "node:http";

const PORT = 8000;

const receiveBody = async (stream) => {
  try {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Error while receiving request body:", error);
    throw error;
  }
};

createServer(async (req, res) => {
  const { headers, url, method } = req;
  const { pathname, hostname } = new URL(`http://${req.url}`);
  const options = { hostname, path: pathname, method, headers };

  const request = _request(options, (response) => {
    console.log(
      `Proxying request to: ${hostname}${pathname}, Method: ${method}, Status: ${response.statusCode}`,
    );
    res.writeHead(response.statusCode, response.headers);
    response.pipe(res);
  });

  request.on("error", (err) => {
    console.error("Proxy request error:", err.message);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  });

  if (method === "POST" || method === "PUT") {
    try {
      const body = await receiveBody(req);
      request.write(body);
    } catch (error) {
      return;
    }
  }

  request.end();
}).listen(PORT);

console.log(`HTTP Proxy listening on port ${PORT}`);
