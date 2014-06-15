<?php
$messages = array (
    'de'=> array(
       'link_failed'   => 'Link wurde leider NICHT eingetragen!',
       'delete_succ'   => 'Erfolgreich gelöscht',
       'show_create'   => 'Shownotes wurden mit dem Showmator erstellt',
       'wrong_version' => 'Auf dem Server läuft nicht die aktuelle Version des Showmators. Bitte updaten!',
       'hide_time'     => 'Zeit ausblenden',
       'show_time'     => 'Zeit anzeigen',
       'hide_blank'    => 'target="_blank" ausblenden',
       'show_blank'    => 'target="_blank" einblenden',
       'as_html'       => 'Als HTML-Liste',
       'as_plain'      => 'Als Plain-Text',
       'change'        => '&Auml;ndern',
       'time_f_entry'  => 'Zeit des ersten Eintrags',
       'pl_chapter'    => 'Shownotes als Podlove Simple Chapter',
       'prep_notes'    => 'Shownotes aufbereiten',
       'live_notes'    => 'Live-Shownotes',
       'auto_open'     => 'Neue Links automatisch öffnen',
       'punchline'     => 'Showmator, das ultimative Shownotes-Tool für Podcaster',
       'no_notes'      => 'Bitte noch etwas Geduld. Im Moment sind noch keine Shownotes eingetragen.',
       'cur_viewer'    => 'Aktuelle Betrachter',
       'auto_refresh'  => 'Die Seite aktualisiert sich automatisch',
       'show_succ'     => 'Die Shownotes "%s" wurden angelegt. Zeit wird beim ersten Eintrag gestartet."',
       'show_err'      => 'Die Shownotes mit diesem Slug existieren schon. Bitte einen anderen Slug verwenden.',
       'part_succ'     => 'Du kannst jetzt bei den Shownotes  "%s" mitmachen',
       'part_err'      => 'Die Shownotes mit diesem Slug existieren nicht. Bitte erst anlegen!'
       
    ),

    'en'=> array(
       'link_failed'   => 'The Link was NOT entered!',
       'delete_succ'   => 'Successfully deleted',
       'show_create'   => 'Shownotes were created with Showmator',
       'wrong_version' => 'There is the wrong Showmator verion on the server. Pleaseupdate!',
       'hide_time'     => 'Hide time',
       'show_time'     => 'Show time',
       'hide_blank'    => 'Hide target="_blank"',
       'show_blank'    => 'Show target="_blank"',
       'as_html'       => 'As HTML-List',
       'as_plain'      => 'As Plain-Text',
       'change'        => 'Change',
       'time_f_entry'  => 'Time of the first entry',
       'pl_chapter'    => 'Shownotes as Podlove Simple Chapter',
       'prep_notes'    => 'prepare Shownotes',
       'live_notes'    => 'Live-Shownotes',
       'auto_open'     => 'Open new links automatically',
       'punchline'     => 'Showmator, the ultimate Shownotes-Tool for Podcasters',
       'no_notes'      => 'Please be patient. There are no Shownotes at the Moment.',
       'cur_viewer'    => 'Current Viewer',
       'auto_refresh'  => 'This page refreshes automatically',
       'show_succ'     => 'The Shownotes "%s" were created. Time will be started on the first entry."',
       'show_err'      => 'Shownotes with this slug already exist. Please change the slug',
       'part_succ'     => 'You can now participate at the Shownotes "%s"',
       'part_err'      => 'There are no Shownotes with this slug. Please create one first!'
    )
);


function msg($s) {
    global $LANG;
    global $messages;
    
    if (isset($messages[$LANG])) {
        if (isset($messages[$LANG][$s])) {
           return $messages[$LANG][$s];
        } else {
           error_log("l10n error:LANG:" ."$LANG,message:'$s'");
        }
    } else {
        if (isset($messages["de"][$s])) {
            return $messages["de"][$s];
        } else {
            error_log("l10n error:LANG:" ."$LANG,message:'$s'");
        }
    }
}
?>
