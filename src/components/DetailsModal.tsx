import { useEffect } from 'react';
import { X, Calendar, FileText, Target, User } from 'lucide-react';
import { format } from 'date-fns';
import { ActivityNotification, TargetInfo } from '../api/types';

interface DetailsModalProps {
    activity: ActivityNotification;
    onClose: () => void;
    targetMap: Map<number, TargetInfo>;
}

export function DetailsModal({ activity, onClose, targetMap }: DetailsModalProps) {
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

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

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
                                {getAmountLabel(activity.activityAmount)}
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

                                                // Debug
                                                if (j === 0) console.log(`Processing target ${target.id}, contactedTargetId: ${target.contactedTargetId}, inMap: ${targetMap.has(Number(target.contactedTargetId))}`);

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
