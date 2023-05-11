const axios = require('axios');
let rows = {
    id: 2,
    name_of_table: 'mySchema4',
    schema: {"name":{"type":"string","pattern":"^.*$"},
    "email":{"type":"string","pattern":"^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$"},
    "phone":{"type":"integer","minimum":0,"maximum":120},
    "age":{"type":"integer","minimum":0,"maximum":120},
    "gender":{"type":"string","pattern":"^[M|F]$"},
    "weight":{"type":"integer","minimum":0,"maximum":500},
    "height":{"type":"integer","minimum":0,"maximum":300}},
    "required":["name","email","phone","age","gender","weight","height"]
  };
  let currentRow = {
    properties: {
        name: { type: 'string'},
        email: { type: 'string' },
        phone: { type: 'integer', minimum: 0, maximum: 900719925474099},
        age: { type: 'integer', minimum: 0, maximum: 900719925474099},
        gender: { type: 'float', minimum: -Infinity, maximum: Infinity },
        weight: { type: 'float', minimum: -Infinity, maximum: Infinity },
        height: { type: 'float', minimum: -Infinity, maximum: Infinity },

    },
    required: [   'name',   'email',
    'phone',  'age',
    'gender', 'weight',
    'height' ]
  };
  

let table = {
    name: [1, 2, 3, 4, 5, 6, 120],
    email: ['John', 'John', 'John', 'John', 'John', 'John', 'John'],
    phone: ['82918291', '82918291', '82918291', '82918291', '82918291', '82918291', '82918291'],
    age: ['12', '12', '12', '12', '12', '12', '12'],
    gender: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    weight: ['40', '40', '40', '40', '40', '40', '40'],
    height: ['40', '40', '40', '40', '40', '40', '40'],
};

function compareRows(row, currentRow, table) { // Передавать сразу table.schema
    // Проверим, что нужные колонки присутствуют в нашей схеме
    let errors = [];
    console.log(row.required);
    console.log(currentRow.required);
    if (!currentRow.required.every(val => row.required.includes(val))) {
        return {error: 'Названия колонок',
            message: `Ожидаются колонки ${row.required}, вместо них получены ${currentRow.required}`};
    }
    // Теперь проверим, что нужные колонки имеют нужный тип данных
    let schema = row.schema;
    for (let i = 0; i < row.required.length; i++) {
        let header = row.required[i];
        if (!(schema[header].type === currentRow.properties[header].type)) {
            errors.push(`В колонке ${header} тип данных ${currentRow.properties[header].type}, ожидается ${schema[header].type}`);
        }
    }

    if (errors.length > 0) {
        return errors;
    }


    // Если и тут все ок, то надо проверить, что числа лежат в нужных границах и строки соответствуют паттерну (это сложно)
    for (const item of row.required) {
        if (currentRow.properties[item].type === "integer" || currentRow.properties[item].type === "float") {
            let res = checkNumbers(table[item], schema[item].minimum, schema[item].maximum, item);
            if (res) {
                errors.push(res);
            }
        }
        if (currentRow.properties[item].type === "string") {
            let res = checkStrings(table[item], schema[item].pattern, item);
            if (res) {
                errors.push(res);
            }
        }
    }

    // Если мы добрались сюда, то с табличой все хорошо, возвращаем ОК
    return [`Таблица обработа и колонки ${row.required} подходят под схему ${row.name_of_table}`];
}

// Нужно запихнуть нужную колонку полностью
function checkStrings(tableColumn, pattern, nameOfColumn) {
    const patterned = new RegExp(pattern); 
    let errors = [];
    for (const item of tableColumn) {
        if (!patterned.test(item)) {
          errors.push(`В колонке ${nameOfColumn} ${item} строка не совпадает с паттерном ${patterned}`);
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
          errors.push(`В колонке ${nameOfColumn} ${item} не входит в границы ${min} - ${max}`);
        }
    }
    if (errors.length > 0) {
        return errors;
    }
    return false;
}

// console.log(compareRows(rows, currentRow, table));

axios.get('http://localhost:3001/tables')
  .then(response => {
    console.log(response.data[2]);
    // for (let i = 0; i < response.data.length; i++) {
    //     compareRows(response.data[0], currentRow, table);
    // }
    // console.log(compareRows(response.data[0], currentRow, table));
    // for (let i = 0; i < response.data.length; i++) {

    // }

  })
  .catch(error => {
    console.error(error);
  });


// Создавать таблицу как объект при передаче ее в сервере