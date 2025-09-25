// Simple client-side i18n helper
(function(){
  const translations = {
    en: {
      brand: 'Internship Application Manager',
      subtitle: 'Settings',
      menu_job: '📋 Job Postings',
      menu_resumes: '📄 Resumes',
      menu_calendar: '📅 Calendar',
      menu_ai: '🤖 AI Assistant',
      menu_settings: '⚙️ Settings',
      appearance: 'Appearance',
      language_label: 'Language',
      timezone_label: 'Timezone',
      reminders: 'Reminders & Notifications',
      accessibility: 'Accessibility & Text',
      save: 'Save Settings',
      reset: 'Reset to Defaults',
      export: 'Export',
      import: 'Import',
      clear: 'Clear all saved settings',
      tips: 'Tips'
    },
    es: {
      brand: 'Administrador de Solicitudes de Prácticas',
      subtitle: 'Configuración',
      menu_job: '📋 Ofertas',
      menu_resumes: '📄 Currículums',
      menu_calendar: '📅 Calendario',
      menu_ai: '🤖 Asistente IA',
      menu_settings: '⚙️ Configuración',
      appearance: 'Apariencia',
      language_label: 'Idioma',
      timezone_label: 'Zona horaria',
      reminders: 'Recordatorios y Notificaciones',
      accessibility: 'Accesibilidad y Texto',
      save: 'Guardar configuración',
      reset: 'Restablecer valores',
      export: 'Exportar',
      import: 'Importar',
      clear: 'Borrar todas las configuraciones guardadas',
      tips: 'Consejos'
    },
    fr: {
      brand: 'Gestionnaire de candidatures',
      subtitle: 'Paramètres',
      menu_job: '📋 Offres',
      menu_resumes: '📄 CV',
      menu_calendar: '📅 Calendrier',
      menu_ai: '🤖 Assistant IA',
      menu_settings: '⚙️ Paramètres',
      appearance: 'Apparence',
      language_label: 'Langue',
      timezone_label: 'Fuseau horaire',
      reminders: 'Rappels et Notifications',
      accessibility: 'Accessibilité et Texte',
      save: 'Enregistrer',
      reset: 'Réinitialiser',
      export: 'Exporter',
      import: 'Importer',
      clear: 'Supprimer toutes les configurations enregistrées',
      tips: 'Astuces'
    },
    de: {
      brand: 'Praktikums-Bewerbungsverwaltung',
      subtitle: 'Einstellungen',
      menu_job: '📋 Stellenangebote',
      menu_resumes: '📄 Lebensläufe',
      menu_calendar: '📅 Kalender',
      menu_ai: '🤖 KI-Assistent',
      menu_settings: '⚙️ Einstellungen',
      appearance: 'Darstellung',
      language_label: 'Sprache',
      timezone_label: 'Zeitzone',
      reminders: 'Erinnerungen & Benachrichtigungen',
      accessibility: 'Barrierefreiheit & Text',
      save: 'Einstellungen speichern',
      reset: 'Zurücksetzen',
      export: 'Exportieren',
      import: 'Importieren',
      clear: 'Alle gespeicherten Einstellungen löschen',
      tips: 'Tipps'
    }
  };

  const I18n = {
    t(key, lang) {
      lang = lang || (JSON.parse(localStorage.getItem('appSettings') || '{}').language) || 'en';
      return (translations[lang] && translations[lang][key]) || translations['en'][key] || key;
    },
    applyLanguage(lang, root=document) {
      if (!lang) lang = (JSON.parse(localStorage.getItem('appSettings') || '{}').language) || 'en';
      try {
        const els = root.querySelectorAll('[data-i18n]');
        els.forEach(el => {
          const key = el.getAttribute('data-i18n');
          const val = I18n.t(key, lang);
          if (val !== undefined) el.textContent = val;
        });
      } catch (e) {
        // ignore
      }
    },
    translations
  };

  window.I18n = I18n;
})();
