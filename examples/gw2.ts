import { $GET, PAPIBuilder } from '../lib/index.js';
import { invariant } from './utility.js';

const itemResp = {
  id: 0,
  chat_link: '',
  name: '',
  icon: '',
  description: '',
  type: '',
  rarity: '',
  level: 0,
  vendor_value: 0,
  default_skin: 0,
  flags: [''],
  game_types: [''],
  restrictions: [''],
  upgrades_into: [{ upgrade: '', item_id: 0 }],
  upgrades_from: [{ upgrade: '', item_id: 0 }],
  details: {},
};
const mountSkinResp = { id: '', name: '', icon: '', mount: '', dye_slots: [{ color_id: 0, material: '' }] };
const mountTypeResp = { id: '', name: '', default_skin: 0, skins: [0], skills: [{ id: 0, slot: '' }] };

const papi = new PAPIBuilder('https://api.guildwars2.com/v2')
  .path('items', items =>
    items
      .endpoint($GET, [0])
      .query({ lang: '', ids: [0] }, path => path.endpoint($GET, [itemResp]).error({ text: '' }))
      .slug(slug => slug.endpoint($GET, itemResp).error({ text: '' }).query({ lang: '' }))
  )
  .path('mounts', mounts =>
    mounts
      .endpoint($GET, [''])
      .path('skins', skins =>
        skins
          .endpoint($GET, [0])
          .query({ lang: '', page: 0, page_size: 0, ids: [0] }, path => path.endpoint($GET, [mountSkinResp]))
          .slug(slug => slug.endpoint($GET, mountSkinResp))
      )
      .path('types', types =>
        types
          .endpoint($GET, [0])
          .query({ lang: '', page: 0, page_size: 0, ids: [0] }, path => path.endpoint($GET, [mountTypeResp]))
          .slug(slug => slug.endpoint($GET, mountTypeResp))
      )
  );

const papiTool = papi.build();
const someItems = await papiTool.items[$GET]();
let randItemID = someItems[(Math.random() * someItems.length) | 0];
const someItem = await papiTool.items[randItemID][$GET]();
invariant('name' in someItem);
console.log('some item: %o', someItem);
