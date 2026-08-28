import express from "express";
import path from "path";
import dotenv from "dotenv";
import { spawn, spawnSync, ChildProcess } from "child_process";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;
const LANGGRAPH_PORT = Number(process.env.LANGGRAPH_PORT || 8001);
let langGraphProcess: ChildProcess | null = null;
let langGraphStartupError: string | null = null;

app.use(express.json({ limit: "10mb" }));

function startLangGraphService() {
  langGraphProcess = spawn(process.env.PYTHON_BIN || "python3", ["agent/langgraph_service.py"], {
    cwd: process.cwd(),
    env: { ...process.env, LANGGRAPH_PORT: String(LANGGRAPH_PORT) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  langGraphProcess.stderr?.on("data", (chunk) => console.error(`[LangGraph] ${chunk.toString().trim()}`));
  langGraphProcess.on("error", (error) => {
    langGraphStartupError = error.message;
    console.error("Could not start LangGraph service:", error);
  });
  langGraphProcess.on("exit", (code, signal) => {
    if (code !== 0) {
      langGraphStartupError = `process exited with ${signal ? `signal ${signal}` : `code ${code}`}`;
    }
  });
}

async function waitForLangGraphService() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (langGraphProcess?.exitCode !== null || langGraphStartupError) break;

    try {
      const response = await fetch(`http://127.0.0.1:${LANGGRAPH_PORT}/health`, {
        signal: AbortSignal.timeout(250),
      });
      if (response.ok) return true;
    } catch {
      // The child process may need a moment to import LangGraph and load the corpus.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return false;
}

async function callLangGraph(pathname: string, payload?: unknown) {
  try {
    const response = await fetch(`http://127.0.0.1:${LANGGRAPH_PORT}${pathname}`, {
      method: payload === undefined ? "GET" : "POST",
      headers: payload === undefined ? undefined : { "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "LangGraph service request failed");
    return data;
  } catch (error: any) {
    const reason = langGraphStartupError || error.message || "unknown connection error";
    throw new Error(`LangGraph service unavailable: ${reason}. Install requirements.txt and restart npm run dev.`);
  }
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasLangGraph: true,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/segment-contract", (req, res) => {
  try {
    const { contractText } = req.body || {};

    if (!contractText || typeof contractText !== "string") {
      return res.status(400).json({ error: "contractText is required" });
    }

    const python = process.platform === "win32" ? "python" : "python3";
    const result = spawnSync(python, ["agent/segmentation.py"], {
      input: JSON.stringify({ contractText }),
      encoding: "utf8",
      cwd: process.cwd(),
    });

    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    if (result.status !== 0) {
      return res.status(500).json({ error: result.stderr || "Clause segmentation failed." });
    }

    const parsed = JSON.parse(result.stdout || "[]");
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to segment contract" });
  }
});

// Proxy analysis requests to the Python LangGraph service.
app.post("/api/analyze-contract", async (req, res) => {
  try {
    const { contractText, contractTitle, category } = req.body;

    if (!contractText || typeof contractText !== "string") {
      return res.status(400).json({ error: "contractText is required" });
    }

    const trace = await callLangGraph("/analyze", {
      contractTitle: contractTitle || "Custom Submitted Contract",
      category: category || "General Risk Assessment",
      contractText,
    });

    res.json({
      success: true,
      data: trace,
    });
  } catch (error: any) {
    console.error("Error analyzing contract:", error);
    res.status(500).json({
      error: error.message || "Failed to analyze contract with LangGraph agent",
    });
  }
});

app.post("/api/generate-explanation", async (req, res) => {
  try {
    const { node, summary, text, evidence } = req.body || {};
    if (!summary || typeof summary !== "string") {
      return res.status(400).json({ error: "summary is required" });
    }

    const explanation = await callLangGraph("/explain", { node, summary, text, evidence });
    return res.json(explanation);
  } catch (error: any) {
    return res.status(503).json({ error: error.message || "Failed to generate explanation" });
  }
});

// Proxy faithfulness audit requests to the Python LangGraph service.
app.post("/api/audit-faithfulness", async (req, res) => {
  try {
    const { summary, technicalPayload, nodeType } = req.body;

    if (!summary || typeof summary !== "string") {
      return res.status(400).json({ error: "summary is required" });
    }

    const data = await callLangGraph("/audit", { summary, technicalPayload: technicalPayload ?? {}, nodeType: nodeType || "audit" });

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error running faithfulness audit:", error);
    res.status(500).json({
      error: error.message || "Failed to perform faithfulness audit",
    });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  startLangGraphService();
  const langGraphReady = await waitForLangGraphService();
  if (!langGraphReady) {
    console.warn("LangGraph service is unavailable; the frontend will use its offline fallback.");
  }
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JustiViz Server running on http://localhost:${PORT}`);
  });
}

process.on("exit", () => langGraphProcess?.kill());

startServer();
