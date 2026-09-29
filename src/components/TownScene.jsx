import { memo } from 'react'

const INK = '#201332'

// Art and hitboxes share percentage coordinates; never crop the scene on phones.
function Scene({ children, night = false }) {
  return <svg className="town-art" viewBox="0 0 1000 680" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <pattern id="town-paving" width="64" height="32" patternUnits="userSpaceOnUse"><rect width="64" height="32" fill="#b7a1bb"/><path d="M0 31H64M32 0V31" stroke="#927c9f" strokeWidth="2"/><path d="M3 3H29M35 3H61" stroke="#d5bfd1" strokeWidth="2"/></pattern>
      <pattern id="town-grass" width="46" height="38" patternUnits="userSpaceOnUse"><rect width="46" height="38" fill="#4b8474"/><path d="M8 20v-4m4 7v-5m20 14v-5" stroke="#66a08a" strokeWidth="3"/></pattern>
      <pattern id="town-brick" width="32" height="20" patternUnits="userSpaceOnUse"><path d="M0 19H32M16 0V19" stroke="#201332" strokeOpacity=".17" strokeWidth="2"/></pattern>
      <pattern id="town-board" width="100" height="24" patternUnits="userSpaceOnUse"><rect width="100" height="24" fill="#986e79"/><path d="M0 23H100M50 0V23" stroke="#553e56" strokeWidth="3"/><path d="M6 7H38M63 16H91" stroke="#bd9197" strokeWidth="2"/></pattern>
    </defs>
    <rect width="1000" height="680" fill={night ? '#251745' : '#6b5d97'}/>
    <path d="M0 100H70V80H170V110H220V55H280V95H360V70H410V112H480V50H530V85H620V65H695V115H755V58H825V85H910V65H960V100H1000V220H0Z" fill="#514574"/>
    <path d="M0 163H90V127H180V167H245V130H330V159H400V113H445V154H550V115H600V146H700V133H750V173H850V124H910V159H1000V260H0Z" fill="#403857"/>
    {[65,145,240,310,470,580,740,870,960].map((x,i) => <g key={x}><rect x={x} y={30+i%3*17} width="5" height="5" fill="#ffe2ad" opacity={i%2 ? '.8' : '.4'}/><rect x={x} y={134+i%2*12} width="5" height="8" fill="#c29da6"/></g>)}
    <path d="M856 27h28v8h10v26h-10v10h-28V61h-10V35h10Z" fill="#ffdf9b"/>
    <rect y="220" width="1000" height="460" fill="url(#town-grass)"/>
    {children}
  </svg>
}

function Tree({ x, y, pink = false, scale = 1 }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cy="10" rx="45" ry="11" fill={INK} opacity=".25"/>
    <path d="M-8 -65H9V10H-8Z" fill="#916779" stroke={INK} strokeWidth="4"/><path d="M0 -5v-40l-18 -13M1 -28l18 -19" stroke="#593f58" strokeWidth="4" fill="none"/>
    <path d="M-25 -115H25V-101H43V-84H52V-56H35V-40H-35V-54H-50V-84H-40V-101H-25Z" fill={pink ? '#c574a8' : '#397264'} stroke={INK} strokeWidth="4"/>
    <path d="M-24 -109H21V-96H36V-82H8V-68H-38V-85H-30Z" fill={pink ? '#ffb3de' : '#72b69a'}/>
    <path d="M-22 -98h14v8h-14M18 -61h14v7H18M-9 -52H3v5H-9" stroke={pink ? '#ff5fa2' : '#4be0e0'} strokeWidth="4" opacity=".65"/>
  </g>
}

function Lamp({ x, y }) {
  return <g transform={`translate(${x} ${y})`}><ellipse rx="34" ry="9" fill="#ffdc9a" opacity=".15"/><path d="M-9 0H9V-8H4V-91H-4V-8H-9Z" fill="#312943" stroke={INK} strokeWidth="3"/><path d="M-15 -111H15L10 -85H-10Z" fill="#ffe3a0" stroke={INK} strokeWidth="4"/><path d="M-18 -111L0 -127L18 -111Z" fill="#735486" stroke={INK} strokeWidth="3"/><rect x="-6" y="-106" width="8" height="15" fill="#fff6d6"/></g>
}

function Window({ x, y, color = '#ffe1a0', w = 42, h = 45 }) {
  return <g transform={`translate(${x} ${y})`}><rect width={w} height={h} fill={color} stroke={INK} strokeWidth="4"/><path d={`M${w/2} 0V${h}M0 ${h/2}H${w}`} stroke="#5b4368" strokeWidth="4"/><path d={`M5 5H${w/2-4}V${h/2-5}H5Z`} fill="#fff4df" opacity=".4"/><rect x="-4" y={h} width={w+8} height="6" fill="#473754"/></g>
}

function Planter({ x, y, color = '#ff5fa2' }) {
  return <g transform={`translate(${x} ${y})`}><path d="M-28 -17H28L23 6H-23Z" fill="#986786" stroke={INK} strokeWidth="3"/><path d="M-32 -22H32V-14H-32Z" fill="#d29daf" stroke={INK} strokeWidth="3"/>{[-18,0,18].map((px,i) => <g key={px}><path d={`M${px} -22v-20m0 13l-8 -6`} stroke="#85c79a" strokeWidth="4"/><rect x={px-6} y={-48+i%2*6} width="12" height="12" fill={color}/><rect x={px-2} y={-44+i%2*6} width="4" height="4" fill="#ffe6a1"/></g>)}</g>
}

function Bench({ x, y }) {
  return <g transform={`translate(${x} ${y})`}><ellipse cy="11" rx="60" ry="10" fill={INK} opacity=".18"/><path d="M-48 -12V16M48 -12V16" stroke={INK} strokeWidth="8"/><path d="M-55 -39H55V-10H-55Z" fill="#a17b91" stroke={INK} strokeWidth="4"/><path d="M-51 -29H51M-51 -20H51" stroke="#e2adb6" strokeWidth="3"/><path d="M-62 -9H62V2H-62Z" fill="#ce9ea6" stroke={INK} strokeWidth="4"/></g>
}

function Building({ x, y = 165, name, color, roof, accent, kind = 'shop', width = 230 }) {
  const center = width/2
  return <g transform={`translate(${x} ${y})`}>
    <path d={`M0 195H${width}l25 15H10Z`} fill={INK} opacity=".27"/>
    <path d={`M${width} 0l22 20V195l-22 8Z`} fill={roof} stroke={INK} strokeWidth="4"/>
    <rect width={width} height="195" fill={color} stroke={INK} strokeWidth="5"/><rect width={width} height="195" fill="url(#town-brick)"/>
    <path d={`M-14 0l30 -42h${width-30}l26 42Z`} fill={roof} stroke={INK} strokeWidth="5"/>
    {[0,1,2].map(i => <path key={i} d={`M${-4+i*8} ${-6-i*12}h${width+13-i*16}`} stroke={accent} strokeWidth="3" opacity=".45"/>)}
    <rect x="20" y="-62" width="20" height="29" fill={color} stroke={INK} strokeWidth="4"/><rect x="15" y="-67" width="30" height="8" fill={accent} stroke={INK} strokeWidth="3"/>
    <rect x="13" y="17" width={width-26} height="33" fill={INK} stroke={accent} strokeWidth="3"/><text x={center} y="39" textAnchor="middle" fill={accent} fontSize={kind === 'boutique' ? 10 : 12}>{name}</text>
    <path d={`M-5 67H${width+5}v23H-5Z`} fill={accent} stroke={INK} strokeWidth="3"/>{Array.from({length:8},(_,i) => <rect key={i} x={i*width/8} y="68" width={width/16} height="21" fill="#fff2da" opacity=".7"/>)}
    <Window x={18} y={106} w={47} color={kind === 'arcade' ? '#4be0e0' : '#ffe0b5'}/><Window x={width-65} y={106} w={47} color={kind === 'boutique' ? '#ffb3de' : '#ffe0b5'}/>
    <rect x={center-25} y="103" width="50" height="92" fill={INK} stroke={accent} strokeWidth="3"/><rect x={center-17} y="111" width="34" height="47" fill={roof}/><path d={`M${center-13} 145l25 -27`} stroke={accent} strokeWidth="3" opacity=".65"/><rect x={center+11} y="165" width="5" height="5" fill="#ffd84b"/>
    <rect x={center-31} y="190" width="62" height="8" fill="#dbc1cb" stroke={INK} strokeWidth="3"/>
    <Planter x={40} y={191} color={accent}/><Planter x={width-38} y={191} color={accent}/>
    {kind === 'arcade' && <><path d={`M${width-34} -67h28v19h-28Z`} fill="#ff5fa2" stroke={INK} strokeWidth="3"/><path d={`M${width-28} -58h15m-8 -6v12`} stroke="#fff2db" strokeWidth="3"/></>}
  </g>
}

function Garland({ y = 136 }) {
  return <g><path d={`M0 ${y-22}Q250 ${y+36} 500 ${y-14}Q750 ${y+30} 1000 ${y-22}`} fill="none" stroke={INK} strokeWidth="3"/>{Array.from({length:17},(_,i) => <rect key={i} x={i*60+16} y={y-12+Math.sin(i/2.5)*12} width="7" height="10" fill={['#ffb3de','#ffd84b','#4be0e0'][i%3]} className={i%4===0 ? 'town-spark' : ''}/>)}</g>
}

function PlazaArt() {
  return <Scene>
    <path d="M0 355H1000V680H0Z" fill="url(#town-paving)"/><path d="M0 380H1000M0 396H1000" stroke="#635274" strokeWidth="4"/>
    <path d="M0 605H1000V680H0Z" fill="url(#town-grass)"/><path d="M105 680V607H895V680" fill="url(#town-paving)" stroke="#685572" strokeWidth="6"/>
    <Building x={65} name="starlight" kind="arcade" color="#78609c" roof="#483265" accent="#ff5fa2"/>
    <Building x={385} name="mochi café" color="#bd829c" roof="#804363" accent="#ffd84b"/>
    <Building x={705} name="paw & thread" kind="boutique" color="#668f9b" roof="#34596c" accent="#4be0e0"/>
    <Tree x={25} y={341} scale={.9}/><Tree x={340} y={326} pink scale={.78}/><Tree x={660} y={326} scale={.78}/><Tree x={975} y={341} pink scale={.9}/><Garland/>
    <g transform="translate(500 452)"><path d="M-112 6L-70 -40H70L112 6L77 54H-77Z" fill="#8b799d" stroke={INK} strokeWidth="4"/><path d="M-100 3L-64 -30H64L100 3L70 35H-70Z" fill="#c5a8c4" stroke={INK} strokeWidth="4"/><path d="M-83 2L-54 -20H54L83 2L56 23H-56Z" fill="#377b97"/><path d="M-65 1H-37M28 8H63M-14 15H8" stroke="#4be0e0" strokeWidth="4" className="town-spark"/><path d="M-11 3L-8 -54H8L11 3Z" fill="#d7c1d3" stroke={INK} strokeWidth="4"/><path d="M-37 -65H37L22 -48H-22Z" fill="#a68caf" stroke={INK} strokeWidth="4"/><path d="M-26 -51Q-49 -22 -53 0M26 -51Q49 -22 53 0" stroke="#9df8f2" strokeWidth="4" fill="none"/><path d="M0 -106l8 16 18 3-13 12 3 18-16-9-16 9 3-18-13-12 18-3Z" fill="#ffd84b" stroke={INK} strokeWidth="3" className="town-spark"/></g>
    <Bench x={220} y={553}/><Bench x={780} y={553}/><Lamp x={104} y={480}/><Lamp x={898} y={480}/><Lamp x={360} y={583}/><Lamp x={640} y={583}/><Planter x={43} y={623}/><Planter x={955} y={623} color="#4be0e0"/>
    <g transform="translate(335 386)"><path d="M-20 0H20L26 43H-26Z" fill="#322341" stroke="#e0b9cc" strokeWidth="3"/><text y="17" textAnchor="middle" fill="#ffd84b" fontSize="7">tea</text><text y="30" textAnchor="middle" fill="#ffb3de" fontSize="7">+ buns</text></g>
    <path d="M454 601h92v30h-92Z" fill="#7a648c" stroke="#d5bdd7" strokeWidth="3"/><text x="500" y="621" textAnchor="middle" fill="#ead5ed" fontSize="8">willow</text><Tree x={36} y={689} scale={.7}/><Tree x={964} y={689} pink scale={.7}/>
  </Scene>
}

function WestArt() {
  return <Scene>
    <path d="M0 354H1000V626H0Z" fill="url(#town-paving)"/><path d="M0 411H1000V495H0Z" fill="#766887"/><path d="M0 454H1000" stroke="#b3a0bb" strokeWidth="3" strokeDasharray="25 16"/>
    <Building x={105} name="crumb & co." color="#ba8b9a" roof="#7b4566" accent="#ffd84b"/><Building x={640} name="post & parcel" color="#8575a8" roof="#493966" accent="#4be0e0"/>
    <Tree x={36} y={363}/><Tree x={410} y={340} pink/><Tree x={949} y={363}/><Garland/>
    <g transform="translate(490 337)"><rect x="-60" y="-48" width="120" height="48" fill="#b289ad" stroke={INK} strokeWidth="4"/><path d="M-66 -49H66L51 -71H-52Z" fill="#ffb3de" stroke={INK} strokeWidth="4"/>{[-39,-9,21].map(x => <g key={x}><path d={`M${x} -20q12 -22 24 0Z`} fill="#ffd596" stroke="#8e5d62" strokeWidth="2"/><path d={`M${x+6} -22l5 -7m4 8l5 -7`} stroke="#fff0c7" strokeWidth="2"/></g>)}<path d="M-44 0V17M44 0V17" stroke={INK} strokeWidth="6"/></g>
    <Lamp x={495} y={505}/><Lamp x={92} y={600}/><Lamp x={909} y={600}/>
    <g transform="translate(740 455)"><path d="M-5 0V-39" stroke={INK} strokeWidth="8"/><path d="M-26 -41V-75H24V-41Z" fill="#4be0e0" stroke={INK} strokeWidth="4"/><path d="M-17 -67H15V-49H-17ZM-17 -67L-1 -57L15 -67" fill="none" stroke={INK} strokeWidth="3"/></g>
    <Bench x={350} y={568}/><Planter x={644} y={578} color="#a06bff"/>
    <g transform="translate(817 580)"><circle cx="-29" r="20" fill="none" stroke={INK} strokeWidth="4"/><circle cx="29" r="20" fill="none" stroke={INK} strokeWidth="4"/><path d="M-29 0L-9 -31L9 0H-29L1 -20H20L29 0M20 -20l-5 -19h12" fill="none" stroke="#ffb3de" strokeWidth="4"/></g>
    <Planter x={150} y={658}/><Planter x={550} y={658} color="#ffd84b"/><Planter x={943} y={658}/>
    <g transform="translate(405 509)"><path d="M-14 0V-20L-5 -15L5 -15L14 -20V0Z" fill="#dba66f" stroke={INK} strokeWidth="3"/><path d="M-7 -7h3m8 0h3" stroke={INK} strokeWidth="3"/><path d="M14 -2q18 -10 14 -19" fill="none" stroke="#dba66f" strokeWidth="6"/></g>
  </Scene>
}

function EastArt() {
  return <Scene>
    <path d="M0 368H1000V586H0Z" fill="url(#town-paving)"/><Building x={106} name="little cloud" color="#bf89b0" roof="#824f82" accent="#ffb3de"/><Building x={516} name="sunbeam house" color="#b9a079" roof="#766278" accent="#ffd84b"/>
    <path d="M0 357H104M339 357H515M750 357H1000" stroke="#d4b6c6" strokeWidth="7"/>{[30,64,367,400,433,470,788,820,852,884,916,950,979].map(x => <path key={x} d={`M${x} 374v-48l6 -6 6 6v48`} fill="#c9a8bd" stroke={INK} strokeWidth="2"/>)}
    <Tree x={54} y={385} pink scale={1.1}/><Tree x={376} y={384} pink scale={1.2}/><Tree x={950} y={400} pink scale={1.25}/>
    <g transform="translate(835 473)"><path d="M-57 5L-40 -111H40L58 5M-48 -109H48" stroke={INK} strokeWidth="9" fill="none"/><path d="M-45 -110H45" stroke="#a987a9" strokeWidth="6"/><path d="M-24 -108V-25M24 -108V-25" stroke="#e6cedc" strokeWidth="3"/><path d="M-33 -25H33V-15H-33Z" fill="#ffb3de" stroke={INK} strokeWidth="4"/></g>
    <Lamp x={489} y={474}/><Bench x={590} y={558}/>
    <g transform="translate(230 595)"><path d="M0 0h32v26H0Zm32 -26h32v26H32ZM32 26h32v26H32Zm32 -26h32v26H64Z" stroke="#f5cbea" strokeWidth="3" fill="none"/><text x="16" y="19" textAnchor="middle" fill="#ffb3de" fontSize="10">1</text><text x="48" y="-7" textAnchor="middle" fill="#4be0e0" fontSize="10">2</text><text x="80" y="19" textAnchor="middle" fill="#ffd84b" fontSize="10">3</text></g>
    <Planter x={60} y={621}/><Planter x={715} y={638}/><Planter x={960} y={623} color="#a06bff"/>{[115,284,436,666,776,890].map((x,i) => <rect key={x} x={x} y={420+i%3*66} width="7" height="4" fill="#ffb3de" className="town-spark" style={{animationDelay:`${i*.4}s`}}/>)}
  </Scene>
}

function DockArt() {
  return <Scene night>
    <rect y="235" width="1000" height="445" fill="#34587f"/>{Array.from({length:32},(_,i) => <path key={i} d={`M${(i*139)%980} ${254+Math.floor(i/7)*28}h${12+i%3*13}`} stroke={i%3 ? '#5589a8' : '#91bfd1'} strokeWidth="3" className={i%5===0 ? 'town-spark' : ''}/>)}
    <g transform="translate(116 283)"><path d="M-33 0L-19 -148H19L33 0Z" fill="#b69cb9" stroke={INK} strokeWidth="4"/><path d="M-25 -59H25M-21 -100H21" stroke="#976585" strokeWidth="19"/><path d="M-25 -148H25V-181H-25Z" fill="#ffe2a1" stroke={INK} strokeWidth="4"/><path d="M-35 -183L0 -208L35 -183Z" fill="#8e6e9d" stroke={INK} strokeWidth="4"/><path d="M19 -175L330 -220V-120L19 -154Z" fill="#ffe4b1" opacity=".09"/></g>
    <path d="M0 396H1000V680H0Z" fill="url(#town-board)" stroke={INK} strokeWidth="5"/><path d="M0 404H1000" stroke="#d8adad" strokeWidth="8"/>
    {[35,188,346,505,665,960].map(x => <g key={x}><rect x={x} y="350" width="14" height="85" fill="#694c66" stroke={INK} strokeWidth="3"/><rect x={x-5} y="346" width="24" height="10" fill="#b18d9d"/>{x<665 && <path d={`M${x+14} 365q70 32 139 0`} fill="none" stroke="#d1b5ac" strokeWidth="5"/>}</g>)}
    <g transform="translate(779 387)"><g className="town-bob"><ellipse cy="-5" rx="94" ry="13" fill="#201c4966"/><path d="M-85 -16H80L58 7H-50Z" fill="#d887a2" stroke={INK} strokeWidth="4"/><path d="M-22 -17V-54H30V-17" fill="#c5adc2" stroke={INK} strokeWidth="3"/><path d="M0 -55V-116M-33 -56H40" stroke={INK} strokeWidth="4"/><path d="M4 -110L55 -64H4Z" fill="#fff0c4" stroke={INK} strokeWidth="3"/><rect x="-13" y="-46" width="17" height="17" fill="#4be0e0"/></g></g>
    <Bench x={295} y={536}/><Lamp x={95} y={561}/><Lamp x={925} y={560}/>{[0,1].map(i => <g key={i} transform={`translate(${470+i*48} ${534-i*12})`}><rect x="-24" y="-37" width="47" height="37" fill="#b28b89" stroke={INK} strokeWidth="4"/><path d="M-19 -32L18 -5M18 -32L-19 -5M-25 -26H24" stroke="#6f506d" strokeWidth="4"/></g>)}
    <g transform="translate(686 608)"><circle r="21" fill="none" stroke="#e9c8c2" strokeWidth="11"/><path d="M-15 -15L-8 -8M8 8L15 15M-15 15L-8 8M8 -8L15 -15" stroke="#e980a4" strokeWidth="13"/></g><path d="M520 602q45 -17 73 8t64 0" stroke="#d3b1a1" strokeWidth="5" fill="none"/>
    <g transform="translate(660 333)"><path d="M-15 0Q0 -15 12 0Q24 -14 38 0" stroke="#ead6ed" strokeWidth="4" fill="none"/></g>
  </Scene>
}

function GardenArt() {
  return <Scene>
    <path d="M0 465H160L310 367H590L715 477H1000V542H695L565 445H332L175 542H0Z" fill="url(#town-paving)" stroke="#695b7a" strokeWidth="5"/><path d="M480 460H552V680H480Z" fill="url(#town-paving)"/>
    <g transform="translate(225 354)"><path d="M-97 0V-134L0 -194L97 -134V0Z" fill="#567e88" stroke={INK} strokeWidth="5"/><path d="M-92 -131L0 -184L92 -131Z" fill="#87c7c5" opacity=".65"/><path d="M-93 -129H93M-48 -157V0M0 -181V0M48 -157V0M-93 -66H93" fill="none" stroke="#d2b6d0" strokeWidth="5"/><path d="M-23 0V-86H23V0" fill="#81b4a9" stroke={INK} strokeWidth="3"/><Planter x={-69} y={-15}/><Planter x={68} y={-15} color="#ffd84b"/></g>
    <Tree x={75} y={377} scale={1.15}/><Tree x={431} y={312} pink scale={1.15}/><Tree x={737} y={349} scale={1.45}/><Tree x={945} y={391} pink scale={1.1}/>
    <g transform="translate(521 435)"><path d="M-74 -5L-50 -28H37L80 -4L71 22L14 37L-69 19Z" fill="#8f8eae" stroke={INK} strokeWidth="4"/><path d="M-62 -4L-44 -18H34L65 -1L57 14L13 25L-56 12Z" fill="#366d93"/><path d="M-40 1H-10M12 14H47" stroke="#78d6dd" strokeWidth="4" className="town-spark"/><path d="M23 -4h15l8 5-8 5H23Z" fill="#ffd84b"/></g>
    <g transform="translate(792 458)"><path d="M-55 0V-93L0 -131L55 -93V0M-60 -91H60" stroke={INK} strokeWidth="7" fill="none"/><path d="M-55 -92L0 -130L55 -92" fill="none" stroke="#d7a6c8" strokeWidth="5"/><path d="M-47 -72Q-15 -95 1 -111M50 -66Q29 -83 15 -112" stroke="#85c795" strokeWidth="8" fill="none"/>{[-35,-15,16,39].map((x,i) => <rect key={x} x={x} y={-90-i%2*20} width="10" height="10" fill="#ffb3de"/>)}</g>
    <Lamp x={350} y={493}/><Lamp x={882} y={551}/>
    <g transform="translate(308 497)"><path d="M-13 0V-28H13V0Z" fill="#a06bff" stroke={INK} strokeWidth="3"/><path d="M-12 -27V-48H12V-27Z" fill="#ffc99d" stroke={INK} strokeWidth="3"/><path d="M-25 -48H25M-14 -52V-61H14V-52" fill="#ffd84b" stroke="#ffd84b" strokeWidth="8"/><path d="M-6 -39h3m6 0h3" stroke={INK} strokeWidth="3"/></g>
    <Planter x={120} y={608}/><Planter x={891} y={629} color="#4be0e0"/>
    <g transform="translate(764 482)"><g className="town-bob"><path d="M0 0C-28 -30 -28 12 0 5C28 12 28 -30 0 0Z" fill="#ffb3de" stroke={INK} strokeWidth="2"/><path d="M0 -4V11" stroke={INK} strokeWidth="3"/></g></g>
    <path d="M189 613H811V655H189Z" fill="#3b615d" stroke={INK} strokeWidth="4"/><text x="500" y="647" textAnchor="middle" fill="#b8ded0" fontSize="8">a little something we grew together</text>
  </Scene>
}

function TownScene({ room = 'plaza' }) {
  if (room === 'west') return <WestArt/>
  if (room === 'east') return <EastArt/>
  if (room === 'dock') return <DockArt/>
  if (room === 'garden') return <GardenArt/>
  return <PlazaArt/>
}

export default memo(TownScene)
