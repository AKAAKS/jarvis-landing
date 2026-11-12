/* -----------------------------------------------------------------------------
 *  THE RECORD. Every line below is transcribed from a real log file in
 *  personal-assistant. Nothing here was written for the page.
 *
 *  Three files are in play, and no screen in the real system shows them
 *  merged. That merge is this page's own view, which is why each moment
 *  carries a `from` note saying so:
 *
 *    client  logs/voice_client.log   wake word, "Listening...", capture length
 *    daemon  logs/jarvisd.log        "Heard: ...", "Routing to ...", "Audio in"
 *    audit   logs/audit.jsonl        tool, input, verdict, reason, result
 *
 *  TIMEZONES: jarvisd.log and voice_client.log print local wall-clock
 *  (%H:%M:%S, no date). audit.jsonl stores UTC ISO-8601. Every `t` below is
 *  normalised to the LOCAL clock so one timeline reads in order. The
 *  conversions, for anyone checking the raw files:
 *    2026-10-30  EDT = UTC-4   18:38:58Z -> 14:38:58 ; 21:01:12Z -> 17:01:12
 *    2026-11-11  EST = UTC-5   17:03:14Z -> 12:03:14
 *    2026-11-12  EST = UTC-5   05:28:56Z -> 00:28:56
 *
 *  REDACTION: one Heard line in the mail moment is cut short, marked
 *  "[address redacted]", because the raw line contains an email address. A cut
 *  is allowed and must be visible; rewriting the line is not.
 *
 *  WHAT GMAIL ACTUALLY DOES. gmail_draft exists in the registry and is unit
 *  tested against a fake client, but it has NEVER appeared in audit.jsonl --
 *  zero entries, ever -- so no draft has ever been written to the real account
 *  and the page must not imply one has. Every real Gmail call is a
 *  gmail_search or a gmail_read. The reply reaches the user through
 *  set_clipboard instead, which is what the mail moment shows. Re-check with:
 *    grep -c gmail_draft logs/audit.jsonl
 *
 *  WHY THERE IS NO SPOKEN-REPLY LINE: the daemon logs what it HEARD but never
 *  what it said. Only the client prints "  JARVIS: ...", and the client's
 *  rotating log does not retain these turns. So each readout stops at the tool
 *  result rather than carry a reconstructed reply. If a terminal capture of one
 *  of these turns ever lands, add { k: 'reply' } lines and they will render.
 *
 *  Figures are listed per moment in `shots` and render below the readout.
 * -------------------------------------------------------------------------- */

export const LINKS = {
  github: 'https://github.com/AKAAKS/personal-assistant',
}

export const RECORD = [
  {
    id: 'bus',
    n: '01',
    kicker: 'The bus',
    title: 'It got it wrong four times, then wrote down the answer',
    blurb:
      'A smart speaker cannot open a web app on your laptop at all, so this is already past what one does. What makes it worth reading is that it fumbled. Four wrong URLs, each corrected out loud, in a transcript full of "my stock" and "catapidus" because the microphone was doing its best at midnight. Then I asked it to remember.',
    from: 'jarvisd.log + audit.jsonl, 2026-11-12',
    lines: [
      {
        t: '00:30:26',
        src: 'daemon',
        k: 'heard',
        x: 'I want to know what the closest bus route is and from which stop I should take it to get to campus.',
      },
      {
        t: '00:31:00',
        src: 'daemon',
        k: 'heard',
        x: 'Open the MyStop app for me on my browser with my route already put in. The root is the V.',
      },
      { t: '00:31:01', src: 'audit', k: 'tool', tool: 'open_url_browser', x: '{"url": "https://www.mystop.com"}' },
      { t: '', src: 'audit', k: 'result', x: 'Opened https://www.mystop.com in default browser.' },
      {
        t: '00:31:23',
        src: 'daemon',
        k: 'heard',
        x: "That's the wrong my stock. The why stop I want is the cata my stock for Center County.",
      },
      { t: '00:31:24', src: 'audit', k: 'tool', tool: 'open_url_browser', x: '{"url": "https://www.catabus.org"}' },
      {
        t: '00:32:33',
        src: 'daemon',
        k: 'heard',
        x: 'The app I want you to open is the Kata My Stop app. Open that on my browser for me.',
      },
      { t: '00:32:34', src: 'audit', k: 'tool', tool: 'open_url_browser', x: '{"url": "https://mystop.catabus.org"}' },
      { t: '00:32:48', src: 'daemon', k: 'heard', x: 'You opened a dead link. Recheck and selected the node.' },
      { t: '00:32:51', src: 'audit', k: 'tool', tool: 'open_url_browser', x: '{"url": "https://realtime.catabus.com"}' },
      { t: '', src: 'audit', k: 'verdict', v: 'write', x: 'allowed (write)' },
      { t: '', src: 'audit', k: 'result', x: 'Opened https://realtime.catabus.com in default browser.' },
      { t: '', src: '', k: 'gap', x: 'four tries. Now the part a speaker does not do.' },
      {
        t: '00:33:06',
        src: 'daemon',
        k: 'heard',
        x: 'Perfect, it works now. Remember this site when I say I want to check my catabust timing?',
      },
      {
        t: '00:33:08',
        src: 'audit',
        k: 'tool',
        tool: 'remember',
        x: '{"fact": "When user asks to check CATA bus timing, open realtime.catabus.com"}',
      },
      { t: '', src: 'audit', k: 'verdict', v: 'write', x: 'allowed (write)' },
      { t: '', src: '', k: 'gap', x: 'six minutes later' },
      { t: '00:39:35', src: 'daemon', k: 'heard', x: 'I mean, can I see my catapidus timing?' },
      { t: '00:39:36', src: 'audit', k: 'tool', tool: 'open_url_browser', x: '{"url": "https://realtime.catabus.com"}' },
      { t: '', src: 'audit', k: 'result', x: 'Opened https://realtime.catabus.com in default browser.' },
    ],
    note:
      'None of this is cleaned up. It heard "the cata my stock for Center County", then "can I see my catapidus timing", and resolved both to the same site -- the second one straight away, because the remember call had turned the right URL from something it had to guess into something it could look up.',
    shots: [
      {
        src: '/catabus.jpg',
        w: 1192,
        h: 885,
        alt: 'The CATA realtime site, showing the route list and the route map for Centre County.',
        cap: 'realtime.catabus.com, the fourth guess',
      },
    ],
  },
  {
    id: 'pc',
    n: '02',
    kicker: 'The machine',
    title: 'It is a process on my PC, so it can close things',
    blurb:
      'Spotify had added itself to my startup apps. Asking a speaker to close it is meaningless, because there is nothing there for a speaker to close. Here is the whole turn, including the part where Whisper heard "Barfire" and I said it again.',
    from: 'jarvisd.log + audit.jsonl, 2026-11-11',
    lines: [
      { t: '12:02:38', src: 'daemon', k: 'audio', x: 'Audio in: 1.9s (61440 bytes)' },
      { t: '12:02:38', src: 'daemon', k: 'speaker', x: 'speaker match 0.427 (gap +0.383 | threshold 0.25) -> accept' },
      { t: '12:02:41', src: 'daemon', k: 'heard', x: 'Close Barfire.' },
      { t: '', src: '', k: 'gap', x: 'not an app. I said it again.' },
      { t: '12:03:12', src: 'daemon', k: 'audio', x: 'Audio in: 3.6s (115200 bytes)' },
      { t: '12:03:12', src: 'daemon', k: 'speaker', x: 'speaker match 0.665 (gap +0.750 | threshold 0.25) -> accept' },
      { t: '12:03:13', src: 'daemon', k: 'heard', x: 'I meant close Spotify.' },
      { t: '12:03:13', src: 'daemon', k: 'route', x: 'Routing to claude-haiku-4-5' },
      { t: '12:03:14', src: 'audit', k: 'tool', tool: 'close_app', x: '{"name": "spotify"}' },
      { t: '', src: 'audit', k: 'verdict', v: 'write', x: 'allowed (write)' },
      { t: '', src: 'audit', k: 'result', x: 'Closed spotify.' },
      { t: '12:03:23', src: 'daemon', k: 'heard', x: "That's all." },
      { t: '12:03:36', src: 'daemon', k: 'reject', x: 'Utterance rejected — not the enrolled speaker' },
    ],
    note:
      'That last line is the speaker check refusing its own voice coming back in through the microphone. It is the reason talking to it does not send it into a conversation with itself.',
    /* No figure, deliberately. The terminal prints "  You: ..." and
     * "  JARVIS: ..." with plain print() calls (clients/voice_client.py:596)
     * that the file logger never sees -- voice_client.log holds only wake
     * word, capture length and speaker-check diagnostics. So any drawing of
     * that terminal would have to invent the reply line, and the readout
     * beside it is already the honest rendering of these logs. No mock-up. */
    shots: [],
  },
  {
    id: 'mail',
    n: '03',
    kicker: 'The mail',
    title: 'It reads the mail. It writes the reply. The paste is mine.',
    blurb:
      'Its reach into Gmail is reading, and that is all it has ever done: every Gmail call in the audit log is a gmail_search or a gmail_read, both read_only. It never touches the compose window. When I ask for a reply it writes the reply and puts it on my clipboard, and I paste it myself. There is no send tool in the registry for the model to call even if it decided to.',
    from: 'jarvisd.log + audit.jsonl, 2026-10-30 and 2026-11-12',
    lines: [
      { t: '17:01:34', src: 'daemon', k: 'audio', x: 'Audio in: 2.4s (75840 bytes)' },
      { t: '17:01:35', src: 'daemon', k: 'heard', x: "What's the last email I got?" },
      { t: '17:01:35', src: 'daemon', k: 'route', x: 'Routing to claude-haiku-4-5' },
      { t: '17:01:38', src: 'audit', k: 'tool', tool: 'gmail_search', x: '{"query": "is:all", "max_results": 1}' },
      { t: '', src: 'audit', k: 'verdict', v: 'read_only', x: 'allowed (read_only)' },
      {
        t: '',
        src: 'audit',
        k: 'result',
        x: '[1a18e5ee784d79a4] Fri, 30 Oct 2026 19:52:26 +0000 from Ultimate Guitar: [Last chance] The Fall sale is almost over',
      },
      {
        t: '',
        src: '',
        k: 'gap',
        x: 'a read verdict, not a write one. Reading mail changes nothing. Thirteen days later I asked it to write one.',
      },
      { t: '00:44:39', src: 'daemon', k: 'audio', x: 'Audio in: 3.8s (120000 bytes)' },
      { t: '00:44:40', src: 'daemon', k: 'heard', x: 'I want you to draft an email.' },
      { t: '00:45:01', src: 'daemon', k: 'audio', x: 'Audio in: 15.0s (480000 bytes)' },
      {
        t: '00:45:03',
        src: 'daemon',
        k: 'heard',
        x: "It should go to just hiring manager, so start off with dear hiring manager, then go to the next line and say, Hi, I'm Akshut Karthik, and explain at least three lines about myself and my role, which is a recent",
      },
      { t: '00:45:03', src: 'daemon', k: 'route', x: 'Routing to claude-sonnet-5' },
      {
        t: '00:45:38',
        src: 'daemon',
        k: 'heard',
        x: 'Yes, in computer science graduated from Penn State University in May 2026, looking for software engineering roles, and padded with at least two more lines, and ended with the signature saying, sincerely, Akshut Karthik, thank you.',
      },
      {
        t: '00:45:40',
        src: 'audit',
        k: 'tool',
        tool: 'set_clipboard',
        x: "{\"text\": \"Dear Hiring Manager,\\n\\nHi, I'm Akshut Karthik. I recently graduated from Penn State University in May 2026 with a degree in Computer Science. …\"}",
      },
      { t: '', src: 'audit', k: 'verdict', v: 'write', x: 'allowed (write)' },
      { t: '', src: 'audit', k: 'result', x: 'Copied to your clipboard.' },
      { t: '00:45:52', src: 'daemon', k: 'reject', x: 'Utterance rejected — not the enrolled speaker' },
    ],
    note:
      'Two things worth catching. The long dictation is the only turn on this page routed to claude-sonnet-5, because the cheap model is not the one that writes a cover letter. And the clipboard text is the only place here where you can read something the machine composed rather than something it heard -- it is there by accident, because the reply had to pass through a tool to reach me and the log caught it going past. The figure below is that text pasted, cut short in the line above; the only hand edit is my name, which the microphone gave it as "Akshut".',
    shots: [
      {
        src: '/draft.jpg',
        w: 1400,
        h: 391,
        alt: 'The reply JARVIS composed, pasted out of the clipboard into a compose window, unsent and with no recipient.',
        cap: 'the reply, pasted. One hand edit: it heard my name as "Akshut".',
      },
    ],
  },
]

/* -----------------------------------------------------------------------------
 *  THE BASELINE. The things a consumer speaker already does, which JARVIS also
 *  does. Here as table stakes rather than as the pitch. Every tool name is
 *  copied from jarvisd/tools/*.py on master.
 *
 *  Counts measured 2026-11-11 against personal-assistant@bc914ea:
 *    tests     1092  python -m pytest --collect-only -q
 *    tools       72  sum of len(TOOLS) over jarvisd/tools/*.py, IMPORTED.
 *                    Do not grep for '"name":' -- nested JSON-schema
 *                    properties carry a name key and that overcounts to 88.
 *    surfaces    13  the SURFACES list below (20 tool modules, grouped the
 *                    way a person would name them)
 * -------------------------------------------------------------------------- */
export const SURFACES = [
  { name: 'Home Assistant', tools: ['list_devices', 'get_device_status', 'control_light', 'control_switch', 'control_media', 'set_thermostat', 'send_notification'], ex: 'Dim the living room to 30%' },
  { name: 'Spotify', tools: ['spotify_search', 'spotify_play', 'spotify_playback_control', 'spotify_queue', 'spotify_now_playing', 'spotify_devices'], ex: 'Play Die For You by The Weeknd' },
  { name: 'Android / Google TV', tools: ['tv_launch_app', 'tv_close_app', 'tv_remote', 'tv_type_text', 'tv_open_url', 'tv_search_youtube', 'tv_status', 'tv_power'], ex: 'Put the F1 highlights on YouTube' },
  { name: 'This PC', tools: ['launch_app', 'close_app', 'list_processes', 'open_url_browser', 'system_info', 'open_terminal', 'run_command', 'scan_unsaved_work', 'system_power', 'get_clipboard', 'set_clipboard'], ex: 'Open Firefox' },
  { name: 'Meals & pantry', tools: ['log_meal', 'log_estimated_meal', 'day_status', 'meal_summary', 'meal_trends', 'set_nutrition_targets', 'export_meals', 'lookup_food', 'pantry_add', 'pantry_list', 'pantry_set_quantity', 'pantry_remove', 'check_dish', 'suggest_meals', 'plan_prep', 'cook_meal', 'list_planned_meals'], ex: 'Log two eggs and toast' },
  { name: 'Reminders', tools: ['set_reminder', 'set_timer', 'list_reminders', 'cancel_reminder'], ex: 'Remind me to clean the bathroom at 11pm' },
  { name: 'Gmail', tools: ['gmail_search', 'gmail_read', 'gmail_draft'], ex: 'Did the landlord reply?' },
  { name: 'Calendar', tools: ['calendar_list_events', 'calendar_get_day', 'calendar_create_event', 'calendar_delete_event'], ex: "What's on tomorrow?" },
  { name: 'Automations', tools: ['add_trigger_rule', 'list_trigger_rules', 'delete_trigger_rule'], ex: 'If the door opens after 11pm, light the hall' },
  { name: 'Files', tools: ['search_files', 'read_document', 'run_script'], ex: 'Find my tax PDF and summarise it' },
  { name: 'Suggestions', tools: ['list_proposals', 'accept_proposal', 'dismiss_proposal'], ex: 'Show suggestions' },
  { name: 'Memory', tools: ['remember', 'recall'], ex: 'Remember I prefer metric units' },
  { name: 'Weather', tools: ['get_weather'], ex: 'Do I need a coat?' },
]

export const TOOL_COUNT = SURFACES.reduce((n, s) => n + s.tools.length, 0) // 72

export const STATS = [
  { n: '1,092', l: 'tests' },
  { n: String(TOOL_COUNT), l: 'tools' },
  { n: String(SURFACES.length), l: 'surfaces' },
  { n: '$20', l: 'monthly cap' },
]

/* How it holds together. Each claim is checkable in security/ or router/. */
export const GUARD = [
  { t: 'One choke-point', d: 'Every tool call funnels through a single guard before it runs. There is no second path.' },
  { t: 'Four permission tiers', d: 'read_only, write, destructive, forbidden. Today that is 24 read-only tools, 34 write and 4 destructive.' },
  { t: 'Turn-bounded confirmation', d: 'The model cannot approve its own destructive call inside one loop, which closes a live prompt-injection hole.' },
  { t: 'Money is refused, not negotiated', d: 'Transfer and payment keywords are denied outright before anything else runs.' },
  { t: 'Fenced access', d: 'File reads are allowlisted. Shell commands run against a denylist.' },
  { t: 'Append-only audit', d: 'Every call lands in audit.jsonl with its verdict and reason. Everything above came out of that file.' },
  { t: 'Secrets never reach the log', d: 'password, token, secret, api_key and credential are redacted, nested keys included, before the line is written.' },
  { t: 'Enrolled-speaker check', d: 'An utterance that matches its own TTS output more closely than it matches me is dropped.' },
]

export const ROUTING = [
  { tier: 'local', model: 'ollama', d: 'Trivial turns never leave the machine.' },
  { tier: 'cloud', model: 'claude-haiku-4-5', d: 'The default. Every turn in the record above took this tier.' },
  { tier: 'cloud', model: 'claude-sonnet-5', d: 'Escalated only for turns that need the reasoning, under a hard monthly cap.' },
]

export const SOLID = [
  { t: '1,092 tests passing', d: 'The loop, the router, every integration and the guard are covered.' },
  { t: 'Offline-first voice', d: 'Wake word, speech-to-text, text-to-speech and the local tier all work with no internet.' },
  { t: 'The gate was designed in', d: 'Audited, turn-bounded and fail-closed, not bolted on afterwards.' },
  { t: 'Cost-engineered', d: 'Cheapest capable model per request, under a hard $20 per month cap.' },
  { t: 'Barge-in ships', d: 'Say the wake word over a spoken reply and it stops, keeps the cut-off turn in history, and takes the correction. Merged to master on 25 October after a live-mic pass.' },
]

export const GROWING = [
  { t: 'One machine', d: 'Runs on a single Windows PC today. Multi-host is future work.' },
  { t: 'Loopback only', d: 'The WebSocket has no auth, so it stays bound to localhost rather than the network.' },
  { t: 'No voice satellite yet', d: 'A remote mic puck on a Pi is design intent, not shipped.' },
  { t: 'The voice tuning is unmerged', d: 'Eight commits retuning speaker verification and the echo gate are live-tested on a branch, not on master. The record above was recorded with them on.' },
  { t: 'Directions are hit and miss', d: 'On 30 October it built a Maps URL from my coordinates and a destination. On 12 November the same request opened the Maps home page and nothing else.' },
]
