export declare const config: {
    readonly name: "Product";
    readonly label: "Produits";
    readonly description: "Gérez vos produits depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "sku";
        readonly label: "Référence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "price";
        readonly label: "Prix";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "stock";
        readonly label: "Stock";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "active", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyProduct";
        readonly label: "Notifications : produits";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveProduct";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section produits.";
    }, {
        readonly key: "approveProduct";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
