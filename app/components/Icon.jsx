// Inline SVG icon set — single-stroke, friendly, 24×24
export function Icon({ name, size = 20, stroke = 1.75, className = "", ...rest }) {
  const s = stroke;
  const props = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: s, strokeLinecap: "round", strokeLinejoin: "round",
    className, ...rest,
  };
  switch (name) {
    case "home": return (<svg {...props}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>);
    case "plus": return (<svg {...props}><path d="M12 5v14M5 12h14"/></svg>);
    case "inbox": return (<svg {...props}><path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 4h14l2 9v7H3v-7z"/></svg>);
    case "check-circle": return (<svg {...props}><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>);
    case "list": return (<svg {...props}><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>);
    case "tool": return (<svg {...props}><path d="M14.7 6.3a4 4 0 1 0-5.4 5.4l-6.3 6.3a1.5 1.5 0 0 0 2.1 2.1l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.5-2.5z"/></svg>);
    case "archive": return (<svg {...props}><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/></svg>);
    case "bell": return (<svg {...props}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>);
    case "settings": return (<svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>);
    case "help": return (<svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-1 .4-1 1.2-1 2.2"/><circle cx="12" cy="17" r=".5"/></svg>);
    case "search": return (<svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>);
    case "filter": return (<svg {...props}><path d="M3 5h18l-7 9v5l-4 2v-7z"/></svg>);
    case "chevron-right": return (<svg {...props}><path d="m9 6 6 6-6 6"/></svg>);
    case "chevron-down": return (<svg {...props}><path d="m6 9 6 6 6-6"/></svg>);
    case "x": return (<svg {...props}><path d="M6 6l12 12M18 6 6 18"/></svg>);
    case "check": return (<svg {...props}><path d="m5 13 4 4 10-12"/></svg>);
    case "monitor": return (<svg {...props}><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>);
    case "phone": return (<svg {...props}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 13 13 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>);
    case "wrench": return (<svg {...props}><path d="M14.7 6.3a4 4 0 1 0-5.4 5.4l-6.3 6.3a1.5 1.5 0 0 0 2.1 2.1l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.5-2.5z"/></svg>);
    case "lifebuoy": return (<svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="m4.9 4.9 4.6 4.6M14.5 14.5l4.6 4.6M19.1 4.9l-4.6 4.6M9.5 14.5l-4.6 4.6"/></svg>);
    case "user-plus": return (<svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>);
    case "wallet": return (<svg {...props}><path d="M20 7H5a2 2 0 1 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16V7H5a2 2 0 0 1-2-2z"/><circle cx="17" cy="14" r="1.2"/></svg>);
    case "mail": return (<svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>);
    case "line": return (<svg {...props}><rect x="2.5" y="3.5" width="19" height="14" rx="4"/><path d="M7 14V9M10 9v5l3-3.5V14M16 9v5h2.5M16 11.5h2"/><path d="m8 19 2-1.5"/></svg>);
    case "bell-dot": return (<svg {...props}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/><circle cx="18" cy="6" r="2.5" fill="currentColor" stroke="none"/></svg>);
    case "file-text": return (<svg {...props}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h6"/></svg>);
    case "clock": return (<svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>);
    case "edit": return (<svg {...props}><path d="M11 4H4v16h16v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/></svg>);
    case "trash": return (<svg {...props}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>);
    case "download": return (<svg {...props}><path d="M12 4v12M7 11l5 5 5-5M5 20h14"/></svg>);
    case "upload":   return (<svg {...props}><path d="M12 20V8M7 13l5-5 5 5M5 4h14"/></svg>);
    case "send": return (<svg {...props}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>);
    case "signature": return (<svg {...props}><path d="M3 18s2-1 4-1 4 3 6 3 4-3 6-3 2 1 2 1"/><path d="M5 14c2-4 4-9 6-9s1 6 3 6 2-3 4-3"/></svg>);
    case "shield-check": return (<svg {...props}><path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>);
    case "trending-up": return (<svg {...props}><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>);
    case "circle": return (<svg {...props}><circle cx="12" cy="12" r="9"/></svg>);
    case "circle-dot": return (<svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>);
    case "language": return (<svg {...props}><path d="M3 5h12M9 3v2M5 8c1 4 4 7 7 8M13 5c-1 4-5 9-9 11"/><path d="M14 19h7M16 19l-2 3M19 19l2 3"/></svg>);
    case "moon": return (<svg {...props}><path d="M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10"/></svg>);
    case "sun": return (<svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5 19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>);
    case "menu": return (<svg {...props}><path d="M4 6h16M4 12h16M4 18h16"/></svg>);
    case "log": return (<svg {...props}><path d="M4 6h16M4 12h16M4 18h12"/></svg>);
    case "user": return (<svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>);
    case "users": return (<svg {...props}><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M17 11a4 4 0 0 0 0-7"/><path d="M22 21a7 7 0 0 0-5-6.7"/></svg>);
    case "arrow-right": return (<svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>);
    case "arrow-left": return (<svg {...props}><path d="M19 12H5M11 19l-7-7 7-7"/></svg>);
    case "external": return (<svg {...props}><path d="M14 4h6v6M10 14 20 4M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>);
    case "play": return (<svg {...props}><path d="m7 4 13 8-13 8z"/></svg>);
    case "more": return (<svg {...props}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>);
    case "fingerprint": return (<svg {...props}><path d="M6 12a6 6 0 0 1 12 0"/><path d="M9 12c0 4 1 6 2 7"/><path d="M12 9a3 3 0 0 1 3 3c0 3 1 5 2 6"/><path d="M5 16c-1-1-2-3-2-4"/></svg>);
    case "lock": return (<svg {...props}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
    case "eye": return (<svg {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
    case "eye-off": return (<svg {...props}><path d="M17.9 17.9A10.9 10.9 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.1-6.1M9.9 4.2A10 10 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.1 3.3M1 1l22 22"/><circle cx="12" cy="12" r="3"/></svg>);
    case "alert-circle": return (<svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>);
    case "log-out": return (<svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>);
    default: return (<svg {...props}><rect x="4" y="4" width="16" height="16" rx="2"/></svg>);
  }
}
