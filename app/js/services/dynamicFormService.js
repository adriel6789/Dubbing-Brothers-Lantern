Lantern.factory("DynamicFormService", [
  "$rootScope",
  function($rootScope) {
    return {
      getFormData: () => {
        let dynamicForm = [];

        dynamicForm.push({
          id: 1,
          type: "mastering",
          work: "qcmedia",
          name: "vod",
          generalForm: [
            {
              name: "diffuser",
              title: $rootScope._T["irlv7lue"],
              read_only: true,
              placeholder: $rootScope._T["irlv7lue"],
              type: {
                view: "ui-select-global",
                api: "clients"
              }
            },
            {
              name: "elements",
              title: $rootScope._T["owkxdlms"],
              placeholder: $rootScope._T["owkxdlms"],
              read_only: true,
              type: {
                view: "ui-select-global",
                api: "options",
                options: [{ id: 0, name: "Pivot VM" }]
              }
            },
            {
              name: "format_master",
              title: $rootScope._T["1k10rymm"],
              read_only: true,
              type: {
                view: "ui-select-global",
                api: "options",
                options: [{ id: 0, name: "ProRes" }]
              }
            },
            {
              name: "etat_master",
              title: $rootScope._T["5iq3bh7c"],
              read_only: false,
              type: {
                view: "ui-select-global",
                api: "options",
                options: [
                  { id: 0, name: "en cours de désarchivage" },
                  { id: 1, name: "terminé" }
                ]
              }
            },
            {
              name: "technician",
              title: $rootScope._T["qdr7u24e"],
              read_only: true,
              type: {
                view: "ui-select-global",
                api: "users"
              }
            },
            {
              name: "elements_supp",
              title: $rootScope._T["prkqcny7"],
              read_only: false,
              type: {
                view: "ui-select-global",
                api: "options",
                options: [{ id: 0, name: "MPEG1 VO pour Sous-Titrage" }]
              }
            },
            {
              name: "service",
              title: $rootScope._T["o6mkj257"],
              read_only: true,
              type: {
                view: "ui-select-multiple",
                api: "groupsInternal"
              }
            },
            {
              name: "delivery",
              title: $rootScope._T["7qbbqfzv"],
              read_only: true,
              type: {
                view: "ui-select-global",
                api: "clients"
              }
            },
            {
              name: "service_delivery",
              title: $rootScope._T["qdr7u24e"],
              read_only: true,
              type: {
                view: "ui-select-global",
                api: "users"
              }
            },
            {
              name: "finished",
              read_only: false,
              title: $rootScope._T["quhcb7oo"],
              type: {
                view: "checkbox"
              }
            }
          ]
        });

        dynamicForm.push({
          id: "pad-fichier",
          type: "servicing",
          work: "fabrication",
          name: "pad-fichier",
          generalForm: [
            // Identique pour chaque produit
            {
              name: "numero_client",
              title: $rootScope._T["8w27cb79"],
              read_only: true,
              placeholder: $rootScope._T["i6i4z7a0"],
              type: {
                view: "input"
              }
            },
            {
              name: "date_delivery",
              title: $rootScope._T["uk381nhz"],
              read_only: false,
              placeholder: "JJ/MM/AAAA",
              type: {
                view: "datepicker"
              }
            }
          ],
          productForm: [
            // Différent selon chaque produit
            {
              name: "title_vf_produit",
              title: $rootScope._T["08ag0k97"],
              ref_context: "title_vf",
              read_only: true,
              placeholder: $rootScope._T["08ag0k97"],
              type: {
                view: "text_only"
              }
            },
            {
              name: "numero_client_produit",
              title: $rootScope._T["zaqk80i1"],
              ref_context: "num_client",
              read_only: true,
              placeholder: $rootScope._T["i6i4z7a0"],
              type: {
                view: "input"
              }
            },
            {
              name: "commentaire_prod",
              title: $rootScope._T["q8v6j5ox"],
              ref_context: "comment_prod",
              read_only: true,
              placeholder: $rootScope._T["eq9spk3x"],
              type: {
                view: "textarea"
              }
            }
          ]
        });

        dynamicForm.push({
          id: "pad-fichier-mpeg1",
          type: "servicing",
          work: "fabrication",
          name: "pad-fichier-mpeg1",
          generalForm: [
            // Identique pour chaque produit
            {
              name: "numero_client",
              title: $rootScope._T["8w27cb79"],
              read_only: true,
              placeholder: $rootScope._T["i6i4z7a0"],
              type: {
                view: "input"
              }
            },
            {
              name: "date_delivery",
              title: $rootScope._T["uk381nhz"],
              read_only: false,
              placeholder: "JJ/MM/AAAA",
              type: {
                view: "datepicker"
              }
            },
            {
              name: "mpeg_creation",
              title: "MPEG1",
              read_only: true,
              placeholder: "MPEG1",
              type: {
                view: "ui-select-global",
                api: "options",
                options: [
                  { id: 0, name: "VO" },
                  { id: 1, name: "VF" },
                  { id: 2, name: "VO+VF" }
                ]
              }
            }
          ],
          productForm: [
            // Différent selon chaque produit
            {
              name: "title_vf_produit",
              title: $rootScope._T["08ag0k97"],
              ref_context: "title_vf",
              read_only: true,
              placeholder: $rootScope._T["08ag0k97"],
              type: {
                view: "text_only"
              }
            },
            {
              name: "numero_client_produit",
              title: $rootScope._T["zaqk80i1"],
              ref_context: "num_client",
              read_only: true,
              placeholder: $rootScope._T["i6i4z7a0"],
              type: {
                view: "input"
              }
            },
            {
              name: "commentaire_prod",
              title: $rootScope._T["q8v6j5ox"],
              ref_context: "comment_prod",
              read_only: true,
              placeholder: $rootScope._T["eq9spk3x"],
              type: {
                view: "textarea"
              }
            }
          ]
        });

        dynamicForm.push({
          id: 5, // Commence à 1
          type: "mastering", // mastering ou servicing
          work: "labo", // labo, regie ou qc
          name: "Labo", // Ce que l'on veut
          generalForm: [
            // Identique pour chaque produit
            {
              name: "diffuser", // Nom en BDD
              title: $rootScope._T["irlv7lue"], // Nom affiché
              placeholder: $rootScope._T["irlv7lue"], // Placeholder du champ
              read_only: true, // Planning peut ou pas modifier
              type: {
                // Caractéristiques pour le champs
                view: "ui-select-global", // tous les champs disponibles sont dans create-field.html, edit-field.html, read-field.html
                api: "clients" // récupérer les champs depuis l'API
              }
            },
            {
              name: "numero_em",
              title: $rootScope._T["hx431gh0"],
              read_only: true,
              placeholder: $rootScope._T["hx431gh0"],
              type: {
                view: "input"
              }
            },
            {
              name: "element_type",
              title: $rootScope._T["n0qneuqy"],
              read_only: true,
              type: {
                view: "ui-select-global",
                api: "options", // Prend les champs en double
                options: [
                  { id: 0, name: "PAD HD" },
                  { id: 1, name: "PAD SD" }
                ]
              }
            },
            {
              name: "language",
              title: $rootScope._T["awbb7v9i"],
              read_only: true,
              type: {
                view: "ui-select-global",
                api: "options",
                options: [
                  { id: 0, name: "VO + VF" },
                  { id: 1, name: "VO" },
                  { id: 2, name: "VF" }
                ]
              }
            },
            {
              name: "audio_format",
              title: "Format audio",
              read_only: true,
              type: {
                view: "ui-select-global",
                api: "options",
                options: [
                  { id: 0, name: "2.0" },
                  { id: 1, name: "5.1" },
                  { id: 2, name: "7.1" },
                  { id: 3, name: "5.1 + 2.0" }
                ]
              }
            },
            {
              name: "version_mpeg",
              title: $rootScope._T["9h8r0geo"],
              read_only: true,
              type: {
                view: "ui-select-global",
                api: "options",
                options: [
                  { id: 0, name: "VO" },
                  { id: 1, name: "VF" },
                  { id: 2, name: "VO + VF" }
                ]
              }
            },
            {
              name: "date_delivery",
              title: $rootScope._T["uk381nhz"],
              read_only: false,
              placeHolder: "JJ/MM/AAAA",
              type: {
                view: "datepicker"
              }
            }
          ],
          productForm: [
            // Différent selon chaque produit
            {
              name: "cf25",
              title: "CF25",
              read_only: true,
              type: {
                view: "ui-select-global",
                api: "options",
                options: [
                  { id: 0, name: "Disponible" },
                  { id: 1, name: "Non disponible" }
                ]
              }
            },
            {
              name: "num_cf25",
              title: $rootScope._T["wpp137ih"],
              read_only: true,
              placeHolder: $rootScope._T["wpp137ih"],
              type: {
                view: "input"
              }
            },
            {
              name: "technician",
              title: $rootScope._T["994zv55k"],
              read_only: true,
              placeholder: $rootScope._T["994zv55k"],
              type: {
                view: "ui-select-global",
                api: "users"
              }
            }
          ]
        });

        dynamicForm.push({
          id: 3, // Commence à 1
          type: "mastering", // mastering ou servicing
          work: "regie", // labo, regie ou qc
          name: "Création Matrice Générique Série TV", // Ce que l'on veut
          generalForm: [
            {
              title: "Description 1",
              text:
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
              type: {
                view: "description"
              }
            },
            {
              name: "support",
              title: $rootScope._T["h5bglkgi"],
              read_only: true,
              required: true,
              return: true,
              type: {
                view: "ui-select-global",
                api: "options", // Prend les champs en double
                options: [
                  { id: 0, name: "FCS" },
                  { id: 1, name: "Bande" }
                ]
              }
            },
            {
              name: "bloup",
              title: "Bloup",
              read_only: true,
              required: true,
              type: {
                view: "switch"
              }
            },
            {
              name: "duree",
              title: $rootScope._T["k1t6im8d"],
              read_only: true,
              type: {
                view: "input"
              }
            },
            {
              name: "description",
              title: "Description 2",
              read_only: true,
              text:
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
              type: {
                view: "description"
              }
            }
          ]
        });

        dynamicForm.push({
          id: 4, // Commence à 1
          type: "mastering", // mastering ou servicing
          work: "regie", // labo, regie ou qc
          name: "Création Générique Episode", // Ce que l'on veut
          generalForm: [
            {
              name: "type_support_source",
              title: $rootScope._T["m0cri0xx"],
              type: {
                view: "ui-select-global",
                api: "options", // Prend les champs en double
                options: [
                  { id: 0, name: "FCS" },
                  { id: 1, name: "Bande" }
                ]
              }
            },
            {
              name: "support_link_source",
              title: $rootScope._T["ivz5otbd"],
              placeholder: $rootScope._T["njb1has6"],
              type: {
                view: "input"
              }
            },
            {
              title: "",
              type: {
                view: "label"
              }
            },
            {
              name: "type_support_dest",
              title: $rootScope._T["ts36p733"],
              required: true,
              type: {
                view: "ui-select-global",
                api: "options", // Prend les champs en double
                options: [
                  { id: 0, name: "FCS" },
                  { id: 1, name: "Bande" }
                ]
              }
            },
            {
              name: "support_link_dest",
              title: $rootScope._T["3wv6dnnn"],
              placeholder: $rootScope._T["njb1has6"],
              type: {
                view: "input"
              }
            },
            {
              name: "description",
              title: $rootScope._T["ewybz84r"],
              text: $rootScope._T["rb3b2azv"],
              type: {
                view: "label"
              }
            }
          ]
        });

        dynamicForm.push({
          id: "pad-package",
          type: "servicing",
          work: "livraison",
          name: "pad-package",
          generalForm: [
            // Identique pour chaque produit
          ],
          productForm: [
            // Différent selon chaque produit
            {
              name: "comment_product",
              title: $rootScope._T["q8v6j5ox"],
              read_only: true,
              placeholder: $rootScope._T["q8v6j5ox"],
              type: {
                view: "textarea"
              }
            }
          ]
        });

        return dynamicForm;
      }
    };
  }
]);
