// One-time script to create the initial admin account.
// This is intentionally NOT exposed as a public API route —
// admin accounts must never be creatable through registration.
//
// Run with: npm run seed

const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const connectDB = require("../config/db");
const User = require("../models/User");

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "System Admin";

    if (!adminEmail || !adminPassword) {
      console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file before seeding.");
      process.exit(1);
    }

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      existingAdmin.password = await bcrypt.hash(adminPassword, salt);
      existingAdmin.role = "admin";
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log(`Admin account password updated successfully for ${adminEmail}.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log(`Admin account created successfully for ${adminEmail}.`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin account:", error.message);
    process.exit(1);
  }
};

seedAdmin();
