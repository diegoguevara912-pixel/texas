import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import '../admin/admin.css';
import { api, setCsrf, STATUS_LABEL } from '../lib/api.js';
import { BrandMark } from '../components/Layout.jsx';
import { Field } from '../components/Forms.jsx';
import { VehicleList, VehicleEditor } from './Vehicles.jsx';
import ContentEditor from './Content.jsx';

const AdminCtx = createContext(null);
export const useAdmin = () => useContext(AdminCtx);

export function useToast() {
  const [t, setT] = useState(null);
  const show = useCallback((msg, err) => { setT({ msg, err }); setTimeout(() => setT(null), 3200); }, []);
  const node = t ? <div className={`toast ${t.err ? 'err' : ''}`} role="status">{t.msg}</div> : null;
  return [show, node];
}

export function useLoad(path, deps = []) {
  const [s, setS] = useState({ loading: true, data: null, error: null });
  const reload = useCallback(() => {
    setS((x) => ({ ...x, loading: true }));
    api(path).then((data) => setS({ loading: false, data, error: null })).catch((e) => setS({ loading: false, data: null, error: e.message }));
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(reload, [reload, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return [s, reload];
}

const fmtDate = (d) => (d ? new Date(d).toLocaleString('es-HN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const fmtDay = (d) => (d ? new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('es-HN', { weekday: 'short', day: 'numeric', month: 'short' }) : '—');

function Login({ onLogin }) {
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setErr(null);
    try {
      const r = await api('/admin/login', { method: 'POST', body: { email: fd.get('email'), password: fd.get('password') } });
      setCsrf(r.csrf);
      onLogin(r.user);
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login">
      <form className="panel form" onSubmit={submit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}><BrandMark /><span className="eyebrow">Panel privado</span></div>
        <h1 className="display" style={{ fontSize: 'var(--step-3)' }}>Bienvenido.</h1>
        <Field label="Correo" name="email"><input id="email" name="email" type="email" autoComplete="username" required /></Field>
        <Field label="Contraseña" name="password"><input id="password" name="password" type="password" autoComplete="current-password" required /></Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Verificando…' : 'Iniciar sesión'}</button>
        <p className="muted" style={{ fontSize: '.8rem', margin: 0 }}>La primera cuenta se crea en el servidor con <code>npm run admin:create</code>. No existen contraseñas de demostración.</p>
        <Link to="/" className="muted" style={{ fontSize: '.85rem' }}>← Volver al sitio</Link>
      </form>
    </div>
  );
}

export default function Admin() {
  const [me, setMe] = useState({ loading: true, user: null, can: {} });
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();
  const loadMe = useCallback(async () => {
    try {
      const r = await api('/admin/me');
      setCsrf(r.csrf);
      const p = await api('/admin/me/permissions');
      setMe({ loading: false, user: r.user, can: p.can });
    } catch {
      setMe({ loading: false, user: null, can: {} });
    }
  }, []);
  useEffect(() => { loadMe(); }, [loadMe]);
  const refreshSummary = useCallback(() => api('/admin/summary').then(setSummary).catch(() => {}), []);
  useEffect(() => { if (me.user) refreshSummary(); }, [me.user, refreshSummary]);
  useEffect(() => { document.title = 'Panel privado'; }, []);

  if (me.loading) return <div className="loader-line" />;
  if (!me.user) return <Login onLogin={() => loadMe()} />;

  const logout = async () => { await api('/admin/logout', { method: 'POST' }).catch(() => {}); setCsrf(null); setMe({ loading: false, user: null, can: {} }); navigate('/admin'); };
  const c = me.can;
  return (
    <AdminCtx.Provider value={{ me, refreshSummary }}>
      <div className="adm">
        <aside className="adm-side">
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}><BrandMark /><span className="eyebrow">Panel</span></Link>
          <nav aria-label="Panel">
            <NavLink end to="/admin">Resumen</NavLink>
            {c.vehicles && <NavLink to="/admin/vehiculos">Vehículos</NavLink>}
            {c.leads && <NavLink to="/admin/clientes">Clientes {summary?.leadsNew ? <span className="count">{summary.leadsNew}</span> : null}</NavLink>}
            {c.appointments && <NavLink to="/admin/citas">Citas {summary?.appointmentsRequested ? <span className="count">{summary.appointmentsRequested}</span> : null}</NavLink>}
            {c.financing && <NavLink to="/admin/financiamiento">Financiamiento {summary?.financingNew ? <span className="count">{summary.financingNew}</span> : null}</NavLink>}
            {c.content && <NavLink to="/admin/contenido">Contenido</NavLink>}
            {c.users && <NavLink to="/admin/usuarios">Usuarios</NavLink>}
            <NavLink to="/admin/seguridad">Sesiones</NavLink>
            {c.audit && <NavLink to="/admin/registro">Registro</NavLink>}
          </nav>
          <div style={{ marginTop: 'auto', display: 'grid', gap: '.5rem', fontSize: '.85rem' }}>
            <span className="muted">{me.user.name} · {me.user.role}</span>
            <a href="/" target="_blank" rel="noopener noreferrer" className="muted">Ver sitio ↗</a>
            <button className="btn btn-sm" onClick={logout}>Cerrar sesión</button>
          </div>
        </aside>
        <main className="adm-main">
          <Routes>
            <Route index element={<Dashboard summary={summary} />} />
            <Route path="vehiculos" element={<VehicleList />} />
            <Route path="vehiculos/nuevo" element={<VehicleEditor />} />
            <Route path="vehiculos/:id" element={<VehicleEditor />} />
            <Route path="clientes" element={<Inbox kind="leads" />} />
            <Route path="citas" element={<Inbox kind="appointments" />} />
            <Route path="financiamiento" element={<Inbox kind="financing" />} />
            <Route path="contenido" element={<ContentEditor />} />
            <Route path="usuarios" element={<Users />} />
            <Route path="seguridad" element={<Sessions />} />
            <Route path="registro" element={<Audit />} />
          </Routes>
        </main>
      </div>
    </AdminCtx.Provider>
  );
}

function Dashboard({ summary }) {
  if (!summary) return <div className="skeleton" style={{ height: 200 }} />;
  const v = summary.vehicles;
  return (
    <>
      <div className="adm-head"><h1>Resumen</h1><Link className="btn btn-primary btn-sm" to="/admin/vehiculos/nuevo">+ Agregar vehículo</Link></div>
      <div className="adm-cards">
        <div className="adm-card"><b>{v.available}</b><span>Disponibles</span></div>
        <div className="adm-card"><b>{v.reserved}</b><span>Reservados</span></div>
        <div className="adm-card"><b>{v.sold}</b><span>Vendidos</span></div>
        <div className="adm-card"><b>{v.unpublished}</b><span>No publicados</span></div>
        {summary.leadsNew != null && <Link to="/admin/clientes" className="adm-card"><b>{summary.leadsNew}</b><span>Consultas nuevas</span></Link>}
        {summary.appointmentsRequested != null && <Link to="/admin/citas" className="adm-card"><b>{summary.appointmentsRequested}</b><span>Citas por confirmar</span></Link>}
        {summary.financingNew != null && <Link to="/admin/financiamiento" className="adm-card"><b>{summary.financingNew}</b><span>Solicitudes de financiamiento</span></Link>}
      </div>
      {summary.pending.length > 0 && (
        <div className="pending-note">
          <b>Datos del negocio pendientes:</b> {summary.pending.join(', ')}. <Link to="/admin/contenido" style={{ textDecoration: 'underline' }}>Completar ahora</Link>
        </div>
      )}
    </>
  );
}

const INBOX = {
  leads: {
    title: 'Clientes potenciales',
    path: '/admin/leads',
    statuses: { new: 'Nuevo', contacted: 'Contactado', qualified: 'Calificado', won: 'Compró', lost: 'Perdido', archived: 'Archivado' },
    cols: [
      ['Fecha', (r) => fmtDate(r.created_at)],
      ['Cliente', (r) => (<><b>{r.name}</b><div className="muted mono" style={{ fontSize: '.8rem' }}>{r.phone}{r.whatsapp ? ` · WA ${r.whatsapp}` : ''}</div>{r.email && <div className="muted" style={{ fontSize: '.8rem' }}>{r.email}</div>}</>)],
      ['Consulta', (r) => (<><span className="badge">{({ info: 'Información', quote: 'Cotización', visit: 'Visita', test_drive: 'Prueba', reservation: 'Reserva', inspection: 'Inspección', other: 'Otro' })[r.kind] || r.kind}</span>{r.message && <p className="muted" style={{ margin: '.4rem 0 0', fontSize: '.84rem', maxWidth: 360 }}>{r.message}</p>}</>)],
      ['Ubicación', (r) => [r.city, r.region, r.country].filter(Boolean).join(', ') || '—'],
      ['Comunicaciones', (r) => (r.consent_marketing ? 'Acepta' : 'No')],
    ],
  },
  appointments: {
    title: 'Citas',
    path: '/admin/appointments',
    statuses: { requested: 'Solicitada', confirmed: 'Confirmada', rescheduled: 'Reprogramada', completed: 'Realizada', cancelled: 'Cancelada', no_show: 'No asistió' },
    cols: [
      ['Preferencia', (r) => (<><b>{fmtDay(r.preferred_date)}</b><div className="muted">{r.preferred_slot === 'manana' ? 'Mañana' : 'Tarde'}</div></>)],
      ['Cliente', (r) => (<><b>{r.name}</b><div className="muted mono" style={{ fontSize: '.8rem' }}>{r.phone}</div></>)],
      ['Tipo', (r) => ({ visit: 'Visita', test_drive: 'Prueba de manejo', inspection: 'Inspección' })[r.type]],
      ['Confirmada para', (r, update) => (<input type="datetime-local" className="status-select" defaultValue={r.confirmed_for ? new Date(r.confirmed_for).toISOString().slice(0, 16) : ''} onBlur={(e) => update(r.id, { confirmedFor: e.target.value || null, ...(e.target.value && r.status === 'requested' ? { status: 'confirmed' } : {}) })} aria-label="Fecha confirmada" />)],
    ],
  },
  financing: {
    title: 'Solicitudes de financiamiento',
    path: '/admin/financing',
    statuses: { new: 'Nueva', in_review: 'En revisión', sent_to_entity: 'Enviada a entidad', approved_by_entity: 'Aprobada por entidad', declined_by_entity: 'Rechazada por entidad', withdrawn: 'Retirada' },
    cols: [
      ['Fecha', (r) => fmtDate(r.created_at)],
      ['Solicitante', (r) => (<><b>{r.name}</b><div className="muted mono" style={{ fontSize: '.8rem' }}>{({ whatsapp: 'WhatsApp', phone: 'Tel.', email: 'Correo' })[r.contact_method]}: {r.contact_value}</div></>)],
      ['Monto', (r) => (<span className="mono" style={{ fontSize: '.82rem' }}>Precio {r.vehicle_price ? Number(r.vehicle_price).toLocaleString('es-HN') : '—'}<br />Prima {r.down_payment ? Number(r.down_payment).toLocaleString('es-HN') : '—'}<br />{r.term_months ? `${r.term_months} meses` : ''}</span>)],
      ['Entidad preferida', (r) => r.preferred_bank || 'Sin preferencia'],
      ['Región', (r) => r.region || '—'],
    ],
  },
};

function Notes({ kind, id }) {
  const [s, reload] = useLoad(`${INBOX[kind].path}/${id}/notes`);
  const [text, setText] = useState('');
  const add = async () => {
    if (!text.trim()) return;
    await api(`${INBOX[kind].path}/${id}/notes`, { method: 'POST', body: { body: text } });
    setText('');
    reload();
  };
  return (
    <div style={{ display: 'grid', gap: '.5rem', padding: '.6rem 0' }}>
      {(s.data?.notes || []).map((n) => (<div key={n.id} style={{ fontSize: '.85rem' }}><span className="muted mono" style={{ fontSize: '.72rem' }}>{fmtDate(n.created_at)} · {n.user}</span><div>{n.body}</div></div>))}
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <input className="status-select" style={{ flex: 1, borderRadius: 8 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Nota de seguimiento (visible solo para el equipo)" maxLength={4000} />
        <button className="btn btn-sm" onClick={add}>Guardar nota</button>
      </div>
    </div>
  );
}

function Inbox({ kind }) {
  const cfg = INBOX[kind];
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const [s, reload] = useLoad(`${cfg.path}?page=${page}${status ? `&status=${status}` : ''}`, [status, page]);
  const [toast, toastNode] = useToast();
  const { refreshSummary } = useAdmin();
  const update = async (id, patch) => {
    try { await api(`${cfg.path}/${id}`, { method: 'PATCH', body: patch }); toast('Actualizado'); reload(); refreshSummary(); } catch (e) { toast(e.message, true); }
  };
  const items = s.data?.items || [];
  return (
    <>
      <div className="adm-head">
        <h1>{cfg.title}</h1>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <select className="status-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            {Object.entries(cfg.statuses).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
          </select>
          {kind === 'leads' && <a className="btn btn-sm" href="/api/admin/leads-export.csv">Exportar CSV</a>}
        </div>
      </div>
      {s.error && <p className="form-error">{s.error}</p>}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr>{cfg.cols.map(([h]) => (<th key={h}>{h}</th>))}<th>Vehículo</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {items.map((r) => (
              <FragmentRow key={r.id} r={r} cfg={cfg} update={update} open={open === r.id} toggle={() => setOpen(open === r.id ? null : r.id)} kind={kind} />
            ))}
            {!items.length && !s.loading && <tr><td colSpan={cfg.cols.length + 3} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>No hay registros con este filtro.</td></tr>}
          </tbody>
        </table>
      </div>
      {s.data && s.data.total > s.data.perPage && (
        <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
          <button className="btn btn-sm" disabled={page * s.data.perPage >= s.data.total} onClick={() => setPage(page + 1)}>Siguiente</button>
        </div>
      )}
      {toastNode}
    </>
  );
}

function FragmentRow({ r, cfg, update, open, toggle, kind }) {
  return (
    <>
      <tr>
        {cfg.cols.map(([h, get]) => (<td key={h}>{get(r, update)}</td>))}
        <td>{r.vehicle_code ? <span className="mono" style={{ fontSize: '.8rem' }}>{r.vehicle_brand} {r.vehicle_model} {r.vehicle_year}<br /><span className="muted">{r.vehicle_code}</span></span> : '—'}</td>
        <td>
          <select className="status-select" value={r.status} onChange={(e) => update(r.id, { status: e.target.value })} aria-label="Estado">
            {Object.entries(cfg.statuses).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
          </select>
        </td>
        <td><button className="btn btn-sm" onClick={toggle} aria-expanded={open}>Notas</button></td>
      </tr>
      {open && <tr><td colSpan={cfg.cols.length + 3}><Notes kind={kind} id={r.id} /></td></tr>}
    </>
  );
}

function Users() {
  const [s, reload] = useLoad('/admin/users');
  const [toast, node] = useToast();
  const [err, setErr] = useState({});
  const create = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api('/admin/users', { method: 'POST', body: Object.fromEntries(fd.entries()) });
      e.currentTarget.reset();
      setErr({});
      toast('Usuario creado');
      reload();
    } catch (x) { setErr(x.fields || {}); toast(x.message, true); }
  };
  const patch = async (id, body) => { try { await api(`/admin/users/${id}`, { method: 'PATCH', body }); toast('Actualizado'); reload(); } catch (x) { toast(x.message, true); } };
  return (
    <>
      <div className="adm-head"><h1>Usuarios y roles</h1></div>
      <p className="muted" style={{ maxWidth: '70ch' }}><b>Propietario</b>: todo, incluido usuarios y pagos reales. <b>Administrador</b>: vehículos, clientes, citas, financiamiento, contenido y registro. <b>Ventas</b>: ve vehículos y gestiona clientes, citas y financiamiento.</p>
      <div className="tbl-wrap" style={{ marginBottom: '2rem' }}>
        <table className="tbl">
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Último acceso</th><th>Activo</th></tr></thead>
          <tbody>
            {(s.data?.users || []).map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td><td>{u.email}</td>
                <td><select className="status-select" value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })}><option value="owner">Propietario</option><option value="admin">Administrador</option><option value="sales">Ventas</option></select></td>
                <td>{fmtDate(u.last_login_at)}</td>
                <td><input type="checkbox" checked={!!u.active} onChange={(e) => patch(u.id, { active: e.target.checked })} aria-label="Activo" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="adm-form" onSubmit={create}>
        <section>
          <h2>Agregar usuario</h2>
          <div className="grid3">
            <Field label="Nombre" name="name" error={err.name}><input id="name" name="name" required /></Field>
            <Field label="Correo" name="email" error={err.email}><input id="email" name="email" type="email" required /></Field>
            <Field label="Rol" name="role"><select id="role" name="role" defaultValue="sales"><option value="sales">Ventas</option><option value="admin">Administrador</option><option value="owner">Propietario</option></select></Field>
            <Field label="Contraseña temporal" name="password" error={err.password} hint="Mín. 12 caracteres, mayúsculas, minúsculas y números"><input id="password" name="password" type="password" autoComplete="new-password" required /></Field>
          </div>
          <button className="btn btn-primary btn-sm" style={{ justifySelf: 'start' }}>Crear usuario</button>
        </section>
      </form>
      {node}
    </>
  );
}

function Sessions() {
  const [s, reload] = useLoad('/admin/sessions');
  const [toast, node] = useToast();
  return (
    <>
      <div className="adm-head"><h1>Sesiones activas</h1><button className="btn btn-sm" onClick={async () => { await api('/admin/sessions/revoke-others', { method: 'POST' }); toast('Otras sesiones cerradas'); reload(); }}>Cerrar mis otras sesiones</button></div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Usuario</th><th>Dispositivo</th><th>Inicio</th><th>Expira</th></tr></thead>
          <tbody>{(s.data?.items || []).map((x) => (<tr key={x.id}><td>{x.name}{x.current && <span className="badge" style={{ marginLeft: '.5rem' }}>actual</span>}</td><td className="muted" style={{ fontSize: '.8rem', maxWidth: 380 }}>{x.user_agent}</td><td>{fmtDate(x.created_at)}</td><td>{fmtDate(x.expires_at)}</td></tr>))}</tbody>
        </table>
      </div>
      {node}
    </>
  );
}

function Audit() {
  const [page, setPage] = useState(1);
  const [s] = useLoad(`/admin/audit?page=${page}&perPage=50`, [page]);
  return (
    <>
      <div className="adm-head"><h1>Registro de acciones</h1></div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Elemento</th><th>Detalle</th></tr></thead>
          <tbody>{(s.data?.items || []).map((a) => (<tr key={a.id}><td>{fmtDate(a.created_at)}</td><td>{a.user || '—'}</td><td className="mono" style={{ fontSize: '.8rem' }}>{a.action}</td><td>{a.entity} {a.entity_id}</td><td className="muted mono" style={{ fontSize: '.74rem' }}>{a.meta}</td></tr>))}</tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
        <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
        <button className="btn btn-sm" disabled={(s.data?.items || []).length < 50} onClick={() => setPage(page + 1)}>Siguiente</button>
      </div>
    </>
  );
}

export { STATUS_LABEL, fmtDate };
