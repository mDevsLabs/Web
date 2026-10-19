export declare const config: {
    readonly name: "TaxReport";
    readonly label: "Déclarations fiscales";
    readonly description: "Gérez vos déclarations fiscales depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "period";
        readonly label: "Période";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "organization";
        readonly label: "Organisation";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "taxableAmount";
        readonly label: "Base imposable";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "dueDate";
        readonly label: "Échéance";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "submitted", "accepted"];
    }];
    readonly titleKey: "period";
    readonly settings: readonly [{
        readonly key: "notifyTaxReport";
        readonly label: "Notifications : déclarations fiscales";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveTaxReport";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section déclarations fiscales.";
    }, {
        readonly key: "approveTaxReport";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
