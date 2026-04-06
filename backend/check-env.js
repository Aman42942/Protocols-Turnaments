
require('dotenv').config();

console.log("Checking Environment Variables...");
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Found" : "Missing");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "Found" : "Missing");
console.log("Client ID Preview:", process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + "..." : "N/A");

if (process.env.GOOGLE_CLIENT_ID === "your-google-client-id") {
    console.error("❌ ERROR: Still using placeholder values!");
} else {
    console.log("✅ Values look real.");
}
