
require('dotenv').config();

const secret = process.env.GOOGLE_CLIENT_SECRET;
console.log(`Secret Length: ${secret ? secret.length : 'N/A'}`);
console.log(`First char: ${secret ? secret[0] : 'N/A'}`);
console.log(`Last char: ${secret ? secret[secret.length - 1] : 'N/A'}`);
console.log(`Contains quote? ${secret && (secret.includes('"') || secret.includes("'"))}`);
