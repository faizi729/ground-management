import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import bcrypt from "bcrypt";

// Demo users for authentication
const DEMO_USERS = {
  client: { 
    id: "demo-client-001", 
    email: "client@demo.com", 
    password: "client123", // plaintext only for demo
    role: "client",
    firstName: "John",
    lastName: "Doe"
  },
  admin: { 
    id: "demo-admin-001", 
    email: "admin@demo.com", 
    password: "admin123",
    role: "admin",
    firstName: "Admin",
    lastName: "User"
  }
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "demo-secret-key-123",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for client
  passport.use("client-local", new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        // Demo user
        if (email === DEMO_USERS.client.email && password === DEMO_USERS.client.password) {
          const user = await storage.upsertUser({
            id: DEMO_USERS.client.id,
            email: DEMO_USERS.client.email,
            firstName: DEMO_USERS.client.firstName,
            lastName: DEMO_USERS.client.lastName,
            role: DEMO_USERS.client.role,
            password: await bcrypt.hash(DEMO_USERS.client.password, 10) // ensure stored
          });
          return done(null, { ...user, userType: "client" });
        }

        // Registered user
        const registeredUser = await storage.getUserByEmail(email);
        if (!registeredUser) {
          return done(null, false, { message: "User not found" });
        }

        if (registeredUser.role !== "client") {
          return done(null, false, { message: "Not a client account" });
        }

        // Compare password hash
        const match = await bcrypt.compare(password, registeredUser.password || "");
        if (!match) {
          return done(null, false, { message: "Invalid password" });
        }

        return done(null, { ...registeredUser, userType: "client" });
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Local strategy for admin
  passport.use("admin-local", new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        // Demo admin
        if (email === DEMO_USERS.admin.email && password === DEMO_USERS.admin.password) {
          const user = await storage.upsertUser({
            id: DEMO_USERS.admin.id,
            email: DEMO_USERS.admin.email,
            firstName: DEMO_USERS.admin.firstName,
            lastName: DEMO_USERS.admin.lastName,
            role: DEMO_USERS.admin.role,
            password: await bcrypt.hash(DEMO_USERS.admin.password, 10)
          });
          return done(null, { ...user, userType: "admin" });
        }

        const registeredUser = await storage.getUserByEmail(email);
        if (!registeredUser || registeredUser.role !== "admin") {
          return done(null, false, { message: "Not an admin account" });
        }

        const match = await bcrypt.compare(password, registeredUser.password || "");
        if (!match) {
          return done(null, false, { message: "Invalid password" });
        }

        return done(null, { ...registeredUser, userType: "admin" });
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Passport session handling
  passport.serializeUser((user: any, done) => {
    done(null, { id: user.id, userType: user.userType });
  });

  passport.deserializeUser(async (sessionData: any, done) => {
    try {
      const user = await storage.getUser(sessionData.id);
      if (user) {
        done(null, { ...user, userType: sessionData.userType });
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error);
    }
  });

  // Login routes
  app.post("/api/login/client", passport.authenticate("client-local"), (req, res) => {
    res.json({ success: true, user: req.user, message: "Client login successful" });
  });

  app.post("/api/login/admin", passport.authenticate("admin-local"), (req, res) => {
    res.json({ success: true, user: req.user, message: "Admin login successful" });
  });

  // Demo login page (unchanged)
  app.get("/api/login", (req, res) => {
    const loginType = req.query.type || "client";
    res.send(/* same HTML as before */);
  });

  // Logout
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
