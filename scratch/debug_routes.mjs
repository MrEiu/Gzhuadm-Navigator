async function debug() {
    try {
        const res = await fetch('http://127.0.0.1:3001/api/health');
        console.log('Health status:', res.status);
        console.log('Health content-type:', res.headers.get('content-type'));
        console.log('Health body:', (await res.text()).slice(0, 200));

        const res2 = await fetch('http://127.0.0.1:3001/api/agents-config');
        console.log('Agents-config status:', res2.status);
        console.log('Agents-config content-type:', res2.headers.get('content-type'));
        console.log('Agents-config body:', (await res2.text()).slice(0, 200));
    } catch (e) {
        console.error('Debug failed:', e);
    }
}
debug();
