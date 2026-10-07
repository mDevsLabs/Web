export declare const config: {
    readonly name: "Lesson";
    readonly label: "Leçons";
    readonly description: "Gérez vos leçons depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "course";
        readonly label: "Formation";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "durationMinutes";
        readonly label: "Durée (min)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "position";
        readonly label: "Ordre";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "published"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyLesson";
        readonly label: "Notifications : leçons";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveLesson";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section leçons.";
    }, {
        readonly key: "approveLesson";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
