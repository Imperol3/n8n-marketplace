import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import fs from 'fs';
import { migrateUploads, PERSISTENT_UPLOAD_DIR, PUBLIC_UPLOAD_DIR } from './migrateUploads';

// Run comprehensive file system migration on startup
// This ensures all uploaded files are properly synchronized between
// persistent and public directories for maximum resilience
console.log('------------------------------------------------------');
console.log('Starting file system migration for persistent uploads...');
migrateUploads();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // First try to serve from the public uploads directory
  app.use('/uploads', express.static(PUBLIC_UPLOAD_DIR, {
    fallthrough: true, // Enable falling through for missing files
    index: false,      // Disable directory listing for security
    maxAge: '1d'       // Add cache headers for better performance
  }));
  
  // Then try the persistent storage directory
  app.use('/uploads', express.static(PERSISTENT_UPLOAD_DIR, {
    fallthrough: true, // Enable falling through for missing files
    index: false,      // Disable directory listing for security
    maxAge: '1d'       // Add cache headers for better performance
  }));

  // Create a file recovery middleware to attempt repair of missing files
  app.use('/uploads', (req, res, next) => {
    const requestedFile = path.basename(req.path);
    
    // Skip empty paths
    if (!requestedFile) {
      return next();
    }
    
    const persistentPath = path.join(PERSISTENT_UPLOAD_DIR, requestedFile);
    const publicPath = path.join(PUBLIC_UPLOAD_DIR, requestedFile);
    
    // Check if file exists in persistent storage but not in public
    if (fs.existsSync(persistentPath) && !fs.existsSync(publicPath)) {
      try {
        // Copy from persistent to public
        fs.copyFileSync(persistentPath, publicPath);
        console.log(`Repaired missing file in public directory: ${requestedFile}`);
        
        // Serve the newly copied file
        return res.sendFile(publicPath);
      } catch (error) {
        console.error(`Failed to repair file ${requestedFile}:`, error);
      }
    }
    
    // Continue to 404 handler if file not found or repair failed
    next();
  });

  // Handle 404 errors for images
  app.use('/uploads', (req, res, next) => {
    const requestedFile = path.basename(req.path);
    
    if (requestedFile) {
      console.log(`File not found in either location: ${requestedFile}`);
      return res.status(404).json({
        error: 'Image not found',
        path: req.path
      });
    }
    
    // Prevent directory listing
    res.status(403).json({
      error: 'Access denied',
      message: 'Directory listing is not allowed'
    });
  });


  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT environment variable or fallback to 5000
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();