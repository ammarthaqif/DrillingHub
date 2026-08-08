import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI Client
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API Health Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Campaign Readiness Audit Endpoint
  app.post('/api/ai/readiness-audit', async (req, res) => {
    try {
      const { items, holeSection } = req.body;
      const ai = getAiClient();

      const prompt = `You are a Senior Principal Drilling & Tubulars Engineer analyzing a drilling campaign inventory.
Review the following inventory items for hole section target: "${holeSection || 'All Hole Sections'}":

${JSON.stringify(items, null, 2)}

Provide a concise, professional engineering assessment with:
1. Overall Campaign Readiness Score (0 to 100%).
2. Critical Inspection Risks & Overdue Warnings.
3. Hole Section Coverage & Missing Tubulars / Tools.
4. Surplus & Backload Yard Optimization Advice (items sitting > 6 months).
5. 3 Actionable Recommendations for the Drilling Campaign Team.

Return the result formatted cleanly in clear Markdown bullet points.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert drilling campaign engineer specializing in OCTG (Oil Country Tubular Goods), NDT inspection standards (DS-1 / API RP 7G), and offshore logistics.',
          temperature: 0.2,
        },
      });

      res.json({ auditReport: response.text });
    } catch (error: any) {
      console.error('AI Readiness Audit error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate campaign audit report' });
    }
  });

  // AI Certificate / MTR Parser Endpoint
  app.post('/api/ai/parse-certificate', async (req, res) => {
    try {
      const { certificateText } = req.body;
      const ai = getAiClient();

      const prompt = `Extract structured OCTG tubular / tool inspection metadata from the following inspection certificate or Mill Test Report (MTR) text:

"""
${certificateText}
"""

Extract and return JSON with keys:
- certNumber: string
- heatNumber: string
- serialNumber: string
- outerDiameter: string (e.g., "13 3/8\"", "9 5/8\"", "5\"")
- weightLbFt: string (e.g., "68 lb/ft")
- grade: string (e.g., "L-80", "P-110", "S-135")
- connectionType: string (e.g., "VAM TOP", "TenarisHydril Wedge 563", "NC50")
- inspectionType: string (e.g., "NDT (Magnetic Particle)", "Full Length Ultrasonic", "Visual Thread Inspection", "Drift Test")
- inspectionDate: string (YYYY-MM-DD format)
- nextInspectionDue: string (YYYY-MM-DD format)
- result: "Pass" | "Pass with Condition" | "Fail"
- inspectorRemarks: string`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const parsedData = JSON.parse(response.text || '{}');
      res.json({ parsedData });
    } catch (error: any) {
      console.error('AI Certificate Parse error:', error);
      res.status(500).json({ error: error.message || 'Failed to parse certificate' });
    }
  });

  // Vite middleware setup for Development vs Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DrillSpec server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
