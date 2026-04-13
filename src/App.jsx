import { useState, useEffect, useMemo } from "react";

const PERSONAS = ["Yo", "Hermano 1", "Hermano 2", "Trabajador"];
const COSTO_COMIDA = 25000;

const formatCOP = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const today = () => new Date().toISOString().slice(0, 10);
const mesActual = () => today().slice(0, 7);

const TABS = ["Registro", "Extras", "Pagos", "Dashboard"];

const ICONS = {
  Registro: "🍽️",
  Extras: "🧆",
  Pagos: "💳",
  Dashboard: "📊",
};

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [fecha, setFecha] = useState(today());
  const [mes, setMes] = useState(mesActual());

  const [registros, setRegistros] = useState(() => JSON.parse(localStorage.getItem("cr_registros") || "[]"));
  const [extras, setExtras] = useState(() => JSON.parse(localStorage.getItem("cr_extras") || "[]"));
  const [pagos, setPagos] = useState(() => JSON.parse(localStorage.getItem("cr_pagos") || "[]"));

  useEffect(() => localStorage.setItem("cr_registros", JSON.stringify(registros)), [registros]);
  useEffect(() => localStorage.setItem("cr_extras", JSON.stringify(extras)), [extras]);
  useEffect(() => localStorage.setItem("cr_pagos", JSON.stringify(pagos)), [pagos]);

  const registroHoy = registros.find((r) => r.fecha === fecha);

  const toggleComida = (tipo) => {
    if (registroHoy) {
      setRegistros(registros.map((r) =>
        r.fecha === fecha ? { ...r, [tipo]: !r[tipo] } : r
      ));
    } else {
      setRegistros([...registros, { fecha, desayuno: tipo === "desayuno", almuerzo: tipo === "almuerzo" }]);
    }
  };

  const [extraForm, setExtraForm] = useState({ persona: PERSONAS[0], descripcion: "", costo: "" });

  const agregarExtra = () => {
    if (!extraForm.descripcion || !extraForm.costo) return;
    setExtras([...extras, { id: Date.now(), fecha, ...extraForm, costo: parseInt(extraForm.costo) }]);
    setExtraForm({ persona: PERSONAS[0], descripcion: "", costo: "" });
  };

  const eliminarExtra = (id) => setExtras(extras.filter((e) => e.id !== id));

  const [pagoForm, setPagoForm] = useState({ persona: PERSONAS[0], monto: "", nota: "" });

  const agregarPago = () => {
    if (!pagoForm.monto) return;
    setPagos([...pagos, { id: Date.now(), fecha, mes: fecha.slice(0, 7), ...pagoForm, monto: parseInt(pagoForm.monto) }]);
    setPagoForm({ persona: PERSONAS[0], monto: "", nota: "" });
  };

  const eliminarPago = (id) => setPagos(pagos.filter((p) => p.id !== id));

  const stats = useMemo(() => {
    const regs = registros.filter((r) => r.fecha.startsWith(mes));
    const exts = extras.filter((e) => e.fecha.startsWith(mes));
    const pags = pagos.filter((p) => p.mes === mes);

    const diasConComida = regs.filter((r) => r.desayuno || r.almuerzo).length;
    const totalComida = diasConComida * COSTO_COMIDA;
    const totalExtras = exts.reduce((s, e) => s + e.costo, 0);
    const totalPagado = pags.reduce((s, p) => s + p.monto, 0);
    const totalGeneral = totalComida + totalExtras;
    const saldoPendiente = totalGeneral - totalPagado;

    const extrasPorPersona = {};
    PERSONAS.forEach((p) => {
      const total = exts.filter((e) => e.persona === p).reduce((s, e) => s + e.costo, 0);
      if (total > 0) extrasPorPersona[p] = total;
    });

    const pagosPorPersona = {};
    PERSONAS.forEach((p) => {
      const total = pags.filter((pg) => pg.persona === p).reduce((s, pg) => s + pg.monto, 0);
      if (total > 0) pagosPorPersona[p] = total;
    });

    return { diasConComida, totalComida, totalExtras, totalPagado, totalGeneral, saldoPendiente, extrasPorPersona, pagosPorPersona, regs, exts, pags };
  }, [registros, extras, pagos, mes]);

  const extrasHoy = extras.filter((e) => e.fecha === fecha);

  return (
    <div style={s.app}>
      <header style={s.header}>
        <div style={s.headerTop}>
          <span style={s.logo}>🍱</span>
          <h1 style={s.title}>Casa Tracker</h1>
          <span style={s.mesLabel}>{mes}</span>
        </div>
      </header>

      <main style={s.main}>
        {tab === "Registro" && (
          <TabRegistro
            fecha={fecha} setFecha={setFecha}
            registroHoy={registroHoy} toggleComida={toggleComida}
            registros={registros} formatCOP={formatCOP}
            mes={mes}
          />
        )}
        {tab === "Extras" && (
          <TabExtras
            fecha={fecha} setFecha={setFecha}
            extraForm={extraForm} setExtraForm={setExtraForm}
            agregarExtra={agregarExtra} extrasHoy={extrasHoy}
            eliminarExtra={eliminarExtra} formatCOP={formatCOP}
            extras={extras} mes={mes}
          />
        )}
        {tab === "Pagos" && (
          <TabPagos
            pagoForm={pagoForm} setPagoForm={setPagoForm}
            agregarPago={agregarPago} pagos={pagos}
            eliminarPago={eliminarPago} formatCOP={formatCOP}
            mes={mes} fecha={fecha}
          />
        )}
        {tab === "Dashboard" && (
          <TabDashboard
            stats={stats} formatCOP={formatCOP}
            mes={mes} setMes={setMes}
          />
        )}
      </main>

      <nav style={s.nav}>
        {TABS.map((t) => (
          <button key={t} style={{ ...s.navBtn, ...(tab === t ? s.navActive : {}) }} onClick={() => setTab(t)}>
            <span style={s.navIcon}>{ICONS[t]}</span>
            <span style={s.navLabel}>{t}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function TabRegistro({ fecha, setFecha, registroHoy, toggleComida, registros, formatCOP, mes }) {
  const regsDelMes = registros.filter((r) => r.fecha.startsWith(mes));
  return (
    <div style={s.tabContent}>
      <label style={s.label}>📅 Fecha</label>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={s.input} />

      <div style={s.card}>
        <p style={s.cardTitle}>Comidas del día</p>
        <p style={s.cardSub}>Costo automático: <strong>$25.000</strong> (desayuno + almuerzo)</p>
        <div style={s.row}>
          <ToggleBtn
            label="☀️ Desayuno" active={registroHoy?.desayuno}
            onClick={() => toggleComida("desayuno")}
          />
          <ToggleBtn
            label="🌤️ Almuerzo" active={registroHoy?.almuerzo}
            onClick={() => toggleComida("almuerzo")}
          />
        </div>
        {(registroHoy?.desayuno || registroHoy?.almuerzo) && (
          <p style={s.costo}>✅ {formatCOP(COSTO_COMIDA)} registrado</p>
        )}
      </div>

      <div style={s.card}>
        <p style={s.cardTitle}>📆 Días registrados este mes</p>
        <div style={s.calGrid}>
          {regsDelMes.sort((a, b) => a.fecha.localeCompare(b.fecha)).map((r) => (
            <div key={r.fecha} style={{
              ...s.calDay,
              background: (r.desayuno || r.almuerzo) ? "#22c55e22" : "#f8717122",
              borderColor: (r.desayuno || r.almuerzo) ? "#22c55e" : "#f87171",
            }}>
              <span style={{ fontSize: 11 }}>{r.fecha.slice(8)}</span>
              <span style={{ fontSize: 10 }}>{r.desayuno ? "☀️" : ""}{r.almuerzo ? "🌤" : ""}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabExtras({ fecha, setFecha, extraForm, setExtraForm, agregarExtra, extrasHoy, eliminarExtra, formatCOP, extras, mes }) {
  const extrasDelMes = extras.filter((e) => e.fecha.startsWith(mes));
  return (
    <div style={s.tabContent}>
      <label style={s.label}>📅 Fecha</label>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={s.input} />

      <div style={s.card}>
        <p style={s.cardTitle}>➕ Agregar extra</p>
        <label style={s.label}>Persona</label>
        <select value={extraForm.persona} onChange={(e) => setExtraForm({ ...extraForm, persona: e.target.value })} style={s.input}>
          {PERSONAS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <label style={s.label}>Descripción (ej: fritos, gaseosa)</label>
        <input placeholder="ej: empanadas" value={extraForm.descripcion}
          onChange={(e) => setExtraForm({ ...extraForm, descripcion: e.target.value })} style={s.input} />
        <label style={s.label}>Costo ($)</label>
        <input type="number" placeholder="ej: 3000" value={extraForm.costo}
          onChange={(e) => setExtraForm({ ...extraForm, costo: e.target.value })} style={s.input} />
        <button style={s.btnPrimary} onClick={agregarExtra}>Agregar extra</button>
      </div>

      <div style={s.card}>
        <p style={s.cardTitle}>📋 Extras de hoy ({fecha.slice(8)})</p>
        {extrasHoy.length === 0 && <p style={s.empty}>Sin extras hoy</p>}
        {extrasHoy.map((e) => (
          <div key={e.id} style={s.listItem}>
            <div>
              <span style={s.badge}>{e.persona}</span>
              <span style={{ marginLeft: 6 }}>{e.descripcion}</span>
            </div>
            <div style={s.row}>
              <span style={s.amount}>{formatCOP(e.costo)}</span>
              <button style={s.btnDel} onClick={() => eliminarExtra(e.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <p style={s.cardTitle}>📋 Todos los extras del mes</p>
        {extrasDelMes.length === 0 && <p style={s.empty}>Sin extras este mes</p>}
        {extrasDelMes.sort((a, b) => b.fecha.localeCompare(a.fecha)).map((e) => (
          <div key={e.id} style={s.listItem}>
            <div>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{e.fecha.slice(5)} · </span>
              <span style={s.badge}>{e.persona}</span>
              <span style={{ marginLeft: 6, fontSize: 13 }}>{e.descripcion}</span>
            </div>
            <div style={s.row}>
              <span style={s.amount}>{formatCOP(e.costo)}</span>
              <button style={s.btnDel} onClick={() => eliminarExtra(e.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabPagos({ pagoForm, setPagoForm, agregarPago, pagos, eliminarPago, formatCOP, mes, fecha }) {
  const pagosDelMes = pagos.filter((p) => p.mes === mes);
  return (
    <div style={s.tabContent}>
      <div style={s.card}>
        <p style={s.cardTitle}>💳 Registrar pago</p>
        <label style={s.label}>Persona que paga</label>
        <select value={pagoForm.persona} onChange={(e) => setPagoForm({ ...pagoForm, persona: e.target.value })} style={s.input}>
          {PERSONAS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <label style={s.label}>Monto ($)</label>
        <input type="number" placeholder="ej: 50000" value={pagoForm.monto}
          onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })} style={s.input} />
        <label style={s.label}>Nota (opcional)</label>
        <input placeholder="ej: transferencia Nequi" value={pagoForm.nota}
          onChange={(e) => setPagoForm({ ...pagoForm, nota: e.target.value })} style={s.input} />
        <button style={s.btnPrimary} onClick={agregarPago}>Registrar pago</button>
      </div>

      <div style={s.card}>
        <p style={s.cardTitle}>📋 Pagos de {mes}</p>
        {pagosDelMes.length === 0 && <p style={s.empty}>Sin pagos registrados</p>}
        {pagosDelMes.sort((a, b) => b.fecha.localeCompare(a.fecha)).map((p) => (
          <div key={p.id} style={s.listItem}>
            <div>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{p.fecha.slice(5)} · </span>
              <span style={s.badgeGreen}>{p.persona}</span>
              {p.nota && <span style={{ marginLeft: 6, fontSize: 12, color: "#9ca3af" }}>{p.nota}</span>}
            </div>
            <div style={s.row}>
              <span style={{ ...s.amount, color: "#22c55e" }}>{formatCOP(p.monto)}</span>
              <button style={s.btnDel} onClick={() => eliminarPago(p.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabDashboard({ stats, formatCOP, mes, setMes }) {
  const { diasConComida, totalComida, totalExtras, totalPagado, totalGeneral, saldoPendiente, extrasPorPersona, pagosPorPersona } = stats;
  const pct = totalGeneral > 0 ? Math.min(100, Math.round((totalPagado / totalGeneral) * 100)) : 0;

  const meses = [];
  const d = new Date();
  for (let i = 0; i < 6; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    meses.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <div style={s.tabContent}>
      <div style={s.row}>
        <label style={{ ...s.label, marginBottom: 0 }}>Mes: </label>
        <select value={mes} onChange={(e) => setMes(e.target.value)} style={{ ...s.input, flex: 1, marginBottom: 0 }}>
          {meses.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div style={s.statsGrid}>
        <StatCard label="Días con comida" value={diasConComida} icon="📅" color="#3b82f6" />
        <StatCard label="Total comidas" value={formatCOP(totalComida)} icon="🍽️" color="#8b5cf6" />
        <StatCard label="Total extras" value={formatCOP(totalExtras)} icon="🧆" color="#f59e0b" />
        <StatCard label="Total general" value={formatCOP(totalGeneral)} icon="💰" color="#6366f1" />
        <StatCard label="Pagado" value={formatCOP(totalPagado)} icon="✅" color="#22c55e" />
        <StatCard label="Pendiente" value={formatCOP(saldoPendiente)} icon="⏳" color={saldoPendiente > 0 ? "#ef4444" : "#22c55e"} />
      </div>

      <div style={s.card}>
        <p style={s.cardTitle}>Progreso de pago</p>
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${pct}%`, background: pct >= 100 ? "#22c55e" : "#3b82f6" }} />
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", marginTop: 6 }}>{pct}% pagado</p>
      </div>

      {Object.keys(extrasPorPersona).length > 0 && (
        <div style={s.card}>
          <p style={s.cardTitle}>Extras por persona</p>
          {Object.entries(extrasPorPersona).map(([p, v]) => (
            <div key={p} style={s.listItem}>
              <span style={s.badge}>{p}</span>
              <span style={s.amount}>{formatCOP(v)}</span>
            </div>
          ))}
        </div>
      )}

      {Object.keys(pagosPorPersona).length > 0 && (
        <div style={s.card}>
          <p style={s.cardTitle}>Pagos por persona</p>
          {Object.entries(pagosPorPersona).map(([p, v]) => (
            <div key={p} style={s.listItem}>
              <span style={s.badgeGreen}>{p}</span>
              <span style={{ ...s.amount, color: "#22c55e" }}>{formatCOP(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ ...s.statCard, borderColor: color + "44" }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <p style={{ ...s.statValue, color }}>{value}</p>
      <p style={s.statLabel}>{label}</p>
    </div>
  );
}

function ToggleBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      ...s.toggleBtn,
      background: active ? "#22c55e22" : "#1e293b",
      borderColor: active ? "#22c55e" : "#334155",
      color: active ? "#22c55e" : "#94a3b8",
    }}>
      {label}
    </button>
  );
}

const s = {
  app: { display: "flex", flexDirection: "column", minHeight: "100dvh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'Nunito', sans-serif", maxWidth: 480, margin: "0 auto" },
  header: { background: "#1e293b", padding: "14px 16px 10px", borderBottom: "1px solid #334155", position: "sticky", top: 0, zIndex: 10 },
  headerTop: { display: "flex", alignItems: "center", gap: 10 },
  logo: { fontSize: 26 },
  title: { fontSize: 20, fontWeight: 800, margin: 0, flex: 1 },
  mesLabel: { fontSize: 12, color: "#64748b", background: "#0f172a", padding: "3px 8px", borderRadius: 20 },
  main: { flex: 1, overflowY: "auto", paddingBottom: 80 },
  tabContent: { padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 14 },
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#1e293b", borderTop: "1px solid #334155", display: "flex", zIndex: 20 },
  navBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px 6px", background: "transparent", border: "none", color: "#64748b", cursor: "pointer", gap: 2 },
  navActive: { color: "#3b82f6", borderTop: "2px solid #3b82f6" },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 10, fontWeight: 600 },
  card: { background: "#1e293b", borderRadius: 14, padding: "14px", border: "1px solid #334155" },
  cardTitle: { fontWeight: 700, fontSize: 15, marginBottom: 8, marginTop: 0 },
  cardSub: { fontSize: 12, color: "#94a3b8", marginBottom: 12, marginTop: -4 },
  label: { fontSize: 12, color: "#94a3b8", marginBottom: 4, display: "block" },
  input: { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "9px 12px", fontSize: 14, marginBottom: 10, boxSizing: "border-box" },
  btnPrimary: { width: "100%", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 2 },
  btnDel: { background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "2px 6px" },
  row: { display: "flex", gap: 10, alignItems: "center" },
  toggleBtn: { flex: 1, padding: "12px 8px", borderRadius: 12, border: "1.5px solid", cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "all .2s" },
  costo: { textAlign: "center", color: "#22c55e", fontSize: 14, marginTop: 10 },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1e293b" },
  badge: { background: "#3b82f622", color: "#3b82f6", borderRadius: 20, padding: "2px 8px", fontSize: 12, fontWeight: 700 },
  badgeGreen: { background: "#22c55e22", color: "#22c55e", borderRadius: 20, padding: "2px 8px", fontSize: 12, fontWeight: 700 },
  amount: { fontWeight: 700, fontSize: 14, color: "#e2e8f0" },
  empty: { color: "#64748b", fontSize: 13, textAlign: "center", padding: "10px 0" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  statCard: { background: "#1e293b", borderRadius: 14, padding: "14px 12px", border: "1.5px solid", textAlign: "center" },
  statValue: { fontSize: 16, fontWeight: 800, margin: "4px 0 2px" },
  statLabel: { fontSize: 11, color: "#64748b", margin: 0 },
  progressBar: { height: 12, background: "#0f172a", borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99, transition: "width .5s ease" },
  calGrid: { display: "flex", flexWrap: "wrap", gap: 6 },
  calDay: { width: 38, height: 38, borderRadius: 8, border: "1.5px solid", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
};
