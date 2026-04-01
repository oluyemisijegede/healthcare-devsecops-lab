const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// In-memory store (replaced by a database in production)
const patients = new Map();

// Seed sample data
const seedPatients = [
  { id: uuidv4(), firstName: 'Sarah', lastName: 'Johnson', dob: '1985-03-15', email: 'sarah.johnson@email.com', phone: '555-0101', insuranceId: 'INS-10234', createdAt: new Date().toISOString() },
  { id: uuidv4(), firstName: 'Michael', lastName: 'Chen', dob: '1972-11-28', email: 'michael.chen@email.com', phone: '555-0102', insuranceId: 'INS-10567', createdAt: new Date().toISOString() },
  { id: uuidv4(), firstName: 'Amara', lastName: 'Okafor', dob: '1990-07-04', email: 'amara.okafor@email.com', phone: '555-0103', insuranceId: 'INS-10891', createdAt: new Date().toISOString() },
];
seedPatients.forEach(p => patients.set(p.id, p));

// List all patients
router.get('/', (req, res) => {
  const list = Array.from(patients.values());
  res.json({ count: list.length, patients: list });
});

// Get a single patient
router.get('/:id', (req, res) => {
  const patient = patients.get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

// Register a new patient
router.post('/', (req, res) => {
  const { firstName, lastName, dob, email, phone, insuranceId } = req.body;

  if (!firstName || !lastName || !dob) {
    return res.status(400).json({ error: 'firstName, lastName, and dob are required' });
  }

  const patient = {
    id: uuidv4(),
    firstName,
    lastName,
    dob,
    email: email || null,
    phone: phone || null,
    insuranceId: insuranceId || null,
    createdAt: new Date().toISOString(),
  };

  patients.set(patient.id, patient);
  res.status(201).json(patient);
});

// Update a patient
router.put('/:id', (req, res) => {
  const existing = patients.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Patient not found' });

  const updated = { ...existing, ...req.body, id: existing.id, createdAt: existing.createdAt };
  patients.set(updated.id, updated);
  res.json(updated);
});

// Delete a patient
router.delete('/:id', (req, res) => {
  if (!patients.has(req.params.id)) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  patients.delete(req.params.id);
  res.status(204).send();
});

module.exports = router;
module.exports._patients = patients;
