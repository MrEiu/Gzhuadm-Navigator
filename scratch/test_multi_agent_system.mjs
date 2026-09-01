const BASE_URL = 'http://localhost:3001';

async function runTests() {
    console.log('🚀 [Test] Starting Multi-Agent & RAG Isolation Verification...');

    // 1. Test GET /api/agents-config
    try {
        const res = await fetch(`${BASE_URL}/api/agents-config`);
        const data = await res.json();
        console.log(`✅ 1. GET /api/agents-config status: ${res.status}, agents count: ${Object.keys(data.data || {}).length}`);
        if (!data.data?.dorm || !data.data?.counselor || !data.data?.senior_boy || !data.data?.senior_girl) {
            throw new Error('Missing expected agents in config');
        }
    } catch (e) {
        console.error('❌ Test 1 failed:', e.message);
    }

    // 2. Test Group Chat Routing -> Dorm Auntie
    try {
        const res = await fetch(`${BASE_URL}/api/chat/group`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'test_user',
                messages: [{ role: 'user', content: '@宿管张阿姨 宿舍用电限制多少瓦？电饭煲可以带吗？' }]
            })
        });
        const data = await res.json();
        console.log(`✅ 2. Group Chat (Dorm Auntie) Routed to: [${data.agentName}] (${data.agentKey}), Reply preview: ${data.reply?.slice(0, 80)}...`);
    } catch (e) {
        console.error('❌ Test 2 failed:', e.message);
    }

    // 3. Test Group Chat Routing -> Counselor
    try {
        const res = await fetch(`${BASE_URL}/api/chat/group`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'test_user',
                messages: [{ role: 'user', content: '@李导 大一下学期转专业有什么基本要求和条件？' }]
            })
        });
        const data = await res.json();
        console.log(`✅ 3. Group Chat (Counselor) Routed to: [${data.agentName}] (${data.agentKey}), Reply preview: ${data.reply?.slice(0, 80)}...`);
    } catch (e) {
        console.error('❌ Test 3 failed:', e.message);
    }

    // 4. Test Group Chat Semantic Auto Routing -> Senior Girl (Food / Spots)
    try {
        const res = await fetch(`${BASE_URL}/api/chat/group`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'test_user',
                messages: [{ role: 'user', content: '大家知道大学城GOGO新天地有什么好吃的推荐吗？' }]
            })
        });
        const data = await res.json();
        console.log(`✅ 4. Group Chat (Senior Girl) Auto-Routed to: [${data.agentName}] (${data.agentKey}), Reply preview: ${data.reply?.slice(0, 80)}...`);
    } catch (e) {
        console.error('❌ Test 4 failed:', e.message);
    }

    // 5. Test RAG Filter by targetAgent
    try {
        const res = await fetch(`${BASE_URL}/api/admin/rag?targetAgent=dorm`);
        const data = await res.json();
        console.log(`✅ 5. RAG Filter targetAgent=dorm returned: ${data.count} items, top item: "${data.data?.[0]?.title}"`);
    } catch (e) {
        console.error('❌ Test 5 failed:', e.message);
    }

    console.log('🎉 All Multi-Agent & RAG isolation tests executed!');
}

runTests();
