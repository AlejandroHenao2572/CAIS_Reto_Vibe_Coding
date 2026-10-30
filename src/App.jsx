import React, { useState, useEffect } from 'react';
import PatientForm from './components/PatientForm';
import PatientList from './components/PatientList';
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';
import MedicalHistorySection from './components/MedicalHistorySection';
import OwnerList from './components/OwnerList';
import OwnerDetail from './components/OwnerDetail';
import RecentVisits from './components/RecentVisits';
import Modal from './components/Modal';
import { getOwnerPatients, loadPeople, savePeople } from './utils/owners';
import { getRecentVisits, toLocalDateString } from './utils/visits';

// Fecha local 'YYYY-MM-DD' de hace n días (para los datos de ejemplo)
const daysAgo = (n) => {
  const now = new Date();
  return toLocalDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n));
};

const INITIAL_OWNERS = [
  { id: 'o1', name: 'Laura Martínez', phone: '310 456 7890' },
  { id: 'o2', name: 'Carlos Martínez', phone: '311 222 3344' },
  { id: 'o3', name: 'Andrés Pérez', phone: '315 987 6543' },
];

const INITIAL_PATIENTS = [
  {
    id: '1',
    petName: 'Max',
    species: 'Perro',
    breed: 'Golden Retriever',
    age: '4 años',
    ownerIds: ['o1', 'o2'],
    createdAt: '30/10/2026',
  },
  {
    id: '2',
    petName: 'Luna',
    species: 'Gato',
    breed: 'Criollo',
    age: '2 años',
    ownerIds: ['o3'],
    createdAt: '30/10/2026',
  },
  {
    id: '3',
    petName: 'Coco',
    species: 'Gato',
    breed: 'Siamés',
    age: '1 año',
    ownerIds: ['o1'],
    createdAt: '30/10/2026',
  },
];

const INITIAL_APPOINTMENTS = [
  {
    id: '101',
    patientId: '1',
    petNameSnapshot: 'Max',
    speciesSnapshot: 'Perro',
    ownersSnapshot: [
      { name: 'Laura Martínez', phone: '310 456 7890' },
      { name: 'Carlos Martínez', phone: '311 222 3344' },
    ],
    reason: 'Vacunación',
    date: '2026-10-31',
    time: '09:30',
    status: 'Pendiente',
    notes: 'Refuerzo anual séxtuple + rabia',
    createdAt: '2026-10-30T07:50:00.000Z',
  },
  {
    id: '102',
    patientId: '2',
    petNameSnapshot: 'Luna',
    speciesSnapshot: 'Gato',
    ownersSnapshot: [{ name: 'Andrés Pérez', phone: '315 987 6543' }],
    reason: 'Control general',
    date: '2026-10-31',
    time: '11:00',
    status: 'Pendiente',
    notes: 'Revisión de peso y chequeo dental',
    createdAt: '2026-10-30T07:50:00.000Z',
  },
  // Visitas pasadas de ejemplo, relativas a hoy (solo afectan a quien no tiene datos guardados)
  {
    id: '103',
    patientId: '1',
    petNameSnapshot: 'Max',
    speciesSnapshot: 'Perro',
    ownersSnapshot: [
      { name: 'Laura Martínez', phone: '310 456 7890' },
      { name: 'Carlos Martínez', phone: '311 222 3344' },
    ],
    reason: 'Control general',
    date: daysAgo(0),
    time: '08:00',
    status: 'Completada',
    notes: 'Visita de hoy',
    createdAt: '2026-10-30T07:50:00.000Z',
  },
  {
    id: '104',
    patientId: '2',
    petNameSnapshot: 'Luna',
    speciesSnapshot: 'Gato',
    ownersSnapshot: [{ name: 'Andrés Pérez', phone: '315 987 6543' }],
    reason: 'Desparasitación',
    date: daysAgo(15),
    time: '10:30',
    status: 'Completada',
    notes: 'Visita de hace 15 días',
    createdAt: '2026-10-30T07:50:00.000Z',
  },
  {
    id: '105',
    patientId: '3',
    petNameSnapshot: 'Coco',
    speciesSnapshot: 'Gato',
    ownersSnapshot: [{ name: 'Laura Martínez', phone: '310 456 7890' }],
    reason: 'Vacunación',
    date: daysAgo(29),
    time: '16:00',
    status: 'Cancelada',
    notes: 'Visita de hace 29 días (último día de la ventana)',
    createdAt: '2026-10-30T07:50:00.000Z',
  },
  {
    id: '106',
    patientId: '1',
    petNameSnapshot: 'Max',
    speciesSnapshot: 'Perro',
    ownersSnapshot: [
      { name: 'Laura Martínez', phone: '310 456 7890' },
      { name: 'Carlos Martínez', phone: '311 222 3344' },
    ],
    reason: 'Urgencia',
    date: daysAgo(31),
    time: '12:00',
    status: 'Completada',
    notes: 'Visita de hace 31 días (debe quedar fuera de la vista)',
    createdAt: '2026-10-30T07:50:00.000Z',
  },
];

const INITIAL_MEDICAL_RECORDS = [
  {
    id: '501',
    patientId: '1',
    date: '2026-10-15',
    diagnosis: 'Dermatitis alérgica leve en abdomen',
    treatment: 'Baños medicados con clorhexidina cada 5 días y Omega 3 oral por 15 días.',
    createdAt: '10:15',
  },
  {
    id: '502',
    patientId: '2',
    date: '2026-10-20',
    diagnosis: 'Control sano y profilaxis antiparasitaria',
    treatment: 'Pipeta antipulgas mensual + desparasitante interno de amplio espectro (dosis única).',
    createdAt: '15:40',
  },
];

export default function App() {
  // 1. Pacientes y Responsables (relación muchos a muchos) con persistencia en localStorage.
  // Se cargan juntos para que la migración desde el formato v1 genere ids consistentes.
  const [initialPeople] = useState(() =>
    loadPeople({ patients: INITIAL_PATIENTS, owners: INITIAL_OWNERS })
  );
  const [patients, setPatients] = useState(initialPeople.patients);
  const [owners, setOwners] = useState(initialPeople.owners);

  // 2. Estado de Citas con persistencia en localStorage
  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem('vet_appointments_v1');
      return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  });

  // 3. Estado de Historial Clínico con persistencia en localStorage
  const [medicalRecords, setMedicalRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('vet_medical_records_v1');
      return saved ? JSON.parse(saved) : INITIAL_MEDICAL_RECORDS;
    } catch {
      return INITIAL_MEDICAL_RECORDS;
    }
  });

  // Paciente seleccionado para ver/agregar su historial clínico
  const [selectedPatientId, setSelectedPatientId] = useState(
    patients.length > 0 ? patients[0].id : ''
  );

  // Control del Modal de Historial Clínico al hacer clic en un paciente de la lista
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Responsable abierto en su modal (muestra todas sus mascotas)
  const [openedOwnerId, setOpenedOwnerId] = useState(null);

  // Pestaña activa ('all' | 'patients' | 'appointments' | 'history' | 'owners' | 'recent')
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    savePeople({ patients, owners });
  }, [patients, owners]);

  useEffect(() => {
    try {
      localStorage.setItem('vet_appointments_v1', JSON.stringify(appointments));
    } catch (err) {
      console.error('Error guardando citas en localStorage:', err);
    }
  }, [appointments]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'vet_medical_records_v1',
        JSON.stringify(medicalRecords)
      );
    } catch (err) {
      console.error('Error guardando historial clínico en localStorage:', err);
    }
  }, [medicalRecords]);

  // Handlers de Funcionalidad 1: Pacientes
  const handleAddPatient = (newPatient, newOwners) => {
    setOwners((prevOwners) => [...newOwners, ...prevOwners]);
    setPatients((prevPatients) => [newPatient, ...prevPatients]);
    setSelectedPatientId(newPatient.id);
  };

  const handleDeletePatient = (id) => {
    const remaining = patients.filter((patient) => patient.id !== id);
    // Un responsable sin mascotas deja de existir
    const activeOwnerIds = new Set(remaining.flatMap((p) => p.ownerIds));

    setPatients(remaining);
    setOwners((prevOwners) =>
      prevOwners.filter((owner) => activeOwnerIds.has(owner.id))
    );
    if (openedOwnerId && !activeOwnerIds.has(openedOwnerId)) {
      setOpenedOwnerId(null);
    }
    if (selectedPatientId === id) {
      setSelectedPatientId(remaining.length > 0 ? remaining[0].id : '');
      setIsHistoryModalOpen(false);
    }
  };

  // Al hacer clic en un paciente de la lista, abrimos su modal de Historial Clínico Rápido
  const handleOpenPatientHistory = (patientId) => {
    setSelectedPatientId(patientId);
    setIsHistoryModalOpen(true);
  };

  // Al hacer clic en un responsable, abrimos su modal con todas sus mascotas
  const handleOpenOwner = (ownerId) => {
    setIsHistoryModalOpen(false);
    setOpenedOwnerId(ownerId);
  };

  const handleOpenPatientFromOwner = (patientId) => {
    setOpenedOwnerId(null);
    handleOpenPatientHistory(patientId);
  };

  // Handlers de Funcionalidad 2: Citas
  const handleAddAppointment = (newAppointment) => {
    setAppointments((prev) => [newAppointment, ...prev]);
  };

  const handleUpdateAppointmentStatus = (appointmentId, newStatus) => {
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === appointmentId ? { ...app, status: newStatus } : app
      )
    );
  };

  const handleDeleteAppointment = (appointmentId) => {
    setAppointments((prev) => prev.filter((app) => app.id !== appointmentId));
  };

  // Handlers de Funcionalidad 3: Historial Clínico y Notas Médicas
  const handleAddMedicalRecord = (newRecord) => {
    setMedicalRecords((prev) => [newRecord, ...prev]);
  };

  const handleDeleteMedicalRecord = (recordId) => {
    setMedicalRecords((prev) => prev.filter((rec) => rec.id !== recordId));
  };

  const openedOwner = owners.find((owner) => owner.id === openedOwnerId) || null;

  const pendingAppointmentsCount = appointments.filter(
    (a) => a.status === 'Pendiente'
  ).length;

  const recentVisitsCount = getRecentVisits(appointments).length;

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-icon" aria-hidden="true">
              🩺
            </div>
            <div>
              <h1>Veterinaria El Barrio</h1>
              <p>Pacientes • Responsables • Citas • Historial Clínico</p>
            </div>
          </div>

          <div className="header-badges">
            <span className="stats-badge">
              🐾 {patients.length}{' '}
              {patients.length === 1 ? 'paciente' : 'pacientes'}
            </span>
            <span className="stats-badge badge-green">
              👨‍👩‍👧 {owners.length}{' '}
              {owners.length === 1 ? 'responsable' : 'responsables'}
            </span>
            <span className="stats-badge badge-amber">
              ⏳ {pendingAppointmentsCount}{' '}
              {pendingAppointmentsCount === 1
                ? 'cita pendiente'
                : 'citas pendientes'}
            </span>
            <span className="stats-badge badge-indigo">
              📋 {medicalRecords.length}{' '}
              {medicalRecords.length === 1 ? 'nota médica' : 'notas médicas'}
            </span>
          </div>
        </div>

        {/* Barra de navegación con los módulos principales y vista integrada */}
        <nav className="module-tabs" aria-label="Navegación principal de la clínica">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            🏥 Vista Completa (4 Módulos)
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            1. 🐶 Pacientes ({patients.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            2. 📅 Citas ({appointments.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            3. 📋 Historial Clínico ({medicalRecords.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'owners' ? 'active' : ''}`}
            onClick={() => setActiveTab('owners')}
          >
            4. 👨‍👩‍👧 Responsables ({owners.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            5. 🗓️ Últimos 30 días ({recentVisitsCount})
          </button>
        </nav>
      </header>

      <div className="sections-wrapper">
        {/* FUNCIONALIDAD 1: GESTIÓN Y REGISTRO DE PACIENTES */}
        {(activeTab === 'all' || activeTab === 'patients') && (
          <section className="module-block">
            <div className="module-banner">
              <h2>1. 🐾 Gestión y Registro de Pacientes (Mascotas y Responsables)</h2>
            </div>
            <main className="main-container">
              <PatientForm owners={owners} onAddPatient={handleAddPatient} />
              <PatientList
                patients={patients}
                owners={owners}
                medicalRecords={medicalRecords}
                selectedPatientId={selectedPatientId}
                onSelectHistory={handleOpenPatientHistory}
                onOpenOwner={handleOpenOwner}
                onDeletePatient={handleDeletePatient}
              />
            </main>
          </section>
        )}

        {/* FUNCIONALIDAD 2: AGENDAMIENTO Y CONTROL DE CITAS */}
        {(activeTab === 'all' || activeTab === 'appointments') && (
          <section className="module-block">
            <div className="module-banner">
              <h2>2. 📅 Módulo de Agendamiento y Control de Citas / Visitas</h2>
            </div>
            <main className="main-container">
              <AppointmentForm
                patients={patients}
                owners={owners}
                onAddAppointment={handleAddAppointment}
              />
              <AppointmentList
                appointments={appointments}
                patients={patients}
                owners={owners}
                onUpdateStatus={handleUpdateAppointmentStatus}
                onDeleteAppointment={handleDeleteAppointment}
              />
            </main>
          </section>
        )}

        {/* FUNCIONALIDAD 3: HISTORIAL CLÍNICO RÁPIDO Y NOTAS MÉDICAS */}
        {(activeTab === 'all' || activeTab === 'history') && (
          <section className="module-block" id="modulo-historial">
            <div className="module-banner">
              <h2>3. 📋 Historial Clínico Rápido y Notas Médicas por Paciente</h2>
            </div>
            <MedicalHistorySection
              patients={patients}
              owners={owners}
              onOpenOwner={handleOpenOwner}
              selectedPatientId={selectedPatientId}
              onSelectPatient={setSelectedPatientId}
              medicalRecords={medicalRecords}
              onAddMedicalRecord={handleAddMedicalRecord}
              onDeleteMedicalRecord={handleDeleteMedicalRecord}
            />
          </section>
        )}

        {/* FUNCIONALIDAD 4: RESPONSABLES Y SUS MASCOTAS */}
        {(activeTab === 'all' || activeTab === 'owners') && (
          <section className="module-block" id="modulo-responsables">
            <div className="module-banner">
              <h2>4. 👨‍👩‍👧 Responsables y sus Mascotas</h2>
            </div>
            <OwnerList
              owners={owners}
              patients={patients}
              onOpenOwner={handleOpenOwner}
            />
          </section>
        )}

        {/* FUNCIONALIDAD 5: VISITAS DE LOS ÚLTIMOS 30 DÍAS (solo lectura + CSV) */}
        {(activeTab === 'all' || activeTab === 'recent') && (
          <section className="module-block" id="modulo-ultimos-30-dias">
            <div className="module-banner">
              <h2>5. 🗓️ Visitas de los Últimos 30 Días</h2>
            </div>
            <RecentVisits
              appointments={appointments}
              patients={patients}
              owners={owners}
            />
          </section>
        )}
      </div>

      {/* MODAL DE DETALLE DE LA MASCOTA: HISTORIAL CLÍNICO Y RESPONSABLES */}
      {isHistoryModalOpen && (
        <Modal
          label="Historial clínico del paciente"
          onClose={() => setIsHistoryModalOpen(false)}
        >
          <MedicalHistorySection
            patients={patients}
            owners={owners}
            onOpenOwner={handleOpenOwner}
            selectedPatientId={selectedPatientId}
            onSelectPatient={setSelectedPatientId}
            medicalRecords={medicalRecords}
            onAddMedicalRecord={handleAddMedicalRecord}
            onDeleteMedicalRecord={handleDeleteMedicalRecord}
            isModal={true}
            onCloseModal={() => setIsHistoryModalOpen(false)}
          />
        </Modal>
      )}

      {/* MODAL DE DETALLE DEL RESPONSABLE: TODAS SUS MASCOTAS */}
      {openedOwner && (
        <Modal
          label={`Mascotas de ${openedOwner.name}`}
          onClose={() => setOpenedOwnerId(null)}
        >
          <OwnerDetail
            owner={openedOwner}
            ownerPatients={getOwnerPatients(openedOwner, patients)}
            owners={owners}
            onOpenPatient={handleOpenPatientFromOwner}
            onOpenOwner={handleOpenOwner}
            onClose={() => setOpenedOwnerId(null)}
          />
        </Modal>
      )}
    </div>
  );
}
