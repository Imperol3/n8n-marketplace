import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertWorkflowSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.json', '.yaml', '.yml', '.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

function isAdmin(req: Request, res: Response, next: Function) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

function isUser(req: Request, res: Response, next: Function) {
  if (!['admin', 'user'].includes(req.user?.role || '')) {
    return res.status(403).json({ message: 'User access required' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Get all workflows
  app.get("/api/workflows", async (_req, res) => {
    const workflows = await storage.getWorkflows();
    res.json(workflows);
  });

  // Get single workflow
  app.get("/api/workflows/:id", async (req, res) => {
    const workflow = await storage.getWorkflow(parseInt(req.params.id));
    if (!workflow) {
      return res.status(404).json({ message: "Workflow not found" });
    }
    res.json(workflow);
  });

  // Create workflow (admin only)
  app.post("/api/workflows", isAdmin, upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'featuredImage', maxCount: 1 },
    { name: 'extraImages', maxCount: 5 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const parsed = insertWorkflowSchema.parse({
        ...req.body,
        filePath: files.file ? `/uploads/${files.file[0].originalname}` : undefined,
        featuredImage: files.featuredImage ? `/uploads/${files.featuredImage[0].originalname}` : undefined,
        extraImages: files.extraImages ? files.extraImages.map(f => `/uploads/${f.originalname}`) : [],
        metadata: JSON.parse(req.body.metadata || '{}')
      });

      const workflow = await storage.createWorkflow(parsed);
      res.status(201).json(workflow);
    } catch (error) {
      res.status(400).json({ message: "Invalid workflow data" });
    }
  });

  // Update workflow (admin only)
  app.patch("/api/workflows/:id", isAdmin, async (req, res) => {
    try {
      const workflow = await storage.updateWorkflow(
        parseInt(req.params.id),
        req.body
      );
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(400).json({ message: "Invalid workflow data" });
    }
  });

  // Delete workflow (admin only)
  app.delete("/api/workflows/:id", isAdmin, async (req, res) => {
    const success = await storage.deleteWorkflow(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ message: "Workflow not found" });
    }
    res.status(204).send();
  });

  // Download workflow file (user only)
  app.get("/api/workflows/:id/download", isUser, async (req, res) => {
    const workflow = await storage.getWorkflow(parseInt(req.params.id));
    if (!workflow || !workflow.filePath) {
      return res.status(404).json({ message: "Workflow file not found" });
    }

    // In a real app, we would stream the file from storage
    res.download(workflow.filePath);
  });

  const httpServer = createServer(app);
  return httpServer;
}