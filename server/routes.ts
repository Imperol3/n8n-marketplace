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
  try {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
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

// Update the upload configuration to use persistent storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => {
      // Use the persistent uploads directory
      const persistentUploadDir = path.join(process.cwd(), '.data', 'uploads');
      // Ensure the uploads directory exists
      if (!fs.existsSync(persistentUploadDir)){
        fs.mkdirSync(persistentUploadDir, { recursive: true });
      }
      
      // Also make sure the public directory exists
      const publicUploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(publicUploadDir)){
        fs.mkdirSync(publicUploadDir, { recursive: true });
      }
      
      // Store in the persistent directory
      cb(null, persistentUploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const fileName = `${uniqueSuffix}-${file.originalname}`;
      cb(null, fileName);
      
      // After uploading to persistent storage, we'll copy to the public directory
      // for immediate serving (this happens asynchronously)
      const persistentPath = path.join(process.cwd(), '.data', 'uploads', fileName);
      const publicPath = path.join(process.cwd(), 'uploads', fileName);
      
      // Use a slight delay to ensure the file is fully written before copying
      setTimeout(() => {
        try {
          if (fs.existsSync(persistentPath)) {
            fs.copyFileSync(persistentPath, publicPath);
            console.log(`File copied to public directory: ${fileName}`);
          }
        } catch (error) {
          console.error(`Error copying file to public directory: ${error}`);
        }
      }, 100);
    }
  })
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Add middleware to track user activity
  app.use(async (req, res, next) => {
    if (req.user && req.path.startsWith('/api/')) {
      try {
        await storage.recordUserActivity(req.user.id);
      } catch (error) {
        console.error('Error recording user activity:', error);
      }
    }
    next();
  });

  // Add these routes after setupAuth(app);

  // Update the user creation API endpoint to handle registrations properly
app.post("/api/v1/users", async (req, res) => {
  try {
    // Validate required fields
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Username, email, and password are required" 
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

    // Check if this is the first user (make them admin)
    const users = await storage.getUsers();
    const role = users.length === 0 ? "admin" : "user";

    // Create user with hashed password
    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      username,
      email,
      password: hashedPassword,
      role,
      preferences: {
        tier: "free",
        interests: []
      },
      metadata: {
        isFirstLogin: true,
        lastLogin: new Date().toISOString()
      }
    });

    // Log the user in automatically after registration
    req.login(user, (err) => {
      if (err) {
        console.error('Auto-login error:', err);
        return res.status(201).json({
          success: true,
          message: "User created successfully, please log in",
          data: {
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      }

      res.status(201).json({
        success: true,
        message: "User created and logged in successfully",
        data: {
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
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
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

  // THIS ENDPOINT IS DUPLICATED - SEE THE UPDATED VERSION AT THE BOTTOM OF THIS FILE
  // The updated version includes proper download tracking

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

  // USER FAVORITE WORKFLOWS ROUTES

  // Get user's favorite workflows
  app.get("/api/favorites", isUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const favorites = await storage.getFavoriteWorkflows(userId);
      res.json(favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ 
        message: "Failed to fetch favorite workflows",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Add workflow to favorites
  app.post("/api/favorites/:workflowId", isUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const workflowId = parseInt(req.params.workflowId);
      
      const updatedUser = await storage.addFavoriteWorkflow(userId, workflowId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User or workflow not found" });
      }
      
      res.status(200).json({ 
        message: "Workflow added to favorites",
        favorites: updatedUser.preferences.favoriteWorkflows
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      res.status(500).json({ 
        message: "Failed to add workflow to favorites",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Remove workflow from favorites
  app.delete("/api/favorites/:workflowId", isUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const workflowId = parseInt(req.params.workflowId);
      
      const updatedUser = await storage.removeFavoriteWorkflow(userId, workflowId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User or favorite not found" });
      }
      
      res.status(200).json({ 
        message: "Workflow removed from favorites",
        favorites: updatedUser.preferences.favoriteWorkflows
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      res.status(500).json({ 
        message: "Failed to remove workflow from favorites",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get user's download history
  app.get("/api/download-history", isUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const history = await storage.getDownloadHistory(userId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching download history:', error);
      res.status(500).json({ 
        message: "Failed to fetch download history",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // WORKFLOW RATING ROUTES

  // Get ratings for a workflow
  app.get("/api/workflows/:id/ratings", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const ratings = await storage.getWorkflowRatings(workflowId);
      res.json(ratings);
    } catch (error) {
      console.error('Error fetching ratings:', error);
      res.status(500).json({ 
        message: "Failed to fetch ratings",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Add/update a rating for a workflow
  app.post("/api/workflows/:id/ratings", isUser, async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { rating, review } = req.body;
      
      if (rating === undefined || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      const updatedWorkflow = await storage.addWorkflowRating(workflowId, userId, rating, review);
      if (!updatedWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.status(200).json({ 
        message: "Rating added successfully",
        ratings: updatedWorkflow.metadata.ratings,
        averageRating: updatedWorkflow.metadata.averageRating
      });
    } catch (error) {
      console.error('Error adding rating:', error);
      res.status(500).json({ 
        message: "Failed to add rating",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // WORKFLOW DOCUMENTATION ROUTES

  // Get documentation for a workflow
  app.get("/api/workflows/:id/documentation", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const documentation = await storage.getWorkflowDocumentation(workflowId);
      
      if (!documentation) {
        return res.status(404).json({ message: "Documentation not found for this workflow" });
      }
      
      // Import the text formatting utility
      const { formatTextForApi } = await import('./utils/textFormatting');
      
      // Format the documentation for the response
      const formattedDocumentation = formatTextForApi(documentation);
      
      res.json({ 
        documentation, 
        formattedHtml: formattedDocumentation.html,
        isMarkdown: formattedDocumentation.isMarkdown
      });
    } catch (error) {
      console.error('Error fetching documentation:', error);
      res.status(500).json({ 
        message: "Failed to fetch documentation",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Add/update documentation for a workflow (admin only)
  app.post("/api/workflows/:id/documentation", isAdmin, async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const { documentation } = req.body;
      
      if (!documentation || typeof documentation !== 'string') {
        return res.status(400).json({ message: "Documentation content is required" });
      }
      
      const updatedWorkflow = await storage.addWorkflowDocumentation(workflowId, documentation);
      if (!updatedWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.status(200).json({ 
        message: "Documentation updated successfully",
        documentation: updatedWorkflow.metadata.documentation
      });
    } catch (error) {
      console.error('Error updating documentation:', error);
      res.status(500).json({ 
        message: "Failed to update documentation",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Analytics endpoints (admin only)
  app.get("/api/analytics", isAdmin, async (_req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      if (!analytics) {
        return res.status(404).json({ message: "Analytics not found" });
      }
      
      // Get details for active users and downloads
      const activeUsers = await storage.getActiveUsers();
      const downloadsPerWorkflow = await storage.getDownloadsPerWorkflow();
      
      // Return comprehensive analytics data
      res.json({
        ...analytics,
        activeUsersDetails: activeUsers,
        downloadsPerWorkflowDetails: downloadsPerWorkflow
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  
  // Content formatting and conversion tools
  
  // Bulk convert all content to markdown (admin only)
  app.post("/api/tools/convert-to-markdown", isAdmin, async (_req, res) => {
    try {
      // Import the conversion tool
      const { convertExistingContentToMarkdown } = await import('./utils/convertExistingContent');
      
      // Run the conversion
      const result = await convertExistingContentToMarkdown();
      
      // Create a detailed message
      const docsText = result.documentations ? `${result.documentations} documentation${result.documentations !== 1 ? 's' : ''}` : '0 documentations';
      const descText = result.descriptions ? `${result.descriptions} description${result.descriptions !== 1 ? 's' : ''}` : '0 descriptions';
      
      res.json({ 
        success: true,
        message: `Conversion completed. Enhanced ${docsText} and ${descText} out of ${result.total} workflows.`,
        ...result
      });
    } catch (error) {
      console.error('Error converting content:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to convert content to markdown",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Format a single piece of content (available to all authenticated users)
  app.post("/api/tools/format-content", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ 
          success: false, 
          message: "Content is required" 
        });
      }
      
      const { convertToMarkdown } = await import('./utils/convertExistingContent');
      
      // Check if content already has markdown
      const { containsMarkdown } = await import('./utils/textFormatting');
      const hasSubstantialFormatting = containsMarkdown(content);
      
      // Format the content
      const formattedContent = convertToMarkdown(content);
      
      // Check if the content changed significantly
      const significantChange = content.trim() !== formattedContent.trim() && 
        Math.abs(formattedContent.length - content.length) > (content.length * 0.05); // 5% change threshold
      
      const wasConverted = !hasSubstantialFormatting || significantChange;
      
      res.json({
        success: true,
        formatted: formattedContent,
        message: wasConverted 
          ? "Content formatted successfully" 
          : "Content already has markdown formatting",
        wasConverted: wasConverted
      });
    } catch (error) {
      console.error('Error formatting content:', error);
      res.status(500).json({
        success: false,
        message: "Failed to format content",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Track user activity endpoint
  app.post("/api/track/pageview", async (req, res) => {
    try {
      // Record for logged-in users
      if (req.isAuthenticated()) {
        await storage.recordUserActivity(req.user!.id);
      }
      
      res.sendStatus(200);
    } catch (error) {
      console.error('Error recording user activity:', error);
      // Still return success to avoid causing issues with the frontend
      res.sendStatus(200);
    }
  });
  
  // Update download route to record download history and analytics
  app.get("/api/workflows/:id/download", isUser, async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      // Only admin can download non-published workflows
      if (workflow.status !== 'published' && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "This workflow is not available for download" });
      }

      // Check if user has access to this tier
      const userTier = req.user!.preferences.tier;
      const requiredTier = workflow.metadata.requiredTier;
      
      // Admin can download any workflow regardless of tier
      if (req.user!.role !== 'admin') {
        const tiers = await storage.getTiers();
        const tierLevels = tiers.reduce((acc, tier) => {
          acc[tier.name] = tier.level;
          return acc;
        }, {} as Record<string, number>);
        
        if (
          !tierLevels[userTier] || 
          !tierLevels[requiredTier] || 
          tierLevels[userTier] < tierLevels[requiredTier]
        ) {
          return res.status(403).json({ 
            message: `This workflow requires ${requiredTier} tier access` 
          });
        }
      }

      try {
        // Record the download in user's history
        await storage.recordWorkflowDownload(userId, workflowId);
        
        // Record download analytics
        await storage.incrementTotalDownloads(workflowId);
      } catch (analyticsError) {
        console.error('Error recording download analytics:', analyticsError);
        // Continue with download attempt even if analytics recording fails
      }

      // Send the file
      try {
        const filePath = fileStorage.getAbsolutePath(workflow.filePath);
        res.download(filePath);
      } catch (fileError) {
        console.error('Error finding workflow file:', fileError);
        res.status(404).json({ 
          message: "Workflow file not found", 
          details: "The workflow was found in the database, but the file is missing. The download has still been recorded."
        });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(500).json({ 
        message: "Error processing download request",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update workflow description (Admin only)
  app.patch("/api/workflows/:id/description", isAdmin, async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const { description } = req.body;
      
      if (description === undefined) {
        return res.status(400).json({ message: "Description is required" });
      }
      
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      const updatedWorkflow = await storage.updateWorkflow(workflowId, { description });
      
      res.json({
        success: true,
        workflow: updatedWorkflow,
        message: "Description updated successfully"
      });
    } catch (error) {
      console.error('Error updating workflow description:', error);
      res.status(500).json({ 
        success: false,
        message: "Error updating workflow description",
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