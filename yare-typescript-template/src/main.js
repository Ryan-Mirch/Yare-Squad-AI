import position from "./position.json";

var HomeStar = star_zxq
var EnemyStar = star_a1c
var OutpostStar = star_p89
setStars()

var RallyPositionData = []
updateRallyPositionData()

var Squad0Data = [4, "PokeEnemyBase"]
var Squad1Data = [0, "PokeEnemyBase"]
var Squad2Data = [1, "PokeEnemyBase"]
var Squad3Data = [0, "DefendOutpost"]
var Squad4Data = [0, "RushEnemyStar"]
var Squad5Data = [0, "HarvestOutpost"]
var Squad6Data = [0, "HarvestHome"]
var Squad7Data = [0, "HarvestHome"]
var Squad8Data = [0, "HarvestHome"]
var Squad9Data = "PokeEnemyBase"

var chainMinHealth = 0
var gatherMinHealth = 0
 

/* AI's */
//HARVEST   HarvestHome         HarvestOutpost 
//DEFEND    DefendBase          DefendHomeStar      DefendOutpost
//ATTACK    AttackEnemyBase     AttackEnemyStar 
//RALLY     SafeRallyPoint1     AggroRallyPoint1        
//POKE      PokeEnemyBase       PokeEnemyStar
//RUSH      RushEnemyStar       RushOutpostStar

/* Openings


*/


/*TODO

| AI'S |
- Rally
    - safe rally and aggro rally

- Rush - moves to the star, jumps if needed. Only attacks if it isnt being attacked or if energy is > 50
    - Enemy Star, Outpost Star
*/


/* constants */
var MarkCounts = [0,0,0,0,0,0,0,0,0,0]
var SquadTargets = [Squad0Data[0],Squad1Data[0],Squad2Data[0],Squad3Data[0],Squad4Data[0],Squad5Data[0],Squad6Data[0],Squad7Data[0],Squad8Data[0],999]
var SquadAI = [Squad0Data[1],Squad1Data[1],Squad2Data[1],Squad3Data[1],Squad4Data[1],Squad5Data[1],Squad6Data[1],Squad7Data[1],Squad8Data[1],Squad9Data]
var start = new Date()
let energyCapacity = my_spirits[0].energy_capacity

clearTargets()
assignSquads()
updateMarkCounts()

harvestAI()

defendBaseAI()
defendOutpostAI()
defendHomeStarAI()

attackEnemyBaseAI()
attackEnemyStarAI()

pokeEnemyBaseAI()
pokeEnemyStarAI()

rushEnemyStarAI()
rushOutpostStarAI()

rallyAI()

spiritShout()



function spiritShout(){
    for(spirit of my_spirits){
        if(spirit.hp != 0){
            //spirit.shout(String(tick))
            //spirit.shout(spirit.mark)
            spirit.shout(memory[spirit.id])
            //spirit.shout(spirit.id)
            //spirit.shout("Can survive? - " + canSurviveEnemiesInRange(spirit))
            //spirit.shout(getSpiritAI(spirit))
        }
        
    }  
    
    console.log("Position: " + position)
    console.log("Squad9: " + MarkCounts[9])
    console.log("Total: " + getAliveFriendlySpirits().length)
    console.log("Tick: " + tick)
    console.log("total execution time: " + (Date.now() - start) + "ms")
    console.log("Enemy shape: " + enemy_base.shape)
    
}

function updateRallyPositionData(){

    
    memory["rally position" + position[0]] = [position[1], position[2]]
    for(let i = 0; i < 10; i ++){
        RallyPositionData[i] = memory["rally position" + i]
        if(RallyPositionData[i] != null){
            graphics.style = "white";
            graphics.circle(RallyPositionData[i], 1);
            graphics.circle(RallyPositionData[i], 5);
            drawNumberAtPosition([RallyPositionData[i][0], parseFloat(RallyPositionData[i][1])  + 30], i, "grey", .8)
        }
        
    }
}

function defendBaseAI(){  
    /*
    This AI will try its best to keep enemies out of the 400 range
    */
    /*possible states  
    - Attacking: actively energizing an enemy
    - Searching: looking for an enemy
    - Recovering: retreating to heal
    */

    var index = -1
    for (s of getAISpirits("DefendBase")) {

        index += 1

        let rallyPointA = positionOnLine(base.position, HomeStar.position,-125)
        let rallyPointB   
        let defenseDistance = 100     

        if(base.position[0] < outpost.position[0])rallyPointB = [1590,900]
        else rallyPointB = [2650,1570]
        
        let rallyPoint = getRallyPosition(rallyPointA, rallyPointB, index, getAISpirits("DefendBase").length)

        while(distance(rallyPoint,base.position) < defenseDistance){
            rallyPoint = positionOnLine(rallyPoint, base.position, -1)
        }

        while(distance(rallyPoint,base.position) > defenseDistance){
            rallyPoint = positionOnLine(rallyPoint, base.position, 1)
        }

        

        let recoverPoint = positionOnLine(HomeStar.position, base.position, 190)
        let enemiesInAttackRange = getEnemiesInRange(s, 200)
        let enemyToChase = getClosestEnemyToPosition(rallyPoint, base.sight.enemies)

        if(energyCapacity == 10){
            //rallyPoint = positionOnLine(rallyPointA, rallyPointB, distance(rallyPointA,rallyPointB)/2)
            rallyPoint = [1600,750]
            if(enemyToChase != null){
                rallyPoint = positionOnLine(base.position, enemyToChase.position, 60)
            }
        }

        //default action to "Searching"
        if (!["Attacking", "Searching", "Recovering"].includes(memory[s.id])) {
            memory[s.id] = "Recovering"
        }

        //Manage States if Recovering
        if( memory[s.id] == "Recovering"){
            if(canSurviveEnemiesInRange(s)){
                if(getTotalEnergy(getEnemiesInRange(base, 400)) > base.energy && s.energy >= energyCapacity * .4){
                    memory[s.id] = "Searching"
                }
                
                if(s.energy > energyCapacity*.9){
                    memory[s.id] = "Searching"
                } 
            }
            if(energyCapacity == 10){
                memory[s.id] = "Searching"
            }
        }

        //Manage States if Searching
        if( memory[s.id] == "Searching"){
            if(enemyToChase != null && enemyToChase.energy < s.energy){
                memory[s.id] = "Attacking"
            }

            if( enemiesInAttackRange.length > 0 ){
                memory[s.id] = "Attacking"
            }

            if(!canSurviveEnemiesInRange(s) || (enemyToChase == null && s.energy < energyCapacity*.9)){
                memory[s.id] = "Recovering"
            }

            if(energyCapacity == 10 && s.energy > 1){
                memory[s.id] = "Attacking"
            }
        }

        //Manage States if Attacking
        if( memory[s.id] == "Attacking"){
            if(!canSurviveEnemiesInRange(s) && energyCapacity != 10){
                memory[s.id] = "Recovering"
            }

            if(enemyToChase == null){
                memory[s.id] = "Searching"
            }
        }

        if( memory[s.id] == "Recovering"){
            if(!isBeingHealed(s)){
                moveAvoidOutpost(s, recoverPoint)
                s.energize(s)
            }
            else{
                moveAvoidOutpost(s, rallyPoint)
            }     
            
            if(canSurviveEnemiesInRange(s)){
                attackEnemyPreventOverkill(s)
            }
            
            jumpAwayFromDeath(s)
            jumpEnemyPreventOverkill(s)
        }

        if( memory[s.id] == "Searching"){
            moveAvoidOutpost(s, rallyPoint)
            attackEnemyPreventOverkill(s)
            jumpEnemyPreventOverkill(s)    
        }
        

        if (memory[s.id] == "Attacking") {

            var attackingTarget = attackEnemyPreventOverkill(s)
            var attackPosition

            if (attackingTarget != null) {
                attackPosition = positionOnLine(attackingTarget.position, rallyPoint, 180)
                if(energyCapacity == 10){
                    attackPosition = positionOnLine(attackingTarget.position, rallyPoint, 199)
                }
            }
            
            else if (enemyToChase != null) {
                attackPosition = positionOnLine(enemyToChase.position, base.position, 180)
                if(energyCapacity == 10){
                    attackPosition = positionOnLine(enemyToChase.position, base.position, 199)
                }
            }

            //prevent the attackPosition from going inside the outpost range
            if(outpost.energy > 500 && outpost.control != "Aecert"){
                while(distance(attackPosition, outpost.position) <= 600){
                    attackPosition = positionOnLine(outpost.position, attackPosition, distance(attackPosition, outpost.position) + 3)
                }
            }

            s.move(attackPosition)
            
            if (attackingTarget == null && energyCapacity != 10) healAllyGettingAttacked(s)
            jumpEnemyPreventOverkill(s)
        } 
    }
}

function defendOutpostAI(){   
    /*
    This AI will take the outpost and hold it
    */
    /*possible states  
    - Attacking: actively energizing an enemy
    - Searching: looking for an enemy
    - Recovering: retreating to heal
    */

    var index = -1
    for (s of getAISpirits("DefendOutpost")) {

        index += 1

        let rallyPointA
        let rallyPointB
        let defenseDistance = 125

        if(base.position[0] < outpost.position[0]){
            rallyPointA = [2190,1270]
            rallyPointB = [1900,1600]
        }
        else{
            rallyPointA = [2020,1130]
            rallyPointB = [1750,1500]
        } 
            
        let rallyPoint = getRallyPosition(rallyPointA, rallyPointB, index, getAISpirits("DefendOutpost").length)

        while(distance(rallyPoint,OutpostStar.position) < defenseDistance){
            rallyPoint = positionOnLine(rallyPoint, OutpostStar.position, -1)
        }

        while(distance(rallyPoint,OutpostStar.position) > defenseDistance){
            rallyPoint = positionOnLine(rallyPoint, OutpostStar.position, 1)
        }

        let attackRange = 300
        

        let recoverPoint 
        if(base.position[0] < outpost.position[0]) recoverPoint = [2020,1130]
        else recoverPoint = [2190,1270]

        if(outpost.control != "Aecert" || getAISpirits("DefendOutpost").length == 1 || OutpostStar.energy == 0){
            rallyPoint = recoverPoint
            attackRange = 200
        }

        let enemiesInAttackRange = getEnemiesInRange(s, 200)
        let enemyToChase = getClosestEnemyToPosition(rallyPoint, outpost.sight.enemies)

        if(enemyToChase != null && distance(enemyToChase.position, outpost.position) > attackRange){
            enemyToChase = null
        }
        if(outpost.control != "Aecert" && outpost.energy != 0)enemyToChase = null

        //default action to "Searching"
        if (!["Attacking", "Searching", "Recovering"].includes(memory[s.id])) {
            memory[s.id] = "Recovering"
        }

        //Manage States if Recovering
        if( memory[s.id] == "Recovering"){
            if(canSurviveEnemiesInRange(s)){
                memory[s.id] = "Searching"
            }
        }

        //Manage States if Searching
        if( memory[s.id] == "Searching"){
            if(enemyToChase != null && enemyToChase.energy < s.energy){
                memory[s.id] = "Attacking"
            }

            if( enemiesInAttackRange.length > 0 ){
                memory[s.id] = "Attacking"
            }

            if(!canSurviveEnemiesInRange(s) || (enemyToChase == null && s.energy < energyCapacity*.9 && enemiesInAttackRange.length == 0)){
                memory[s.id] = "Recovering"
            }
        }

        //Manage States if Attacking
        if( memory[s.id] == "Attacking"){
            if(!canSurviveEnemiesInRange(s)){
                memory[s.id] = "Recovering"
            }

            if(enemyToChase == null && enemiesInAttackRange.length == 0){
                memory[s.id] = "Searching"
            }
        }

        if( memory[s.id] == "Recovering"){
            if(!isBeingHealed(s)){
                s.move(recoverPoint)
                s.energize(s)
            }
            else{
                s.move(rallyPoint)
                healAllyPreventOverHeal(s)
            }            

            if(outpost.energy == 0 && get1TickDamagePotentialGroup(getEnemiesInRange(s,200)) + energyCapacity*.1 < s.energy){
                s.energize(outpost)
            }
            
            else if(outpost.control != "Aecert" && enemyToChase == null && s.energy > energyCapacity*.5){
                s.energize(outpost)
            }

            if(memory[s.id + "jumped"] == true){
                attackEnemyPreventOverkill(s)
                memory[s.id + "jumped"] = false
            }
            
            jumpAwayFromDeath(s)
            jumpEnemyPreventOverkill(s)
        }

        if( memory[s.id] == "Searching"){
            s.move(rallyPoint) 
            s.energize(s)
            attackEnemyPreventOverkill(s)
            jumpEnemyPreventOverkill(s)

            if(outpost.control != "Aecert"){
                if(s.energy > energyCapacity*.2)s.energize(outpost)                
            } 

            else if(outpost.energy < 990){
                if(OutpostStar.energy > 250 && index == 0){
                    s.energize(outpost)
                }
    
                if(OutpostStar.energy > 700 && index == 2){
                    s.energize(outpost)
                } 
            }
            
            if(energyCapacity < 100){
                s.energize(outpost)
            }
        }

        if (memory[s.id] == "Attacking") {
            s.energize(s)

            var attackingTarget = attackEnemyPreventOverkill(s)
            var attackPosition = rallyPointA

            if (attackingTarget != null) {
                attackPosition = positionOnLine(attackingTarget.position, OutpostStar.position, 199)
            }
            else if (enemyToChase != null) {
                attackPosition = positionOnLine(enemyToChase.position, OutpostStar.position, 199)
            }

            s.move(attackPosition)

            if (attackingTarget == null) healAllyGettingAttacked(s)

            if(outpost.energy == 0 && distance(s.position, outpost.position) < 200){
                s.energize(outpost)
            } 
            jumpAwayFromDeath(spirit)
            jumpEnemyPreventOverkill(s)            
        } 
    }
}

function defendHomeStarAI(){  
    /*
    This AI will keep enemies off the home star
    */
    /*possible states  
    - Attacking: actively energizing an enemy
    - Searching: looking for an enemy
    - Recovering: retreating to heal
    */

    var index = -1
    for (s of getAISpirits("DefendHomeStar")) {

        index += 1

        let rallyPointA 
        let rallyPointB   
        
        let defenseDistance = 150

        if(base.position[0] < outpost.position[0]){
            rallyPointA = [1200,1100]
            rallyPointB = [900,1250]
        }
        else {
            rallyPointA = [3020,1330]
            rallyPointB = [3300,1250]
        }
        
        let rallyPoint = getRallyPosition(rallyPointA, rallyPointB, index, getAISpirits("DefendHomeStar").length)
        
        while(distance(rallyPoint,HomeStar.position) < defenseDistance){
            rallyPoint = positionOnLine(rallyPoint, HomeStar.position, -1)
        }

        while(distance(rallyPoint,HomeStar.position) > defenseDistance){
            rallyPoint = positionOnLine(rallyPoint, HomeStar.position, 1)
        }

        let recoverPoint = positionOnLine(HomeStar.position, s.position, 150) 
        
        let enemiesInAttackRange = getEnemiesInRange(s, 400)
        let chaseRange = 400

        let enemyToChase = getClosestEnemyToPosition(rallyPoint, s.sight.enemies)

        if(enemyToChase != null && distance(enemyToChase.position, HomeStar.position) > chaseRange){
            enemyToChase = null
        }

        //default action to "Searching"
        if (!["Attacking", "Searching", "Recovering"].includes(memory[s.id])) {
            memory[s.id] = "Recovering"
        }

        //Manage States if Recovering
        if( memory[s.id] == "Recovering"){
            if(canSurviveEnemiesInRange(s)){
                memory[s.id] = "Searching"
            }
        }

        //Manage States if Searching
        if( memory[s.id] == "Searching"){
            if(enemyToChase != null && enemyToChase.energy < s.energy){
                memory[s.id] = "Attacking"
            }

            if( enemiesInAttackRange.length > 0 ){
                memory[s.id] = "Attacking"
            }

            if(!canSurviveEnemiesInRange(s) && s.energ || (enemyToChase == null && s.energy < energyCapacity*.9)){
                memory[s.id] = "Recovering"
            }
        }

        //Manage States if Attacking
        if( memory[s.id] == "Attacking"){
            if(!canSurviveEnemiesInRange(s) && s.energy <= energyCapacity*.5){
                memory[s.id] = "Recovering"
            }

            if(enemyToChase == null){
                memory[s.id] = "Searching"
            }
        }

        if( memory[s.id] == "Recovering"){
            moveAvoidOutpost(s, recoverPoint)
            s.energize(s) 

            if(memory[s.id + "jumped"] == true){
                attackEnemyPreventOverkill(s)                
            }
            
            jumpAwayFromDeath(s)
            jumpEnemyPreventOverkill(s)
        }

        if( memory[s.id] == "Searching"){
            moveAvoidOutpost(s, rallyPoint)
            s.energize(s)

            var attackingTarget = attackEnemyPreventOverkill(s)
            if (attackingTarget == null) healAllyGettingAttacked(s)

            jumpEnemyPreventOverkill(s)
        }

        if (memory[s.id] == "Attacking") {
            s.energize(s)

            var attackingTarget = attackEnemyPreventOverkill(s)
            var attackPosition = rallyPoint

            if (attackingTarget != null) {
                attackPosition = positionOnLine(attackingTarget.position, HomeStar.position, 199)
            }
            else if (enemyToChase != null) {
                attackPosition = positionOnLine(enemyToChase.position, HomeStar.position, 199)
            }

            s.move(attackPosition)

            if (attackingTarget == null) healAllyGettingAttacked(s)

            jumpAwayFromDeath(spirit)
            jumpEnemyPreventOverkill(s)
            
        } 
    }
}

function rallyAI() {

    for (let i = 0; i < 10; i++) {
        if (SquadAI[i].includes("RallyPoint")) {
            let squadSpirits = getSquadSpirits(i)
            

            let rallyPointNumber = SquadAI[i][SquadAI[i].length -1];
            let aggro = SquadAI[i].includes("Aggro")

            let rallyPoint
            rallyPoint = RallyPositionData[rallyPointNumber]

            for (spirit of squadSpirits) {
                memory[spirit.id] = "Rallying"
                if(rallyPoint != null){
                    moveAvoidOutpost(spirit, rallyPoint)
                }
                let closestEnemy = getClosestEnemy(spirit, spirit.sight.enemies)
                if(aggro){
                    let attackTarget = attackEnemyPreventOverkill(spirit)
                    if (attackTarget != null) {
                        moveAvoidOutpost(spirit, positionOnLine(attackTarget.position, spirit.position,198))
                    }
                    else{
                        if(distance(spirit.position, rallyPoint) < 200 && closestEnemy != null){
                            moveAvoidOutpost(spirit, positionOnLine(closestEnemy.position, spirit.position,198))
                        }
                    }
                    
    
                    if (attackTarget == null) {
                        attackTarget = healAllyPreventOverHeal(spirit)
                    }
    
                    if(attackTarget == null){
                        spirit.energize(spirit)
                    }
                }
                if(!aggro){
                    var attackTarget
                    if(getTotalEnergy(getEnemiesInRange(spirit,250)) <= spirit.energy){
                        attackTarget = attackEnemyPreventOverkill(spirit)
                        if (attackTarget != null) {
                            moveAvoidOutpost(spirit, positionOnLine(attackTarget.position, spirit.position,198))
                        }
                    }
                    else{
                        moveAvoidOutpost(spirit, positionOnLine(closestEnemy.position, spirit.position,275))
                    }

                    if (attackTarget == null) {
                        attackTarget = healAllyPreventOverHeal(spirit)
                    }
    
                    if(attackTarget == null){
                        spirit.energize(spirit)
                    }
                }                
            }
        }
    }
}

function attackEnemyBaseAI() {

    for (s of getAISpirits("AttackEnemyBase")) {
        

        if (distance(s.position, enemy_base.position) >= 200) {
            moveAvoidOutpost(s, enemy_base.position)
            memory[s.id] = "Traveling" 

            //check if they should jump to the base

            let jumpableSpirits = []
            
            //calculate the total energy lost for all spirits jumping to the base
            let totalJumpCost = 0
            for(jumpSpirit of getAISpirits("AttackEnemyBase")){
                let jumpPosition = positionOnLine(enemy_base.position, jumpSpirit.position, 199)
                let jumpDistance = distance(jumpSpirit.position, jumpPosition)
                let jumpCost = jumpDistance/5

                if(jumpSpirit.energy - jumpCost >= 40 && jumpDistance <= 300 && energyCapacity == 100){
                    totalJumpCost += jumpCost
                    jumpableSpirits.push(jumpSpirit)
                }                
            }                        
            
            //if the energy required to win + energy required to tank the enemies is less than the energy of the jumpable squad spirits, they jump
            if(getTotalEnergy(getAlliesInRange(enemy_base, 300)) * 2 + totalJumpCost + enemy_base.energy + 50 < getTotalEnergy(jumpableSpirits) 
            && energyCapacity == 100
            && enemy_base.shape != "triangles"){
                for(jumper of jumpableSpirits){
                    jumper.jump(positionOnLine(enemy_base.position, jumper.position, 199))
                }                            
            }
        }

        var attackTarget
        var healTarget

        if(distance(s.position, enemy_base.position) <= 200) {
            memory[s.id] = "Ending Game" 
        }
        
        else{
            attackTarget = attackEnemyPreventOverkill(s)
        }

        if(attackTarget != null){
            memory[s.id] = "Attacking"
            s.move(positionOnLine(attackTarget.position, s.position, 190))

        }
        else if(memory[s.id] != "Ending Game" ){
            healTarget = healAllyGettingAttacked(s)
        }

        if(healTarget != null){
            s.move(positionOnLine(healTarget.position, s.position, 10))  
            memory[s.id] = "Healing"                           
        }
    }

    
    var baseHealing = 0
    let baseHealers = getAllHealingAllies(enemy_base)
    for(bh of baseHealers){
        baseHealing += bh.size
    }

    var baseAttackers = 0
    for (s of getMemorySpirits("Ending Game")) {
        if(energyCapacity*.2 + enemy_base.energy + baseHealing > baseAttackers * energyCapacity*.2 && s.energy > 0){
            s.energize(enemy_base)
            baseAttackers += 1
        }
        else if(attackEnemyPreventOverkill(s) != null){
            memory[s.id] = "Attacking"
        }

        else if(healAllyGettingAttacked(s) != null){  
            memory[s.id] = "Healing"                    
        }
    }
}

function attackEnemyStarAI() {

    for (s of getAISpirits("AttackEnemyStar")) {

        var rallyPoint = positionOnLine(EnemyStar.position, enemy_base.position, 190)
        moveAvoidOutpost(s, rallyPoint)
            memory[s.id] = "Traveling"

            if (canSurviveEnemiesInRange(s) && s.energy >= energyCapacity*.2 || s.energy >= energyCapacity*.8) {
                if (attackEnemyPreventOverkill(s) != null) {
                    memory[s.id] = "Attacking"
                }     
            }

            if(memory[s.id] != "Attacking"){
                if (healAllyPreventOverHeal(s) != null) {
                    memory[s.id] = "Healing"
                }
            }

            if(memory[s.id] == "Traveling") {
                s.energize(s)
                memory[s.id] = "Recovering"
                var safePoint = positionOnLine(EnemyStar.position, s.position, 195)

                if(distance(s.position, EnemyStar.position) > 200
                    && !canSurviveEnemiesInRange(s))
                    s.jump(safePoint)
            }
    }
}

function pokeEnemyBaseAI() {
    let index = 0
    for (s of getAISpirits("PokeEnemyBase")) {
        index++
        //if outpost is under control recover there, otherwise recover at homestar
        var recoverPoint = positionOnLine(HomeStar.position, s.position, 199)
        if(outpost.control == "Aecert" || (outpost.energy == 0 && OutpostStar.energy > 0)){
            recoverPoint = positionOnLine(OutpostStar.position, s.position, 199)

            if(distance(s.position, EnemyStar.position) < distance(s.position, OutpostStar.position)){
                recoverPoint = positionOnLine(EnemyStar.position, s.position, 199)
            }
        }

        

        //if outpost is under control, the attack point is from within its range, otherwise its on the opposite side of the enemies star
        var attackPoint = positionOnLine(enemy_base.position, EnemyStar.position, -399)
        if(outpost.control == "Aecert" || outpost.energy == 0){
            attackPoint = positionOnLine(enemy_base.position, OutpostStar.position, 350)

            if(outpost.energy >= 500){
                attackPoint = positionOnLine(outpost.position, enemy_base.position, 399)
            }
        }

        //if outpost has energy, make every 4th poker a healer
        if(index == 2 || index == 6 || index == 10 || index == 14){
            if(OutpostStar.energy > 0){
                attackPoint = positionOnLine(OutpostStar.position, attackPoint, 199)
            }            
        }

        
        
        if (!["Attacking", "Recovering"].includes(memory[s.id])) {
            memory[s.id] = "Recovering"
        }

        //Manage States if Recovering
        if( memory[s.id] == "Recovering"){
            if(s.energy >= energyCapacity*.9){
                memory[s.id] = "Attacking"
            }
        }

        //Manage States if Attacking
        if( memory[s.id] == "Attacking"){
            if(s.energy <= energyCapacity*.2){
                memory[s.id] = "Recovering"
            }

            if(!canSurviveEnemiesInRange(s)){
                memory[s.id] = "Recovering"
            }

            if(getAlliesInRange(enemy_base,400).length == 0 && s.energy > 0){
                memory[s.id] = "Attacking"
            }
        }

        //Actions if Recovering
        if( memory[s.id] == "Recovering"){
            moveAvoidEnemies(s, recoverPoint)
            s.energize(s)

            if(!canSurviveEnemiesInRange(s)){
                s.jump(positionOnLine(s.position, recoverPoint, 50))
            }

            if(getEnemiesInRange(s,210).length == 0){
                healAllyPreventOverHeal(s)
            }
        }

        //Actions if Attacking
        if( memory[s.id] == "Attacking"){
            //move to point just inside enemy base sight
            moveAvoidOutpost(s, attackPoint)

            //attack anything close
            var target = attackEnemyPreventOverkill(s)
            if(target != null){
                s.move(positionOnLine(target.position, s.position, 199))
            }
            if(target == null){
                target =healAllyGettingAttacked(s)
            }

            if(target == null){
                s.energize(s)
            }

            //move to enemy base if no enemies are nearby
            if(getTotalEnergy(getAlliesInRange(enemy_base,200)) < s.energy){
                s.move(positionOnLine(enemy_base.position, s.position, 199))
            }

            //attack enemy base if no enemies are in range
            if(getEnemiesInRange(s, 200).length == 0 && distance(enemy_base.position, s.position) < 200){
                s.energize(enemy_base)
            }

            //if enemies have more energy, retreat
            if(getTotalEnergy(getEnemiesInRange(s, 215)) > getTotalEnergy(getAlliesInRange(s,50)) + s.energy){
                s.move(recoverPoint)
            }
        }
    }
}

function pokeEnemyStarAI() {
    for (s of getAISpirits("PokeEnemyStar")) {

        //recover on far side of enemy star
        var recoverPoint = positionOnLine(EnemyStar.position, enemy_base.position, -199)

        //flee away from the closest enemy
        var fleePoint = recoverPoint
        if(s.sight.enemies.length > 0){
            fleePoint = positionOnLine(getClosestEnemy(s,s.sight.enemies).position, s.position, 250)
        }
        

        //Attack between enemy star and enemy base
        var attackPoint = positionOnLine(EnemyStar.position, enemy_base.position, 199)

        
        
        if (!["Attacking", "Fleeing", "Recovering"].includes(memory[s.id])) {
            memory[s.id] = "Recovering"
        }

        //Manage States if Recovering
        if( memory[s.id] == "Recovering"){
            if(s.energy > energyCapacity*.9){
                memory[s.id] = "Attacking"
            }
            if(getTotalEnergy(getEnemiesInRange(s, 240)) > s.energy){
                memory[s.id] = "Fleeing"
            }
        }

        //Manage States if Fleeing
        if( memory[s.id] == "Fleeing"){
            if(getTotalEnergy(getEnemiesInRange(s, 240)) <= s.energy){
                if(s.energy <= energyCapacity*.9){
                    memory[s.id] = "Recovering"
                }
    
                if(getTotalEnergy(getEnemiesInRange(s, 200)) <= s.energy){
                    memory[s.id] = "Attacking"
                }
            }            
        }

        //Manage States if Attacking
        if( memory[s.id] == "Attacking"){
            if(s.energy <= energyCapacity*.2){
                memory[s.id] = "Recovering"
            }

            if(getTotalEnergy(getEnemiesInRange(s, 230)) > s.energy){
                memory[s.id] = "Fleeing"
            }          
        }

        //Actions if Recovering
        if( memory[s.id] == "Recovering"){
            moveAvoidEnemies(s, recoverPoint)
            s.energize(s)

            if(!canSurviveEnemiesInRange(s)){
                s.jump(positionOnLine(s.position, fleePoint, 40))
            }

            if(getTotalEnergy(getEnemiesInRange(s, 200)) < s.energy){
                attackEnemyPreventOverkill(s)
            }
        }

        //Actions if Fleeing
        if( memory[s.id] == "Fleeing"){
            moveAvoidEnemies(s, fleePoint)
            s.energize(s)

            if(!canSurviveEnemiesInRange(s)){
                s.jump(fleePoint)
            }

            if(getTotalEnergy(getEnemiesInRange(s, 200)) < s.energy){
                attackEnemyPreventOverkill(s)
            }
        }

        //Actions if Attacking
        if( memory[s.id] == "Attacking"){
            //move to point just inside enemy base sight
            moveAvoidOutpost(s, attackPoint)

            //attack anything close
            var target = attackEnemyPreventOverkill(s)
            if(target != null){
                s.move(positionOnLine(target.position, s.position, 199))
            }

            //if not attacking, heal ally getting attacked
            if(target == null){
                target = healAllyGettingAttacked(s)
            }

            //if not healing, energize star
            if(target == null){
                s.energize(s)
            }
        }
    }
}

function rushEnemyStarAI() {
    for (s of getAISpirits("RushEnemyStar")) {

        //rush to the closest point to the star
        var rushPoint = positionOnLine(EnemyStar.position, s.position, 199)

        //recover on far side of enemy star
        var recoverPoint = positionOnLine(EnemyStar.position, enemy_base.position, -199)        

        //Attack between enemy star and enemy base
        var attackPoint = positionOnLine(EnemyStar.position, enemy_base.position, 199)

        
        
        if (!["Attacking", "Rushing", "Recovering"].includes(memory[s.id])) {
            memory[s.id] = "Rushing"
        }

        //Manage States if Rushing
        if( memory[s.id] == "Rushing"){
            if(distance(s.position, EnemyStar.position) < 200){
                memory[s.id] = "Recovering"
            }          
        }

        //Manage States if Recovering
        if( memory[s.id] == "Recovering"){
            if(s.energy > energyCapacity*.5){
                memory[s.id] = "Attacking"
            }

            if(s.energy - 10 >= getTotalEnergy(getEnemiesInRange(s,220))*1.5){
                memory[s.id] = "Attacking"
            }

            if(EnemyStar.energy < 5){
                memory[s.id] = "Attacking"
            }
        }

        //Manage States if Attacking
        if( memory[s.id] == "Attacking"){
            if(s.energy <= energyCapacity*.2 && getEnemiesInRange(s, 400).length > 0){
                memory[s.id] = "Recovering"
            }   
            
            if(s.energy < getTotalEnergy(getEnemiesInRange(s,220)) && !canSurviveEnemiesInRange(s)){
                memory[s.id] = "Recovering"
            }

            if(EnemyStar.energy < 5){
                memory[s.id] = "Attacking"
            }
        }

        
        //Actions if Rushing
        if( memory[s.id] == "Rushing"){
            s.move(rushPoint)
            graphics.circle(rushPoint,2)
            attackEnemyPreventOverkill(s)

            if(getTotalEnergy(getEnemiesInRange(s,210)) * 2 > s.energy && 10 + distance(s.position, rushPoint)/5 < s.energy){
                s.jump(rushPoint)
                s.energize(s)
            }

            if(!canSurviveEnemiesInRange(s)){
                s.jump(rushPoint)
                s.energize(s)
            }
        }

        //Actions if Recovering
        if( memory[s.id] == "Recovering"){
            s.move(recoverPoint)
            s.energize(s)
        }


        //Actions if Attacking
        if( memory[s.id] == "Attacking"){
            s.move(attackPoint)
            if(getTotalEnergy(getEnemiesInRange(s,210)) > s.energy){
                s.move(recoverPoint)
            }
            //attack anything close
            var target = attackEnemyPreventOverkill(s)

            //if not attacking, heal ally getting attacked
            if(target == null){
                target = healAllyGettingAttacked(s)
            }

            //if not healing, energize star
            if(target == null){
                s.energize(s)
            }

            if(getEnemiesInRange(s, 400).length == 0 ){
                s.move(positionOnLine(enemy_base.position,s.position,199))
                s.energize(enemy_base)
            }
        }
    }
}

function rushOutpostStarAI() {
    for (s of getAISpirits("RushOutpostStar")) {

        //rush to the closest point to the star
        var rushPoint = positionOnLine(OutpostStar.position, s.position, 199)

        //recover on far side of enemy star
        var recoverPoint = positionOnLine(OutpostStar.position, outpost.position, -150)        

        //Attack between enemy star and enemy base
        var attackPoint = positionOnLine(OutpostStar.position, outpost.position, 150)

        
        
        if (!["Attacking", "Rushing", "Recovering"].includes(memory[s.id])) {
            memory[s.id] = "Rushing"
        }

        //Manage States if Rushing
        if( memory[s.id] == "Rushing"){
            if(distance(s.position, OutpostStar.position) < 200){
                memory[s.id] = "Recovering"
            }          
        }

        //Manage States if Recovering
        if( memory[s.id] == "Recovering"){
            if(s.energy > energyCapacity*.5){
                memory[s.id] = "Attacking"
            }

            if(s.energy - 10 >= getTotalEnergy(getEnemiesInRange(s,220))*1.5){
                memory[s.id] = "Attacking"
            }
        }

        //Manage States if Attacking
        if( memory[s.id] == "Attacking"){
            if(s.energy <= energyCapacity*.2){
                memory[s.id] = "Recovering"
            }   
            
            if(s.energy < getTotalEnergy(getEnemiesInRange(s,220)) && !canSurviveEnemiesInRange(s)){
                memory[s.id] = "Recovering"
            }
        }

        
        //Actions if Rushing
        if( memory[s.id] == "Rushing"){
            s.move(rushPoint)
            graphics.circle(rushPoint,2)
            s.energize(s)

            if(getTotalEnergy(getEnemiesInRange(s,210)) * 2 > s.energy && 10 + distance(s.position, rushPoint)/5 < s.energy){
                s.jump(rushPoint)
            }

            if(!canSurviveEnemiesInRange(s)){
                s.jump(rushPoint)
            }
        }

        //Actions if Recovering
        if( memory[s.id] == "Recovering"){
            s.move(recoverPoint)
            s.energize(s)
        }


        //Actions if Attacking
        if( memory[s.id] == "Attacking"){
            s.move(attackPoint)

            //attack anything close
            var target = attackEnemyPreventOverkill(s)

            //if not attacking, heal ally getting attacked
            if(target == null){
                target = healAllyGettingAttacked(s)
            }

            if(target == null && s.energy > 20 && outpost.control != "Aecert"){
                s.energize(outpost)
            }

            if(outpost.energy == 0){
                s.energize(outpost)
            }

            //if not healing, energize star
            if(target == null){
                s.energize(s)
            }
        }
    }
}

function harvestAI(){   

    for (let i = 0; i < 10; i++) {
        if (["HarvestHome", "HarvestOutpost"].includes(SquadAI[i])) {

            //set which star is being harvested
            var harvestStar
            if (SquadAI[i] == "HarvestOutpost") harvestStar = OutpostStar
            if (SquadAI[i] == "HarvestHome") harvestStar = HomeStar

            var squadSpirits = getSquadSpirits(i)            

            //Makes sure the s is one of the following
            for (s of squadSpirits) {
                if (!["Depositing", "Gathering", "Chaining", "Safe", "Spawned"].includes(memory[s.id])) {
                    memory[s.id] = "Spawned"
                }
            }

            // 1 s At Base - Just go back and forth
            if (MarkCounts[i] == 1) {
                let gatherSpirit = squadSpirits[0]
                //initialize
                if (!["Defending", "Recovering", "Depositing", "Gathering"].includes(memory[gatherSpirit.id])) {
                    memory[gatherSpirit.id] = "Depositing"
                }

                //Depositing
                if (memory[gatherSpirit.id] == "Depositing") {
                    gatherSpirit.energize(base)
                    moveAvoidOutpost(gatherSpirit, positionOnLine(base.position, harvestStar.position, 199))

                    if (gatherSpirit.energy <= gatherMinHealth) {
                        memory[gatherSpirit.id] = "Gathering"
                    }
                }

                //Gathering
                if (memory[gatherSpirit.id] == "Gathering") {
                    gatherSpirit.energize(gatherSpirit)
                    moveAvoidOutpost(gatherSpirit, positionOnLine(harvestStar.position, base.position, 199))

                    if (gatherSpirit.energy == gatherSpirit.energy_capacity) {
                        memory[gatherSpirit.id] = "Depositing"
                    }
                }
            }

            // 2 Spirits At Base - 1 gathers, the other starts the chain
            if (MarkCounts[i] == 2) {
                let chainSpirit = squadSpirits[1]
                if (!["Defending", "Recovering"].includes(memory[chainSpirit.id])) {
                    moveAvoidOutpost(chainSpirit, positionOnLine(base.position, harvestStar.position, 199))
                    if (chainSpirit.energy >= chainMinHealth) chainSpirit.energize(base)
                    memory[chainSpirit.id] = "Chaining"
                }

                let gatherSpirit = squadSpirits[0]
                if (!["Defending", "Recovering", "Depositing", "Gathering"].includes(memory[gatherSpirit.id])) {
                    memory[gatherSpirit.id] = "Depositing"
                }

                //Depositing
                if (memory[gatherSpirit.id] == "Depositing") {
                    if (chainSpirit.energy <= energyCapacity*.9) {
                        gatherSpirit.energize(chainSpirit)
                    }            
                    moveAvoidOutpost(gatherSpirit, positionOnLine(chainSpirit.position, harvestStar.position, 199)) 

                    if (gatherSpirit.energy <= gatherMinHealth) {
                        memory[gatherSpirit.id] = "Gathering"
                    }
                }

                //Gathering
                if (memory[gatherSpirit.id] == "Gathering") {
                    gatherSpirit.energize(gatherSpirit)
                    moveAvoidOutpost(gatherSpirit, positionOnLine(harvestStar.position, chainSpirit.position, 199))

                    if (gatherSpirit.energy == gatherSpirit.energy_capacity) {
                        memory[gatherSpirit.id] = "Depositing"
                    }
                }
            }

            // 3 Spirits At Base - 1 gathers, the other 2 make the chain
            if (MarkCounts[i] == 3) {
                let chainSpirit1 = squadSpirits[2]
                let chainDistance = 150
                if (!["Defending", "Recovering"].includes(memory[chainSpirit1.id])) {
                    moveAvoidOutpost(chainSpirit1, positionOnLine(base.position, harvestStar.position, chainDistance))
                    if (chainSpirit1.energy >= chainMinHealth) chainSpirit1.energize(base)
                    memory[chainSpirit1.id] = "Chaining"
                }

                let chainSpirit2 = squadSpirits[1]
                chainDistance += 199
                if (!["Defending", "Recovering"].includes(memory[chainSpirit2.id])) {
                    moveAvoidOutpost(chainSpirit2, positionOnLine(base.position, harvestStar.position, chainDistance))
                    if (chainSpirit2.energy >= chainMinHealth && chainSpirit1.energy <= energyCapacity*.9) chainSpirit2.energize(chainSpirit1)
                    memory[chainSpirit2.id] = "Chaining"
                }


                let gatherSpirit = squadSpirits[0]
                chainDistance += 199
                if (!["Defending", "Recovering", "Depositing", "Gathering"].includes(memory[gatherSpirit.id])) {
                    memory[gatherSpirit.id] = "Depositing"
                }

                //Depositing
                if (memory[gatherSpirit.id] == "Depositing") {
                    moveAvoidOutpost(gatherSpirit, positionOnLine(base.position, harvestStar.position, chainDistance))
                    if (chainSpirit2.energy <= energyCapacity*.9) gatherSpirit.energize(chainSpirit2)

                    if (gatherSpirit.energy <= chainMinHealth) {
                        memory[gatherSpirit.id] = "Gathering"
                    }
                }

                //Gathering
                if (memory[gatherSpirit.id] == "Gathering") {
                    moveAvoidOutpost(gatherSpirit, positionOnLine(base.position, harvestStar.position, chainDistance))
                    if (harvestStar.energy > 150 || energyCapacity < 100) {
                        gatherSpirit.energize(gatherSpirit)
                    }


                    if (gatherSpirit.energy >= energyCapacity*.9) {
                        memory[gatherSpirit.id] = "Depositing"
                    }
                }
            }

            // 4 Spirits At Base - 2 gather, the other 2 make the chain
            if (MarkCounts[i] >= 4 && energyCapacity >= 30) {
                let chainSpirit1 = squadSpirits[3]
                let chainDistance = 150
                if (!["Defending", "Recovering"].includes(memory[chainSpirit1.id])) {
                    moveAvoidOutpost(chainSpirit1, positionOnLine(base.position, harvestStar.position, chainDistance))
                    if (chainSpirit1.energy >= chainMinHealth) chainSpirit1.energize(base)
                    memory[chainSpirit1.id] = "Chaining"
                }

                chainDistance += 199
                let chainSpirit2 = squadSpirits[2]
                if (!["Defending", "Recovering"].includes(memory[chainSpirit1.id])) {
                    moveAvoidOutpost(chainSpirit2, positionOnLine(base.position, harvestStar.position, chainDistance))
                    if (chainSpirit2.energy >= chainMinHealth && chainSpirit1.energy <= energyCapacity*.9) chainSpirit2.energize(chainSpirit1)
                    memory[chainSpirit2.id] = "Chaining"
                }

                let gatherSpirit = squadSpirits[1]
                let gatherSpirit2 = squadSpirits[0]
                chainDistance += 199

                if (!["Defending", "Recovering"].includes(memory[gatherSpirit.id])) {
                    moveAvoidOutpost(gatherSpirit, positionOnLine(base.position, harvestStar.position, chainDistance))

                    if (tick % 2 == 0) {
                        if (gatherSpirit.energy > energyCapacity*.7 && chainSpirit2.energy <= energyCapacity*.9) gatherSpirit.energize(chainSpirit2)
                        memory[gatherSpirit.id] = "Depositing"
                    }
                    else {
                        if (harvestStar.energy > 350 || energyCapacity < 100) {
                            gatherSpirit.energize(gatherSpirit)
                        }
                        memory[gatherSpirit.id] = "Gathering"
                    }
                }

                if (!["Defending", "Recovering"].includes(memory[gatherSpirit2.id])) {
                    moveAvoidOutpost(gatherSpirit2, positionOnLine(base.position, harvestStar.position, chainDistance))

                    if (tick % 2 != 0) {
                        if (gatherSpirit2.energy > energyCapacity*.7 && chainSpirit2.energy <= energyCapacity*.9) gatherSpirit2.energize(chainSpirit2)
                        memory[gatherSpirit2.id] = "Depositing"
                    }
                    else {
                        if (harvestStar.energy > 700 || energyCapacity < 100) {
                            gatherSpirit2.energize(gatherSpirit2)
                        }
                        memory[gatherSpirit2.id] = "Gathering"
                    }
                }
            }

            // >4 Spirits At Base - the rest haul normally
            if (MarkCounts[i] > 4) {
                let startingIndex = 4
                if(energyCapacity == 10)startingIndex = 0

                for (let j = startingIndex; j < MarkCounts[i]; j++) {
                    let gatherSpirit = squadSpirits[j]
                    if (!["Defending", "Recovering", "Depositing", "Gathering"].includes(memory[gatherSpirit.id])) {
                        memory[gatherSpirit.id] = "Depositing"
                    }

                    //Depositing
                    if (memory[gatherSpirit.id] == "Depositing") {
                        gatherSpirit.energize(base)

                        moveAvoidOutpost(gatherSpirit, positionOnLine(base.position, harvestStar.position, 199))

                        if (gatherSpirit.energy <= gatherMinHealth) {
                            memory[gatherSpirit.id] = "Gathering"
                        }
                    }

                    //Gathering
                    if (memory[gatherSpirit.id] == "Gathering") {
                        if (harvestStar.energy > 900 || energyCapacity < 100) {
                            gatherSpirit.energize(gatherSpirit)
                        }


                        if (distance(gatherSpirit.position, harvestStar.position) > 200) {
                            moveAvoidOutpost(gatherSpirit, harvestStar.position)
                        }

                        if (gatherSpirit.energy == gatherSpirit.energy_capacity) {
                            memory[gatherSpirit.id] = "Depositing"
                        }
                    }
                }
            }

            //check if s should heal
            for (s of getSquadSpirits(i)) {
                if(healAllyPreventOverHeal(s) != null){
                    memory[s.id] = "Healing"
                }                
            }            

            //Defense - Shoot at enemies in range, retreat to star and recover if <= 20 energy
            for (s of getSquadSpirits(i)) {
                var closestEnemy = getClosestEnemy(s, s.sight.enemies)
                if (closestEnemy != null) {

                    if (distance(s.position, closestEnemy.position) <= 200 && memory[s.id] != "Healing") {
                        memory[s.id] = "Defending"
                    }
                    if (!canSurviveEnemiesInRange(s)) {
                        memory[s.id] = "Recovering"
                        s.energize(s)
                    }

                    if (memory[s.id] == "Defending") {
                        var target = attackEnemyPreventOverkill(s)

                        let kitePosition = positionOnLine(target.position, s.position, 190)
                        s.move(kitePosition)
                    }

                    if (memory[s.id] == "Recovering") {
                        s.energize(s)

                        let recoverPosition = positionOnLine(harvestStar.position, s.position, 190)
                        s.move(recoverPosition)

                        if (distance(s.position, closestEnemy.position) <= 200 
                        && distance(s.position, harvestStar.position) > 199
                        && distance(s.position, recoverPosition)/5 < s.energy) {
                            s.jump(recoverPosition)
                        }

                        if (s.energy >= 80) {
                            memory[s.id] = "Defending"
                        }

                    }
                }

                //No enemies in range
                else if (["Defending", "Recovering"].includes(memory[s.id])) {
                    memory[s.id] = "Safe"
                }
            }
        }
    }
}

function assignSquads(){
    
    
    let Squad0 = []
    let Squad1 = []
    let Squad2 = []
    let Squad3 = []
    let Squad4 = []
    let Squad5 = []
    let Squad6 = []
    let Squad7 = []
    let Squad8 = []
    let Squad9 = []
    let Squads = [Squad0,Squad1,Squad2,Squad3,Squad4,Squad5,Squad6,Squad7,Squad8,Squad9]

    //put spirits into arrays
    for(spirit of my_spirits){
        if(spirit.hp == 0)continue

        if (spirit.mark == null) {
            spirit.set_mark("Squad9")
        }

        if (memory[spirit.id] == null) {
            memory[spirit.id] = "Spawned"
        }

        for (let i = 0; i < 10; i++) {
            if (spirit.mark == i) {                
                Squads[i].push(spirit)
            }
        }
    }

    //removes all extra spirits from their squad and puts them in Squad5
    for (let i = 0; i < 9; i++) {
        while(Squads[i].length > SquadTargets[i]){
            let removedSpirit = Squads[i].pop()
            Squad9.push(removedSpirit)     
            memory[removedSpirit.id] = "Spawned"       
        }             
    }

    //logic for re-assigning squads from squad5
    
    for (let i = 0; i < 9; i++) {
        while(Squads[i].length < SquadTargets[i] && Squad9.length > 0){
            let removedSpirit = Squad9.pop()            
            Squads[i].push(removedSpirit)
        }             
    }
    
    //assign marks
    for (let i = 0; i < 10; i++) {        
        for(spirit of Squads[i]){            
            spirit.set_mark(String(i))
        }        
    }
}

function getRallyPosition(pos1,pos2,spotIndex,totalSpots){
    var result
    var rallyPointDistance = distance(pos1,pos2)      

    var step = rallyPointDistance/(totalSpots - 1)

    result = positionOnLine(pos1, pos2, step * (spotIndex-1))
    
    if(totalSpots >= 2){
        if(spotIndex == 0){
            result = pos1
        }
        if(spotIndex == 1){
            result = pos2
        }            
    }

    else if(totalSpots >= 1){
        if(spotIndex == 0){
            result = positionOnLine(pos1, pos2, rallyPointDistance/2)
        }            
    }

    return result
}

function jumpAwayFromDeath(spirit){
    if(energyCapacity < 100)return
    if (!canSurviveEnemiesInRange(spirit)) {
        var closestEnemy = getClosestEnemy(spirit, spirit.sight.enemies)
        var jumpPosition = positionOnLine(closestEnemy.position, spirit.position, 220)

        if (jumpPosition != null) {
            if (spirit.energy <= 50) {
                spirit.jump(jumpPosition)
            }
        }
    }
}

function distance(position1, position2){
    let x1 = position1[0]
    let y1 = position1[1]
    let x2 = position2[0]
    let y2 = position2[1]
    
    let y = x2 - x1;
    let x = y2 - y1;
    let result =  Math.sqrt(x * x + y * y);
    return result
}

function positionOnLine(p1, p2, len){
    
    var xDist = p2[0] - p1[0];
    var yDist = p2[1] - p1[1];
    var dist = Math.sqrt(xDist * xDist + yDist * yDist);

    var fractionOfTotal = len / dist;

    let x = p1[0] + xDist * fractionOfTotal
    let y = p1[1] + yDist * fractionOfTotal
    var p = [x,y]

    return p
}

function getClosestStar(spirit){
    let result = HomeStar;
    let dtHomeStar = distance(spirit.position,HomeStar.position)
    let dtOutpostStar = distance(spirit.position,OutpostStar.position)
    let dtEnemyStar = distance(spirit.position,EnemyStar.position)

    if(dtOutpostStar < dtHomeStar) result = OutpostStar

    if(dtEnemyStar < distance(spirit.position,result.position)) result = EnemyStar

    return result
}

function setStars(){
    if(distance(base.position,star_zxq.position) < distance(base.position,star_a1c.position)){
        HomeStar = star_zxq
        EnemyStar = star_a1c
    }
    else{
        HomeStar = star_a1c
        EnemyStar = star_zxq
    }
}

function updateMarkCounts(){
    for(spirit of my_spirits){
        if(spirit.hp > 0){
            let i = parseInt(spirit.mark, 10)
            MarkCounts[i] = MarkCounts[i] + 1 
        }
    }
}

function getClosestEnemy(spirit, enemyIDList){
    if(enemyIDList.length == 0) return null

    var closestEnemy = spirits[enemyIDList[0]]
    var closestDistance = 9999
    for(id of enemyIDList){
        if(distance(spirit.position, spirits[id].position) < closestDistance){
            closestEnemy = spirits[id]
            closestDistance = distance(spirit.position, closestEnemy.position)
        }
    }
    return closestEnemy
}

function getClosestEnemyToPosition(p, enemyIDList){
    if(enemyIDList.length == 0) return null

    var closestEnemy = spirits[enemyIDList[0]]
    var closestDistance = 9999
    for(id of enemyIDList){
        if(distance(p, spirits[id].position) < closestDistance){
            closestEnemy = spirits[id]
            closestDistance = distance(p, closestEnemy.position)
        }
    }
    return closestEnemy
}

function getAllSpirits(spiritIDList){
    var result = []
    for(id of spiritIDList){
        result.push(spirits[id])
    }
    return result
}

function getTotalEnergy(spiritObjectList){
    var result = 0
    for(spirit of spiritObjectList){
        result += spirit.energy
    }
    return result
}

function getEnemiesInRange(spirit, range = 200){
    var enemiesInSight = getAllSpirits(spirit.sight.enemies)
    var enemiesInRange = []

    for(enemy of enemiesInSight){
        if(distance(enemy.position, spirit.position) <= range)enemiesInRange.push(enemy)
    }

    return enemiesInRange
}

function getAlliesInRange(spirit, range = 200){
    var alliesInSight = getAllSpirits(spirit.sight.friends)
    var alliesInRange = []

    for(ally of alliesInSight){
        if(distance(ally.position, spirit.position) <= range)alliesInRange.push(ally)
    }

    return alliesInRange
}

function getLowestEnergySpirit(spiritGroup){
    var result
    for(spirit of spiritGroup){
        if(result == null || spirit.energy < result.energy ){
            if(!["Gathering", "Depositing"].includes(memory[spirit.id])){
                result = spirit
            }
        }
    }
    return result
}

function getAliveFriendlySpirits(){
    var result = []
    for(spirit of my_spirits){
        if(spirit.hp > 0)result.push(spirit)
    }
    return result
}

function attackEnemyPreventOverkill(spirit){
    var enemiesInRange = getEnemiesInRange(spirit)
    if(enemiesInRange.length == 0) return
    if(spirit.energy == 0) return

    var targets = []
    for(ally of my_spirits){
        targets.push(memory[ally.id + "attack target"])
    }
    var smallestAttackerAmount
    var largestAttackerAmount
    var smallestAttackerAmountEnemy
    var largestAttackerAmountEnemy

    for(enemy of enemiesInRange){
        var attackerAmount = 0

        //check how many times the enemy appears in the targets array
        for(target of targets){
            if(target == enemy.id)attackerAmount += 1
        }
        if(smallestAttackerAmount == null || attackerAmount < smallestAttackerAmount){
            smallestAttackerAmount = attackerAmount
            smallestAttackerAmountEnemy = enemy
        }

        if(largestAttackerAmount == null || attackerAmount > largestAttackerAmount){
            largestAttackerAmount = attackerAmount
            largestAttackerAmountEnemy = enemy
        }
    }

    //do NOT attack if it will be overkill
    if(smallestAttackerAmount * energyCapacity*.2 > smallestAttackerAmountEnemy.energy)return

    memory[spirit.id + "jumped"] = false

    //attack the largest attacker amount if it isnt going to die.
    if(largestAttackerAmount * energyCapacity*.2 <= largestAttackerAmountEnemy.energy){
        memory[spirit.id + "attack target"] = largestAttackerAmountEnemy.id
        spirit.energize(largestAttackerAmountEnemy)
        return largestAttackerAmountEnemy
    }

    //attack the lowest attacker amount otherwise
    else{
        memory[spirit.id + "attack target"] = smallestAttackerAmountEnemy.id
        spirit.energize(smallestAttackerAmountEnemy)
        return smallestAttackerAmountEnemy
    }
}


function healAllyPreventOverHeal(spirit){
    var alliesInRange = getAlliesInRange(spirit)
    if(alliesInRange.length == 0) return
    if(spirit.energy == 0) return

    var targets = []
    for(ally of my_spirits){
        targets.push(memory[ally.id + "heal target"])
    }
    var smallestHealerAmount
    var smallestHealerAmountAlly
    for(ally of alliesInRange){
        var healerAmount = 0

        //check how many times the ally appears in the targets array
        for(target of targets){
            if(target == ally.id)healerAmount += 1
        }
        
        if(smallestHealerAmount == null || healerAmount < smallestHealerAmount){
            if(!(["Gathering", "Depositing", "Chaining", "Healing"].includes(memory[ally.id]) 
            && getFirstAttackingEnemy(ally) == null)
            && ally.energy < energyCapacity 
            && memory[ally.id + "heal target"] != spirit.id){
                smallestHealerAmount = healerAmount
                smallestHealerAmountAlly = ally
            }            
        }
    }
    if(smallestHealerAmountAlly == null) return null

    //do NOT heal if it will be overheal 
    //or if they are gathering or depositing
    //or if they are full hp
    if(smallestHealerAmount * energyCapacity*.1 > energyCapacity - smallestHealerAmountAlly.energy 
        || (distance(getClosestStar(smallestHealerAmountAlly).position, smallestHealerAmountAlly.position) <= 200 && getClosestStar(smallestHealerAmountAlly).energy >= energyCapacity*.1 ))return

    memory[spirit.id + "heal target"] = smallestHealerAmountAlly.id
    spirit.energize(smallestHealerAmountAlly)

    return smallestHealerAmountAlly
}

function jumpEnemyPreventOverkill(spirit){

    if(energyCapacity < 100)return
    var enemiesInSight = getEnemiesInRange(spirit, 400) 
    var enemiesJumpable = []

    for(enemy of enemiesInSight){
        var jumpPosition = positionOnLine(enemy.position, spirit.position, 160)
        var jumpDistance = distance(jumpPosition, spirit.position)

        var enemiesCloseToEnemy = getAlliesInRange(enemy, 210)

        var enemyHealthRemaining = enemy.energy - enemy.size
        var enemydamageDealt = get1TickDamagePotentialSingle(enemy) 

  
        //jump into a single enemy
        if(    enemy.energy <= 19
            && (enemy.energy_capacity >= 20 || getSpiritAI(spirit) == "DefendBase")
            && spirit.energy - 10 > (jumpDistance/5) + enemyHealthRemaining + enemydamageDealt + 1
            && distance(enemy.position, spirit.position) > 195
            && !willDieToOutpost(enemy)
            && getAlliesInRange(enemy,250).length == 0) enemiesJumpable.push(enemy)

        //jump into multiple enemies
        else if(    enemy.energy <= 19 
            && (enemy.energy_capacity >= 20 || getSpiritAI(spirit) == "DefendBase")
            && spirit.energy - 10 > (jumpDistance/5) + enemyHealthRemaining + enemydamageDealt + getTotalEnergy(enemiesCloseToEnemy) * 2
            && distance(enemy.position, spirit.position) > 195
            && distance(enemy.position, spirit.position) < 360
            && !willDieToOutpost(enemy)) enemiesJumpable.push(enemy)

         
    }

    var targets = []
    for(ally of my_spirits){
        targets.push(memory[ally.id + "jump target"])
        targets.push(memory[ally.id + "attack target"])
    }

    var jumpableEnemy  

    //check how many times the enemy appears in the targets array
    for(enemy of enemiesJumpable){
        if(!targets.includes(enemy.id)){
            jumpableEnemy = enemy
            break
        }
    }

    if(jumpableEnemy == null) return null

    var jumpPosition = positionOnLine(jumpableEnemy.position, spirit.position, 150)
    spirit.jump(jumpPosition)  
    spirit.move(jumpPosition)
    spirit.energize(jumpableEnemy)
    memory[ally.id + "jump target"] = jumpableEnemy.id
    memory[spirit.id + "jumped"] = true

    return jumpableEnemy
}

function healAllyGettingAttacked(spirit){
    var alliesInRange = getAlliesInRange(spirit)
    

    var targets = []
    for(ally of alliesInRange){
        if(getFirstAttackingEnemy(ally) != null){
            targets.push(ally)
        }
        else if(ally.energy < spirit.energy && getEnemiesInRange(ally, 300).length > 0){
            targets.push(ally)
        }
    }

    if(targets.length == 0) return null

    var lowestHealthAmount
    var lowestHealthAmountAlly
    for(ally of targets){
        if(lowestHealthAmount == null || lowestHealthAmount > ally.energy){
            lowestHealthAmount = ally.energy
            lowestHealthAmountAlly = ally
        }
    }

    memory[spirit.id + "heal target"] = lowestHealthAmountAlly.id
    spirit.energize(lowestHealthAmountAlly)

    return lowestHealthAmountAlly
}

function clearTargets(){
    for(spirit of my_spirits){
        memory[spirit.id + "attack target"] = ""
        memory[spirit.id + "heal target"] = ""
        memory[spirit.id + "jump target"] = ""
    }
}

function moveAvoidOutpost(spirit, destination){
    spirit.move(destination)
    if(outpost.control == "Aecert" || outpost.energy == 0) return

    let outpostRange = 400
    if(outpost.energy > 400) outpostRange = 600

    //if inside outpost range, move out of it 
    if(distance(spirit.position, outpost.position) <= outpostRange){
        spirit.move(positionOnLine(outpost.position, spirit.position, outpostRange + 5))
        return
    }

    let line = [spirit.position, destination]  

    let angle = 0

    

    if(outpost.control != "Aecert" && outpost.energy != 0){

        while(distToSegment(outpost.position, line[0], line[1]) <= outpostRange + 5){
            
            let newPointClockwise = rotatePoint(line[0], line[1], angle)
            let newPointCounterClockwise = rotatePoint(line[0], line[1], -angle)

            

            if(distToSegment(outpost.position, spirit.position, newPointClockwise) > outpostRange){
                spirit.move(newPointClockwise)   
                //graphics.line(spirit.position,newPointClockwise)            
                return
            }
            if(distToSegment(outpost.position, spirit.position, newPointCounterClockwise) > outpostRange){
                spirit.move(newPointCounterClockwise)
                //graphics.line(spirit.position,newPointCounterClockwise)
                return
            }
            if(angle > 200){
                spirit.move(positionOnLine(outpost.position, spirit.position, outpostRange + 5))
            }

            angle += 0.1
        }
    }
}

function moveAvoidEnemies(spirit, destination){
    spirit.move(destination)

    let avoidanceRange = 260
    let closestEnemy = getClosestEnemy(spirit,spirit.sight.enemies)
    if(closestEnemy == null) return

    let closestEnemyDistance = distance(spirit.position, closestEnemy.position)
    

    //if inside enemy range, move out of it 
    if(closestEnemyDistance <= 200){
        spirit.move(positionOnLine(closestEnemy.position, spirit.position, avoidanceRange))
        return
    }

    let line = [spirit.position, destination]  

    let angle = 0

    while(distToSegment(closestEnemy.position, line[0], line[1]) <= avoidanceRange){
                    
        let newPointClockwise = rotatePoint(line[0], line[1], angle)
        let newPointCounterClockwise = rotatePoint(line[0], line[1], -angle)

        if(distToSegment(closestEnemy.position, spirit.position, newPointClockwise) > avoidanceRange){
            spirit.move(newPointClockwise)        
            //graphics.line(spirit.position,newPointClockwise)       
            return
        }
        if(distToSegment(closestEnemy.position, spirit.position, newPointCounterClockwise) > avoidanceRange){
            spirit.move(newPointCounterClockwise)
            //graphics.line(spirit.position,newPointCounterClockwise)
            return
        }
        if(angle > 360){
            spirit.move(positionOnLine(closestEnemy.position, spirit.position, avoidanceRange + 5))
            return
        }

        angle += 0.1
    }
}


//p1 is the rotation point, p2 is the end of the line, a is the rotation angle
function rotatePoint(p1, p2, angle){
    let old_x_point = p2[0]
    let old_y_point = p2[1]

    //p1 is the rotation point. it needs to be the origin. 
    old_x_point = old_x_point - p1[0]
    old_y_point = old_y_point - p1[1]

    let new_x_point = old_x_point * Math.cos(angle) - old_y_point * Math.sin(angle);
    let new_y_point = old_y_point * Math.cos(angle) + old_x_point * Math.sin(angle);

    //removes the offset 
    new_x_point = new_x_point + p1[0]
    new_y_point = new_y_point + p1[1]

    return [new_x_point,new_y_point]
}

function sqr(x) {
    return x * x;
}

function dist2(v, w) {
    return sqr(v[0] - w[0]) + sqr(v[1] - w[1]);
}

// p - point
// v - start point of segment
// w - end point of segment
function distToSegmentSquared(p, v, w) {
    var l2 = dist2(v, w);
    if (l2 === 0) return dist2(p, v);
    var t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])]);
}

// p - point
// v - start point of segment
// w - end point of segment
function distToSegment(p, v, w) {
    return Math.sqrt(distToSegmentSquared(p, v, w));
}

function getAISpirits(AI){

    var results = []
    for (let i = 0; i < 10; i++) {
        if(SquadAI[i] == AI){
            for(spirit of getSquadSpirits(String(i))){
                results.push(spirit)
            }
        }        
    }

    return results
}

function getMemorySpirits(memoryString){

    var result = []
    for (spirit of my_spirits) {
        if(memory[spirit.id] == memoryString)result.push(spirit)
    }  

    return result
}

function getFirstAttackingEnemy(spirit){
    for(enemy of getEnemiesInRange(spirit)){
        if(enemy.last_energized == spirit.id){
            return enemy
        }
    }
    return null
}

function getClosestAttackingEnemy(spirit) {

    var closestDistance = 999
    var closestAttackingEnemy = null

    for (enemy of getEnemiesInRange(spirit)) {
        if (enemy.last_energized == spirit.id && distance(enemy.position, spirit.position) < closestDistance) {
            closestDistance = distance(enemy.position, spirit.position)
            closestAttackingEnemy = enemy
        }
    }
    return closestAttackingEnemy
}



function getAllHealingAllies(spirit){

    var result = []

    for(ally of getAlliesInRange(spirit)){
        if(ally.last_energized == spirit.id) result.push(ally) 
    }
    return result
}

function isBeingHealed(spirit){
    for(ally of my_spirits){
        if(memory[ally.id + "heal target"] == spirit.id){
            return true
        }
    }
    return false
}

function canSurviveEnemiesInRange(spirit){
    var result = true
    var enemiesAttackingThisSpirit = []
    for(enemy of getEnemiesInRange(spirit, 200)){
        if(enemy.last_energized == spirit.id) enemiesAttackingThisSpirit.push(enemy)
    }

    if(enemiesAttackingThisSpirit.length == 0){
        result = true
    }

    else if(enemiesAttackingThisSpirit.length == 1){
        if(spirit.energy > enemiesAttackingThisSpirit[0].energy) result = true
        else result = false
    }

    else if(enemiesAttackingThisSpirit.length == 2){
        if(spirit.energy > enemiesAttackingThisSpirit[0].energy + enemiesAttackingThisSpirit[1].energy * 2) result = true
        else result = false
    }

    else{
        result = getTotalEnergy(enemiesAttackingThisSpirit) * 2 < spirit.energy
    }

    
    //console.log(spirit.id + ": Can Survive? - " + result)
    return result
}

function willDieToOutpost(spirit){
    if(outpost.sight.enemies.length == 0) return false
    if(outpost.energy == 0) return false

    var result = false
    var outpostDamage = 2
    if(outpost.energy >= 500)outpostDamage = 8
    var escapeDistance = distance(spirit.position, outpost.position)
    var minDamage = (escapeDistance/20) * 2 / outpost.sight.enemies.length


    if( minDamage > spirit.energy) return true

    console.log(spirit.id + " will die to outpost")

    return false
}

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function get1TickDamagePotentialGroup(spiritGroup){
    var result = 0
    for(spirit of spiritGroup){
        if(spirit.energy < spirit.size){
            result += spirit.energy * 2
        }
        else{
            result += spirit.size * 2
        }
    }

    return result
}

function get1TickDamagePotentialSingle(spirit){
    var result = 0

    if(spirit.energy < spirit.size){
        result += spirit.energy * 2
    }
    else{
        result += spirit.size * 2
    }

    return result
}

function getSquadSpirits(m){
    var results = []
    for(spirit of my_spirits){
        if(spirit.mark == m && spirit.hp > 0) results.push(spirit)
    }
    return results
}

function getSpiritAI(spirit){
    for(let i = 0; i < 10; i++){
        if(getAISpirits(SquadAI[i]).includes(spirit))return SquadAI[i]
    }
}

//position([x,y]), number (0-9), color(string), scale(float)
function drawNumberAtPosition(p, n, c, s){

    graphics.style = c;
    
    let x = parseFloat(p[0])
    let y = parseFloat(p[1])
    let segments = [false, false, false, false, false, false, false]

    if(n == 0){
        segments = [true, true, true, false, true, true, true]
    }
    if(n == 1){
        segments = [false, false, true, false, false, true, false]
    }
    if(n == 2){
        segments = [true, false, true, true, true, false, true]
    }
    if(n == 3){
        segments = [true, false, true, true, false, true, true]
    }
    if(n == 4){
        segments = [false, true, true, true, false, true, false]
    }
    if(n == 5){
        segments = [true, true, false, true, false, true, true]
    }
    if(n == 6){
        segments = [true, true, false, true, true, true, true]
    }
    if(n == 7){
        segments = [true, false, true, false, false, true, false]
    }
    if(n == 8){
        segments = [true, true, true, true, true, true, true]
    }
    if(n == 9){
        segments = [true, true, true, true, false, true, true]
    }

    if(segments[0])graphics.line([x-5*s,y-10*s],[x+5*s,y-10*s])    //0 - top
    if(segments[1])graphics.line([x-5*s,y-10*s],[x-5*s,y])         //1 - top left
    if(segments[2])graphics.line([x+5*s,y-10*s],[x+5*s,y])         //2 - top right
    if(segments[3])graphics.line([x-5*s,y],[x+5*s,y])              //3 - middle
    if(segments[4])graphics.line([x-5*s,y+10*s],[x-5*s,y])         //4 - bottom left
    if(segments[5])graphics.line([x+5*s,y+10*s],[x+5*s,y])         //5 - bottom right
    if(segments[6])graphics.line([x-5*s,y+10*s],[x+5*s,y+10*s])    //6 - bottom
}

