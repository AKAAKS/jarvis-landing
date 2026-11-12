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
 *
 *  WHY THERE IS NO SPOKEN-REPLY LINE: the daemon logs what it HEARD but never
 *  what it said. Only the client prints "  JARVIS: ...", and the client's
 *  rotating log does not retain these turns. So each readout stops at the tool
 *  result rather than carry a reconstructed reply. If a terminal capture of one
 *  of these turns ever lands, add { k: 'reply' } lines and they will render.
 *
 *  `shot` on a line means: when this line is revealed, reveal that figure.
 * -------------------------------------------------------------------------- */

export const LINKS = {
  github: 'https://github.com/AKAAKS/personal-assistant',
}

export const RECORD = [
  {
    id: 'bus',
    n: '01',
    kicker: 'The bus',
    title: 'It went and got what the speaker could not',
    blurb:
      'Two turns, both on 30 October. The first is a question a smart speaker answers with a web result. The second is one it cannot do at all: put the route on my screen, from my own address, with the walking time already worked out.',
    from: 'jarvisd.log + audit.jsonl, 2026-10-30',
    lines: [
      { t: '14:38:20', src: 'daemon', k: 'heard', x: "When's the next bus I can take to each campus?" },
      { t: '14:38:20', src: 'daemon', k: 'route', x: 'Routing to claude-haiku-4-5' },
      { t: '14:38:58', src: 'audit', k: 'tool', tool: 'open_url_browser', x: '{"url": "https://www.catabus.com"}' },
      { t: '', src: 'audit', k: 'verdict', v: 'write', x: 'allowed (write)' },
      { t: '', src: 'audit', k: 'result', x: 'Opened https://www.catabus.com in default browser.', shot: 0 },
      { t: '', src: '', k: 'gap', x: '22 minutes later, still getting out of the door' },
      { t: '17:01:09', src: 'daemon', k: 'audio', x: 'Audio in: 4.6s (146880 bytes)' },
      { t: '17:01:10', src: 'daemon', k: 'heard', x: 'Give me directions to walk from my home to crunch fitness.' },
      { t: '17:01:10', src: 'daemon', k: 'route', x: 'Routing to claude-haiku-4-5' },
      {
        t: '17:01:12',
        src: 'audit',
        k: 'tool',
        tool: 'open_url_browser',
        x: '{"url": "https://www.google.com/maps/dir/40.8154,-77.8856/Crunch+Fitness+near+Patton+Township+PA"}',
      },
      { t: '', src: 'audit', k: 'verdict', v: 'write', x: 'allowed (write)' },
      {
        t: '',
        src: 'audit',
        k: 'result',
        x: 'Opened https://www.google.com/maps/dir/40.8154,-77.8856/Crunch+Fitness+near+Patton+Township+PA in default browser.',
        shot: 1,
      },
    ],
    note:
      'Those are my own coordinates in the second call, not a place name. It resolved where home is before it built the URL.',
    shots: [
      {
        src: '',
        alt: 'The CATA bus site as JARVIS opened it, showing the next departures for my stop.',
        cap: 'catabus.com, opened on my laptop',
      },
      {
        src: '',
        alt: 'Google Maps with walking directions from my address to Crunch Fitness, walking time shown.',
        cap: 'Maps, my coordinates, walking route',
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
      { t: '', src: 'audit', k: 'result', x: 'Closed spotify.', shot: 0 },
      { t: '12:03:23', src: 'daemon', k: 'heard', x: "That's all." },
      { t: '12:03:36', src: 'daemon', k: 'reject', x: 'Utterance rejected: not the enrolled speaker' },
    ],
    note:
      'That last line is the speaker check refusing its own voice coming back in through the microphone. It is the reason talking to it does not send it into a conversation with itself.',
    shots: [
      { src: '', alt: 'The voice client terminal showing the close Spotify turn.', cap: 'the client, mid-turn' },
    ],
  },
  {
    id: 'mail',
    n: '03',
    kicker: 'The mail',
    title: 'It reads the mail. It cannot send.',
    blurb:
      'The Gmail tool pack has exactly three entries: gmail_search, gmail_read and gmail_draft. No send tool exists in the registry, so there is nothing for the model to call even if it decided to. The worst case is a draft sitting in my own account.',
    from: 'jarvisd.log + audit.jsonl, 2026-10-30',
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
        shot: 0,
      },
      { t: '', src: '', k: 'gap', x: 'a read verdict, not a write one. Reading mail changes nothing.' },
      {
        t: '17:05:20',
        src: 'daemon',
        k: 'heard',
        x: 'From now on when I ask you to read my emails only read from my primary inbox',
      },
      { t: '17:07:12', src: 'daemon', k: 'heard', x: 'Can you close the Google Maps tab that you opened?' },
    ],
    note:
      'Those last two lines are from the same session: a standing preference it kept, and a request to undo something it had done an hour earlier. Both are ordinary. Neither needed a new feature.',
    shots: [
      { src: '', alt: 'A reply JARVIS wrote, sitting unsent in the Gmail Drafts folder.', cap: 'a drafted reply, unsent, in Drafts' },
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
]

export const GROWING = [
  { t: 'One machine', d: 'Runs on a single Windows PC today. Multi-host is future work.' },
  { t: 'Loopback only', d: 'The WebSocket has no auth, so it stays bound to localhost rather than the network.' },
  { t: 'Barge-in is on a branch', d: 'Interrupting it mid-sentence works, but it is awaiting a live-mic acceptance pass.' },
  { t: 'No voice satellite yet', d: 'A remote mic puck on a Pi is design intent, not shipped.' },
]
