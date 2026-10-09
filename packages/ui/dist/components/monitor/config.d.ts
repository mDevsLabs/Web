export declare const config: {
    readonly name: "Monitor";
    readonly label: "Moniteurs";
    readonly description: "Gérez vos moniteurs depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "url";
        readonly label: "Adresse";
        readonly kind: "url";
        readonly required: true;
    }, {
        readonly key: "uptimePercent";
        readonly label: "Disponibilité (%)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "intervalSeconds";
        readonly label: "Intervalle (s)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["up", "down", "paused"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyMonitor";
        readonly label: "Notifications : moniteurs";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveMonitor";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section moniteurs.";
    }, {
        readonly key: "approveMonitor";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
