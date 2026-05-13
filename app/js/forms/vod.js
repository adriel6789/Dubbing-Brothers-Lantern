dynamicForm.push({
    "id": 1,
    "type": "mastering",
    "work": "qcmedia",
    "name": "vod",
    "generalForm": [
        {
            "name": "diffuser",
            "title": "Diffuseur",
            "read_only" : true,
            "placeholder": "Diffuseur",
            "type": {
                "view": "ui-select-global",
                "api": "clients"
            }
        },
        {
            "name": "elements",
            "title": "Elément à créer",
            "placeholder": "Élément à créer",
            "read_only" : true,
            "type": {
                "view": "ui-select-global",
                "api":"options",
                "options": [
                    {"id": 0, "name": "Pivot VM"}
                ]
            }
        },
        {
            "name": "format_master",
            "title": "Format Master",
            "read_only" : true,
            "type": {
                "view": "ui-select-global",
                "api":"options",
                "options": [
                    {"id": 0, "name": "ProRes"}
                ]
            }
        },
        {
            "name": "etat_master",
            "title": "Etat Master",
            "read_only" : false,
            "type": {
                "view": "ui-select-global",
                "api":"options",
                "options": [
                    {"id": 0, "name": "en cours de désarchivage"},
                    {"id": 1, "name": "terminé"}
                ]
            }
        },
        {
            "name": "technician",
            "title": "Personne Concernée",
            "read_only" : true,
            "type": {
                "view": "ui-select-global",
                "api":"users"
            }
        },
        {
            "name": "elements_supp",
            "title": "Eléments supplémentaires",
            "read_only" : false,
            "type": {
                "view": "ui-select-global",
                "api":"options",
                "options": [
                    {"id": 0, "name": "MPEG1 VO pour Sous-Titrage"}
                ]
            }
        },
        {
            "name": "service",
            "title": "Service Concerné",
            "read_only" : true,
            "type": {
                "view": "ui-select-multiple",
                "api":"groupsInternal"
            }
        },
        {
            "name": "delivery",
            "title": "Livraison",
            "read_only" : true,
            "type": {
                "view": "ui-select-global",
                "api":"clients"
            }
        },
        {
            "name": "service_delivery",
            "title": "Personne Concernée",
            "read_only" : true,
            "type": {
                "view": "ui-select-global",
                "api":"users"
            }
        },
        {
            "name": "finished",
            "read_only" : false,
            "title": "Travaux ok",
            "type": {
                "view": "checkbox"
            }
        }
    ]
});