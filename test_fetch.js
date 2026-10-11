const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://admin.thamanicraft.co.tz:8090/api/admin/configs');
    console.log("SUCCESS:", typeof res.data, res.data);
  } catch (e) {
    console.log("ERROR:", e.message);
  }
}
run();
