dynamicForm.push({
    "id": 3, // Commence à 1
    "type": "mastering", // mastering ou servicing
    "work": "regie", // labo, regie ou qc
    "name": "Création Matrice Générique Série TV", // Ce que l'on veut
    "generalForm": [
        {
            "title": "Description 1",
            "text" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            "type": {
                "view": "description"
            }
        },
        {
            "name": "support",
            "title": "Support",
            "read_only" : true,
            "required": true,
            "return": true,
            "type": {
                "view": "ui-select-global",
                "api": "options", // Prend les champs en double
                "options": [
                    {"id": 0, "name": "FCS"},
                    {"id": 1, "name": "Bande"}
                ]
            }
        },
        {
            "name": "bloup",
            "title": "Bloup",
            "read_only" : true,
            "required": true,
            "type": {
                "view": "switch"
            }
        },
        {
            "name": "duree",
            "title": "Durée",
            "read_only" : true,
            "type": {
                "view": "input"
            }
        },
        {
            "name": "description",
            "title": "Description 2",
            "read_only" : true,
            "text" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            "type": {
                "view": "description"
            }
        }

    ]
});