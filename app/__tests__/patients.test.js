const request = require('supertest');
const app = require('../server');

describe('Health Check', () => {
  it('GET /health returns 200 with status healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('meditrack-api');
  });
});

describe('Patients API', () => {
  it('GET /api/patients returns seeded patients', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(3);
    expect(res.body.patients).toBeInstanceOf(Array);
  });

  it('POST /api/patients creates a new patient', async () => {
    const newPatient = {
      firstName: 'Test',
      lastName: 'Patient',
      dob: '1995-01-01',
      email: 'test@example.com',
      phone: '555-9999',
      insuranceId: 'INS-99999',
    };
    const res = await request(app).post('/api/patients').send(newPatient);
    expect(res.statusCode).toBe(201);
    expect(res.body.firstName).toBe('Test');
    expect(res.body.id).toBeDefined();
  });

  it('POST /api/patients returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/patients').send({ firstName: 'Incomplete' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('GET /api/patients/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/patients/nonexistent-id');
    expect(res.statusCode).toBe(404);
  });
});

describe('Appointments API', () => {
  it('GET /api/appointments returns seeded appointments', async () => {
    const res = await request(app).get('/api/appointments');
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(3);
    expect(res.body.appointments).toBeInstanceOf(Array);
  });

  it('POST /api/appointments creates a new appointment', async () => {
    const newAppt = {
      patientName: 'Test Patient',
      provider: 'Dr. Smith',
      department: 'Radiology',
      date: '2026-05-01',
      time: '10:00',
      type: 'X-Ray',
      notes: 'Left wrist',
    };
    const res = await request(app).post('/api/appointments').send(newAppt);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('scheduled');
    expect(res.body.id).toBeDefined();
  });

  it('POST /api/appointments returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/appointments').send({ patientName: 'Incomplete' });
    expect(res.statusCode).toBe(400);
  });

  it('DELETE /api/appointments/:id cancels an appointment', async () => {
    // Create one first
    const create = await request(app).post('/api/appointments').send({
      patientName: 'Cancel Test',
      provider: 'Dr. Lee',
      date: '2026-06-01',
      time: '08:00',
    });
    const res = await request(app).delete(`/api/appointments/${create.body.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.appointment.status).toBe('cancelled');
  });
});

describe('404 Handler', () => {
  it('returns 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.statusCode).toBe(404);
  });
});
