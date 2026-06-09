export function buildUrl(base: string, params: Record<string, string | number | null | undefined>) {
    const url = new URL(base, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            url.searchParams.append(key, value.toString());
        }
    });
    return url.pathname + url.search;
}