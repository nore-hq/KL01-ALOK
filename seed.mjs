import { hashSync } from 'bcrypt-ts';
import fs from 'fs';

const email = 'kl01@gmail.com';
const password = 'kl01admin@123';
const id = 'user_' + Date.now();
const role = 'ADMIN';
const createdAt = new Date().toISOString();
const passwordHash = hashSync(password, 10);

const sql = `INSERT INTO users (id, email, password_hash, role, created_at) VALUES ('${id}', '${email}', '${passwordHash}', '${role}', '${createdAt}');`;

fs.writeFileSync('seed.sql', sql);
console.log('SQL script generated.');
