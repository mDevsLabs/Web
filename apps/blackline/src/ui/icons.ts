const icons:Record<string,string>={
  arrow:'M5 12h14m-6-6 6 6-6 6',chevron:'m9 5 7 7-7 7',play:'m8 5 11 7-11 7V5Z',target:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M12 8v8m-4-4h8',
  shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z',settings:'M4 6h16M4 12h16M4 18h16M8 4v4m8 2v4M10 16v4',
  gun:'M3 8h15v4h-7l-2 8H5l2-8H3V8Zm15 1h4m-9-4v3',book:'M4 4h7l1 2 1-2h7v15h-7l-1 2-1-2H4V4Zm8 2v15',
  audio:'m11 4-5 5H2v6h4l5 5V4Zm4 4c3 2 3 6 0 8m3-11c5 4 5 10 0 14',mute:'m11 4-5 5H2v6h4l5 5V4Zm5 5 6 6m0-6-6 6',
  expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',close:'m6 6 12 12M6 18 18 6',skull:'M5 14V9a7 7 0 1 1 14 0v5l-3 1v5H8v-5l-3-1Zm3-4v2m8-2v2m-4 3v2',
  flag:'M5 21V3m0 1h13l-3 4 3 4H5',wave:'M2 12h4l3-7 6 14 3-7h4',bolt:'m13 2-9 12h7l-1 8 10-13h-7l0-7Z',
  interact:'M7 2v20M17 2v20M7 5h10M7 10h10M7 15h10M7 20h10',
  pause:'M8 5v14m8-14v14',score:'M4 4h16v16H4zM8 8h8M8 12h8M8 16h4',reload:'M20 7v5h-5m5 0a8 8 0 1 0-2 6',jump:'m5 14 7-7 7 7M12 7v14M5 3h14',crouch:'M13 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM12 8l-2 5 5 2 2 6M10 13l-4 4H3M12 9l5 3h4',grenade:'m10 4 4-2 3 4-4 3M7 9a7 7 0 1 0 10 10A7 7 0 0 0 7 9Zm-1 1 10 10',melee:'m5 20 3-3M7 15l4 4M9 16 19 3l2 2-9 13',sprint:'M14 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-1 5-4 4-5 1m9-5 4 4h4M9 11l4 4-2 6M13 8l-1 6 6 5M3 5h5M2 9h3',
  cross:'M12 2v5m0 10v5M2 12h5m10 0h5m-5-7H7v10h10V7Z',clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v6l4 2',
};
export const icon=(name:string,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="${icons[name]??icons.target}"/></svg>`;
