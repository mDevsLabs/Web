export declare const config: {
    readonly name: "Transaction";
    readonly label: "Transactions";
    readonly description: "Gérez vos transactions depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "reference";
        readonly label: "Référence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "description";
        readonly label: "Description";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "amount";
        readonly label: "Montant";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "postedOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["pending", "posted", "reversed"];
    }];
    readonly titleKey: "reference";
    readonly settings: readonly [{
        readonly key: "notifyTransaction";
        readonly label: "Notifications : transactions";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveTransaction";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section transactions.";
    }, {
        readonly key: "approveTransaction";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
