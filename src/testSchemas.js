// const sqlite3 = require('sqlite3').verbose();

// const schemaName = 'mySchema3';
// const newSchema = {
//   properties: {
//     column1: { type: 'integer', minimum: 0, maximum: 100 },
//     column2: { type: 'string', pattern: "/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/" },
//     column3: { type: 'boolean' },
//     column4: { type: 'string', format: 'date-time' },
//     column5: { type: 'number' },
//   },
//   required: ['column1', 'column2', 'column3'],
// };
// const schemaString = JSON.stringify(newSchema);

// const db = new sqlite3.Database('csv_schemas.db');

// db.serialize(() => {
//   db.run(`
//     CREATE TABLE IF NOT EXISTS myTable (
//       id INTEGER PRIMARY KEY,
//       name_of_table TEXT,
//       schema TEXT,
//       required_headers TEXT
//     )
//   `);

//   db.run(
//     'INSERT INTO myTable (name_of_table, schema, required_headers) VALUES (?, ?, ?)',
//     [schemaName, schemaString, JSON.stringify(newSchema.required)],
//     (err) => {
//       if (err) {
//         console.error(err);
//         return;
//       }
//       console.log('Schema created successfully');
//     }
//   );
// });

// db.close();


// ADD schema to database

// const schemaName = 'mySchema4';

// const newSchema = {
//   properties: {
//     column1: { type: 'integer', minimum: 0, maximum: 100 },
//     column2: { type: 'string', pattern: "/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/" },
//   },
//   required: ['column1', 'column2'],
// };

// const schemaString = JSON.stringify(newSchema);

// db.run('INSERT INTO myTable (name_of_table, schema, required_headers) VALUES (?, ?, ?)', [schemaName, schemaString, JSON.stringify(newSchema.required)], (err) => {
//   if (err) {
//     console.error(err);
//     return;
//   }

//   console.log('Schema created successfully');
// });



// Connect to the database
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('csv_schemas.db');

// Query the data from the table
db.all('SELECT * FROM myTable', [], (err, rows) => {
  if (err) {
    throw err;
  }
  // Log the rows
  console.log(rows);
});

// Close the database connection
db.close();

