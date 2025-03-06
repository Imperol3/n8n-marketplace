import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import express from "express";
import { fileStorage } from "./storage/fileStorage";

// Update the multer configuration to handle multiple file types
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => {
      cb(null, path.join(process.cwd(), 'uploads'))
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
  })
});

function isAdmin(req: Request, res: Response, next: Function) {
  console.log('Admin check - user:', req.user); // Add logging
  if (!req.user || req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

function isUser(req: Request, res: Response, next: Function) {
  console.log('User check - user:', req.user); // Add logging
  if (!req.user || !['admin', 'user'].includes(req.user?.role || '')) {
    return res.status(403).json({ message: 'User access required' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Log session configuration
  app.use((req, res, next) => {
    console.log('Session user:', req.user);
    console.log('Is authenticated:', req.isAuthenticated());
    next();
  });

  setupAuth(app);

  // Public route - Get all workflows
  app.get("/api/workflows", async (_req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json(workflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  // Public route - Get single workflow
  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(parseInt(req.params.id));
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  // Serve uploaded files (but not workflow files)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Protected routes below

  // Update the workflow creation route to handle metadata
  app.post("/api/workflows", isAdmin, upload.fields([
    { name: 'workflow-file', maxCount: 1 },
    { name: 'featured-image', maxCount: 1 },
    { name: 'extra-images', maxCount: 5 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files['workflow-file'] || !files['featured-image']) {
        return res.status(400).json({ message: "Required files missing" });
      }

      // Parse metadata from the request body
      const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {
        categories: [],
        tags: [],
        requiredTier: "free"
      };

      const workflow = await storage.createWorkflow({
        title: req.body.title,
        description: req.body.description,
        filePath: `/uploads/${files['workflow-file'][0].filename}`,
        featuredImage: `/uploads/${files['featured-image'][0].filename}`,
        extraImages: files['extra-images']?.map(file => `/uploads/${file.filename}`) || [],
        videoUrl: req.body.videoUrl || null,
        metadata: {
          categories: metadata.categories || [],
          tags: metadata.tags || [],
          requiredTier: metadata.requiredTier || "free",
          previewUrl: metadata.previewUrl
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

  // Download workflow file (authenticated users only)
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

  // Update workflow status (admin only)
  app.patch("/api/workflows/:id/status", isAdmin, async (req, res) => {
    try {
      const { status } = req.body;

      if (!['draft', 'in_progress', 'needs_edit', 'published'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const workflow = await storage.updateWorkflow(parseInt(req.params.id), {
        status
      });

      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      res.json(workflow);
    } catch (error) {
      console.error('Error updating workflow status:', error);
      res.status(400).json({
        message: "Failed to update workflow status",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}