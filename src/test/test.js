let schema = {
        properties: {
        name: {
        type: "string",
        pattern: "^[A-Za-z]{3,10}$"
        },
        email: {
        type: "string",
        pattern: "^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$"
        },
        phone: {
        type: "string",
        pattern: "^[0-9]{10}$"
        },
        age: {
        type: "integer",
        minimum: 0,
        maximum: 120
        },
        gender: {
        type: "string",
        pattern: "^[M|F]$"
        },
        weight: {
        type: "number",
        minimum: 0,
        maximum: 500
        },
        height: {
        type: "number",
        minimum: 0,
        maximum: 300
        }
        },
        required: ["name", "email", "phone", "age", "gender", "weight", "height"]
};


