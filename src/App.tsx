import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './api/client';
import { Search, Globe, Building2, Calendar, FileText, Download, X, User, DollarSign, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ActivityNotification, TargetInfo } from './api/types';

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
      targets.forEach(t => map.set(t.id, t));
    }
    return map;
  }, [targets]);

  // Fetch Activity Notifications
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      console.log('Starting activity fetch...');
      try {
        const data = await api.getActivityNotifications();
        console.log('Activity fetch success, items:', data.length);
        return data;
      } catch (e) {
        console.error('Activity fetch failed:', e);
        throw e;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  if (activitiesError) {
    console.error('Query error:', activitiesError);
  }

  // Fetch Organizations (we'll fetch register notifications which contain org details)
  const { data: organizations, isLoading: orgsLoading } = useQuery({
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
    if (activeTab === 'activities' && filteredActivities.length > 0) {
      const headers = ['Company', 'Start Date', 'End Date', 'Topic Type', 'Topic Description', 'Targets'];
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

        return [
          `"${a.companyName}"`,
          `"${startDate}"`,
          `"${endDate}"`,
          `"${topics}"`,
          `"${resolvedTargets}"`
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'avoimuus-export.csv');
      document.body.appendChild(link);
      link.click();
    }
  };

  return (
    <div className="container">
      <header>
        <h1>AvoimuusExplorer</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="tab" onClick={handleExport} title="Export CSV">
            <Download size={18} /> Export
          </button>
        </div>
      </header>

      <div className="search-container">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder="Etsi toimijoita, aiheita (esim. 'CER', 'huoltovarmuus')..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'activities' ? 'active' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          <Globe size={16} style={{ marginRight: 6 }} />
          Toimintailmoitukset
        </button>
        <button
          className={`tab ${activeTab === 'organizations' ? 'active' : ''}`}
          onClick={() => setActiveTab('organizations')}
        >
          <Building2 size={16} style={{ marginRight: 6 }} />
          Organisaatiot
        </button>
      </div>

      {activeTab === 'activities' && (
        <div className="content">
          {activitiesLoading ? (
            <div className="loading">Ladataan toimintailmoituksia... (voi kestää hetken)</div>
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
                <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '20px', color: '#94a3b8' }}>
                  Näytetään 100 / {filteredActivities.length} tulosta
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'organizations' && (
        <div className="content">
          {orgsLoading ? (
            <div className="loading">Ladataan organisaatioita...</div>
          ) : (
            <div className="card-grid">
              {filteredOrgs.slice(0, 100).map((org) => (
                <div className="card" key={org.id}>
                  <div className="card-header">
                    <h3>{org.companyName}</h3>
                    <span className="tag">{org.companyId}</span>
                  </div>
                  <div className="card-body">
                    {org.mainIndustry && <p>Toimiala: {org.mainIndustry}</p>}
                    <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>{org.description?.substring(0, 150)}...</p>
                  </div>
                </div>
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
    <div className="card" onClick={onClick}>
      <div className="card-header">
        <h3>{activity.companyName}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#94a3b8' }}>
          <Calendar size={14} /> {dateStr}
        </div>
      </div>

      <div className="card-body">
        {activity.topics?.slice(0, 2).map((topic, i) => (
          <div key={i} style={{ marginBottom: '10px' }}>
            {topic.contactTopicOther && (
              <div style={{ fontWeight: 500, marginBottom: '4px', color: '#e2e8f0' }}>
                {topic.contactTopicOther}
              </div>
            )}
            {topic.title && (
              <div style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>
                Aihe: {topic.title}
              </div>
            )}
          </div>
        ))}

        {targets.length > 0 && (
          <div className="meta">
            <div style={{ display: 'flex', gap: '5px' }}>
              <FileText size={14} style={{ marginTop: '2px' }} />
              <div>
                <span style={{ color: '#94a3b8' }}>Kontaktit:</span><br />
                {targets.slice(0, 3).join(', ')}
                {targets.length > 3 && ` +${targets.length - 3} muuta`}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.8rem', color: '#38bdf8' }}>
          Klikkaa nähdäksesi tiedot &rarr;
        </div>
      </div>
    </div>
  );
}

function DetailsModal({ activity, onClose, targetMap }: { activity: ActivityNotification, onClose: () => void, targetMap: Map<number, TargetInfo> }) {
  // Fix 1: Dates
  const start = activity.term?.reportingStartDate || activity.reportingStartDate;
  const end = activity.term?.reportingEndDate || activity.reportingEndDate;

  const dateStr = start && end
    ? `${format(new Date(start), 'd.M.yyyy')} - ${format(new Date(end), 'd.M.yyyy')}`
    : 'N/A';

  // Fix 3: Currency
  const getAmountLabel = (amount: string) => {
    switch (amount) {
      case 'none': return '0 €';
      case 'minimal': return '< 10 000 €';
      case 'many': return '> 10 000 €';
      default: return amount;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{activity.companyName}</h2>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '5px' }}>
              Y-tunnus: {activity.companyId}
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section" style={{ display: 'flex', gap: '20px', paddingBottom: '20px', borderBottom: '1px solid #334155' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Ajankohta</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={16} /> {dateStr}
              </div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Vaikuttamisen taloudellinen arvo</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <DollarSign size={16} /> {getAmountLabel(activity.activityAmount)}
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h4><FileText size={18} /> Aiheet ja tavoitteet</h4>
            {activity.topics?.map((topic, i) => (
              <div key={i} className="topic-item">
                {topic.contactTopicOther && (
                  <h5 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#fff' }}>{topic.contactTopicOther}</h5>
                )}
                {topic.title && (
                  <p style={{ margin: '0 0 10px 0', color: '#e2e8f0' }}>{topic.title}</p>
                )}

                <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '10px' }}>
                  Tyyppi: {topic.activityType} | {topic.contactTopicType}
                </div>

                {topic.contactedTargets && topic.contactedTargets.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Target size={14} /> Kohdehenkilöt ja -instituutiot
                    </div>
                    <div>
                      {topic.contactedTargets.map((target, j) => {
                        // Fix 2: Resolve names
                        let name = 'Tuntematon';
                        let title = '';
                        let org = '';

                        if (target.contactedTargetId && targetMap.has(target.contactedTargetId)) {
                          const info = targetMap.get(target.contactedTargetId)!;
                          name = info.name;
                          title = info.title || '';
                          org = info.organization;
                        } else {
                          // Fallback
                          name = target.contactedTarget?.fi?.name || 'Tuntematon';
                          title = target.contactedTarget?.fi?.title || '';
                          org = target.contactedTarget?.fi?.organization || '';
                        }

                        const fullLabel = [name, title, org].filter(Boolean).join(', ');

                        return (
                          <span key={j} className="target-chip" title={target.contactMethods.join(', ')}>
                            <User size={12} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
                            {fullLabel}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {activity.description && (
            <div className="modal-section">
              <h4>Lisätiedot</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{activity.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
