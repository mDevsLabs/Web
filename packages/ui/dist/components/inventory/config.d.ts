export declare const config: {
    readonly name: "Inventory";
    readonly label: "Inventaire";
    readonly description: "Gérez vos inventaire depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "itemName";
        readonly label: "Article";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "location";
        readonly label: "Emplacement";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "quantity";
        readonly label: "Quantité";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "reorderAt";
        readonly label: "Seuil de commande";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["available", "low", "out-of-stock"];
    }];
    readonly titleKey: "itemName";
    readonly settings: readonly [{
        readonly key: "notifyInventory";
        readonly label: "Notifications : inventaire";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveInventory";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section inventaire.";
    }, {
        readonly key: "approveInventory";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
