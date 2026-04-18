const normalizeUrl = (url) => String(url || '').trim().replace(/\/$/, '');

const envBackendUrl = normalizeUrl(import.meta.env.VITE_BACKEND_URL);
const browserHost = window.location.hostname;
const isLocalHost = browserHost === 'localhost' || browserHost === '127.0.0.1';

const localCandidates = [
    `http://${browserHost}:5000`,
    `http://${browserHost}:5001`
];

let resolvedBackendUrl = envBackendUrl || null;
let resolvingPromise = null;

async function isReachable(baseUrl) {
    try {
        const res = await fetch(`${baseUrl}/`, { method: 'GET' });
        return res.ok;
    } catch {
        return false;
    }
}

export async function getBackendBaseUrl() {
    if (resolvedBackendUrl) {
        return resolvedBackendUrl;
    }

    if (resolvingPromise) {
        return resolvingPromise;
    }

    const candidates = isLocalHost ? localCandidates : [`http://${browserHost}:5000`];

    resolvingPromise = (async () => {
        for (const candidate of candidates) {
            if (await isReachable(candidate)) {
                resolvedBackendUrl = candidate;
                return candidate;
            }
        }

        throw new Error('Backend server is not reachable. Start backend or set VITE_BACKEND_URL.');
    })();

    try {
        return await resolvingPromise;
    } finally {
        resolvingPromise = null;
    }
}
