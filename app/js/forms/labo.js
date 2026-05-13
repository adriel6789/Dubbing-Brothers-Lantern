dynamicForm.push({
    "id": 5, // Commence à 1
    "type": "mastering", // mastering ou servicing
    "work": "labo", // labo, regie ou qc
    "name": "Labo", // Ce que l'on veut
    "generalForm": [ // Identique pour chaque produit
        {
            "name": "diffuser", // Nom en BDD
            "title": "Diffuseur", // Nom affiché
            "placeholder":"Diffuseur", // Placeholder du champ
            "read_only" : true, // Planning peut ou pas modifier
            "type": { // Caractéristiques pour le champs
                "view": "ui-select-global", // tous les champs disponibles sont dans create-field.html, edit-field.html, read-field.html
                "api":"clients" // récupérer les champs depuis l'API
            }
        },
        {
            "name": "numero_em",
            "title": "Numéro EM",
            "read_only" : true,
            "placeholder": "Numéro EM",
            "type": {
                "view": "input"
            }
        },
        {
            "name": "element_type",
            "title": "Type Element",
            "read_only" : true,
            "type": {
                "view": "ui-select-global",
                "api": "options", // Prend les champs en double
                "options": [
                    {"id": 0, "name": "PAD HD"},
                    {"id": 1, "name": "PAD SD"}
                ]
            }
        },
        {
            "name": "language",
            "title": "Langue",
            "read_only" : true,
            "type": {
                "view": "ui-select-global",
                "api": "options",
                "options": [
                    {"id": 0, "name": "VO + VF"},
                    {"id": 1, "name": "VO"},
                    {"id": 2, "name": "VF"}
                ]
            }
        },
        {
            "name": "audio_format",
            "title": "Format audio",
            "read_only" : true,
            "type": {
                "view": "ui-select-global",
                "api": "options",
                "options": [
                    {"id": 0, "name": "2.0"},
                    {"id": 1, "name": "5.1"},
                    {"id": 2, "name": "7.1"},
                    {"id": 3, "name": "5.1 + 2.0"}
                ]
            }
        },
        {
            "name": "version_mpeg",
            "title": "Version : MPEG1 Langues",
            "read_only" : true,
            "type": {
                "view": "ui-select-global",
                "api": "options",
                "options": [
                    {"id": 0, "name": "VO"},
                    {"id": 1, "name": "VF"},
                    {"id": 2, "name": "VO + VF"}
                ]
            }
        },
        {
            "name": "date_delivery",
            "title": "Date de livraison",
            "read_only" : false,
            "placeHolder": "JJ/MM/AAAA",
            "type": {
                "view": "datepicker"
            }
        }

    ],
    "productForm":[ // Différent selon chaque produit
        {
            "name": "cf25",
            "title": "CF25",
            "read_only" : true,
            "type": {
                "view": "ui-select-global",
                "api": "options",
                "options": [
                    {"id": 0, "name": "Disponible"},
                    {"id": 1, "name": "Non disponible"}
                ]
            }
        },
        {
            "name": "num_cf25",
            "title": "Numéro CF25",
            "read_only" : true,
            "placeHolder": "Numéro CF25",
            "type": {
                "view": "input"
            }
        },
        {
            "name": "technician",
            "title": "Technicien",
            "read_only" : true,
            "placeholder":"Technicien",
            "type": {
                "view": "ui-select-global",
                "api":"users"
            }
        }
    ]
});
