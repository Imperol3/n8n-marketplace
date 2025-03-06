import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import express from "express";
import { fileStorage } from "./storage/fileStorage";

// Simplified multer setup with direct disk storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(process.cwd(), 'uploads'))
    },
    filename: (_req, file, cb) => {
      cb(null, file.originalname)
    }
  })
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

  // Create workflow (admin only) - Simplified to handle just the file upload
  app.post("/api/workflows", isAdmin, upload.single('workflow-file'), async (req, res) => {
    try {
      console.log('Upload request received');
      console.log('File:', req.file);
      console.log('Body:', req.body);

      if (!req.file) {
        return res.status(400).json({ message: "No workflow file provided" });
      }

      const workflow = await storage.createWorkflow({
        title: req.body.title,
        description: req.body.description,
        filePath: `/uploads/${req.file.filename}`,
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