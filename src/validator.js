const fs = require('fs');
const csv = require('csv-parser');
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const types = {};

const cors = require('cors');

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
        columnValues[column].push(row[column]); // Обработали таблцу чтобы передавать ее дальше
      }
    })
    .on('headers', (headers) => {
      console.log(headers);
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
      Object.keys(row).forEach((key) => {
        const value = row[key];
        const valueType = getValueType(value);
        types[key][valueType]++;
      });
    })
    .on('end', () => {
      const schema = generateSchema(types); 
      // Сгенерировали схему для текущей таблицы (а где таблица)
      axios.get('http://localhost:3001/tables')
      .then(response => {
        let errors = [];
        for (let i = 0; i < response.data.length; i++) {
          errors = compareRows(response.data[i], schema, columnValues, errors);
          //console.log(response.data[i].name);
          errors[i].name = response.data[i].name;
        }
        console.log(errors);
        res.send(errors);

      })
      .catch(error => {
        console.error(error);
      });
      });
});

app.post('/uploadedTable', upload.single('file'), (req, res) => {
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
        columnValues[column].push(row[column]); // Обработали таблцу чтобы передавать ее дальше
        console.log(columnValues);
      }
    })
    .on('headers', (headers) => {
      //console.log(headers);
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
      Object.keys(row).forEach((key) => {
        const value = row[key];
        const valueType = getValueType(value);
        types[key][valueType]++;
      });
    })
    .on('end', () => {
      const schema = generateSchema(types); 
      // Сгенерировали схему для текущей таблицы (а где таблица)
      axios.get('http://localhost:3001/uploadedTables')
      .then(response => {
        let errors = [];
        for (let i = 0; i < response.data.length; i++) {
          errors = compareRows(response.data[i], schema, columnValues, errors);
          //console.log(response.data[i].name);
          errors[i].name = response.data[i].name;
        }
        console.log(errors);
        res.send(errors);

      })
      .catch(error => {
        console.error(error);
      });
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



function compareRows(row, currentRow, table, errors) { // Передавать сразу table.schema
  // Проверим, что нужные колонки присутствуют в нашей схеме
  let result = [];
  if (!currentRow.required.every(val => row.required.includes(val))) {
    errors.push(
      {error: 'Названия колонок',
          message: `Ожидаются колонки ${row.required}, вместо них получены ${currentRow.required}`});
      return errors;
  }
  // Теперь проверим, что нужные колонки имеют нужный тип данных
  let schema = row.schema;
  for (let i = 0; i < row.required.length; i++) {
      let header = row.required[i];
      if (!(schema[header].type === currentRow.properties[header].type)) {
        result.push(`В колонке ${header} тип данных ${currentRow.properties[header].type}, ожидается ${schema[header].type}`);
      }
  }

  if (result.length > 0) {
    errors.push(
      {error : "Типы данных",
      message : result});
  }


  // Если и тут все ок, то надо проверить, что числа лежат в нужных границах и строки соответствуют паттерну (это сложно)
  for (const item of row.required) {
      if (currentRow.properties[item].type === "integer" || currentRow.properties[item].type === "float") {
          let res = checkNumbers(table[item], schema[item].minimum, schema[item].maximum, item);
          if (res) {
            result.push(res);
          }
      }
      if (currentRow.properties[item].type === "string") {
          let res = checkStrings(table[item], schema[item].pattern, item);
          if (res) {
            result.push(res);
          }
      }
  }

  if (result.length > 0) {
    errors.push(
    {error: "Данные в колонках",
  message: result});
  return errors;
  }

  // Если мы добрались сюда, то с табличой все хорошо, возвращаем ОК
   errors.push({error: "ОК",
  message: `Таблица обработа и колонки ${row.required} подходят под схему ${row.name}`});
  return errors;
}

// Нужно запихнуть нужную колонку полностью
function checkStrings(tableColumn, pattern, nameOfColumn) {
  const patterned = new RegExp(pattern); 
  let errors = [];
  for (const item of tableColumn) {
      if (!patterned.test(item)) {
        errors.push(`В колонке ${nameOfColumn} ${item} строка не совпадает с паттерном ${patterned}\n`);
      }
  }
  if (errors.length > 0) {
      return errors;
  }
  return false;
}


function checkNumbers(tableColumn, min, max, nameOfColumn) {
  let errors = [];
  console.log(typeof min);
  console.log(min);
  for (const item of tableColumn) {
      if (Number(item) < min || Number(item) > max) {
        console.log(Number(item));
        errors.push(`В колонке ${nameOfColumn} ${item} не входит в границы ${min} - ${max}\n`);
      }
  }
  if (errors.length > 0) {
      return errors;
  }
  return false;
}



// Создавать таблицу как объект при передаче ее в сервере