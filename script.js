const https = require('https');

const { CF_API_TOKEN, CF_ZONE_ID, CF_DOMAIN } = process.env;

async function run() {
    console.log(`正在更新域名: ${CF_DOMAIN}`);
    
    // 1. 获取 DNS 记录 ID
    const listOptions = {
        hostname: 'api.cloudflare.com',
        path: `/client/v4/zones/${CF_ZONE_ID}/dns_records?name=${CF_DOMAIN}`,
        headers: { 'Authorization': `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' }
    };

    https.get(listOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            const json = JSON.parse(data);
            if (json.result && json.result.length > 0) {
                const recordId = json.result[0].id;
                // 2. 更新 IP（这里先填一个官方推荐 IP 104.18.2.161 测试，通了以后你可以换成测速结果）
                updateRecord(recordId, '104.18.2.161');
            } else {
                console.error("错误：未找到解析记录。请先在 Cloudflare 手动添加一条 speed 的 A 记录，并关闭小云朵。");
            }
        });
    });
}

function updateRecord(id, ip) {
    const payload = JSON.stringify({ type: 'A', name: CF_DOMAIN, content: ip, ttl: 60, proxied: false });
    const req = https.request({
        hostname: 'api.cloudflare.com',
        path: `/client/v4/zones/${CF_ZONE_ID}/dns_records/${id}`,
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${CF_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    }, (res) => {
        res.on('data', () => console.log(`成功！已将 ${CF_DOMAIN} 指向 ${ip}`));
    });
    req.write(payload);
    req.end();
}

run();
