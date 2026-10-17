export declare const config: {
    readonly name: "Shift";
    readonly label: "Plannings";
    readonly description: "Gérez vos plannings depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Créneau";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "employee";
        readonly label: "Collaborateur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "scheduledOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "hours";
        readonly label: "Heures";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["planned", "confirmed", "completed"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyShift";
        readonly label: "Notifications : plannings";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveShift";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section plannings.";
    }, {
        readonly key: "approveShift";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
