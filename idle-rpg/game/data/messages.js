const messages = {
  /**
   * $$ -> map name
   * ## -> selectedPlayer name
   * @@ -> selectedPlayer gender him
   * ^^ -> selectedPlayer gender his
   * && -> seletecdPlayer gender he
   * %% -> item name
   * !! -> victimPlayer name
   * 
   * Specific events:
   *    gamble:
   *      $& = luckGambleGold
   * TODO: Need moar messages!
   */
  event: {
    camp: [{
      eventMsg: '[\`$$\`] ## has set up camp and began resting.',
      eventLog: 'Set up camp to rest'
    },
    {
      eventMsg: '[\`$$\`] ## began resting safely inside an abandoned hut.',
      eventLog: 'Rested inside an abandoned hut'
    },
    {
      eventMsg: '[\`$$\`] ## decided to take a break and hunt for some food.',
      eventLog: 'Hunt for food around $$'
    },
    {
      eventMsg: '[\`$$\`] ## went foraging for ingredients to make medicine for ^^ wounds.',
      eventLog: 'Foraged for ingredients to make medicine for your wounds'
    },
    {
      eventMsg: '[\`$$\`] ## has decided to rest his head on a rock for a while.',
      eventLog: 'Rested your head on a rock'
    },
    {
      eventMsg: '[\`$$\`] ## just noticed its time for second breakfast and a break.',
      eventLog: 'Noticed it was time for second breakfast and a break'
    },
    {
      eventMsg: '[\`$$\`] ## stumbled upon ancient ruins near $$ and rested in their shadow.',
      eventLog: 'Rested in the shadow of ancient ruins near $$'
    },
    {
      eventMsg: '[\`$$\`] ## sat by a stream in $$ and listened to the water while catching ^^ breath.',
      eventLog: 'Sat by a stream in $$ to rest'
    },
    {
      eventMsg: '[\`$$\`] ## found a quiet clearing in $$ and spent time sharpening ^^ weapons.',
      eventLog: 'Sharpened your weapons in a quiet clearing in $$'
    },
    {
      eventMsg: '[\`$$\`] ## was startled by rustling in the bushes near $$, but relaxed once it passed.',
      eventLog: 'Was startled by rustling near $$ but it was nothing'
    },
    {
      eventMsg: '[\`$$\`] ## spent the rest period in $$ watching the clouds and gathering ^^ thoughts.',
      eventLog: 'Watched the clouds drift over $$ while resting'
    },
    {
      eventMsg: '[\`$$\`] ## patched up ^^ worn armor with scraps found near $$.',
      eventLog: 'Patched up your armor with scraps found near $$'
    },
    {
      eventMsg: '[\`$$\`] ## lit a small fire near $$ and cooked a simple meal from foraged scraps.',
      eventLog: 'Cooked a simple meal over a small fire near $$'
    },
    {
      eventMsg: '[\`$$\`] ## sat on a mossy log in $$ and polished ^^ equipment until it gleamed.',
      eventLog: 'Polished your equipment on a mossy log in $$'
    },
    {
      eventMsg: '[\`$$\`] ## meditated under a twisted tree near $$ to clear ^^ mind.',
      eventLog: 'Meditated under a twisted tree near $$'
    },
    {
      eventMsg: '[\`$$\`] ## took shelter under an overhang near $$ as the wind picked up overhead.',
      eventLog: 'Sheltered under an overhang near $$ from the wind'
    },
    {
      eventMsg: '[\`$$\`] ## rested against a warm stone in $$ and dozed off briefly.',
      eventLog: 'Dozed off briefly against a warm stone in $$'
    },
    {
      eventMsg: '[\`$$\`] ## traded a nod with a passing traveller near $$ before both went their separate ways.',
      eventLog: 'Exchanged a nod with a passing traveller near $$'
    },
    {
      eventMsg: '[\`$$\`] ## watched a hawk circle overhead near $$ while stretching out tired limbs.',
      eventLog: 'Watched a hawk circle overhead near $$ while resting'
    },
    {
      eventMsg: '[\`$$\`] ## dug a shallow fire pit near $$, warmed up, then covered the tracks carefully.',
      eventLog: 'Warmed up by a fire pit near $$ before moving on'
    }
    ],

    gamble: {
      win: [{
        eventMsg: `[\`$$\`] ## decided to try ^^ luck in a tavern.
    Fortunately, && won $& gold!`,
        eventLog: 'Congrats! You won $& gold by gambling in a tavern.'
      }],

      lose: [{
        eventMsg: `[\`$$\`] ## decided to try ^^ luck in a tavern.
    Unfortunately, && lost $& gold!`,
        eventLog: 'Oh dear! You lost $& gold by gambling in a tavern.'
      }]
    },

    item: [{
      eventMsg: '[\`$$\`] ## found a chest containing \`%%\`!',
      eventLog: 'Found a chest containing %% in $$'
    },
    {
      eventMsg: '[\`$$\`] ## found \`%%\` on the ground!',
      eventLog: 'Found %% on the ground in $$'
    },
    {
      eventMsg: '[\`$$\`] ## explored an abandoned hut which had \`%%\` inside!',
      eventLog: 'Explored an abandoned hut in $$ which had %% inside'
    },
    {
      eventMsg: '[\`$$\`] ## a bird just dropped \`%%\` infront of @@!',
      eventLog: 'A bird just dropped %% infront of you in $$'
    },
    {
      eventMsg: '[\`$$\`] ## stumbles upon a grizzly scene. One of the corpses has \`%%\` next to it! Seems like it is in good enough condition to use.',
      eventLog: 'You found %% on a corpse in $$'
    },
    {
      eventMsg: '[\`$$\`] ## found an altar. \`%%\` is sitting on the center, ready to be used!',
      eventLog: 'On an altar in $$ you found %%'
    },
    {
      eventMsg: '[\`$$\`] ## catches a glint out of the corner of ^^ eye. Brushing aside some leaves ## finds \`%%\` left here by the last person to camp at this spot.',
      eventLog: 'Near your camp in $$ there was %%'
    },
    {
      eventMsg: '[\`$$\`] ## notices something reflecting inside a nearby cave. Exploring it further && find \`%%\` resting against a wall.',
      eventLog: 'While exploring a cave in $$ you found %%'
    },
    {
      eventMsg: '[\`$$\`] ## finds a grave with \`%%\` sitting on it. The dead do not need equipment so it\'s yours for the taking',
      eventLog: 'You stole %% from a grave in $$'
    },
    {
      eventMsg: '[\`$$\`] ## looks around a derlict building and finds \`%%\` in one of the corners.',
      eventLog: 'Found %% while looking around a derlict building in $$'
    }]
  }
};
module.exports = messages;