let rows = {
    id: 2,
    name_of_table: 'mySchema4',
    schema: '{"properties":{"column1":{"type":"integer","minimum":0,"maximum":100},"column2":{"type":"string","pattern":"^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$"}},"required":["column1","column2"]}',
    required_headers: '["column1","column2"]'
  };
  let currentRow = {
    properties: {
      column1: { type: 'integer', minimum: 0, maximum: 9007199254740991 },
      column2: { type: 'string' },
      column3: { type: 'string' },
      column4: { type: 'date' },
      column5: { type: 'float', minimum: Infinity, maximum: -Infinity }
    },
    required: [ 'column1', 'column2', 'column3', 'column4', 'column5' ]
  };
  

let table = {
    column1: [1, 2, 3, 4, 5, 6, 120],
    column2: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
};

function compareRows(row, currentRow, table) {
    // Проверим, что нужные колонки присутствуют в нашей схеме
    let errors = [];
    if (!JSON.parse(currentRow.required).every(val => JSON.parse(row.required_headers).includes(val))) {
        return ["required_headers are not the same"];
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
        return errors;
    }


    // Если и тут все ок, то надо проверить, что числа лежат в нужных границах и строки соответствуют паттерну (это сложно)
    for (const item of JSON.parse(row.required_headers)) {
        if (currentRow.properties[item].type === "integer") {
            let res = checkNumbers(table[item], JSON.parse(row.schema).properties[item].minimum, JSON.parse(row.schema).properties[item].maximum, item);
            if (res) {
                return res;
            }
        }
        if (currentRow.properties[item].type === "string") {
            let res = checkStrings(table[item], JSON.parse(row.schema).properties[item].pattern, item);
            if (res) {
                return res;
            }
        }
    }

    // Если мы добрались сюда, то с табличой все хорошо, возвращаем ОК
    return [`Таблица обработа и колонки подходят под схему ${rows.name_of_table}`];
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

console.log(compareRows(rows, currentRow, table));


// Создавать таблицу как объект при передаче ее в сервере