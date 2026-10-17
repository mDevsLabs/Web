export declare const config: {
    readonly name: "Supplier";
    readonly label: "Fournisseurs";
    readonly description: "Gérez vos fournisseurs depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "contactEmail";
        readonly label: "E-mail";
        readonly kind: "email";
        readonly required: true;
    }, {
        readonly key: "leadTimeDays";
        readonly label: "Délai (jours)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "country";
        readonly label: "Pays";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "pending", "inactive"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifySupplier";
        readonly label: "Notifications : fournisseurs";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveSupplier";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section fournisseurs.";
    }, {
        readonly key: "approveSupplier";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
