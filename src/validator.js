const fs = require('fs');
const csv = require('csv-parser');
const express = require('express');
const multer = require('multer');
const test = 'BookData.csv';
const types = {};
const sqlite3 = require("sqlite3").verbose();
const transform = require('stream-transform');

const cors = require('cors');

const rows = {
  id: 2,
  name_of_table: 'mySchema4',
  schema: '{"properties":{"column1":{"type":"integer","minimum":0,"maximum":100},"column2":{"type":"string","pattern":"^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$"}},"required":["column1","column2"]}',
  required_headers: '["column1","column2"]'
};

// function deepEqual(obj1, obj2) {
//   const keys1 = Object.keys(obj1);
//   const keys2 = Object.keys(obj2);
//   if (keys1.length !== keys2.length) {
//     return false;
//   }

//   for (const key of keys1) {
//     if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
//       return false;
//     }
//   }
//   return true;
// }

// Может быть четыре случая
// 1. Все полностью совпало и схема одинаковая - done
// 2. Названия колонок не совпадают, но остальное одинаково - 
// 3. Название колонок не совпадают, минимумы и максимумы не совпадают, но значения типов совпали
// 4. Названия колонок совпали, но не мин и мак нет, остальное совпало


// function goodCompareFunction(obj1, obj2) {
//   // 1. Все полностью совпало
//   if (deepEqual(obj1, obj2)) {
//       return true;
//   }

//   // 2. Названия колонок не совпадают, но остальное совпадает
//   const values1 = Object.values(obj1).map(prop => JSON.stringify(prop));
//   const values2 = Object.values(obj2).map(prop => JSON.stringify(prop));
//   if (JSON.stringify(values1) === JSON.stringify(values2)) {
//       return true;
//   }

//   // 3. Название колонок не совпадают и порядок не совпадает, но остальное совпадает
//   if (JSON.stringify(values1.sort()) === JSON.stringify(values2.sort())) {
//       return true;
//   }
//   //4. Убираем часть с минимумами и максимумами и сравниваем так
//   Object.keys(obj1).forEach(key => {
//       delete obj1[key].minimum;
//       delete obj1[key].maximum;
//   });

//   const values3 = Object.values(obj1).map(prop => JSON.stringify(prop));
//   if (JSON.stringify(values3) === JSON.stringify(values2)) {
//       return true;
//   } else if (JSON.stringify(values3.sort()) === JSON.stringify(values2.sort())) {
//       return true;
//   }

//   return false;
// }




function downloadTable() {
  //          ПОДКЛЮЧАЕМСЯ К БАЗЕ ДАННЫХ
  let db = new sqlite3.Database('csv_schemas.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log('Connected to the database.');
    });
  db.all('SELECT * FROM mytable', [], (err, rows) => {
      if (err) {
        throw err;
      }
      const result = [];
      rows.forEach((row) => {
        result.push({id: row.id, name_of_table: row.name_of_table, schema: row.schema, required_headers: row.required_headers});
      });
      db.close((err) => {
        if (err) {
          console.error(err.message);
        }
        console.log('Closed the database connection.');
      });
      return result;
    });
  }     


//_______________________________________________//

// CREATE SERVER TO RECIEVE FILES //


// const app = express();

// app.use(cors());

// const upload = multer({ dest: 'uploads/' });

// app.post('/upload', upload.single('file'), (req, res) => {
//   let csvSchema = createSchema(req.file.path);  // Создали схему
//   console.log("We are here");
//   let validSchemas = downloadTable();
//   for (let i of validSchemas) {
//     let flag = goodCompareFunction(csvSchema, i);
//     if (flag) {
//       return flag;
//     } else {
//       let result = "No such schema";
//     }
//   }
//   res.json(csvSchema);
// });

// app.listen(8000, () => {
//   console.log('Server running on port 8000');
// });

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

app.post('/upload', upload.single('file'), (req, res) => {
  console.log('Received a file upload request');
  const columnValues = {}; // object to hold column values

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', function(row) {
      // add row values to object
      for (const column in row) {
        if (!columnValues[column]) {
          columnValues[column] = [];
        }
        columnValues[column].push(row[column]);
      }
    })
    .on('headers', (headers) => {
      // Initialize types object with headers
      headers.forEach((header) => {
        types[header] = {
          integer: 0,
          float: 0,
          string: 0,
          date: 0
        };
      });
    })
    .on('data', (row) => {
      // Analyze each row and update types object
      Object.keys(row).forEach((key) => {
        const value = row[key];
        const valueType = getValueType(value);
        types[key][valueType]++;
      });
    })
    .on('end', () => {
      // Generate schema based on types object
      const schema = generateSchema(types);
      // if (schema.properties.includes('')) {
      //   throw Error("File does not have headers");
      // }
      // console.log(schema);
      // console.log(columnValues);
      console.log(compareRows(rows, schema, columnValues));
      res.send(compareRows(rows, schema, columnValues));
      // Скачали из базы данных все схемы
      
      });
});

app.listen(8000, () => {
  console.log('Server running on port 8000');
});


//_______________________________________//
// VALIDATION FUNCTION //


function getValueType(value) {
  if (value === null || value === undefined || value === '') {
    return 'string';
  } else if (!isNaN(value) && Number.isInteger(+value)) {
    return 'integer';
  } else if (!isNaN(value) && !Number.isNaN(+value)) {
    return 'float';
  } else if (new Date(value).toString() !== 'Invalid Date') {
    return 'date';
  } else {
    return 'string';
  }
}

function generateSchema(types) {
  const schema = {
    properties: {},
    required: []
  };
  Object.keys(types).forEach((key) => {
    const type = getMostCommonType(types[key]);
    const property = { type };
    if (type === 'integer' || type === 'float') {
      property.minimum = getMinimumValue(types[key], type);
      property.maximum = getMaximumValue(types[key], type);
    }
    schema.properties[key] = property;
    if (types[key][type] > 0) {
      schema.required.push(key);
    }
  });
  return schema;
}

function getMostCommonType(typeCounts) {
  const types = Object.keys(typeCounts);
  let mostCommonType = 'string';
  let mostCommonCount = 0;
  types.forEach((type) => {
    if (typeCounts[type] > mostCommonCount) {
      mostCommonType = type;
      mostCommonCount = typeCounts[type];
    }
  });
  return mostCommonType;
}

function getMinimumValue(typeCounts, type) {
  if (type === 'integer') {
    return 0;
  } else {
    let minimum = Infinity;
    Object.keys(typeCounts).forEach((valueType) => {
      if (valueType !== 'string' && valueType !== 'date') {
        const value = +valueType;
        if (value < minimum) {
          minimum = value;
        }
      }
    });
    return minimum;
  }
}

function getMaximumValue(typeCounts, type) {
  if (type === 'integer') {
    return Number.MAX_SAFE_INTEGER;
  } else {
    let maximum = -Infinity;
    Object.keys(typeCounts).forEach((valueType) => {
      if (valueType !== 'string' && valueType !== 'date') {
        const value = +valueType;
        if (value > maximum) {
          maximum = value;
        }
      }
    });
    return maximum;
  }
}

//_____________________________________________________________________________//

//JSON.stringify(schema1) === JSON.stringify(schema2)


function compareRows(row, currentRow, table) {
  // Проверим, что нужные колонки присутствуют в нашей схеме
  let errors = [];
  console.log(JSON.parse(row.required_headers));
  if (!JSON.parse(row.required_headers).every(val => currentRow.required.includes(val))) {
      return {response: "required_headers are not the same",
              error: 'header'};
  }
  // Теперь проверим, что нужные колонки имеют нужный тип данных
  let schema = JSON.parse(rows.schema).properties;
  for (let i = 0; i < JSON.parse(row.required_headers).length; i++) {
      let header = JSON.parse(row.required_headers)[i];
      if (!(schema[header].type === currentRow.properties[header].type)) {
          errors.push(`in the column ${header} the type is ${currentRow.properties[header].type}, but should be ${schema[header].type}`);
      }
  }

  if (errors.length > 0) {
      return {response: errors,
              error: 'type'};
  }


  // Если и тут все ок, то надо проверить, что числа лежат в нужных границах и строки соответствуют паттерну (это сложно)
  for (const item of JSON.parse(row.required_headers)) {
      if (currentRow.properties[item].type === "integer") {
          let res = checkNumbers(table[item], JSON.parse(row.schema).properties[item].minimum, JSON.parse(row.schema).properties[item].maximum, item);
          if (res) {
            return {response: res,
              error: 'number'};
          }
      }
      if (currentRow.properties[item].type === "string") {
          let res = checkStrings(table[item], JSON.parse(row.schema).properties[item].pattern, item);
          if (res) {
              return {response: res,
                      error: 'string'};
          }
      }
  }

  // Если мы добрались сюда, то с табличой все хорошо, возвращаем ОК
  return {response: `Таблица обработа и колонки ${JSON.parse(row.required_headers)} подходят`,
            error: null};
}

// Нужно запихнуть нужную колонку полностью
function checkStrings(tableColumn, pattern, nameOfColumn) {
  const patterned = new RegExp(pattern); 
  let errors = [];
  for (const item of tableColumn) {
      if (!patterned.test(item)) {
        errors.push(`in the column ${nameOfColumn} ${item} does not match the pattern ${patterned}`);
      }
  }
  if (errors.length > 0) {
      return errors;
  }
  return false;
}


function checkNumbers(tableColumn, min, max, nameOfColumn) {
  let errors = [];
  for (const item of tableColumn) {
      if (item < min || item > max) {
        errors.push(`in the column ${nameOfColumn} ${item} is not in the range ${min} - ${max}`);
      }
  }
  if (errors.length > 0) {
      return errors;
  }
  return false;
}



// Создавать таблицу как объект при передаче ее в сервере