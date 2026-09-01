// a large list of common 5-letter words used both as answers and for
// validating guesses. kept lowercase to match the site's style.

export const WORDS = [
  'about','above','abuse','actor','acute','admit','adopt','adult','after','again',
  'agent','agree','ahead','alarm','album','alert','alike','alive','allow','alone',
  'along','alter','among','anger','angle','angry','apart','apple','apply','arena',
  'argue','arise','array','aside','asset','audio','audit','avoid','award','aware',
  'badly','baker','bases','basic','beach','began','begin','begun','being','below',
  'bench','billy','birth','black','blame','blank','blast','blend','blind','block',
  'blood','bloom','bloke','board','boost','booth','bound','brain','brand','brave',
  'bread','break','breed','brick','brief','bring','broad','broke','brown','brush',
  'build','built','bunch','burst','buyer','cabin','cable','cache','candy','carry',
  'catch','cause','chain','chair','chalk','chaos','charm','chart','chase','cheap',
  'check','chess','chest','chief','child','chill','china','chose','civic','civil',
  'claim','class','clean','clear','click','cliff','climb','clock','clone','close',
  'cloth','cloud','coach','coast','could','count','court','cover','crack','craft',
  'crash','crazy','cream','crime','cross','crowd','crown','crude','cruel','crush',
  'curve','cyber','cycle','daily','dairy','dance','dated','dealt','death','debut',
  'delay','depth','diary','dirty','ditch','dizzy','dodge','doing','donor','dough',
  'dozen','draft','drama','drank','dream','dress','dried','drift','drill','drink',
  'drive','drone','drove','dwell','eager','eagle','early','earth','eaten','ebony',
  'eight','elbow','elder','elect','elite','ember','empty','enemy','enjoy','enter',
  'entry','equal','equip','error','essay','event','every','exact','exams','exist',
  'extra','fable','faces','fairy','faith','false','fancy','fatal','fault','favor',
  'feast','fella','fence','ferry','fetch','fever','fewer','fiber','field','fiery',
  'fifth','fifty','fight','filed','final','finch','first','fixed','flame','flash',
  'fleet','flesh','flint','float','flock','flood','floor','flora','flour','fluid',
  'flush','focal','focus','force','forge','forth','forty','forum','found','frame',
  'frank','fraud','fresh','fried','front','frost','fruit','fully','funny','gamer',
  'gauge','ghost','giant','given','glass','globe','glory','glove','going','grace',
  'grade','grain','grand','grant','grape','graph','grasp','grass','grave','great',
  'greed','green','greet','grief','grill','grind','groan','groom','gross','group',
  'grown','guard','guess','guest','guide','guild','habit','handy','happy','harsh',
  'haste','hatch','haunt','heart','heavy','hedge','hello','hence','honey','honor',
  'horse','hotel','house','hover','human','humor','hurry','ideal','image','imply',
  'inbox','index','inner','input','intro','irony','issue','ivory','jazzy','jelly',
  'jewel','joint','jolly','jumbo','juror','kayak','kebab','kneel','knife','knock',
  'known','koala','label','labor','laden','lance','large','laser','later','laugh',
  'layer','leach','leafy','learn','lease','least','leave','ledge','lemon','level',
  'lever','light','limit','linen','liner','lived','liver','lobby','local','lodge',
  'logic','loose','lorry','loser','lover','lower','loyal','lucky','lunar','lunch',
  'lyric','macro','madam','magic','magma','major','maker','mango','manor','maple',
  'march','marry','match','maybe','mayor','meant','medal','media','melon','mercy',
  'merge','merit','merry','metal','meter','micro','midst','might','minor','minus',
  'mixed','model','moist','money','month','moral','motor','mound','mount','mouse',
  'mouth','moved','mover','movie','mucus','music','naive','naked','nasty','naval',
  'nerve','never','newly','niche','niece','night','ninja','noble','noise','north',
  'notch','novel','nurse','oasis','ocean','offer','often','olive','onion','onset',
  'opera','orbit','order','organ','other','ought','ounce','outer','owner','oxide',
  'ozone','paint','panel','panic','paper','party','pasta','patch','patio','pause',
  'peace','peach','pearl','pedal','penny','perch','peril','petal','phase','phone',
  'photo','piano','piece','pilot','pinch','pitch','pixel','pizza','place','plain',
  'plane','plank','plant','plate','plaza','plead','pluck','plumb','poker','polar',
  'porch','pound','power','press','price','pride','prime','print','prior','prize',
  'probe','proof','proud','prove','proxy','pulse','punch','pupil','puppy','purse',
  'queen','query','quest','queue','quick','quiet','quill','quilt','quirk','quite',
  'quota','quote','radar','radio','raise','rally','ranch','range','rapid','ratio',
  'razor','reach','react','ready','realm','rebel','refer','reign','relax','relay',
  'remit','renew','repay','reply','rider','ridge','right','rigid','rinse','risky',
  'rival','river','roast','robin','robot','rocky','rogue','roman','rough','round',
  'route','royal','rugby','ruler','rumor','rural','sadly','saint','salad','sales',
  'salon','sandy','sauce','scale','scalp','scare','scarf','scene','scent','scoop',
  'scope','score','scout','scrap','screw','scrub','seize','sense','serve','seven',
  'shade','shady','shake','shaky','shall','shame','shape','share','shark','sharp',
  'shave','shear','sheep','sheet','shelf','shell','shift','shine','shiny','shirt',
  'shock','shoot','shore','short','shout','shown','shrub','shrug','sight','silky',
  'silly','since','siren','sixth','sixty','skate','skill','skull','slack','slate',
  'sleek','sleep','slice','slide','slime','slope','sloth','small','smart','smash',
  'smell','smile','smoke','snack','snail','snake','sneak','snowy','solar','solid',
  'solve','sonic','sorry','sound','south','space','spare','spark','speak','spear',
  'speed','spell','spend','spice','spicy','spike','spine','spite','split','spoke',
  'spoon','sport','spray','squad','stack','staff','stage','stain','stair','stake',
  'stale','stalk','stall','stamp','stand','stare','stark','start','state','steak',
  'steam','steel','steep','steer','stern','stick','stiff','still','sting','stock',
  'stone','stony','stood','stool','stoop','store','storm','story','stout','stove',
  'strap','straw','stray','strip','stuck','study','stuff','stump','style','sugar',
  'suite','sunny','super','surge','swamp','swarm','swear','sweat','sweep','sweet',
  'swell','swept','swift','swing','swirl','sword','table','taken','tally','tango',
  'taper','tardy','taste','tasty','taunt','teach','teary','tempo','tenth','thank',
  'theft','their','theme','there','these','thick','thief','thigh','thing','think',
  'third','those','three','threw','throw','thumb','tiger','tight','timer','tired',
  'title','toast','today','token','tonic','tooth','topic','torch','total','touch',
  'tough','tower','toxic','trace','track','trade','trail','train','trait','tramp',
  'trash','tread','treat','trend','trial','tribe','trick','tried','tripe','troop',
  'trout','truck','truly','trump','trunk','trust','truth','tulip','tumor','tuner',
  'tunic','turbo','twice','twist','tying','udder','ultra','uncle','under','undue',
  'unfit','union','unite','unity','until','upper','upset','urban','urged','usage',
  'usher','usual','utter','vague','valid','value','valve','vapor','vault','vegan',
  'venue','verge','verse','vibes','video','vigor','villa','vinyl','viola','viper',
  'viral','virus','visit','vista','vital','vivid','vocal','vodka','vogue','voice',
  'voter','wafer','wagon','waist','waltz','waste','watch','water','weary','weave',
  'wedge','weigh','weird','whale','wheat','wheel','where','which','while','whine',
  'whirl','white','whole','whose','widen','wider','width','wield','wimpy','wince',
  'windy','wiper','witch','witty','woken','woman','women','world','worry','worse',
  'worst','worth','would','wound','woven','wrath','wreck','wrist','write','wrong',
  'wrote','yacht','yeast','yield','young','yours','youth','zebra','zesty','zonal',
]

// build a fast lookup set for guess validation.
const WORD_SET = new Set(WORDS)

export function isValidWord(word) {
  return WORD_SET.has(word.toLowerCase())
}

export function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

// pick a word deterministically from a shared seed, so both players get the
// exact same answer without ever storing it in plaintext.
export function wordFromSeed(seed) {
  const n = Number(seed) >>> 0
  return WORDS[n % WORDS.length]
}
