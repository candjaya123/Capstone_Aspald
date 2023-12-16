Database configuration

file path : src/api/v1/config/database.js

```javascript
module.exports = {
  development: {
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'username',
    password: 'password',
    database: 'db',
  },
  production: {
    dialect: 'postgres',
    host: 'your_production_host',
    port: 5432,
    username: 'your_production_username',
    password: 'your_production_password',
    database: 'your_production_database',
  },
};