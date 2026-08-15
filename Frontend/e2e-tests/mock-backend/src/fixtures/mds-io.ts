import { MdsGroup, MdsView, MdsWidget } from '../models';

/**
 * The `io` group - the metadata editor that opens through "edit metadata" on a node.
 *
 * This is the widest widget surface the application has, and per `Frontend/CLAUDE.md` the area
 * with the highest regression rate. The view below therefore uses one widget of (almost) every
 * `MdsWidgetType` plus the native widgets, so a single screenshot covers all of them.
 *
 * Deliberately left out, because they pull in infrastructure this mock does not provide:
 * `tinyMCE` (loads the TinyMCE bundle), `nodefilter` (node picker), `multivalueAuthorityBadges`
 * (authority search), `facetList` (search facets), `fileupload` and `childobjects` (uploads).
 */

const educationalContextValues = [
    { id: 'grundschule', caption: 'Grundschule' },
    { id: 'sekundarstufe_1', caption: 'Sekundarstufe I' },
    { id: 'sekundarstufe_2', caption: 'Sekundarstufe II' },
    { id: 'sonstiges', caption: 'Sonstiges' },
];

export const ioWidgets: MdsWidget[] = [
    { id: 'cclom:title', caption: 'Titel', type: 'text', placeholder: 'Titel des Materials' },
    { id: 'cclom:general_description', caption: 'Beschreibung', type: 'textarea' },
    { id: 'cclom:general_keyword', caption: 'Schlagworte', type: 'multivalueBadges' },
    { id: 'ccm:wwwurl', caption: 'Web-Adresse', type: 'text' },
    { id: 'ccm:author_email', caption: 'E-Mail', type: 'email' },
    { id: 'cclom:typicallearningtime', caption: 'Bearbeitungszeit', type: 'duration' },
    { id: 'ccm:published_date', caption: 'Veröffentlicht am', type: 'date' },
    { id: 'ccm:create_month', caption: 'Erstellungsmonat', type: 'month' },
    { id: 'ccm:price', caption: 'Preis', type: 'number', unit: 'EUR', min: 0, max: 100, step: 1 },
    { id: 'ccm:accent_color', caption: 'Akzentfarbe', type: 'color' },
    { id: 'ccm:is_public', caption: 'Öffentlich sichtbar', type: 'checkbox' },
    { id: 'ccm:notify_authors', caption: 'Autor:innen benachrichtigen', type: 'toggle' },
    {
        id: 'ccm:conditionsofaccess',
        caption: 'Zugang',
        type: 'radioHorizontal',
        hasValues: true,
        values: [
            { id: 'no_login', caption: 'Ohne Login' },
            { id: 'login', caption: 'Mit Login' },
        ],
    },
    {
        id: 'ccm:oeh_quality_criminal_law',
        caption: 'Rechtliche Prüfung',
        type: 'radioVertical',
        hasValues: true,
        values: [
            { id: 'checked', caption: 'Geprüft' },
            { id: 'unchecked', caption: 'Ungeprüft' },
        ],
    },
    {
        id: 'ccm:oeh_accessibility_summary',
        caption: 'Barrierefreiheit',
        type: 'checkboxVertical',
        hasValues: true,
        values: [
            { id: 'captions', caption: 'Untertitel' },
            { id: 'transcript', caption: 'Transkript' },
            { id: 'sign_language', caption: 'Gebärdensprache' },
        ],
    },
    {
        id: 'ccm:educationalintendedenduserrole',
        caption: 'Zielgruppe',
        type: 'multivalueButtons',
        hasValues: true,
        values: [
            { id: 'learner', caption: 'Lernende' },
            { id: 'teacher', caption: 'Lehrende' },
            { id: 'general', caption: 'Allgemein' },
        ],
    },
    {
        id: 'ccm:educationallearningresourcetype',
        caption: 'Inhaltstyp',
        type: 'singleoption',
        hasValues: true,
        values: [
            { id: 'worksheet', caption: 'Arbeitsblatt' },
            { id: 'video', caption: 'Video' },
            { id: 'audio', caption: 'Audio' },
        ],
    },
    {
        id: 'ccm:educationalcontext',
        caption: 'Bildungsstufe',
        type: 'multivalueFixedBadges',
        hasValues: true,
        values: educationalContextValues,
    },
    {
        id: 'ccm:taxonid',
        caption: 'Fachgebiet',
        type: 'multivalueTree',
        hasValues: true,
        values: [
            { id: 'mathematics', caption: 'Mathematik' },
            { id: 'physics', caption: 'Physik' },
            { id: 'german', caption: 'Deutsch' },
        ],
    },
    {
        id: 'ccm:oeh_lrt_aggregated',
        caption: 'Materialart',
        type: 'singlevalueTree',
        hasValues: true,
        values: [
            { id: 'course', caption: 'Kurs' },
            { id: 'lesson_plan', caption: 'Unterrichtsplanung' },
        ],
    },
    {
        id: 'ccm:oeh_widgets_suggest',
        caption: 'Vorschläge',
        type: 'multivalueSuggestBadges',
        allowValuespaceSuggestions: true,
        hasValues: true,
        values: educationalContextValues,
    },
    {
        id: 'ccm:difficulty',
        caption: 'Schwierigkeit',
        type: 'slider',
        min: 0,
        max: 10,
        step: 1,
        defaultMin: 0,
        defaultMax: 10,
    },
    {
        id: 'ccm:agerange',
        caption: 'Altersspanne',
        type: 'range',
        min: 6,
        max: 18,
        step: 1,
        defaultMin: 6,
        defaultMax: 18,
    },
    { id: 'ccm:lifecyclecontributer_author', caption: 'Autor:in', type: 'vcard' },
    // The native `<license>` widget takes its options from a widget definition of the same id and
    // dereferences `definition.values` without a guard (`MdsEditorWidgetLicenseComponent.ngOnInit`).
    {
        id: 'license',
        caption: 'Lizenz',
        type: 'license',
        hasValues: true,
        values: [
            { id: 'OPEN', caption: 'Frei zugänglich' },
            { id: 'CC_BY_OPEN', caption: 'Creative Commons' },
            { id: 'COPYRIGHT_OTHERS', caption: 'Urheberrechtlich geschützt' },
        ],
    },
];

export const ioViews: MdsView[] = [
    {
        id: 'node_general',
        caption: 'Allgemein',
        icon: 'info',
        html: [
            '<preview></preview>',
            '<cclom:title></cclom:title>',
            '<cclom:general_description></cclom:general_description>',
            '<cclom:general_keyword></cclom:general_keyword>',
            '<ccm:wwwurl></ccm:wwwurl>',
            '<ccm:author_email></ccm:author_email>',
            '<ccm:published_date></ccm:published_date>',
            '<ccm:create_month></ccm:create_month>',
            '<cclom:typicallearningtime></cclom:typicallearningtime>',
            '<ccm:price></ccm:price>',
            '<ccm:accent_color></ccm:accent_color>',
            '<ccm:is_public></ccm:is_public>',
            '<ccm:notify_authors></ccm:notify_authors>',
            '<ccm:conditionsofaccess></ccm:conditionsofaccess>',
            '<ccm:oeh_quality_criminal_law></ccm:oeh_quality_criminal_law>',
            '<ccm:oeh_accessibility_summary></ccm:oeh_accessibility_summary>',
            '<ccm:educationalintendedenduserrole></ccm:educationalintendedenduserrole>',
            '<ccm:educationallearningresourcetype></ccm:educationallearningresourcetype>',
            '<ccm:educationalcontext></ccm:educationalcontext>',
            '<ccm:taxonid></ccm:taxonid>',
            '<ccm:oeh_lrt_aggregated></ccm:oeh_lrt_aggregated>',
            '<ccm:oeh_widgets_suggest></ccm:oeh_widgets_suggest>',
            '<ccm:difficulty></ccm:difficulty>',
            '<ccm:agerange></ccm:agerange>',
            '<ccm:lifecyclecontributer_author></ccm:lifecyclecontributer_author>',
            '<author></author>',
            '<license></license>',
            '<version></version>',
        ].join('\n'),
    },
];

export const ioGroups: MdsGroup[] = [
    { id: 'io', rendering: 'angular', views: ['node_general'] },
    { id: 'io_simple', rendering: 'angular', views: ['node_general'] },
    // The metadata block below the renderer on the render2 page uses this group in viewer mode.
    { id: 'io_render', rendering: 'angular', views: ['node_general'] },
];
