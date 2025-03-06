import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.log("Invalid stored password format");
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to false for development
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    }, async (username, password, done) => {
      try {
        console.log(`[Auth] Login attempt for: ${username}`);

        // Try username first, then email
        let user = await storage.getUserByUsername(username);
        if (!user) {
          user = await storage.getUserByEmail(username);
        }

        if (!user) {
          console.log("[Auth] User not found");
          return done(null, false, { message: "Invalid credentials" });
        }

        console.log("[Auth] User found, comparing passwords");
        const isValidPassword = await comparePasswords(password, user.password);

        if (!isValidPassword) {
          console.log("[Auth] Invalid password");
          return done(null, false, { message: "Invalid credentials" });
        }

        console.log("[Auth] Login successful for:", user.username);
        return done(null, user);
      } catch (error) {
        console.error("[Auth] Login error:", error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log("[Auth] Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("[Auth] Deserializing user:", id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log("[Auth] User not found during deserialization");
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("[Auth] Deserialization error:", error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      console.log("[Auth] Registration attempt for:", req.body.username);

      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: "user",
        preferences: {
          interests: [],
          tier: "free"
        }
      });

      req.login(user, (err) => {
        if (err) {
          console.error("[Auth] Login error after registration:", err);
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        console.log("[Auth] Registration successful for:", username);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("[Auth] Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("[Auth] Login attempt for:", req.body.username);

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("[Auth] Authentication error:", err);
        return res.status(500).json({ message: "Authentication error" });
      }

      if (!user) {
        console.log("[Auth] Authentication failed:", info?.message);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.login(user, (err) => {
        if (err) {
          console.error("[Auth] Session creation error:", err);
          return res.status(500).json({ message: "Error creating session" });
        }
        console.log("[Auth] Login successful for:", user.username);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    const username = req.user?.username;
    console.log("[Auth] Logout attempt for:", username);

    req.logout((err) => {
      if (err) {
        console.error("[Auth] Logout error:", err);
        return res.status(500).json({ message: "Error logging out" });
      }
      console.log("[Auth] Logout successful for:", username);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("[Auth] Checking authentication:", req.isAuthenticated());
    console.log("[Auth] Current user:", req.user?.username);

    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });

  // Initialize admin user
  initializeAdmin();
}

async function initializeAdmin() {
  try {
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      console.log("[Auth] Creating admin user...");
      await storage.createUser({
        username: "admin",
        email: "admin@example.com",
        password: await hashPassword("admin123"),
        role: "admin",
        preferences: {
          interests: [],
          tier: "premium"
        }
      });
      console.log("[Auth] Admin user created successfully");
    }
  } catch (error) {
    console.error("[Auth] Error initializing admin user:", error);
  }
}

export { hashPassword };