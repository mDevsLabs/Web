export declare const config: {
    readonly name: "Server";
    readonly label: "Serveurs";
    readonly description: "Gérez vos serveurs depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "region";
        readonly label: "Région";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "cpuPercent";
        readonly label: "CPU (%)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "memoryGb";
        readonly label: "Mémoire (Go)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["online", "offline", "maintenance"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyServer";
        readonly label: "Notifications : serveurs";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveServer";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section serveurs.";
    }, {
        readonly key: "approveServer";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
