const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/production/recipes',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + process.env.TEST_TOKEN
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const recipes = JSON.parse(data);
    if(recipes.length > 0) {
      const rId = recipes[0].id;
      const opt2 = { ...options, path: '/api/production/recipes/' + rId };
      http.request(opt2, (res2) => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => console.log(JSON.stringify(JSON.parse(data2), null, 2)));
      }).end();
    }
  });
});
req.end();
