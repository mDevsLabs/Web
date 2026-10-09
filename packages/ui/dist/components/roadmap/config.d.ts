export declare const config: {
    readonly name: "Roadmap";
    readonly label: "Feuilles de route";
    readonly description: "Gérez vos feuilles de route depuis une interface claire.";
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
        readonly key: "quarter";
        readonly label: "Trimestre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "initiativeCount";
        readonly label: "Initiatives";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "published", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyRoadmap";
        readonly label: "Notifications : feuilles de route";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveRoadmap";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section feuilles de route.";
    }, {
        readonly key: "approveRoadmap";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
