import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import express from "express";
import { fileStorage } from "./storage/fileStorage";
import fs from 'fs';
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Update webhook function to use environment variables for external notifications
async function sendWebhookNotification(data: any) {
  try {
    let webhookUrl;

    // Select webhook URL based on notification type
    if (data.type === 'notification') {
      webhookUrl = process.env.EXTERNAL_NOTIFICATION_WEBHOOK;
    } else if (data.type === 'audit') {
      webhookUrl = process.env.EXTERNAL_AUDIT_WEBHOOK;
    }

    if (!webhookUrl) {
      console.error(`External webhook URL not configured for type: ${data.type}`);
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending webhook notification:', error);
    // Don't throw - we don't want to fail the operation if notification fails
  }
}

// Update the upload configuration
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => {
      const uploadDir = path.join(process.cwd(), '.replit', 'uploads');
      // Ensure the uploads directory exists
      if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
  })
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Add these routes after setupAuth(app);

  // Update the user creation API endpoint to handle passwords properly
  app.post("/api/v1/users", async (req, res) => {
    try {
      // Validate required fields
      const { username, email, role = "user", tier = "free", password } = req.body;

      if (!username || !email) {
        return res.status(400).json({ 
          success: false,
          message: "Username and email are required" 
        });
      }

      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already exists"
        });
      }

      // Generate password if not provided
      const temporaryPassword = password || Math.random().toString(36).slice(-8);

      // Create user with hashed password
      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(temporaryPassword),
        role,
        preferences: {
          tier,
          interests: []
        },
        metadata: {
          isFirstLogin: true,
          lastLogin: new Date().toISOString()
        }
      });

      // Send webhook notification
      await sendWebhookNotification({
        type: 'new_user',
        username,
        email,
        temporaryPassword: password ? undefined : temporaryPassword,
        message: `New user account created for ${email}`,
        loginUrl: `${process.env.APP_URL || 'https://your-app.repl.co'}/auth`
      });

      // Return response with temporary password if it was auto-generated
      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            preferences: user.preferences
          },
          ...(password ? {} : { temporaryPassword })
        }
      });
    } catch (error) {
      console.error('Error creating user via API:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create user"
      });
    }
  });

  // Add password reset request endpoint
  app.post("/api/password-reset/request", async (req, res) => {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store reset token
      await storage.saveResetToken(user.id, resetToken, resetExpiry);

      // Send webhook notification for password reset
      await sendWebhookNotification({
        type: 'password_reset_request',
        email,
        resetToken,
        resetUrl: `${process.env.APP_URL || 'https://your-app.repl.co'}/reset-password?token=${resetToken}`,
        message: `Password reset requested for ${email}`
      });

      res.json({
        success: true,
        message: "Password reset instructions have been sent to your email"
      });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      res.status(500).json({
        success: false,
        message: "Failed to process password reset request"
      });
    }
  });

  // Add endpoint to reset password with token
  app.post("/api/password-reset/reset", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      // Verify token and get user
      const resetInfo = await storage.getResetToken(token);
      if (!resetInfo || resetInfo.expiry < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token"
        });
      }

      // Update password and clear first login flag
      await storage.updateUser(resetInfo.userId, {
        password: await hashPassword(newPassword),
        metadata: {
          isFirstLogin: false,
          lastLogin: new Date().toISOString()
        }
      });

      // Clear used token
      await storage.clearResetToken(token);

      res.json({
        success: true,
        message: "Password has been reset successfully"
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({
        success: false,
        message: "Failed to reset password"
      });
    }
  });

  // Serve uploaded files (but not workflow files)
  app.use('/uploads', express.static(path.join(process.cwd(), '.replit', 'uploads')));

  // Protected routes below

  // Update the workflow creation route to handle metadata
  app.post("/api/workflows", isAdmin, upload.fields([
    { name: 'workflow-file', maxCount: 1 },
    { name: 'featuredImage', maxCount: 1 },
    { name: 'extra-images', maxCount: 5 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files['workflow-file'] || !files['featuredImage']) {
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
        featuredImage: `/uploads/${files['featuredImage'][0].filename}`,
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

  // Update workflow (admin only)
  app.patch("/api/workflows/:id", isAdmin, upload.fields([
    { name: 'workflow-file', maxCount: 1 },
    { name: 'featuredImage', maxCount: 1 },
    { name: 'extra-images', maxCount: 5 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const workflow = await storage.getWorkflow(parseInt(req.params.id));

      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      // Parse metadata from the request body
      const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : workflow.metadata;

      const updateData: any = {
        title: req.body.title,
        description: req.body.description,
        videoUrl: req.body.videoUrl || workflow.videoUrl,
        metadata: {
          ...workflow.metadata,
          ...metadata
        }
      };

      // Only update files if new ones are uploaded
      if (files['workflow-file']) {
        updateData.filePath = `/uploads/${files['workflow-file'][0].filename}`;
      }
      if (files['featuredImage']) {
        updateData.featuredImage = `/uploads/${files['featuredImage'][0].filename}`;
      }
      if (files['extra-images']) {
        updateData.extraImages = files['extra-images'].map(file => `/uploads/${file.filename}`);
      }

      const updatedWorkflow = await storage.updateWorkflow(parseInt(req.params.id), updateData);

      if (!updatedWorkflow) {
        return res.status(404).json({ message: "Failed to update workflow" });
      }

      res.json(updatedWorkflow);
    } catch (error) {
      console.error('Error updating workflow:', error);
      res.status(400).json({
        message: "Failed to update workflow",
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

    // Check user's tier against workflow's required tier
    const tiers = ["free", "tier1", "tier2", "premium"];
    const userTier = req.user?.preferences?.tier || "free";
    const requiredTier = workflow.metadata?.requiredTier || "free";

    const userTierIndex = tiers.indexOf(userTier);
    const requiredTierIndex = tiers.indexOf(requiredTier);

    if (userTierIndex < requiredTierIndex) {
      return res.status(403).json({ 
        message: "Upgrade required",
        currentTier: userTier,
        requiredTier: requiredTier
      });
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

  // Get all users (admin only)
  app.get("/api/users", isAdmin, async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user (admin only)
  app.patch("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role, preferences } = req.body;

      const user = await storage.updateUser(userId, {
        role,
        preferences
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(400).json({
        message: "Failed to update user",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete user (admin only)
  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.deleteUser(userId);

      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(400).json({
        message: "Failed to delete user",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete workflow (admin only)
  app.delete("/api/workflows/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteWorkflow(parseInt(req.params.id));

      if (!success) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      res.status(400).json({
        message: "Failed to delete workflow",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get all tiers
  app.get("/api/tiers", isAdmin, async (_req, res) => {
    try {
      const tiers = await storage.getTiers();
      res.json(tiers);
    } catch (error) {
      console.error('Error fetching tiers:', error);
      res.status(500).json({ message: "Failed to fetch tiers" });
    }
  });

  // Create new tier
  app.post("/api/tiers", isAdmin, async (req, res) => {
    try {
      const tier = await storage.createTier(req.body);
      res.status(201).json(tier);
    } catch (error) {
      console.error('Error creating tier:', error);
      res.status(400).json({
        message: "Failed to create tier",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update tier
  app.patch("/api/tiers/:id", isAdmin, async (req, res) => {
    try {
      const tier = await storage.updateTier(parseInt(req.params.id), req.body);
      if (!tier) {
        return res.status(404).json({ message: "Tier not found" });
      }
      res.json(tier);
    } catch (error) {
      console.error('Error updating tier:', error);
      res.status(400).json({
        message: "Failed to update tier",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete tier
  app.delete("/api/tiers/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteTier(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Tier not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting tier:', error);
      res.status(400).json({
        message: "Failed to delete tier",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

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


  // Custom domain management routes
  app.post("/api/domains", isAdmin, async (req, res) => {
    try {
      const { domain } = req.body;

      if (!domain) {
        return res.status(400).json({ 
          success: false, 
          message: "Domain name is required" 
        });
      }

      // Store domain configuration
      const domainConfig = await storage.createDomain({
        domain,
        status: 'pending',
        createdAt: new Date().toISOString(),
        verifiedAt: null
      });

      // Send webhook notification for domain configuration
      await sendWebhookNotification({
        type: 'domain_added',
        domain,
        message: `New custom domain ${domain} has been configured`
      });

      res.status(201).json({
        success: true,
        message: "Domain configuration added",
        data: domainConfig
      });
    } catch (error) {
      console.error('Error configuring domain:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to configure domain"
      });
    }
  });

  app.get("/api/domains", isAdmin, async (_req, res) => {
    try {
      const domains = await storage.getDomains();
      res.json(domains);
    } catch (error) {
      console.error('Error fetching domains:', error);
      res.status(500).json({ message: "Failed to fetch domains" });
    }
  });

  app.delete("/api/domains/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteDomain(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Domain configuration not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting domain:', error);
      res.status(400).json({
        message: "Failed to delete domain",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

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