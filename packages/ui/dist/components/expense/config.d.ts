export declare const config: {
    readonly name: "Expense";
    readonly label: "Notes de frais";
    readonly description: "Gérez vos notes de frais depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Libellé";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "employee";
        readonly label: "Collaborateur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "amount";
        readonly label: "Montant";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "spentOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "submitted", "approved", "reimbursed"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyExpense";
        readonly label: "Notifications : notes de frais";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveExpense";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section notes de frais.";
    }, {
        readonly key: "approveExpense";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
