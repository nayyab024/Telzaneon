/* Live demo settings. Edit these values to switch each demo on; no other
   file needs to change. Empty values show the demo as "being configured". */
window.TELZA_DEMO_CONFIG = {
  voiceInbound: {
    // The phone number visitors call to talk to the inbound Voice Agent,
    // in international format, e.g. '+14015550123'. Empty = not live yet.
    number: '',
    // Optional label shown on the button, e.g. '+1 (401) 555-0123'.
    label: ''
  },
  voiceOutbound: {
    // true: visitors can request a call from the outbound agent. Requests are
    // sent to /api/demo-request (and to TELZA_WEBHOOK_URL if configured).
    enabled: true,
    // Set to true once the agent places demo calls automatically.
    live: false
  },
  whatsapp: {
    // WhatsApp number in international format without '+' or spaces.
    number: '14016783367',
    message: 'Hi Telza! I’d like to try the WhatsApp bot demo.',
    // Set to true once the bot (not a person) answers this number.
    live: false
  },
  fillo: {
    // A link to a Fillo sandbox or recorded walkthrough. Empty = book a walkthrough.
    sandboxUrl: ''
  },
  // Optional: an https:// URL to embed (web chat widget, recorded demo, etc.).
  embedUrl: '',
  embedTitle: 'Telza live demo'
};
