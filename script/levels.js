var GAME_LEVELS = [`
........................................................................................................2............#.........
......................................................o................................................###...........#.........
......................................................................................................##+##..........#.........
.................................................................o....................................#+++#........x.#.........
.....................FW............................o......o.....3.3...................................##+##.......343..........
.....................GH.....................o..................2###....o...............................#v#........###..........
.....................GH.o.........o.o.............##......##...##+##..................................................#........
.....................KJ3...<<>>...1..#.....##..................#+++#............................................BBBBBB#........
.....................####?BBBBBBB?####.........................##+##.......o....o....o....o....o..............TU......#........
................................................................#v#.......333.................=...............[]......#........
.......................................#..................................###BBB#BBB.#BBB.#BBB.#..............[]......#........
##.....oooooo.....TU....................o.o................................#....#....#....#....#............TU[]......#........
#.................[].FWFW...o..........33333..............FW.............o.#....#....#....#....#............[][]....#..........
#.....%BBBBBB%....[].GHGH.......o......#####..............GH.............o..................................[][]....#..........
#....%%......%%...[].GHGH...#.............................GH.............o.................................#[][]...............
#.@.%%%++++++%%%..[]#KJKJ1m.#...#33n.....9n.....m33#.....3KJ233...9....m.......>>>>>>>>.<<<<.......33......#####....#..........
#############################...####################.....##################################################....####.#..........
............................#...#..................#.....#.....................................................................
............................#+++#..................#+++++#.....................................................................
............................#+++#..................#+++++#.....................................................................
............................#####..................#######.....................................................................
...............................................................................................................................
.......................................................................%++++++++++++++++++++++++++++++++++++++++++++++++++++++%

`,`
####################v###################################..v.....v.....v.....v##########################################+###########+#########+##############%%%%
###############...............##############.....................................##v######v######v############........#v#.........#v#.......#v#.........####%%%%
###########....................###.........................................................................###........#.#.........#.#.......#.#.........##..%%%%
###########....................###........................o.....o.....o.....o..............................###..........................................##..%%%%
###########....................###........................o.....o.....o.....o..............................###..........................................##..%%%%
###########.....o..............###..................o.....o.....o.....o.....o..............................###..........................................##..%%%%
#######........<>>.............###.......................<<>...<<>...<<>...<<>.............................###..........................................##..%%%%
#######........###...........QII##.......................###...###...###...###.............................###..............................................%%%%
#######.....................=SPP##.................###.....................................................###..............................................%%%%
#######.....o...........o......###.............o...###.....................................................###............................................w.%%%%
#..........<>>.........<<>.....###9...............###v....................................................####............................................4.%%%%
#..........###.........###...QII###.........o......#......................................................=###..........................................TU##%%%%
#...........................=SPP###BBB............o#......................................................####..........................................[]..%%%%
#........o.....................###.................#........................................................##..............................=.........QIL]..%%%%
#.......<<>....................###..........#.....##.........................................................#..........o...o...o...o..............=..SPR]..%%%%
#....o..###..................QII##..........#......#.................................................................................................#..[]..%%%%
#...........................=SPP##.........#......o#.....................TU..........................................%..n.....n.......%.....#.....#.....[]..%%%%
#......3.............................FW....#.......#.....................[]............................FW.FW........%?BBBBBBBBBBBBBBB%%......=........QIL]..%%%%
#....#.#.............................GH...#.......##...................QIL].....o......o......o........GH.GH.......%%?...............%%...o.....o...=.SPR]..%%%%
#.....m#................33.o..o..o...GH...#.......#ooo.........TU.....#SPR]............................GH.GH......%%%?...............%%.................[]..%%%%
#...###.................##.....mm.n.mKJ2.##.......#ooo....o..o.[].o..o..o[]....33.....33.....33.....332KJ.KJ.#...%%%%?...............%%#....#.....#.....[]..%%%%
#@..#...................###################+++++++#2..m...n...2[]33....n.[].n..%%.....%%.....%%.....%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
####++++++++++++++++++++##................#+++++++#############[]########[]####%%+++++%%+++++%%+++++%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
`,`
....................................................................................................................##########################################################.........###...###.......................
....................................................................................................................#####...........##########...9.........#####.........#####.........#v#...#v#.......................
.....................................o...o...o...o......o....o.....o..o.....o.....o.......o.........................#####.....oo....##########.............#####.........#####.........................................
......................................................<<<<<<<<<###<<<<<<###<<<<<<<<<>>>>>>>>........................#####.....oo...=##########...#.........#####........QI####......o..................................
.....................................#...#...#...#....#########.v.######.v.#################........................#####...........##########........#....#####........SP####.........................................
....................................................................................................................#####...........##########.............#v###.........#####......%..................................
................................................................................................##.......=........QI#####.....##....##v###v###......................=...QI###v......%%.................................
..................................#.......FW.FW.FW...............................................................=SP#####...........##.###.###.....#..................=.SP###......%%%.................................
..........................................GH.GH.GH..................................................................................##.v##.v##.........................=QI###......%%%.................................
..........................................GH.GH.GH..................................................................................##..##..##........................=.SP###.......%%............o....................
..............................#...........GH.GH.GH...........................................................................#......##..##..##........#...................###.......%%333.......333....................
..........................................GH.GH.GH.......333.............333.........................##....................#.......................................................%%%BBBBBBBBBBBB%....................
..........................................GH.GH.GH.......#BBBBBBBBBBBBBBBBB#..........................................TU.......................................................o...%%%............%....................
..........................#...............GH.GH.GH....o......................o.......................................#[]...........................#...............................%%%............%....................
..........................................GH.GH.GH.............................................................o..o...[]....o.................................................%%...%%%............%..................b.
.............................#............GHoGHoGH..#####...................###.......................................[]............TU..TU..TU................................%%....%%...............................4.
............o..o......................TU..GH.GH.GH.................................o......o.......o...........######..[]..####......[]..[]..[]...............................#%%....%%.ooo.ooo.ooo....TU.............TU
...........3..1.3.....................[]..GH.GH.GH........................................1...........................[]............[]..[]..[].......o.....o.o......o......o..%%...%%%................[].............[]
...........######.................QIIIL]..GH#####H.........#+++++++++++++++++#.....#.....##.......#.......####........[]........#...[]..[]..[].............333................%%...%%%BBBBBBBBBBBB%%..[].............[]
#TU...............................SPPPR]..GH.GH.GH.........#+++++++++++++++++#...........##.......#................o.o[]...o..o.....[]..[]..[]2n...........###...n............%%oooo%%............%%..[].............[]
#[]..@............mTU>>>>>>>..........[].3KJ1KJ2KJ3....m...#+++++++++++++++++#.m..m......##+++++++#..%...n............[].........n..[]++[]++[]%%++++++++++++#+++++++++++++%%..%%....%%............%%..[]..n....n....%[]
%%%%%%%%%%%%%%%%%%%[]%%%%%%%++%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%+++++++++++++++++%%%%%%%%%%%%%%+++++++%++%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%[]%%%%%%%%%%%%%[]
%%%%%%%%%%%%%%%%%%%[]%%%%%%%++%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%[]%%%%%%%%%%%%%[]
`,
`
...................................#################..........................................##############################################################################################v#v........................
.....................................##[]##.....##............................................##################.........?v?.?v?..?v?...##....?v?......?v?...........################..vv....v.........................
.......................................[]........#=............................FW.............####v?###.?###v?##........................##...........................################..................................
.......................................[].......3#9............................GH.#...........###v.?##v.?##v.?##........................##...........................################..................................
...............................................##3>>>>.....>>>>.....>>>>.....32KJ3#...<<......##v..?#...?#v..?##........................##..............................############...................................
...............................................###BBBB.....BBBB.....BBBB.....???####..##................................................##..............................############...................................
...............................................###=...................................##.................................................##.............................############...................................
...............................................####......................................................................................##.............................############...................................
................................oo...........=QIL]#=.......................................#..............................................##.............................############..................................
....................................oo..o...=.SPR]##...................................<<.................................................##...............................#########...................................
................................................[]#....................................##.................................................##...............................#########...................................
.............................oo.##...........=QIL]#....................................##3...............................................##............................................................................
............................................=.SPR]#............oo.......oo.......oo....###......o....o....o....o.........................##o...........................................................................
....................................##..o.......[]#.............................................o....o....o....o......................ooo##o...........................................................................
.............................##..............=QIL]#....................................oooo....#.........................=............ooo##..o.o.o.o.o.o.o.o.o.o.o.....................................................
..........................................o.=.SPR]#....................................3..3#.........................=...................##................................................................h...........
........................3333..........FW..o...FW......FW.......TU.......TU.......TU....####............................=.................###.............................<<....>>.........................34...........
......................TU####..........GH#.o...GH.....#GH#......[].......[].......[]....####.....#....#....#....#.....o..3...3.3...3.....###?BBBBBBBBBBBBBBBBBBBBBB?......##....##.........................##...........
......................[]..............GH..o...GH......GH.......[].......[].......[]............o#....#....#....##..3#BBBB...BBB...BBBB######.............................##....##.........................##...........
......................[]..............GH..o...GH......GH.......[]....#..[].......[]............<#....#....#....#####......................##.............................##....##........................3##.....oooooo
...........nn........#[]..o.o.o.......GH......GH......GH.......[]o......[].......[]............##....#....#....#####...o..................##...FW..FW..FW..FW.......................<>.....<>.....<>.....####....oooooo
...........TU.........[].............oGHo.#..oGHo.#..oGHo......[]o......[].......[]............##....#....#....#####...........................GH.oGH.oGH.oGH........o......##......TU.....TU.....TU.....####....oooooo
........333[]333....33[]33............GH......GH......GH.......[]>......[].......[]............##....#....#....#####.##o##o##o##o##..?#........GH..GH..GH..GH.............o.##......[].....[].....[]..<<<####..........
.......####[]#########[]#######....n..GHm.n...GH..n...GH......#[]#......[].......##............##....#....#....#####.oo.oo.oo.oo.oo..##.......3KJ..KJ3.KJn.KJ.2..o......o...##3.....[].....[].....[]..#################
.@....#####[]#########[]########1....3KJ3....3KJ3....3KJ3.n..m#[]#++++++[]+++++++##++++++++++++##....#....#....#####.n..m..m..m..m2.m#########%%%%%%%%%%%%%%%%%+++++++++++%####.....[].....[].....[]..#################
%%%########[]#########[]#########BBBB####BBBB####BBBB##########[]#+++++#[]#++++++##++++++++++++##....#....#....##############################%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%####.....[].....[].....[]..#################
%%%##############################++++####++++####++++#############++++++##+++++++##++++++++++++##++++#++++#++++########################%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%####+++++[]+++++[]+++++[]++#################
`];
