import { memo } from 'react'

function ShopWindow({ x }) {
  return <g transform={`translate(${x} 78)`}><rect width="130" height="126" fill="#362e65" stroke="#21132f" strokeWidth="8"/><path d="M8 83H36V59H70V82H105V39H123V119H8Z" fill="#796093"/><path d="M64 0V126M0 62H130" stroke="#b089a9" strokeWidth="6"/><rect x="14" y="17" width="8" height="8" fill="#ffdda1"/><path d="M-8 -7H138V11H-8Z" fill="#ffb3de"/><path d="M0 10H29L15 115H0M101 10H130V115H115Z" fill="#945a87"/></g>
}

function ShopPlant({ x, y }) {
  return <g transform={`translate(${x} ${y})`}><path d="M-22 -32H22L16 2H-16Z" fill="#af81a8" stroke="#21132f" strokeWidth="4"/><path d="M0 -33V-96M0 -63q-43 -1 -29 -30 29 3 29 30M0 -52q41 -12 28 -39-30 7-28 39" fill="#6eb09a" stroke="#315c60" strokeWidth="3"/></g>
}

export const CafeRoom = memo(function CafeRoom() {
  return (
    <>
      <div className="shop-wall cafe-wall" aria-hidden="true" />
      <div className="shop-floor cafe-floor" aria-hidden="true" />
      <svg className="town-art shop-details" viewBox="0 0 1000 680" preserveAspectRatio="none" aria-hidden="true">
        <ShopWindow x={60}/><ShopWindow x={811}/>
        <rect x="356" y="68" width="288" height="71" fill="#35213e" stroke="#ddb19f" strokeWidth="5"/><text x="500" y="97" textAnchor="middle" fill="#ffd84b" fontSize="17">mochi café</text><text x="500" y="122" textAnchor="middle" fill="#ffb3de" fontSize="9">warm cups · happy paws</text>
        <path d="M280 167H720V177H280Z" fill="#6a425d" stroke="#21132f" strokeWidth="3"/>{[303,360,417,546,603,660].map((x,i) => <g key={x}><rect x={x} y="142" width="26" height="23" fill={i%2 ? '#ffb3de' : '#4be0e0'} stroke="#39243f" strokeWidth="3"/><path d={`M${x+26} 147h9v11h-9`} fill="none" stroke="#39243f" strokeWidth="3"/></g>)}
        <rect x="290" y="208" width="146" height="73" fill="#32243f" stroke="#4be0e0" strokeWidth="4"/><text x="363" y="229" textAnchor="middle" fill="#fff0d5" fontSize="9">today's treats</text><text x="363" y="252" textAnchor="middle" fill="#ffd84b" fontSize="8">berry bun + tea</text><path d="M313 264H413" stroke="#ffb3de" strokeWidth="2"/>
        <g transform="translate(535 275)"><path d="M-20 0V-36L-29 -55L-9 -49L7 -55L19 -36V0Z" fill="#ecc9bc" stroke="#21132f" strokeWidth="3"/><path d="M-15 -55v-13H14v13" fill="#fff0dc" stroke="#21132f" strokeWidth="3"/><path d="M-12 -33h4m12 0h4" stroke="#21132f" strokeWidth="4"/><path d="M-17 -19H17V1H-17Z" fill="#ff5fa2"/></g>
        <rect x="610" y="236" width="80" height="52" fill="#9ac9c4" stroke="#21132f" strokeWidth="5"/><rect x="623" y="247" width="26" height="16" fill="#332a49"/><path d="M658 252h18m-48 23h45" stroke="#f6e5db" strokeWidth="4"/>
        <path d="M207 290H793V365H207Z" fill="#98627d" stroke="#21132f" strokeWidth="5"/><path d="M193 278H807V301H193Z" fill="#d5a5b7" stroke="#21132f" strokeWidth="5"/><path d="M240 317H760M240 340H760" stroke="#ba869b" strokeWidth="4"/>
        {[266,325,395].map(x => <g key={x}><path d={`M${x} 276q0 -27 32 -27 30 0 30 27Z`} fill="#c9e5dc" fillOpacity=".6" stroke="#eff3d8" strokeWidth="3"/><path d={`M${x+12} 272q12 -24 30 0Z`} fill="#ffd59b"/></g>)}
        <path d="M156 477H348V505H156Z" fill="#ce9aae" stroke="#21132f" strokeWidth="5"/><path d="M187 505V542M317 505V542" stroke="#51344e" strokeWidth="10"/><path d="M173 445h26v29h-26ZM276 445h26v29h-26Z" fill="#fff0dc" stroke="#51344e" strokeWidth="3"/>
        <path d="M652 432H862V460H652Z" fill="#a671a0" stroke="#21132f" strokeWidth="5"/><path d="M657 460H857V515H657Z" fill="#c38aaf" stroke="#21132f" strokeWidth="5"/><path d="M720 461V505M792 461V505" stroke="#95628a" strokeWidth="4"/><rect x="672" y="453" width="35" height="27" fill="#ffd84b"/><rect x="804" y="454" width="35" height="27" fill="#4be0e0"/>
        <ShopPlant x={101} y={370}/><ShopPlant x={904} y={374}/>
        <path d="M390 443H610V567H390Z" fill="#b980a5" stroke="#f0b7d4" strokeWidth="5"/><path d="M407 460H593V550H407Z" fill="none" stroke="#e5a6c7" strokeWidth="3"/><text x="500" y="517" textAnchor="middle" fill="#f6d9dc" fontSize="10">stay cozy</text>
      </svg>
    </>
  )
})

export const BoutiqueRoom = memo(function BoutiqueRoom() {
  return (
    <>
      <div className="shop-wall boutique-wall" aria-hidden="true" />
      <div className="shop-floor boutique-floor" aria-hidden="true" />
      <svg className="town-art shop-details" viewBox="0 0 1000 680" preserveAspectRatio="none" aria-hidden="true">
        <text x="500" y="90" textAnchor="middle" fill="#ffb3de" fontSize="22">paw & thread</text><text x="500" y="119" textAnchor="middle" fill="#4be0e0" fontSize="10">little paws. big personality.</text>
        <path d="M105 332V183H420V332M90 333H123M403 333H437" stroke="#e1bdd7" strokeWidth="7" fill="none"/>
        {[135,204,273,342].map((x,i) => <g key={x}><path d={`M${x+23} 183v13l-25 15h51l-26 -15`} fill="none" stroke="#b49ac1" strokeWidth="3"/><path d={`M${x+9} 209l-20 21 13 17 11 -10v64h37v-64l11 10 13 -17-20 -21-23 7Z`} fill={['#ff5fa2','#a06bff','#4be0e0','#ffd84b'][i]} stroke="#21132f" strokeWidth="4"/><path d={`M${x+27} 226v65`} stroke="#fff" strokeOpacity=".2" strokeWidth="3"/></g>)}
        <rect x="474" y="177" width="154" height="142" fill="#412a59" stroke="#a06bff" strokeWidth="5"/><path d="M477 248H625" stroke="#aa83b7" strokeWidth="6"/>
        <path d="M495 221l7 -27 15 15 16 -15 8 27Z" fill="#ffd84b" stroke="#21132f" strokeWidth="3"/><path d="M566 207l-14 -10v28l14 -8 14 8v-28Z" fill="#ff5fa2" stroke="#21132f" strokeWidth="3"/>
        <path d="M505 285h32v-17h-32Zm45 -17h32v17h-32Zm-13 7h13" fill="#4be0e0" stroke="#21132f" strokeWidth="4"/>
        <path d="M721 174H885V370H721Z" fill="#a1b9d9" stroke="#ffd84b" strokeWidth="9"/><path d="M735 341L854 190M752 353L867 207" stroke="#e8eeff" strokeWidth="9" opacity=".6"/><path d="M706 381H900V397H706Z" fill="#8e679a" stroke="#21132f" strokeWidth="4"/>
        {[730,870].flatMap(x => [191,232,273,314,355].map(y => <rect key={`${x}-${y}`} x={x} y={y} width="7" height="7" fill="#fff3c8"/>))}
        <path d="M136 442H382V464H136Z" fill="#b487b5" stroke="#21132f" strokeWidth="5"/><path d="M150 464H368V499H150Z" fill="#775789" stroke="#21132f" strokeWidth="5"/><path d="M177 435h42v-23h-42Zm100 0h42v-23h-42Z" fill="#ffd84b" stroke="#21132f" strokeWidth="4"/>
        <path d="M670 460H909L933 534H645Z" fill="#884f89" stroke="#ffb3de" strokeWidth="5"/><path d="M698 476H883L898 517H681Z" fill="none" stroke="#b978a8" strokeWidth="3"/>
        <ShopPlant x={67} y={374}/><ShopPlant x={943} y={375}/><text x="504" y="469" textAnchor="middle" fill="#cfaadb" fontSize="9">made for you</text>
      </svg>
    </>
  )
})
