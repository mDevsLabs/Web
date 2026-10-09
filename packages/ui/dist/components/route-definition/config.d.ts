export declare const config: {
    readonly name: "RouteDefinition";
    readonly label: "Routes applicatives";
    readonly description: "Gérez vos routes applicatives depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "path";
        readonly label: "Chemin";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "section";
        readonly label: "Section";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "priority";
        readonly label: "Priorité";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "updatedAt";
        readonly label: "Mise à jour";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "active", "hidden", "retired"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyRouteDefinition";
        readonly label: "Notifications : routes applicatives";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveRouteDefinition";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section routes applicatives.";
    }, {
        readonly key: "approveRouteDefinition";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
