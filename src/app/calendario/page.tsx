'use client';

import { useEffect, useState, useMemo } from 'react';
import { getVestibularesWithEvents } from '@/app/actions/vestibulares';
import Link from 'next/link';

export default function CalendarioVestibularesPage() {
  const [vestibulares, setVestibulares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterEventType, setFilterEventType] = useState('');

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await getVestibularesWithEvents();
      if (res.success && res.data) {
        setVestibulares(res.data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterType('');
    setFilterState('');
    setFilterEventType('');
  };

  const allEvents = useMemo(() => {
    const list: any[] = [];
    vestibulares.forEach(v => {
      v.events.forEach((e: any) => {
        list.push({ ...e, vestibular: v });
      });
    });
    return list.sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  }, [vestibulares]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      const name = e.vestibular.name.toLowerCase();
      const inst = e.vestibular.institution.toLowerCase();
      const s = search.toLowerCase();
      
      const matchesSearch = !s || name.includes(s) || inst.includes(s);
      const matchesType = !filterType || e.vestibular.type === filterType;
      const matchesState = !filterState || e.vestibular.state === filterState || filterState === "Nacional";
      
      // Match the normalized event type
      let eTypeNormalized = "";
      if (e.type.includes('INSCRI')) eTypeNormalized = 'inscricao';
      else if (e.type.includes('PAG')) eTypeNormalized = 'pagamento';
      else if (e.type.includes('PROVA')) eTypeNormalized = 'prova';
      else if (e.type.includes('RESUL')) eTypeNormalized = 'resultado';
      else if (e.type.includes('MAT')) eTypeNormalized = 'matricula';
      
      const matchesEvent = !filterEventType || eTypeNormalized === filterEventType;

      return matchesSearch && matchesType && matchesState && matchesEvent;
    });
  }, [allEvents, search, filterType, filterState, filterEventType]);

  const getEventClass = (type: string) => {
    if (type.includes('INSCRI')) return 'inscricao';
    if (type.includes('PAG')) return 'pagamento';
    if (type.includes('PROVA')) return 'prova';
    if (type.includes('RESUL')) return 'resultado';
    if (type.includes('MAT')) return 'matricula';
    return '';
  };

  const getEventNameDisplay = (type: string) => {
    if (type.includes('INSCRI')) return 'Inscrições';
    if (type.includes('PAG')) return 'Pagamento';
    if (type.includes('PROVA')) return 'Prova';
    if (type.includes('RESUL')) return 'Resultado';
    if (type.includes('MAT')) return 'Matrícula';
    return type;
  };

  // Calendar logic
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); 
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarCells = [];
  
  // Previous month trailing days
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push({
      day: daysInPrevMonth - startingDayOfWeek + i + 1,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - startingDayOfWeek + i + 1),
      events: []
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(currentYear, currentMonth, i);
    const dayEvents = filteredEvents.filter(e => {
      const ed = new Date(e.dateStart);
      return ed.getDate() === d.getDate() && ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
    });
    calendarCells.push({
      day: i,
      isCurrentMonth: true,
      date: d,
      events: dayEvents
    });
  }
  
  // Next month leading days (fill to 42 cells)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth + 1, i),
      events: []
    });
  }

  // Upcoming events
  const today = new Date();
  today.setHours(0,0,0,0);
  const upcomingEvents = filteredEvents.filter(e => new Date(e.dateStart) >= today).slice(0, 4);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --navy: #0f172a;
          --navy-2: #162033;
          --orange: #f5b000;
          --orange-dark: #d99600;
          --white: #ffffff;
          --bg: #f6f8fb;
          --text: #172033;
          --muted: #64748b;
          --border: #e5eaf1;
          --green: #16a34a;
          --blue: #2563eb;
          --red: #dc2626;
          --purple: #7c3aed;
          --shadow: 0 12px 35px rgba(15, 23, 42, .07);
          --radius: 16px;
        }

        body {
          background: var(--bg);
          color: var(--text);
          line-height: 1.5;
        }

        /* HEADER */
        .topbar {
          background: var(--navy);
          color: white;
          padding: 18px 24px;
        }
        .topbar-inner {
          max-width: 1180px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          font-size: 18px;
        }
        .brand-mark {
          width: 38px;
          height: 38px;
          background: var(--orange);
          border-radius: 10px;
          display: grid;
          place-items: center;
          color: var(--navy);
          font-weight: 900;
        }
        .topbar-link {
          color: rgba(255,255,255,.75);
          text-decoration: none;
          font-size: 14px;
        }

        /* HERO */
        .hero {
          background: radial-gradient(circle at 85% 20%, rgba(245,176,0,.13), transparent 28%), var(--navy);
          color: white;
          padding: 65px 24px 85px;
        }
        .hero-inner {
          max-width: 1180px;
          margin: auto;
          text-align: center;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(245,176,0,.12);
          border: 1px solid rgba(245,176,0,.25);
          color: #ffd66b;
          padding: 7px 13px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .5px;
          margin-bottom: 18px;
        }
        .hero h1 {
          font-size: clamp(32px, 5vw, 54px);
          line-height: 1.08;
          max-width: 800px;
          margin: 0 auto 18px;
          letter-spacing: -1.5px;
          font-weight: 900;
        }
        .hero h1 span { color: var(--orange); }
        .hero p {
          max-width: 690px;
          margin: auto;
          color: rgba(255,255,255,.72);
          font-size: 17px;
        }

        /* MAIN */
        .container {
          max-width: 1180px;
          margin: -35px auto 70px;
          padding: 0 24px;
          position: relative;
        }

        /* FILTERS */
        .filters {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 22px;
          margin-bottom: 28px;
        }
        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 17px;
          gap: 15px;
        }
        .filters-header h2 { font-size: 16px; font-weight: 700; }
        .clear-filters {
          background: none;
          border: none;
          color: var(--blue);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }
        .filter-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 12px;
        }
        .field { position: relative; }
        .field input, .field select {
          width: 100%;
          height: 48px;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0 14px;
          background: #fff;
          color: var(--text);
          outline: none;
          transition: .2s;
        }
        .field input:focus, .field select:focus {
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(245,176,0,.12);
        }

        /* LAYOUT */
        .content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(300px, .75fr);
          gap: 25px;
          align-items: start;
        }
        .section-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: 0 5px 20px rgba(15,23,42,.04);
          overflow: hidden;
        }

        /* CALENDAR */
        .calendar-header {
          padding: 20px 22px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }
        .month-title {
          font-size: 20px;
          font-weight: 800;
          text-transform: capitalize;
        }
        .calendar-actions { display: flex; gap: 7px; }
        .calendar-actions button {
          width: 38px;
          height: 38px;
          border: 1px solid var(--border);
          background: white;
          border-radius: 9px;
          cursor: pointer;
          font-size: 17px;
          display: grid;
          place-items: center;
        }
        .calendar-actions button:hover { background: #f8fafc; }
        .calendar { display: grid; grid-template-columns: repeat(7, 1fr); }
        .weekday {
          padding: 13px 8px;
          text-align: center;
          font-size: 11px;
          font-weight: 800;
          color: var(--muted);
          text-transform: uppercase;
          border-bottom: 1px solid var(--border);
        }
        .day {
          min-height: 105px;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 8px;
          position: relative;
          background: white;
        }
        .day:nth-child(7n) { border-right: none; }
        .day-number {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 5px;
          font-weight: 700;
        }
        .day.today .day-number {
          background: var(--orange);
          color: var(--navy);
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          border-radius: 50%;
        }
        .day.muted { background: #fafbfc; }
        .day.muted .day-number { opacity: .35; }
        .event {
          display: block;
          border-radius: 6px;
          padding: 5px 6px;
          margin-top: 4px;
          font-size: 10px;
          font-weight: 700;
          line-height: 1.25;
          cursor: pointer;
          transition: .15s;
        }
        .event:hover {
          transform: translateY(-1px);
          filter: brightness(.97);
        }
        .event.inscricao { background: #dcfce7; color: #166534; }
        .event.prova { background: #dbeafe; color: #1e40af; }
        .event.pagamento { background: #fef3c7; color: #92400e; }
        .event.resultado { background: #ede9fe; color: #5b21b6; }
        .event.matricula { background: #fee2e2; color: #991b1b; }

        /* LEGEND */
        .legend {
          padding: 16px 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 13px;
          border-top: 1px solid var(--border);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--muted);
          font-size: 11px;
          font-weight: 600;
        }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

        /* UPCOMING EVENTS */
        .upcoming { padding: 20px; }
        .upcoming h2 { font-size: 18px; margin-bottom: 4px; font-weight: 800; }
        .upcoming-subtitle {
          color: var(--muted);
          font-size: 13px;
          margin-bottom: 18px;
        }
        .event-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 11px;
          transition: .2s;
        }
        .event-card:hover {
          border-color: #d6dce5;
          transform: translateY(-1px);
        }
        .event-card-date {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 9px;
        }
        .date-box {
          width: 44px;
          height: 44px;
          border-radius: 9px;
          background: #fff7df;
          display: grid;
          place-items: center;
          color: var(--navy);
          text-align: center;
          line-height: 1;
        }
        .date-box strong { display: block; font-size: 17px; }
        .date-box span {
          display: block;
          font-size: 8px;
          text-transform: uppercase;
          font-weight: 800;
        }
        .event-card h3 { font-size: 13px; margin-bottom: 3px; font-weight: 700; }
        .event-card p { color: var(--muted); font-size: 11px; }
        .event-tag {
          display: inline-block;
          margin-top: 9px;
          padding: 4px 8px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .tag-inscricao { background: #dcfce7; color: #166534; }
        .tag-prova { background: #dbeafe; color: #1e40af; }
        .tag-pagamento { background: #fef3c7; color: #92400e; }
        .tag-resultado { background: #ede9fe; color: #5b21b6; }
        .tag-matricula { background: #fee2e2; color: #991b1b; }

        /* INFO BOX */
        .info-box {
          margin-top: 18px;
          background: var(--navy);
          color: white;
          border-radius: var(--radius);
          padding: 22px;
          position: relative;
          overflow: hidden;
        }
        .info-box::after {
          content: "";
          position: absolute;
          width: 130px;
          height: 130px;
          background: var(--orange);
          opacity: .08;
          border-radius: 50%;
          right: -40px;
          top: -40px;
        }
        .info-box h3 { font-size: 17px; margin-bottom: 7px; font-weight: 800;}
        .info-box p {
          color: rgba(255,255,255,.68);
          font-size: 12px;
          margin-bottom: 15px;
        }
        .info-box a {
          display: inline-block;
          background: var(--orange);
          color: var(--navy);
          text-decoration: none;
          padding: 9px 13px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
        }

        /* FOOTER */
        .page-footer {
          background: var(--navy);
          color: rgba(255,255,255,.55);
          padding: 35px 24px;
          text-align: center;
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .filter-grid { grid-template-columns: 1fr 1fr; }
          .content-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 650px) {
          .topbar { padding: 14px 16px; }
          .topbar-link { display: none; }
          .hero { padding: 45px 18px 65px; }
          .hero p { font-size: 15px; }
          .container { padding: 0 12px; margin-top: -25px; }
          .filters { padding: 16px; }
          .filter-grid { grid-template-columns: 1fr; }
          .calendar-header { padding: 16px; }
          .calendar { overflow-x: auto; }
          .weekday { font-size: 9px; padding: 10px 2px; }
          .day { min-height: 82px; padding: 5px; }
          .day-number { font-size: 10px; }
          .event { font-size: 8px; padding: 4px; }
          .legend { gap: 8px; padding: 12px; }
        }
      `}} />

      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark">S</div>
            Aulas Online Senra
          </div>
          <Link href="/" className="topbar-link">
            Aulas particulares &rarr;
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">
            📅 Atualizado regularmente
          </div>
          <h1>
            Calendário de <span>Vestibulares</span>
          </h1>
          <p>
            Consulte as principais datas de inscrições, pagamentos, provas, resultados e matrículas dos processos seletivos.
          </p>
        </div>
      </section>

      <main className="container">
        {/* FILTERS */}
        <section className="filters">
          <div className="filters-header">
            <h2>Encontre o processo seletivo</h2>
            <button className="clear-filters" onClick={clearFilters}>
              Limpar filtros
            </button>
          </div>

          <div className="filter-grid">
            <div className="field">
              <input
                type="text"
                placeholder="🔎 Buscar instituição..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="field">
              <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">Todos os tipos</option>
                <option value="Vestibular">Vestibular</option>
                <option value="Exame Nacional">Exame nacional</option>
                <option value="Medicina">Medicina</option>
                <option value="Admissão Escolar">Admissão escolar</option>
              </select>
            </div>
            <div className="field">
              <select value={filterState} onChange={e => setFilterState(e.target.value)}>
                <option value="">Todos os estados</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="SP">São Paulo</option>
                <option value="MG">Minas Gerais</option>
                <option value="PR">Paraná</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="SC">Santa Catarina</option>
                <option value="DF">Distrito Federal</option>
                <option value="Nacional">Nacional</option>
              </select>
            </div>
            <div className="field">
              <select value={filterEventType} onChange={e => setFilterEventType(e.target.value)}>
                <option value="">Todas as datas</option>
                <option value="inscricao">Inscrições</option>
                <option value="pagamento">Pagamento</option>
                <option value="prova">Provas</option>
                <option value="resultado">Resultados</option>
                <option value="matricula">Matrículas</option>
              </select>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <div className="content-grid">
          
          {/* CALENDAR */}
          <section className="section-card">
            <div className="calendar-header">
              <div className="month-title">
                {monthNames[currentMonth]} {currentYear}
              </div>
              <div className="calendar-actions">
                <button onClick={previousMonth}>&lsaquo;</button>
                <button onClick={nextMonth}>&rsaquo;</button>
              </div>
            </div>

            <div className="calendar">
              <div className="weekday">Dom</div>
              <div className="weekday">Seg</div>
              <div className="weekday">Ter</div>
              <div className="weekday">Qua</div>
              <div className="weekday">Qui</div>
              <div className="weekday">Sex</div>
              <div className="weekday">Sáb</div>

              {calendarCells.map((cell, idx) => {
                const isToday = cell.date.toDateString() === new Date().toDateString();
                return (
                  <div key={idx} className={`day ${!cell.isCurrentMonth ? 'muted' : ''} ${isToday ? 'today' : ''}`}>
                    <div className="day-number">{cell.day}</div>
                    {cell.events.map((ev: any) => (
                      <div
                        key={ev.id}
                        className={`event ${getEventClass(ev.type)}`}
                        title={`${ev.vestibular.institution} - ${ev.type}`}
                      >
                        {ev.vestibular.institution}
                        <br />
                        {getEventNameDisplay(ev.type)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* LEGEND */}
            <div className="legend">
              <div className="legend-item"><span className="legend-dot" style={{background:'#16a34a'}}></span>Inscrição</div>
              <div className="legend-item"><span className="legend-dot" style={{background:'#2563eb'}}></span>Prova</div>
              <div className="legend-item"><span className="legend-dot" style={{background:'#d97706'}}></span>Pagamento</div>
              <div className="legend-item"><span className="legend-dot" style={{background:'#7c3aed'}}></span>Resultado</div>
              <div className="legend-item"><span className="legend-dot" style={{background:'#dc2626'}}></span>Matrícula</div>
            </div>
          </section>

          {/* UPCOMING EVENTS */}
          <aside>
            <section className="section-card upcoming">
              <h2>Próximas datas</h2>
              <p className="upcoming-subtitle">Os próximos prazos importantes.</p>

              {upcomingEvents.length === 0 ? (
                <p style={{fontSize:'12px', color:'var(--muted)'}}>Nenhuma data próxima encontrada.</p>
              ) : (
                upcomingEvents.map((ev: any) => (
                  <div key={ev.id} className="event-card">
                    <div className="event-card-date">
                      <div className="date-box">
                        <div>
                          <strong>{new Date(ev.dateStart).getDate()}</strong>
                          <span>{monthNames[new Date(ev.dateStart).getMonth()].substring(0,3)}</span>
                        </div>
                      </div>
                      <div>
                        <h3>{ev.vestibular.institution}</h3>
                        <p>{ev.description || getEventNameDisplay(ev.type)}</p>
                      </div>
                    </div>
                    <span className={`event-tag tag-${getEventClass(ev.type)}`}>
                      {getEventNameDisplay(ev.type)}
                    </span>
                  </div>
                ))
              )}
            </section>

            {/* CTA */}
            <div className="info-box">
              <h3>Vai prestar vestibular?</h3>
              <p>Organize sua preparação com aulas particulares e acompanhamento individual.</p>
              <Link href="/">
                Conheça as aulas &rarr;
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <footer className="page-footer">
        &copy; 2026 Aulas Online Senra &middot; Calendário de Vestibulares
      </footer>
    </>
  );
}
