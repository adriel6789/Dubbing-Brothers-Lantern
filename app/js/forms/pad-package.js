dynamicForm.push({
    "id": "pad-package",
    "type": "servicing",
    "work": "livraison",
    "name": "pad-package",
    "generalForm": [ // Identique pour chaque produit

    ],
    "productForm":[ // Différent selon chaque produit
        {
            "name": "comment_product",
            "title": "Commentaire (Produit)",
            "read_only" : true,
            "placeholder": "Commentaire (Produit)",
            "type": {
                "view": "textarea"
            }
        }
    ]
});
