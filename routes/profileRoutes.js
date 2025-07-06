const express = require("express");
const { requireAuth } = require("./authRoutes");
const router = express.Router();
const db = require("../database");

// GET /api/profile - fetch user profile
router.get("/", requireAuth, async (req, res) => {
  console.log("=== Profile GET route called ===");
  
  try {
    // Debug logging
    console.log("Session object:", req.session);
    console.log("Session user:", req.session?.user);
    console.log("User ID:", req.session?.user?.id);
    
    const userId = req.session?.user?.id;
    if (!userId) {
      console.log("No user ID found in session");
      return res.status(401).json({ message: "Unauthorized - No user session found" });
    }

    console.log("Fetching profile for user ID:", userId);
    
    // Test database connection first
    const testQuery = await db.query('SELECT 1 as test');
    console.log("Database connection test:", testQuery.rows);
    
    // Get user info
    const userQuery = await db.query(`
      SELECT first_name, last_name, email, contactnum, roles
      FROM users WHERE user_id = $1
    `, [userId]);

    if (userQuery.rows.length === 0) {
      console.log("User not found in database");
      return res.status(404).json({ message: "User not found" });
    }

    const user = userQuery.rows[0];
    console.log("User found:", user);
    
    const profile = {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      contactnum: user.contactnum,
      role: user.roles,
      businessAreas: [],
    };

    // If mentor, get critical_areas from mentors table
    if (user.roles === "Mentor") {
      console.log("User is a mentor, fetching business areas...");
      const mentorQuery = await db.query(`
        SELECT critical_areas
        FROM mentors
        WHERE mentor_id = $1
      `, [userId]);

      if (mentorQuery.rows.length > 0) {
        // critical_areas is stored as a PostgreSQL array, convert to JS array
        profile.businessAreas = mentorQuery.rows[0].critical_areas || [];
        console.log("Business areas found:", profile.businessAreas);
      } else {
        console.log("No mentor record found");
      }
    }

    console.log("Final profile data:", profile);
    return res.json(profile);
  } catch (err) {
    console.error("GET /api/profile error:", err);
    console.error("Error stack:", err.stack);
    
    // Make sure we always return JSON
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: "Internal server error", 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
});

// PUT /api/profile - update user profile
router.put("/", requireAuth, async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      firstName,
      lastName,
      email,
      contactnum,
      businessAreas,
      preferredTime,
      specificTime,
      communicationMode,
      bio,
    } = req.body;

    console.log("=== Profile UPDATE route called ===");
    console.log("User ID:", userId);
    console.log("Update data:", { firstName, lastName, email, contactnum, businessAreas, preferredTime, specificTime, communicationMode, bio });

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: "First name, last name, and email are required" });
    }

    // Check for duplicate email in both users and mentors tables
    const emailCheck = await db.query(`
      SELECT 'users' as source, user_id as id FROM users WHERE email = $1 AND user_id != $2
      UNION
      SELECT 'mentors' as source, mentor_id as id FROM mentors WHERE email = $1 AND mentor_id != $2
    `, [email, userId]);

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // Check for duplicate contact number (only if contactnum is provided)
    if (contactnum && contactnum.trim() !== "") {
      const contactCheck = await db.query(`
        SELECT 'users' as source, user_id as id FROM users WHERE contactnum = $1 AND user_id != $2
        UNION
        SELECT 'mentors' as source, mentor_id as id FROM mentors WHERE contactnum = $1 AND mentor_id != $2
      `, [contactnum, userId]);

      if (contactCheck.rows.length > 0) {
        return res.status(409).json({ message: "Contact number already in use" });
      }
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Update users table
      await db.query(`
        UPDATE users
        SET first_name = $1,
            last_name = $2,
            email = $3,
            contactnum = $4
        WHERE user_id = $5
      `, [firstName, lastName, email, contactnum || null, userId]);

      console.log("Users table updated successfully");

      // Check if user is a mentor
      const roleCheck = await db.query(`
        SELECT roles FROM users WHERE user_id = $1
      `, [userId]);

      if (roleCheck.rows[0]?.roles === "Mentor") {
        console.log("User is a mentor, updating mentor table...");
        
        // Check if mentor record exists
        const mentorExists = await db.query(`
          SELECT mentor_id FROM mentors WHERE mentor_id = $1
        `, [userId]);

        if (mentorExists.rows.length > 0) {
          // Update existing mentor record
          console.log("Updating existing mentor record...");
          
          await db.query(`
            UPDATE mentors
            SET mentor_firstname = $1,
                mentor_lastname = $2,
                email = $3,
                contactnum = $4,
                critical_areas = $5
            WHERE mentor_id = $6
          `, [firstName, lastName, email, contactnum || null, businessAreas || [], userId]);
          
          console.log("Mentor record updated successfully");
        } else {
          // Create new mentor record
          console.log("Creating new mentor record...");
          await db.query(`
            INSERT INTO mentors (
              mentor_id, 
              mentor_firstname, 
              mentor_lastname, 
              email, 
              contactnum, 
              critical_areas, 
              number_SE_assigned,
              isactive, 
              status, 
              is_available_for_assignment
            )
            VALUES ($1, $2, $3, $4, $5, $6, 0, true, 'Active', true)
          `, [userId, firstName, lastName, email, contactnum || null, businessAreas || []]);
          
          console.log("New mentor record created successfully");
        }
      }

      // Commit transaction
      await db.query('COMMIT');
      console.log("Transaction committed successfully");

      return res.json({ message: "Profile updated successfully" });
    } catch (err) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      console.error("Transaction rolled back due to error:", err);
      throw err;
    }
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: err.message 
    });
  }
});

// GET /api/profile/debug - test endpoint
router.get("/debug", requireAuth, async (req, res) => {
  console.log("=== Debug route called ===");
  
  try {
    console.log("Headers:", req.headers);
    console.log("Session:", req.session);
    console.log("Cookies:", req.cookies);
    
    // Test database connection
    const dbTest = await db.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log("Database test result:", dbTest.rows[0]);
    
    // Test users table
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    console.log("Users table count:", userCount.rows[0]);
    
    // Test mentors table
    const mentorCount = await db.query('SELECT COUNT(*) as count FROM mentors');
    console.log("Mentors table count:", mentorCount.rows[0]);
    
    return res.json({
      message: "Debug endpoint working",
      session: req.session,
      dbConnected: true,
      userCount: userCount.rows[0].count,
      mentorCount: mentorCount.rows[0].count,
      currentTime: dbTest.rows[0].current_time
    });
  } catch (err) {
    console.error("Debug route error:", err);
    return res.status(500).json({
      message: "Debug endpoint error",
      error: err.message,
      stack: err.stack
    });
  }
});

module.exports = router;