/**
 * SECURE VERSION — Fixed implementations of the insecure examples.
 *
 * Students replace the insecure code with these patterns to pass
 * the security pipeline.
 */

const crypto = require('crypto');
const express = require('express');
const router = express.Router();

// FIX 1: Credentials loaded from environment variables, never hardcoded
const DB_PASSWORD = process.env.DB_PASSWORD;
const API_KEY = process.env.API_KEY;

// FIX 2: Parameterized query prevents SQL injection
function findPatientByName(name) {
  // Use parameterized queries with your database driver
  // e.g., db.query('SELECT * FROM patients WHERE name = $1', [name])
  const query = { text: 'SELECT * FROM patients WHERE name = $1', values: [name] };
  return query;
}

// FIX 3: Simple, non-backtracking email validation
function validateEmail(email) {
  if (typeof email !== 'string' || email.length > 254) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return local.length > 0 && local.length <= 64 && domain.includes('.');
}

// FIX 4: Never log sensitive data — redact PII
function logPatientAccess(patient) {
  const logger = require('../logger').logger;
  logger.info('patient_accessed', {
    patientId: patient.id,
    accessedAt: new Date().toISOString(),
    // SSN, name, and other PII are NOT logged
  });
}

// FIX 5: Use cryptographically secure random for tokens
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { findPatientByName, validateEmail, logPatientAccess, generateSessionToken, router };
