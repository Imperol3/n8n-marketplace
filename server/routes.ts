import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertWorkflowSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import express from "express";
import { fileStorage } from "./storage/fileStorage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only json files for workflow
    if (file.fieldname === 'workflow-file') {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.json') {
        return cb(null, true);
      }
      cb(new Error('Only JSON files are allowed for workflows'));
    }
    // For images, accept common image formats
    else if (['featuredImage', 'extraImages'].includes(file.fieldname)) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        return cb(null, true);
      }
      cb(new Error('Only jpg, jpeg, png, and gif files are allowed for images'));
    }
    else {
      cb(new Error('Unexpected field'));
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

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
    { name: 'workflow-file', maxCount: 1 },
  ]), async (req, res) => {
    try {
      // Debug logging
      console.log('Upload request received');
      console.log('Files:', req.files);
      console.log('Body:', req.body);

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files || !files['workflow-file']) {
        return res.status(400).json({ message: "No workflow file provided" });
      }

      // Save the workflow file
      const workflowPath = await fileStorage.saveFile(
        files['workflow-file'][0].buffer,
        files['workflow-file'][0].originalname
      );

      const workflow = await storage.createWorkflow({
        title: req.body.title,
        description: req.body.description,
        filePath: workflowPath,
        featuredImage: null,
        extraImages: null,
        metadata: {
          category: '',
          tags: [],
          previewUrl: null
        },
      });

      res.status(201).json(workflow);
    } catch (error) {
      console.error('Workflow creation error:', error);
      res.status(400).json({ 
        message: "Invalid workflow data", 
        error: error instanceof Error ? error.message : String(error) 
      });
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
    const workflow = await storage.getWorkflow(parseInt(req.params.id));
    if (!workflow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    // Delete associated files
    if (workflow.filePath) await fileStorage.deleteFile(workflow.filePath);
    if (workflow.featuredImage) await fileStorage.deleteFile(workflow.featuredImage);
    if (workflow.extraImages) {
      await Promise.all(workflow.extraImages.map(img => fileStorage.deleteFile(img)));
    }

    await storage.deleteWorkflow(parseInt(req.params.id));
    res.status(204).send();
  });

  // Download workflow file (user only)
  app.get("/api/workflows/:id/download", isUser, async (req, res) => {
    const workflow = await storage.getWorkflow(parseInt(req.params.id));
    if (!workflow || !workflow.filePath) {
      return res.status(404).json({ message: "Workflow file not found" });
    }

    try {
      const filePath = fileStorage.getAbsolutePath(workflow.filePath);
      res.download(filePath);
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(404).json({ message: "Workflow file not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}