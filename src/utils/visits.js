import { getAppointmentSnapshotOwners, getPatientOwners } from './owners';

const pad = (n) => String(n).padStart(2, '0');

// 'YYYY-MM-DD' en hora LOCAL (toISOString usaría UTC y puede desplazar un día).
export const toLocalDateString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Visitas desde (hoy - (days - 1)) hasta hoy, ambos inclusive, más reciente primero.
// Se comparan cadenas 'YYYY-MM-DD' para no depender de zonas horarias.
export const getRecentVisits = (appointments, today = new Date(), days = 30) => {
  const end = toLocalDateString(today);
  const start = toLocalDateString(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1))
  );

  return appointments
    .filter((app) => app.date >= start && app.date <= end)
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
};

// Datos de presentación de una visita: paciente vivo y, si no existe, el snapshot.
export const getVisitDetails = (visit, patients, owners) => {
  const patient = patients.find((p) => p.id === visit.patientId);
  return {
    petName: patient ? patient.petName : visit.petNameSnapshot,
    guardians: patient
      ? getPatientOwners(patient, owners)
      : getAppointmentSnapshotOwners(visit),
  };
};

// "Nombre (teléfono)" separados por " / "
export const formatGuardians = (guardians) =>
  guardians
    .map((g) => (g.phone ? `${g.name} (${g.phone})` : g.name))
    .join(' / ');

const escapeCsvField = (value) => {
  const text = String(value ?? '');
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// CSV con separador ';' y BOM para que Excel respete las tildes.
export const buildVisitsCsv = (visits, patients, owners) => {
  const rows = visits.map((visit) => {
    const { petName, guardians } = getVisitDetails(visit, patients, owners);
    return [petName, formatGuardians(guardians), visit.date, visit.reason];
  });

  const lines = [['Mascota', 'Responsable', 'Fecha', 'Motivo'], ...rows].map((row) =>
    row.map(escapeCsvField).join(';')
  );
  return `﻿${lines.join('\r\n')}`;
};

export const downloadCsv = (filename, content) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
