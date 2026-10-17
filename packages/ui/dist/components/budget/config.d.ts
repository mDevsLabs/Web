export declare const config: {
    readonly name: "Budget";
    readonly label: "Budgets";
    readonly description: "Gérez vos budgets depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "owner";
        readonly label: "Responsable";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "allocated";
        readonly label: "Alloué";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "spent";
        readonly label: "Dépensé";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "active", "closed"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyBudget";
        readonly label: "Notifications : budgets";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveBudget";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section budgets.";
    }, {
        readonly key: "approveBudget";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
