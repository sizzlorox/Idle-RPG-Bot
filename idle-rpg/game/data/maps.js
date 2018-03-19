const type = {
  land: {
    id: 0,
    name: 'Land'
  },

  town: {
    id: 2,
    name: 'Town'
  },
};

const biome = {
  // TODO: REMOVE WHEN BIOMES COMPLETE
  land: {
    id: 0,
    name: 'Land'
  },

  tundra: {
    id: 1,
    name: 'Tundra'
  },

  forest: {
    id: 3,
    name: 'Forest'
  },

  plains: {
    id: 4,
    name: 'Plains'
  },

  beach: {
    id: 5,
    name: 'Beach'
  },

  barrows: {
    id: 6,
    name: 'Barrows'
  },

  mountain: {
    id: 7,
    name: 'Mountains'
  },

  swamp: {
    id: 8,
    name: 'Swamp'
  },

  desert: {
    id: 9,
    name: 'Desert'
  },

  cave: {
    id: 10,
    name: 'Caves'
  },

  barren: {
    id: 11,
    name: 'Barren'
  },

  plateau: {
    id: 13,
    name: 'Plateau'
  }
};

const maps = [
  {
    id: 0,
    coords: [0, 0],
    image: '',
    name: 'The Isle Of Puckarmpit',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'A few islands near Neataman Lake.'
  },

  {
    id: 1,
    coords: [1, 0],
    image: '',
    name: 'Beach of Flames',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: ''
  },

  {
    id: 2,
    coords: [2, 0],
    image: '',
    name: 'Silent Rain City',
    type: type.town,
    biome: biome.land,
    levelReq: 1,
    lore: 'A large sized city, holding 75,000 villagers, holding a first line of defence with thousands of mages and knights. The rain comes everyday in a dark luster which overruns the streets with vibrant specks of water.'
  },

  {
    id: 3,
    coords: [3, 0],
    image: '',
    name: 'Uglyoch Temple',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'Once inhabitted by the monks of the local religion it has fallen into disrepair. Plants grow through the stonework, and sections have collapsed of what was once a sprawling complex. Now monsters roam the dark forgotten halls.'
  },

  {
    id: 4,
    coords: [4, 0],
    image: '',
    name: 'Axeter',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'The tough lumberjacks make this timblerland their home. It seems no matter how many logs they send down the fast moving river there is still many more to cut. The lumber here is said to be some of the best in the land.'
  },

  {
    id: 5,
    coords: [5, 0],
    image: '',
    name: 'Aldbarrow',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'Quiet and sleepy. Never at threat of invasion as there is nothing worth invading. What few people who do live here are subsistence farmers or else wizarding types. It is said the school of wizardry for the continent is somewhere in the hills but any attempt to give directions to it seems to result in a radically different path each time.'
  },

  {
    id: 6,
    coords: [1, 1],
    image: 'https://cdn.discordapp.com/attachments/418132578030190594/418132614931808256/unknown.png',
    name: 'Opemdek Peak',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'A white, snowy mountain covered with evergreens. Paths running through the hills are known to be very vulnerable to bandit attacks...'
  },

  {
    id: 7,
    coords: [1, 1],
    image: '',
    name: 'Appleview',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'The people residing in Appleview having been farming since before written record. It is said that their fruit and vegetables can cure illness and exorcise demons. Very secret of their techniques but rather friendly in other contexts.'
  },

  {
    id: 8,
    coords: [2, 1],
    image: '',
    name: 'Sludgefold',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'Mud. Muck. Sticky dirt that requires wading through. No one wants to be there, not even the monsters that go there to feed.'
  },

  {
    id: 9,
    coords: [3, 1],
    image: '',
    name: 'Witchlyn',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'No matter what warnings are given there are always those who find themselves attracted to this closely packed dark forest. Trees do not look healthy but grow dense enough to obscure much of the light. The forest round is home to a number creatures that hate the light. Many stories use this as a location of evil.'
  },

  {
    id: 10,
    coords: [4, 1],
    image: '',
    name: 'Polcester',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: ''
  },

  {
    id: 11,
    coords: [5, 1],
    image: '',
    name: 'Pantbryde Plains',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: ''
  },

  {
    id: 12,
    coords: [0, 2],
    image: '',
    name: 'Macingdon',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: ''
  },

  {
    id: 13,
    coords: [1, 2],
    image: '',
    name: 'Rosepond',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'A beautiful blue lake surrounded by high weeds. The depth is said to be unknowable, only becoming darker closer to the center. Nothing lost in Rosepond is ever recovered. The name comes from the crop of choice in the area a unique blue rose rumored to bring health when prepared right.'
  },

  {
    id: 14,
    coords: [2, 2],
    image: '',
    name: 'Wintermere',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'A tall set of snow tipped peaks, many paths have been chiseled out of the rock by unknown ancient people.'
  },

  {
    id: 15,
    coords: [3, 2],
    image: '',
    name: 'North Rendmount',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'High peeks covered in snow the majority of the year. The altitude deters most people, and the remoteness most others. Rumored to be filled with yetis and other fierce creatures.'
  },

  {
    id: 16,
    coords: [4, 2],
    image: '',
    name: 'Modesarder Caves',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: ''
  },

  {
    id: 17,
    coords: [5, 2],
    image: '',
    name: 'Holmsham',
    type: type.town,
    biome: biome.land,
    levelReq: 1,
    lore: ''
  },

  {
    id: 18,
    coords: [0, 3],
    image: '',
    name: 'Port Grimonas',
    type: type.town,
    biome: biome.land,
    levelReq: 1,
    lore: 'A larger city, though not the largest of the continent. Stone buildings, and an extensive dock system characterize this city. Never are you far from a place to drink away troubles and gamble away money.'
  },

  {
    id: 19,
    coords: [1, 3],
    image: '',
    name: 'Damascus Fields',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'So much blood has been shed on the Damascus Fields that the plants growing in it have become red. The battlegrounds of the Kingdom of Olohaseth it is where the soldiers fight and protect the kingdoms inhabitants. Scoured by treasure hunters in search of unfound weapons, armor, and other artifacts which could command a high price inside the city. It has been said that a profitable iron mine could be made with the discarded chunks of debris alone.'
  },

  {
    id: 20,
    coords: [2, 3],
    image: '',
    name: 'Norpond',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'A nearly peramently frozen lake located high up on a plateau. Once a year it defrosts allowing the creatures that reside bellow the ice to begin their mating season. These fish are a local delicacy and sell for quite a pretty penny.'
  },

  {
    id: 21,
    coords: [3, 3],
    image: '',
    name: 'Espion Peak',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'Renowned to be one of the highest peaks in the world. Many young warriors train here by climbing up its steps in perserverance.'
  },

  {
    id: 22,
    coords: [4, 3],
    image: '',
    name: 'Deerhaven',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'Not a dreadful place to be lost in. The basis for many local tales of fairies, and other little folk. Catching a meal is easy with the abundant wildlife.'
  },

  {
    id: 23,
    coords: [5, 3],
    image: '',
    name: 'Topscros Path',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: ''
  },

  {
    id: 24,
    coords: [0, 4],
    image: '',
    name: 'Llynenham Cove',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: ''
  },

  {
    id: 25,
    coords: [1, 4],
    image: '',
    name: 'Kingdom Of Olohaseth',
    type: type.town,
    biome: biome.land,
    levelReq: 1,
    lore: 'There have been good kings and evil kings. They are just men temporary. The Kingdom of Olohaseth seems to be eternal. No successful invasion has ever taken place and the high walls around the land keep the residents safe. Roads stretch from it, and if you can find it somewhere in the continent it is likely bought and sold inside the kingdom walls.'
  },

  {
    id: 26,
    coords: [2, 4],
    image: '',
    name: 'Neataman Lake',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'It\'s rumored that a mighty kraken resides in the lake. Adventurers travel from all over to visit the lake.'
  },

  {
    id: 27,
    coords: [3, 4],
    image: '',
    name: 'Skullsampton',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'Named for the large amount of bones to be found in the dense forest. The powerful creatures hidden in the mists are the cause of the death. No full maps exist of the forest and some say such a task is impossible due to a constantly shifting nature.'
  },

  {
    id: 28,
    coords: [4, 4],
    image: '',
    name: 'Nastihenge Moors',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'Dry and deserted. It is hard to survive in is just a few inches of rain a year above a desert. Occasionally the bones of great beasts that seem like odd forms of dragons will be unearthed in these loose soils.'
  },

  {
    id: 29,
    coords: [5, 4],
    image: '',
    name: 'Wanaton Desert',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: ''
  },

  {
    id: 30,
    coords: [0, 5],
    image: '',
    name: 'Cliff of Birds',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: ''
  },

  {
    id: 31,
    coords: [1, 5],
    image: '',
    name: 'Auchterkeld',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: ''
  },

  {
    id: 32,
    coords: [2, 5],
    image: '',
    name: 'Hellserscrutch Hill',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'A medium sized hill topped with trees. The howls that emanate from this place at night keep all but the brave away.'
  },

  {
    id: 33,
    coords: [3, 5],
    image: '',
    name: 'Kindale',
    type: type.town,
    biome: biome.land,
    levelReq: 1,
    lore: 'A quiet farming town that was once more populous before the troubles begin nearby. The people are generally friendly unless provoked but wary of strangers.'
  },

  {
    id: 34,
    coords: [4, 5],
    image: '',
    name: 'Woldingfords Barrow',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: 'Named after an old farm that used to stand on the field. Flat and featureless except for tall grass on both sides of the one road that runs through. The rustling of it could just be the wind or could be the elves sneaking up for a kill.'
  },

  {
    id: 35,
    coords: [5, 5],
    image: '',
    name: 'Kinwardine Desert',
    type: type.land,
    biome: biome.land,
    levelReq: 1,
    lore: ''
  }
];
module.exports = maps;
