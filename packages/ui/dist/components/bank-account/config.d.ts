export declare const config: {
    readonly name: "BankAccount";
    readonly label: "Comptes bancaires";
    readonly description: "Gérez vos comptes bancaires depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "bank";
        readonly label: "Banque";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "balance";
        readonly label: "Solde";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "currency";
        readonly label: "Devise";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "frozen", "closed"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyBankAccount";
        readonly label: "Notifications : comptes bancaires";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveBankAccount";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section comptes bancaires.";
    }, {
        readonly key: "approveBankAccount";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
