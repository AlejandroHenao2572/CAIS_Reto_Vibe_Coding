import React from 'react';
import {
  buildVisitsCsv,
  downloadCsv,
  formatGuardians,
  getRecentVisits,
  getVisitDetails,
  toLocalDateString,
} from '../utils/visits';

const STATUS_BADGES = {
  Pendiente: { badgeClass: 'status-pendiente', label: '⏳ Pendiente' },
  Completada: { badgeClass: 'status-completada', label: '✅ Completada' },
  Cancelada: { badgeClass: 'status-cancelada', label: '❌ Cancelada' },
};

export default function RecentVisits({ appointments, patients, owners = [] }) {
  const today = new Date();
  const visits = getRecentVisits(appointments, today);

  const handleExport = () => {
    downloadCsv(
      `visitas_ultimos_30_dias_${toLocalDateString(today)}.csv`,
      buildVisitsCsv(visits, patients, owners)
    );
  };

  return (
    <section className="recent-visits">
      <div className="list-header">
        <div className="list-header-top">
          <div>
            <h2 className="panel-title">Visitas de los últimos 30 días</h2>
            <p className="panel-subtitle" style={{ marginBottom: 0 }}>
              {visits.length} {visits.length === 1 ? 'visita' : 'visitas'} entre hoy y los
              29 días anteriores (las citas futuras no se incluyen).
            </p>
          </div>
          <button
            type="button"
            className="btn-history"
            onClick={handleExport}
            disabled={visits.length === 0}
          >
            ⬇ Exportar CSV
          </button>
        </div>
      </div>

      {visits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗓️</div>
          <h3>No hay visitas en los últimos 30 días</h3>
          <p>Las citas con fecha dentro de ese rango aparecerán aquí.</p>
        </div>
      ) : (
        <div className="visits-table-wrapper">
          <table className="visits-table">
            <thead>
              <tr>
                <th>Mascota</th>
                <th>Responsable(s)</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Motivo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => {
                const { petName, guardians } = getVisitDetails(visit, patients, owners);
                const status = STATUS_BADGES[visit.status] || STATUS_BADGES.Pendiente;
                return (
                  <tr key={visit.id}>
                    <td>{petName}</td>
                    <td>{formatGuardians(guardians)}</td>
                    <td>{visit.date}</td>
                    <td>{visit.time}</td>
                    <td>{visit.reason}</td>
                    <td>
                      <span className={`status-badge ${status.badgeClass}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
