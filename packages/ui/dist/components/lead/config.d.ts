export declare const config: {
    readonly name: "Lead";
    readonly label: "Prospects";
    readonly description: "Gérez vos prospects depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "email";
        readonly label: "E-mail";
        readonly kind: "email";
        readonly required: true;
    }, {
        readonly key: "source";
        readonly label: "Origine";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "score";
        readonly label: "Score";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["new", "qualified", "contacted", "converted"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyLead";
        readonly label: "Notifications : prospects";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveLead";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section prospects.";
    }, {
        readonly key: "approveLead";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
