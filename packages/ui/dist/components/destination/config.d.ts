export declare const config: {
    readonly name: "Destination";
    readonly label: "Destinations";
    readonly description: "Gérez vos destinations depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "country";
        readonly label: "Pays";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "averageCost";
        readonly label: "Coût moyen";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "rating";
        readonly label: "Note";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["featured", "available", "seasonal"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyDestination";
        readonly label: "Notifications : destinations";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveDestination";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section destinations.";
    }, {
        readonly key: "approveDestination";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
