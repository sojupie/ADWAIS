export function normalizeStatus(status?: string | number | null): string {
    if (status === undefined || status === null) return 'UNKNOWN';
    const s = status.toString().toUpperCase().trim();
    if (s === '1' || s === 'STARTING' || s === 'NOT CHECKED YET' || s === 'NOT CHECKED') return 'STARTING';
    if (s === '2' || s === 'UP') return 'UP';
    if (s === '8' || s === '9' || s === 'DOWN' || s === 'SEEMS DOWN' || s === 'CRITICAL') return 'DOWN';
    if (s === '0' || s === 'PAUSED') return 'PAUSED';
    return 'UNKNOWN';
}