export declare const config: {
    readonly name: "Course";
    readonly label: "Formations";
    readonly description: "Gérez vos formations depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "instructor";
        readonly label: "Formateur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "durationHours";
        readonly label: "Durée (h)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "enrollmentCount";
        readonly label: "Inscrits";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "published", "archived"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyCourse";
        readonly label: "Notifications : formations";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveCourse";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section formations.";
    }, {
        readonly key: "approveCourse";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
