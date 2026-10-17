export declare const config: {
    readonly name: "LogEntry";
    readonly label: "Journaux";
    readonly description: "Gérez vos journaux depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "message";
        readonly label: "Message";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "service";
        readonly label: "Service";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "timestamp";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "occurrences";
        readonly label: "Occurrences";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["info", "warning", "error"];
    }];
    readonly titleKey: "message";
    readonly settings: readonly [{
        readonly key: "notifyLogEntry";
        readonly label: "Notifications : journaux";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveLogEntry";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section journaux.";
    }, {
        readonly key: "approveLogEntry";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
