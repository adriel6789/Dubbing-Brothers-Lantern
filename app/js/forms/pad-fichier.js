dynamicForm.push({
    "id": "pad-fichier",
    "type": "servicing",
    "work": "fabrication",
    "name": "pad-fichier",
    "generalForm": [ // Identique pour chaque produit
        {
            "name": "numero_client",
            "title": "Numéro Client (global à la demande)",
            "read_only" : true,
            "placeholder": "Numéro Client",
            "type": {
                "view": "input"
            }
        },
        {
            "name": "date_delivery",
            "title": "Date de livraison",
            "read_only" : false,
            "placeholder": "JJ/MM/AAAA",
            "type": {
                "view": "datepicker"
            }
        }

    ],
    "productForm":[ // Différent selon chaque produit
        {
            "name": "title_vf_produit",
            "title": "Titre VF",
            "ref_context": "title_vf",
            "read_only" : true,
            "placeholder": "Titre VF",
            "type": {
                "view": "text_only"
            }
        },
        {
            "name": "numero_client_produit",
            "title": "Numéro Client (Produit)",
            "ref_context": "num_client",
            "read_only" : true,
            "placeholder": "Numéro Client",
            "type": {
                "view": "input"
            }
        },
        {
            "name": "commentaire_prod",
            "title": "Commentaire (Produit)",
            "ref_context": "comment_prod",
            "read_only" : true,
            "placeholder": "Commentaire",
            "type": {
                "view": "textarea"
            }
        }
    ]
});
