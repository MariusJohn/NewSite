// ecosystem.config.js
module.exports = { 
    apps : [{
      name   : "newsite",
      script : "./app.mjs",
      interpreter : "node",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }]
  };