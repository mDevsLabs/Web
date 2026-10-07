export declare const config: {
    readonly name: "Checkout";
    readonly label: "Passages en caisse";
    readonly description: "Gérez vos passages en caisse depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "reference";
        readonly label: "Référence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "email";
        readonly label: "E-mail";
        readonly kind: "email";
        readonly required: true;
    }, {
        readonly key: "total";
        readonly label: "Total";
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
        readonly options: readonly ["started", "processing", "complete"];
    }];
    readonly titleKey: "reference";
    readonly settings: readonly [{
        readonly key: "notifyCheckout";
        readonly label: "Notifications : passages en caisse";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveCheckout";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section passages en caisse.";
    }, {
        readonly key: "approveCheckout";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
