const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// In-memory store (replaced by a database in production)
const appointments = new Map();

// Seed sample data
const seedAppointments = [
  { id: uuidv4(), patientName: 'Sarah Johnson', provider: 'Dr. Emily Torres', department: 'Cardiology', date: '2026-04-02', time: '09:00', type: 'Follow-up', status: 'scheduled', notes: 'Review blood pressure medication', createdAt: new Date().toISOString() },
  { id: uuidv4(), patientName: 'Michael Chen', provider: 'Dr. James Park', department: 'Orthopedics', date: '2026-04-03', time: '14:30', type: 'New Patient', status: 'scheduled', notes: 'Left knee evaluation', createdAt: new Date().toISOString() },
  { id: uuidv4(), patientName: 'Amara Okafor', provider: 'Dr. Lisa Wang', department: 'General Practice', date: '2026-04-05', time: '11:00', type: 'Annual Physical', status: 'confirmed', notes: '', createdAt: new Date().toISOString() },
];
seedAppointments.forEach(a => appointments.set(a.id, a));

// List all appointments (optionally filter by date or status)
router.get('/', (req, res) => {
  let list = Array.from(appointments.values());

  if (req.query.date) {
    list = list.filter(a => a.date === req.query.date);
  }
  if (req.query.status) {
    list = list.filter(a => a.status === req.query.status);
  }

  res.json({ count: list.length, appointments: list });
});

// Get a single appointment
router.get('/:id', (req, res) => {
  const appt = appointments.get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });
  res.json(appt);
});

// Schedule a new appointment
router.post('/', (req, res) => {
  const { patientName, provider, department, date, time, type, notes } = req.body;

  if (!patientName || !provider || !date || !time) {
    return res.status(400).json({ error: 'patientName, provider, date, and time are required' });
  }

  const appt = {
    id: uuidv4(),
    patientName,
    provider,
    department: department || 'General Practice',
    date,
    time,
    type: type || 'General',
    status: 'scheduled',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  appointments.set(appt.id, appt);
  res.status(201).json(appt);
});

// Update an appointment (reschedule, change status, etc.)
router.put('/:id', (req, res) => {
  const existing = appointments.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Appointment not found' });

  const updated = { ...existing, ...req.body, id: existing.id, createdAt: existing.createdAt };
  appointments.set(updated.id, updated);
  res.json(updated);
});

// Cancel an appointment
router.delete('/:id', (req, res) => {
  const existing = appointments.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Appointment not found' });

  existing.status = 'cancelled';
  appointments.set(existing.id, existing);
  res.json({ message: 'Appointment cancelled', appointment: existing });
});

module.exports = router;
module.exports._appointments = appointments;
