import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './api/client';
import { Search, Globe, Building2, Calendar, FileText, Download, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { ActivityNotification, TargetInfo } from './api/types';
import { DetailsModal } from './components/DetailsModal';

function App() {
  const [activeTab, setActiveTab] = useState<'activities' | 'organizations'>('activities');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<ActivityNotification | null>(null);

  // Fetch Targets (lookup for names)
  const { data: targets } = useQuery({
    queryKey: ['targets'],
    queryFn: api.getTargets,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Create lookup map for targets
  const targetMap = useMemo(() => {
    const map = new Map<number, TargetInfo>();
    if (targets) {
      targets.forEach(t => {
        // Prefer FI, then SV, then EN
        const info = t.fi || t.sv || t.en;
        if (info) {
          map.set(t.id, info);
        }
      });
    }
    return map;
  }, [targets]);

  // Fetch Activity Notifications
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      return api.getActivityNotifications();
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  // Fetch Organizations (we'll fetch register notifications which contain org details)
  const { data: organizations, isLoading: orgsLoading, error: orgsError } = useQuery({
    queryKey: ['organizations'],
    queryFn: api.getRegisterNotifications,
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: activeTab === 'organizations',
  });

  // Filter Activities
  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    if (!searchTerm) return activities;
    const lowerTerm = searchTerm.toLowerCase();

    return activities.filter(a => {
      // Check company name
      if (a.companyName.toLowerCase().includes(lowerTerm)) return true;
      // Check topics
      if (a.topics) {
        return a.topics.some(t =>
          (t.contactTopicOther && t.contactTopicOther.toLowerCase().includes(lowerTerm)) ||
          (t.title && t.title.toLowerCase().includes(lowerTerm))
        );
      }
      return false;
    });
  }, [activities, searchTerm]);

  // Filter Organizations
  const filteredOrgs = useMemo(() => {
    if (!organizations) return [];
    if (!searchTerm) return organizations;
    const lowerTerm = searchTerm.toLowerCase();

    return organizations.filter(o =>
      o.companyName.toLowerCase().includes(lowerTerm) ||
      (o.companyId && o.companyId.includes(lowerTerm))
    );
  }, [organizations, searchTerm]);

  // CSV Export
  const handleExport = () => {
    if (activeTab === 'organizations' && filteredOrgs.length > 0) {
      const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const rows = filteredOrgs.map(org => [org.companyName, org.companyId, org.mainIndustry, org.description].map(csvEscape).join(','));
      const blob = new Blob([[['Organisaatio', 'Y-tunnus', 'Toimiala', 'Kuvaus'].map(csvEscape).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'avoimuus-organisaatiot.csv';
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    if (activeTab === 'activities' && filteredActivities.length > 0) {
      const headers = ['Yritys', 'Alkupäivä', 'Loppupäivä', 'Aiheet', 'Kohteet'];
      const rows = filteredActivities.map(a => {
        const topics = a.topics?.map(t => `${t.contactTopicOther || t.title}`).join('; ') || '';
        // Resolve target names if possible, otherwise empty
        const resolvedTargets = a.topics?.flatMap(t =>
          t.contactedTargets?.map(ct => {
            // For export, we try to lookup the name using the map
            const lookup = ct.contactedTargetId ? targetMap.get(ct.contactedTargetId) : null;
            // If lookup found, use it. If not, try embedded info. If that fails, empty string.
            if (lookup) return `${lookup.name} (${lookup.organization})`;
            return ct.contactedTarget?.fi?.name || '';
          })
        ).filter(Boolean).join('; ') || '';

        const startDate = a.term?.reportingStartDate || a.reportingStartDate || '';
        const endDate = a.term?.reportingEndDate || a.reportingEndDate || '';

        const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        return [a.companyName, startDate, endDate, topics, resolvedTargets].map(csvEscape).join(',');
      });

      const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const csvContent = [[...headers].map(csvEscape).join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'avoimuus-export.csv');
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="container">
      <header className="topbar">
        <a className="brand" href="#" aria-label="AvoimuusExplorer etusivu">
          <span className="brand-mark"><Landmark size={20} /></span>
          <span><strong>Avoimuus</strong><small>Explorer</small></span>
        </a>
        <button className="export-button" onClick={handleExport} title="Vie näkyvät tulokset CSV-tiedostoon" disabled={activeTab === 'activities' ? filteredActivities.length === 0 : filteredOrgs.length === 0}>
          <Download size={16} /> Vie tulokset
        </button>
      </header>

      <section className="intro">
        <div className="eyebrow">SUOMEN AVOIMUUSREKISTERI</div>
        <h1>Seuraa vaikuttamista.<br /><span>Ymmärrä, ketkä keskustelevat.</span></h1>
        <p>Hae yritysten toimintailmoituksia ja rekisteröityjä organisaatioita yhdestä paikasta.</p>
      </section>

      <div className="search-container">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder="Hae yritystä, aihetta tai Y-tunnusta…"
          aria-label="Hae yritystä, aihetta tai Y-tunnusta"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="list-toolbar">
      <div className="tabs" role="tablist" aria-label="Tietosisältö">
        <button
          className={`tab ${activeTab === 'activities' ? 'active' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          <Globe size={16} />
          Toimintailmoitukset
        </button>
        <button
          className={`tab ${activeTab === 'organizations' ? 'active' : ''}`}
          onClick={() => setActiveTab('organizations')}
        >
          <Building2 size={16} />
          Organisaatiot
        </button>
      </div>
      <span className="result-count">{activeTab === 'activities' ? filteredActivities.length : filteredOrgs.length} tulosta</span>
      </div>

      {activeTab === 'activities' && (
        <div className="content">
          {activitiesLoading ? (
            <div className="state-card"><span className="spinner" /><strong>Ladataan toimintailmoituksia</strong><p>Tietojen haku voi kestää hetken.</p></div>
          ) : activitiesError ? (
            <div className="state-card"><strong>Tietojen lataus epäonnistui</strong><p>Tarkista verkkoyhteys ja yritä myöhemmin uudelleen.</p></div>
          ) : filteredActivities.length === 0 ? (
            <div className="state-card"><Search size={22} /><strong>Ei hakua vastaavia ilmoituksia</strong><p>Kokeile toista hakusanaa tai tyhjennä haku.</p></div>
          ) : (
            <div className="card-grid">
              {filteredActivities.slice(0, 100).map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  targetMap={targetMap}
                  onClick={() => setSelectedActivity(activity)}
                />
              ))}
              {filteredActivities.length > 100 && (
                <div className="more-results">
                  Näytetään 100 ensimmäistä tulosta / {filteredActivities.length}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'organizations' && (
        <div className="content">
          {orgsLoading ? (
            <div className="state-card"><span className="spinner" /><strong>Ladataan organisaatioita</strong></div>
          ) : orgsError ? (
            <div className="state-card"><strong>Organisaatioiden lataus epäonnistui</strong><p>Tarkista verkkoyhteys ja yritä myöhemmin uudelleen.</p></div>
          ) : filteredOrgs.length === 0 ? (
            <div className="state-card"><Search size={22} /><strong>Ei hakua vastaavia organisaatioita</strong><p>Kokeile toista hakusanaa.</p></div>
          ) : (
            <div className="card-grid">
              {filteredOrgs.slice(0, 100).map((org) => (
                <article className="card org-card" key={org.id}>
                  <div className="card-header">
                    <h3>{org.companyName}</h3>
                    <span className="tag">{org.companyId}</span>
                  </div>
                  <div className="card-body">
                    {org.mainIndustry && <p>Toimiala: {org.mainIndustry}</p>}
                    {org.description && <p className="org-description">{org.description.substring(0, 150)}{org.description.length > 150 ? '…' : ''}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedActivity && (
        <DetailsModal
          activity={selectedActivity}
          targetMap={targetMap}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
}

function ActivityCard({ activity, onClick, targetMap }: { activity: ActivityNotification, onClick: () => void, targetMap: Map<number, TargetInfo> }) {
  // Fix 1: Use nested term dates if available
  const startDate = activity.term?.reportingStartDate || activity.reportingStartDate;
  const dateStr = startDate ? format(new Date(startDate), 'd.M.yyyy') : 'N/A';

  // Fix 2: Resolve targets using map
  const targets = Array.from(new Set(
    activity.topics?.flatMap(t =>
      t.contactedTargets?.map(ct => {
        // Try lookup by ID
        if (ct.contactedTargetId && targetMap.has(ct.contactedTargetId)) {
          return targetMap.get(ct.contactedTargetId)?.name;
        }
        // Fallback to embedded info if exists (usually null for these)
        return ct.contactedTarget?.fi?.name;
      })
    ).filter(Boolean) as string[]
  ));

  return (
    <button className="card activity-card" onClick={onClick} aria-label={`Avaa ilmoituksen tiedot: ${activity.companyName}`}>
      <div className="card-header">
        <h3>{activity.companyName}</h3>
        <div className="date-label">
          <Calendar size={14} /> {dateStr}
        </div>
      </div>

      <div className="card-body">
        {activity.topics?.slice(0, 2).map((topic, i) => (
          <div key={i} className="topic-preview">
            {topic.contactTopicOther && (
              <strong>
                {topic.contactTopicOther}
              </strong>
            )}
            {topic.title && (
              <em>
                Aihe: {topic.title}
              </em>
            )}
          </div>
        ))}

        {targets.length > 0 && (
          <div className="meta">
            <div style={{ display: 'flex', gap: '8px' }}>
              <FileText size={14} className="meta-icon" />
              <div>
                <span>Kontaktit: </span>
                {targets.slice(0, 3).join(', ')}
                {targets.length > 3 && ` +${targets.length - 3} muuta`}
              </div>
            </div>
          </div>
        )}

        <div className="card-cta">
          <span>Avaa ilmoituksen tiedot</span><span aria-hidden="true">→</span>
        </div>
      </div>
    </button>
  );
}


export default App;
