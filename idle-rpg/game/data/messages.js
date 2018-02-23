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
      eventMsg: '[\`$$\`] ## has decided to rest his head on this rock for a while.',
      eventLog: 'Rested your head on a rock'
    },
    {
      eventMsg: '[\`$$\`] ## just noticed its time for second breakfast and a break.',
      eventLog: 'Noticed it was time for second breakfast and a break'
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