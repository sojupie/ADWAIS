import { useEffect, useState } from 'react';
import { FactPanel } from '../components/common/FactPanel';
import { CollectionPanel } from '../components/common/CollectionPanel';
import { LoadingIcon } from '../components/common/LoadingIcon';
import './Intranet.css';

interface OfficeVisit {
    id: string;
    guestName: string;
    company: string | null;
    logoUrl: string | null;
    visitTime: string;
}

interface OfficeEvent {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startTime: string;
    endTime: string | null;
    eventType: string;
    isImportant: boolean;
}

interface OfficeMessage {
    id: string;
    content: string;
    validFrom: string;
    validUntil: string;
}

//Fetch funktioner
// TODO: ersätt med riktiga endpoints
async function fetchVisits(): Promise<OfficeVisit[]> {
    // Mock data för: fetch('/api/office/visits')
    return [
        { id: '1', guestName: 'Sven Göran', company: 'Tradera', logoUrl: null, visitTime: new Date().toISOString() },
        { id: '2', guestName: 'Erika Persson', company: 'Volvo', logoUrl: null, visitTime: new Date().toISOString() },
    ];
}

async function fetchEvents(): Promise<OfficeEvent[]> {
    // Mock data för: fetch('/api/office/events')
    return [
        { id: '1', title: 'Sprint demo', description: null, location: 'Konferensrum A', startTime: new Date().toISOString(), endTime: null, eventType: 'Meeting', isImportant: true },
        { id: '2', title: '🎂 Marcus födelsedag', description: null, location: null, startTime: new Date().toISOString(), endTime: null, eventType: 'Birthday', isImportant: false },
    ];
}

async function fetchMessages(): Promise<OfficeMessage[]> {
    // Mock data för: fetch('/api/office/messages')
    return [
        { id: '1', content: 'Välkommen till Motillos kontor!', validFrom: new Date().toISOString(), validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    ];
}

// Hjälpfunktioner
function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('sv-SE', { weekday: 'long', month: 'long', day: 'numeric' });
}


// Komponenterna nedan
export function Intranet() {
    const [visits, setVisits] = useState<OfficeVisit[]>([]);
    const [events, setEvents] = useState<OfficeEvent[]>([]);
    const [messages, setMessages] = useState<OfficeMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);

            try {
                const [nextVisits, nextEvents, nextMessages] = await Promise.all([
                    fetchVisits(),
                    fetchEvents(),
                    fetchMessages(),
                ]);

                if (!cancelled) {
                    setVisits(nextVisits);
                    setEvents(nextEvents);
                    setMessages(nextMessages);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Failed to fetch intranet data');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void load();
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <div className="intranet-loading">
                <LoadingIcon />
            </div>
        );
    }

    if (error) {
        return (
            <CollectionPanel title="Intranet">
                <div className="intranet-empty"><span>{error}</span></div>
            </CollectionPanel>
        );
    }

    return (
        <section className="intranet-page" aria-label="Intranet">

            <section className="intranet-kpi-row" aria-label="Tid och datum">
                <FactPanel label="Tid" value={now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })} />
                <FactPanel label="Datum" value={now.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} />
                <FactPanel label="Besök idag" value={visits.length.toString()} />
                <FactPanel label="Händelser" value={events.length.toString()} />
            </section>

            {messages.length > 0 && (
                <CollectionPanel title="Meddelanden">
                    {messages.map(msg => (
                        <div key={msg.id} className="intranet-message">
                            <span>{msg.content}</span>
                            <span className="intranet-message__date">
                                {formatDate(msg.validFrom)} – {formatDate(msg.validUntil)}
                            </span>
                        </div>
                    ))}
                </CollectionPanel>
            )}
            
            <section className="intranet-grid" aria-label="Besök och händelser">
                <CollectionPanel title="Dagens besök">
                    {visits.length === 0 ? (
                        <div className="intranet-empty"><span>Inga besök idag</span></div>
                    ) : (
                        visits.map(visit => (
                            <div key={visit.id} className="intranet-visit">
                                <div className="intranet-visit__info">
                                    <span className="intranet-visit__name">{visit.guestName}</span>
                                    {visit.company && (
                                        <span className="intranet-visit__company">{visit.company}</span>
                                    )}
                                </div>
                                <span className="intranet-visit__time">{formatTime(visit.visitTime)}</span>
                            </div>
                        ))
                    )}
                </CollectionPanel>

                <CollectionPanel title="Veckans händelser">
                    {events.length === 0 ? (
                        <div className="intranet-empty"><span>Inga händelser denna vecka</span></div>
                    ) : (
                        events.map(event => (
                            <div key={event.id} className={`intranet-event ${event.isImportant ? 'intranet-event--important' : ''}`}>
                                <div className="intranet-event__info">
                                    <span className="intranet-event__title">{event.title}</span>
                                    {event.location && (
                                        <span className="intranet-event__location">{event.location}</span>
                                    )}
                                </div>
                                <span className="intranet-event__time">{formatTime(event.startTime)}</span>
                            </div>
                        ))
                    )}
                </CollectionPanel>
            </section>

        </section>
    );
}