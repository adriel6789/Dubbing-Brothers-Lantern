dynamicForm.push({
    "id": 4, // Commence à 1
    "type": "mastering", // mastering ou servicing
    "work": "regie", // labo, regie ou qc
    "name": "Création Générique Episode", // Ce que l'on veut
    "generalForm": [
        {
            "name": "type_support_source",
            "title": "Type de support source",
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
            "name": "support_link_source",
            "title": "Support source",
            "placeholder": "Lien ou Asset ID",
            "type": {
                "view": "input"
            }
        },
        {
            "title": "",
            "type": {
                "view": "label"
            }
        },
        {
            "name": "type_support_dest",
            "title": "Type de support destination",
            "required": true,
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
            "name": "support_link_dest",
            "title": "Support destination",
            "placeholder": "Lien ou Asset ID",
            "type": {
                "view": "input"
            }
        },
        {
            "name": "description",
            "title": "Description",
            "text": "Le générique devra etre composé blablabla...",
            "type": {
                "view": "label"
            }
        }

    ]
});