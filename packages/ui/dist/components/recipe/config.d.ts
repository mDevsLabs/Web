export declare const config: {
    readonly name: "Recipe";
    readonly label: "Recettes";
    readonly description: "Gérez vos recettes depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "author";
        readonly label: "Auteur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "prepMinutes";
        readonly label: "Préparation (min)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "servings";
        readonly label: "Portions";
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
        readonly key: "notifyRecipe";
        readonly label: "Notifications : recettes";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveRecipe";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section recettes.";
    }, {
        readonly key: "approveRecipe";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
