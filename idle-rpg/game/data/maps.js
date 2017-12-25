const type = {
  land: {
    id: 0,
    name: 'Land'
  },
  snow: {
    id: 1,
    name: 'Snow'
  },
  town: {
    id: 2,
    name: 'Town'
  }
};

const maps = [
  {
    id: 0,
    name: 'The Isle Of Puckarmpit',
    type: type.land,
    levelReq: 1,
    lore: 'A few islands near Neataman Lake.'
  },
  {
    id: 1,
    name: 'Neataman Lake',
    type: type.land,
    levelReq: 1,
    lore: 'A small lake that sits just west of Hellserscrutch Hill. It\'s rumored that a mighty kraken resides in the lake. Adventurers travel from all over to visit the lake.'
  },
  {
    id: 2,
    name: 'Hellserscrutch Hill',
    type: type.land,
    levelReq: 1,
    lore: 'A medium sized hill topped with trees. Paths run over it to Neataman Lake and Woldingford Barrow. The howls that emanate from this place at night keep all but the brave away.'
  },
  {
    id: 3,
    name: 'Woldingfords Barrow',
    type: type.land,
    levelReq: 1,
    lore: 'Named after an old farm that used to stand on the field. Flat and featureless except for tall grass on both sides of the one road that runs through. The rustling of it could just be the wind or could be the elves sneaking up for a kill. On the outskirts of Kindale and over looked by Hellserscrutch Hill.'
  },
  {
    id: 4,
    name: 'Kindale',
    type: type.town,
    levelReq: 1,
    lore: 'A quiet farming town that was once more populous before the troubles begin nearby. The people are generally friendly unless provoked but wary of strangers. On the outskirts of the town are the fields of Woldingfords Barrow and the ruins of Uglyoch Temple.'
  },
  {
    id: 5,
    name: 'Uglyoch Temple',
    type: type.land,
    levelReq: 1,
    lore: 'Once inhabitted by the monks of the local religion it has fallen into disrepair. Plants grow through the stonework, and sections have collapsed of what was once a sprawling complex. Now monsters roam the dark forgotten halls. On the outskirts of Kindale and beyond it lies Sludgefold.'
  },
  {
    id: 6,
    name: 'Sludgefold',
    type: type.land,
    levelReq: 1,
    lore: 'Mud. Muck. Sticky dirt that requires wading through. No one wants to be there, not even the monsters that go there to feed. By the old Uglyoch Temple and on the far side surrounded by North Rendmount.'
  },
  {
    id: 7,
    name: 'North Rendmount',
    type: type.snow,
    levelReq: 1,
    lore: 'High peeks covered in snow the majority of the year. The altitude deters most people, and the remoteness most others. Rumored to be filled with yetis and other fierce creatures. On one side is the mucks of Sludgeford and the deadly region of Skullsampton'
  },
  {
    id: 8,
    name: 'Skullsampton',
    type: type.land,
    levelReq: 1,
    lore: 'Named for the large amount of bones to be found in the dense forest. The powerful creatures hidden in the mists are the cause of the death. No full maps exist of the forest and some say such a task is impossible due to a constantly shifting nature. Bordered on one side by the mountains of North Rendmount and by the lumber camps of Axeter on the other.'
  },
  {
    id: 9,
    name: 'Axeter',
    type: type.land,
    levelReq: 1,
    lore: 'The tough lumberjacks make this timblerland their home. It seems no matter how many logs they send down the fast moving river there is still many more to cut. The lumber here is said to be some of the best in the land. Going too far will take you into Skullsampton and the otherside is ringed by Wintermere.'
  },
  {
    id: 10,
    name: 'Wintermere',
    type: type.snow,
    levelReq: 1,
    lore: 'A tall set of snow tipped peaks, many paths have been chiseled out of the rock by unknown ancient people. Descends into Axeter on one side and the Nastihenge Moors on the other.'
  },
  {
    id: 11,
    name: 'Nastihenge Moors',
    type: type.land,
    levelReq: 1,
    lore: 'Dry and deserted. It is hard to survive in is just a few inches of rain a year above a desert. Occasionally the bones of great beasts that seem like odd forms of dragons will be unearthed in these loose soils. On one side the peaks of Wintermere rise, and on the edge is the city of Port Grimonas.'
  },
  {
    id: 12,
    name: 'Port Grimonas',
    type: type.town,
    levelReq: 1,
    lore: 'A larger city, though not the largest of the continent. Stone buildings, and an extensive dock system characterize this city. Never are you far from a place to drink away troubles and gamble away money. To the west you find the Nastihenge Moors and to north the trees of Deerhaven.'
  },
  {
    id: 13,
    name: 'Deerhaven',
    type: type.land,
    levelReq: 1,
    lore: 'Not a dreadful place to be lost in. The basis for many local tales of fairies, and other little folk. Catching a meal is easy with the abundant wildlife. To the South lies the City of Port Grimonas and further North the moutains of Norpond.'
  },
  {
    id: 14,
    name: 'Norpond',
    type: type.snow,
    levelReq: 1,
    lore: 'A nearly peramently frozen lake located high up on a plateau. Once a year it defrosts allowing the creatures that reside bellow the ice to begin their mating season. These fish are a local delicacy and sell for quite a pretty penny. Looking over the south edge of the plateau allows you to see the woods of Deerhaven and to the northeast the vast orchards of Appleview.'
  },
  {
    id: 15,
    name: 'Appleview',
    type: type.land,
    levelReq: 1,
    lore: 'The people residing in Appleview having been farming since before written record. It is said that their fruit and vegetables can cure illness and exorcise demons. Very secret of their techniques but rather friendly in other contexts. The plateau of Norpond can be seen to the southwest and east are the rolling hills of Aldbarrow.'
  },
  {
    id: 16,
    name: 'Aldbarrow',
    type: type.land,
    levelReq: 1,
    lore: 'Quiet and sleepy. Never at threat of invasion as there is nothing worth invading. What few people who do live here are subsistence farmers or else wizarding types. It is said the school of wizardry for the continent is somewhere in the hills but any attempt to give directions to it seems to result in a radically different path each time. West of are the trees of Appleview and further east is the large body of water known as Rosepond.'
  },
  {
    id: 17,
    name: 'Rosepond',
    type: type.land,
    levelReq: 1,
    lore: 'A beautiful blue lake surrounded by high weeds. The depth is said to be unknowable, only becoming darker closer to the center. Nothing lost in Rosepond is ever recovered. The name comes from the crop of choice in the area a unique blue rose rumored to bring health when prepared right. One one side of the lake are the hills of Aldbarrow and the other the gnarled woods of Witchlyn.'
  },
  {
    id: 18,
    name: 'Witchlyn',
    type: type.land,
    levelReq: 1,
    lore: 'No matter what warnings are given there are always those who find themselves attracted to this closely packed dark forest. Trees do not look healthy but grow dense enough to obscure much of the light. The forest floor is home to a number creatures that hate the light. Many stories use this as a location of evil. Grows to the lake of Rosepond on one side and the walls of the Kingdom of Olohaseth.'
  },
  {
    id: 19,
    name: 'Kingdom Of Olohaseth',
    type: type.town,
    levelReq: 1,
    lore: 'There have been good kings and evil kings. They are just men temporary. The Kingdom of Olohaseth seems to be eternal. No successful invasion has ever taken place and the high walls around the land keep the residents safe. Roads stretch from it, and if you can find it somewhere in the continent it is likely bought and sold inside the kingdom walls. On one side are the woods of Witchlyn, the others are the Damascus Fields.'
  },
  {
    id: 20,
    name: 'Damascus Fields',
    type: type.land,
    levelReq: 1,
    lore: 'So much blood has been shed on the Damascus Fields that the plants growing in it have become red. The battlegrounds of the Kingdom of Olohaseth it is where the soldiers fight and protect the kingdoms inhabitants. Scoured by treasure hunters in search of unfound weapons, armor, and other artifacts which could command a high price inside the city. It has been said that a profitable iron mine could be made with the discarded chunks of debris alone. These fields surround the Kingdom of Olohaseth as far as the eye can see only to run into the ocean that surround the island.'
  },
];
module.exports = maps;
