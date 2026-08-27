import express from "express";
import path from "path";
import dotenv from "dotenv";
import { spawnSync } from "child_process";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { runLangGraphPipeline } from "./src/utils/langgraphPipeline";
import { runMockFaithfulnessAudit } from "./src/utils/mockLangGraph";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
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

// Analyze contract using a real LangGraph state machine.
app.post("/api/analyze-contract", async (req, res) => {
  try {
    const { contractText, contractTitle, category } = req.body;

    if (!contractText || typeof contractText !== "string") {
      return res.status(400).json({ error: "contractText is required" });
    }

    const trace = await runLangGraphPipeline({
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

// Real-time Faithfulness Audit endpoint - mocked for the local Ollama audit path only.
app.post("/api/audit-faithfulness", async (req, res) => {
  try {
    const { summary, technicalPayload, nodeType } = req.body;

    if (!summary || typeof summary !== "string") {
      return res.status(400).json({ error: "summary is required" });
    }

    const data = runMockFaithfulnessAudit({
      summary,
      technicalPayload: technicalPayload ?? {},
      nodeType: nodeType || "audit",
    });

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

startServer();
