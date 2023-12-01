import assert from 'node:assert';
import { describe, it } from 'node:test';
import { $GET, PAPIBuilder } from '../dist/index.js';

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

const gw2Test = new PAPIBuilder('https://api.guildwars2.com/v2')
  .path('items', items =>
    items
      .endpoint($GET, [0])
      .query({ lang: '', ids: [0] }, path => path.endpoint($GET, [itemResp]).error({ text: '' }))
      .slug(slug => slug.endpoint($GET, itemResp).error({ text: '' }).query({ lang: '' }))
  )
  // .path('mounts', mounts =>
  //   mounts
  //     .endpoint($GET, [''])
  //     .path('skins', skins =>
  //       skins
  //         .endpoint($GET, [0])
  //         .query({ lang: '', page: 0, page_size: 0, ids: [0] }, path => path.endpoint($GET, [mountSkinResp]))
  //         .slug(slug => slug.endpoint($GET, mountSkinResp))
  //     )
  //     .path('types', types =>
  //       types
  //         .endpoint($GET, [0])
  //         .query({ lang: '', page: 0, page_size: 0, ids: [0] }, path => path.endpoint($GET, [mountTypeResp]))
  //         .slug(slug => slug.endpoint($GET, mountTypeResp))
  //     )
  // )
  .build();

describe('initial checks', () => {
  it('works for simple URL, slug URL, query URL?', async () => {
    const itemIDs = await gw2Test.items[$GET]();
    assert.equal(Array.isArray(itemIDs), true, 'Did not return an array');
    assert.equal(
      itemIDs.every(val => typeof val === 'number'),
      true,
      'Array was not all numbers'
    );
    const [id] = itemIDs;
    const item = await gw2Test.items[id][$GET]();
    assert.notEqual('text' in item, true, 'API sent error response');
    if ('text' in item) throw new Error();
    assert.equal(typeof item.name, 'string', 'Returned item did not have a name string');
    const itemArr = await gw2Test.items[$GET]({ query: { ids: [id] } });
    assert.equal(typeof itemArr[0].name, 'string', 'Returned items did not have a name string in the first entry');
  });
});
