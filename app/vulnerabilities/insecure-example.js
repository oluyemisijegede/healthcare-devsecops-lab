/**
 * INTENTIONALLY INSECURE CODE — FOR LEARNING PURPOSES ONLY
 *
 * This file contains common security anti-patterns that CodeQL and Semgrep
 * should detect. Students will fix these issues as part of the lab.
 *
 * DO NOT use this code in production.
 */

const express = require('express');
const router = express.Router();

// VULNERABILITY 1: Hardcoded credentials
// CodeQL will flag this as "Hard-coded credentials"
const DB_PASSWORD = 'SuperSecret123!';
const API_KEY = 'sk-live-abcdef123456789';

// VULNERABILITY 2: SQL injection via string concatenation
// CodeQL will flag this as "Database query built from user-controlled sources"
function findPatientByName(name) {
  const query = "SELECT * FROM patients WHERE name = '" + name + "'";
  // In a real app this would execute the query
  return query;
}

// VULNERABILITY 3: Missing input validation — ReDoS risk
// A regex that is vulnerable to catastrophic backtracking
function validateEmail(email) {
  const regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
}

// VULNERABILITY 4: Sensitive data in logs
function logPatientAccess(patient) {
  console.log('Patient accessed: ' + patient.name + ', SSN: ' + patient.ssn);
}

// VULNERABILITY 5: Insecure random for token generation
function generateSessionToken() {
  return Math.random().toString(36).substring(2);
}

module.exports = { findPatientByName, validateEmail, logPatientAccess, generateSessionToken, router };
