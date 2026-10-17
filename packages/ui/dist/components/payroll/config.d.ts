export declare const config: {
    readonly name: "Payroll";
    readonly label: "Paie";
    readonly description: "Gérez vos paie depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "period";
        readonly label: "Période";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "employee";
        readonly label: "Collaborateur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "grossAmount";
        readonly label: "Brut";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "netAmount";
        readonly label: "Net";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "approved", "paid"];
    }];
    readonly titleKey: "period";
    readonly settings: readonly [{
        readonly key: "notifyPayroll";
        readonly label: "Notifications : paie";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archivePayroll";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section paie.";
    }, {
        readonly key: "approvePayroll";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
