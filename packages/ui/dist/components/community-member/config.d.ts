export declare const config: {
    readonly name: "CommunityMember";
    readonly label: "Membres de communauté";
    readonly description: "Gérez vos membres de communauté depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "handle";
        readonly label: "Pseudonyme";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "postCount";
        readonly label: "Publications";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "joinedOn";
        readonly label: "Inscription";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "moderator", "suspended"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyCommunityMember";
        readonly label: "Notifications : membres de communauté";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveCommunityMember";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section membres de communauté.";
    }, {
        readonly key: "approveCommunityMember";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
