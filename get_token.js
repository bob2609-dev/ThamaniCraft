const jwt = require('jsonwebtoken');
const token = jwt.sign({ sub: 'info@thamanicraft.co.tz', roles: ['ROLE_SUPER_ADMIN'], tenant_id: null }, '0d5c317f2a8947d6a5467362a2bb7f5519dbab62fa646872bfb1a415a77242ba', { expiresIn: '1h' });
console.log(token);
