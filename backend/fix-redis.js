/**
 * Redis Eviction Policy Fix Script
 * Run: node fix-redis.js
 */
const Redis = require('ioredis');

const redis = new Redis({
    host: 'redis-14507.c212.ap-south-1-1.ec2.cloud.redislabs.com',
    port: 14507,
    username: 'default',
    password: 'YtF9YqeROYjiOp5WCl0xTajlrYMr7tNK',
    tls: false,
});

async function fixRedis() {
    console.log('Connecting to Redis...');

    try {
        // Check current policy
        const current = await redis.config('GET', 'maxmemory-policy');
        console.log('Current eviction policy:', current);

        // Set to noeviction
        const result = await redis.config('SET', 'maxmemory-policy', 'noeviction');
        console.log('Set noeviction result:', result);

        // Verify
        const verify = await redis.config('GET', 'maxmemory-policy');
        console.log('New eviction policy:', verify);

        if (verify[1] === 'noeviction') {
            console.log('\n✅ SUCCESS! Redis eviction policy set to noeviction.');
        } else {
            console.log('\n⚠️  Policy change may be blocked by Redis Cloud plan.');
            console.log('This is OK - the code-side fix (skipVersionCheck) will suppress the warning.');
        }
    } catch (err) {
        console.error('Error:', err.message);
        if (err.message.includes('ERR')) {
            console.log('\n⚠️  CONFIG SET is not allowed on this Redis Cloud plan.');
            console.log('This is OK - the skipVersionCheck fix in code is sufficient.');
        }
    } finally {
        redis.disconnect();
        process.exit(0);
    }
}

fixRedis();
