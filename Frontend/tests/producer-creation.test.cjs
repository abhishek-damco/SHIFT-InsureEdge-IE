const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

// Exercise actual component callbacks with isolated hooks and mocked network calls.
// No HTTP requests, database writes, browser globals or added dependencies are needed.
function setup(overrides = {}) {
  const requests = [];
  let nextReservedId = 1;
  const api = {
    users: { create: async () => ({ id: 4 }) },
    producers: {
      listByIntermediary: async () => [],
      reserveId: async () => { const id = nextReservedId++; return { producer_code: 'PR' + String(id).padStart(8, '0'), producer_draft_token: 'reserved-' + id }; },
      create: async payload => { requests.push(payload); const id = payload.producer_draft_token ? Number(payload.producer_draft_token.split('-')[1]) : 501; return { id, producer_code: payload.producer_draft_token ? 'PR' + String(id).padStart(8, '0') : 'PR00000501' }; },
      ...overrides.producers,
    },
    producerAddress: { create: async () => ({}), ...overrides.producerAddress },
    producerNrStates: { create: async () => ({}), ...overrides.producerNrStates },
    commonMaster: { list: async () => [] },
  };
  const frames = new Map();
  let current;
  const react = { ...React,
    useState(initial) {
      const frame = current, index = frame.cursor++;
      if (!(index in frame.state)) frame.state[index] = typeof initial === 'function' ? initial() : initial;
      return [frame.state[index], next => { frame.state[index] = typeof next === 'function' ? next(frame.state[index]) : next; }];
    },
    useRef(initial) {
      const frame = current, index = frame.cursor++;
      if (!(index in frame.state)) frame.state[index] = { current: initial };
      return frame.state[index];
    },
    useEffect(effect) { current.effects.push(effect); },
  };
  const cache = new Map();
  let sessionReads = 0;
  function load(file) {
    const filename = path.resolve(__dirname, '../src/pages/DistributionManagement', file);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const source = fs.readFileSync(filename, 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
    const localRequire = name => {
      if (name === 'react') return react;
      if (name.endsWith('.css')) return {};
      if (name.endsWith('/distribution')) return { distributionApi: api };
      if (name.endsWith('/passwordReset')) return { passwordResetApi: {} };
      if (/BulkUploadModal|SearchableSelect|IntermediaryTypeSelect/.test(name)) return { __esModule: true, default: () => null };
      if (name.startsWith('.')) {
        const base = path.resolve(path.dirname(filename), name);
        const target = ['.tsx', '.ts'].map(ext => base + ext).find(fs.existsSync);
        if (!target) throw new Error('Unknown local import: ' + name);
        return load(target);
      }
      return require(name);
    };
    vm.runInNewContext('(function(require,module,exports){' + compiled + '\n})', {
      console, URL, setTimeout: () => 0,
      sessionStorage: { getItem() { sessionReads++; return JSON.stringify([{ id: 'old', form: {} }]); } },
    }, { filename })(localRequire, module, module.exports);
    return module.exports;
  }
  function render(component, props = {}) {
    let frame = frames.get(component);
    if (!frame) { frame = { state: [], cursor: 0, effects: [] }; frames.set(component, frame); }
    current = frame; frame.cursor = 0; frame.effects = [];
    return component(props);
  }
  function effects(component) { for (const effect of frames.get(component).effects) effect(); }
  const creation = load('AddProducersPage.tsx');
  return { api, requests, creation, load, render, effects, sessionReads: () => sessionReads };
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join('');
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  return tree?.props ? text(tree.props.children) : '';
}
function card(tree) { return nodes(tree).find(node => node.props?.onValidateSave); }
function button(tree, label) { return nodes(tree).find(node => node.type === 'button' && text(node).trim() === label); }
const valid = { firstName: 'Test', middleName: '', lastName: 'Producer', suffix: '', country: 'United States', residentState: 'Alabama',
  status: true, licReq: 'Combined', combinedLicense: '0123456789', plLicense: '', clLicense: '',
  phoneCC: '1', phone: '(555) 555-5555', ext: '12', altPhone: '', altExt: '', email: 'test@example.invalid', profilePic: null, nrRows: [] };

function cards(tree) { return nodes(tree).filter(node => node.props?.onValidateSave); }
async function startPage(env, props) {
  env.render(env.creation.default, props); env.effects(env.creation.default);
  await new Promise(resolve => setImmediate(resolve));
  return env.render(env.creation.default, props);
}

test('Full-page navigation retains drafts when returning through Back and Add Producers', async () => {
  const env = setup(), View = env.load('ViewIntermediaryPage.tsx').default;
  const props = { record: { id: 77, name: 'Intermediary', status: 'Active' }, onBack() {} };
  let tree = env.render(View, props);
  button(tree, 'Producers').props.onClick(); tree = env.render(View, props);
  let tab = nodes(tree).find(node => node.type?.name === 'ProducersTab');
  button(env.render(tab.type, tab.props), '+ Add Producers').props.onClick();
  tree = env.render(View, props);
  let page = nodes(tree).find(node => node.type === env.creation.default);
  assert.equal(page.props.intermediaryId, 77);
  let fullPage = await startPage(env, page.props);
  assert.ok(nodes(fullPage).some(node => node.type === 'main' && node.props.className.includes('pc-page')));
  assert.ok(!nodes(fullPage).some(node => /modal|overlay/.test(node.props?.className || '')));
  let first = card(fullPage); first.props.onUpdate(first.props.producer.id, { firstName: 'Keep my draft' });
  button(fullPage, 'Back').props.onClick(); tree = env.render(View, props);
  assert.ok(button(tree, 'Producers').props.className.includes('vi-tab--active'));
  assert.ok(nodes(tree).some(node => node.type === env.creation.default), 'Creation component stays mounted');
  tab = nodes(tree).find(node => node.type?.name === 'ProducersTab');
  button(env.render(tab.type, tab.props), '+ Add Producers').props.onClick(); tree = env.render(View, props);
  page = nodes(tree).find(node => node.type === env.creation.default);
  fullPage = await startPage(env, page.props);
  assert.equal(cards(fullPage).length, 2);
  assert.equal(card(fullPage).props.producer.form.firstName, 'Keep my draft');
});

test('Standalone creation ignores wizard drafts and obtains a PR-prefixed eight-digit ID before Save', async () => {
  const env = setup(), Page = env.creation.default;
  const tree = await startPage(env, { intermediaryId: 77, onBack() {} });
  assert.equal(env.sessionReads(), 0);
  const producer = card(tree);
  assert.equal(producer.props.producer.saved, false);
  assert.equal(producer.props.producer.dbId, undefined);
  assert.equal(producer.props.producer.producerCode, 'PR00000001');
  const details = env.render(producer.type, producer.props);
  const content = text(details);
  for (const label of ['Producer Primary Information', 'PR00000001', 'Contact Details', 'Office Address', 'No Data Available', 'Save']) assert.ok(content.includes(label), label);
});

test('Three appended drafts retain independent data, IDs, validation and collapse state', async () => {
  const env = setup(), Page = env.creation.default, props = { intermediaryId: 77, onBack() {} };
  let tree = await startPage(env, props), first = card(tree);
  first.props.onUpdate(first.props.producer.id, { ...valid, firstName: 'One' });
  button(tree, '+ Add Producers').props.onClick(); tree = env.render(Page, props);
  button(tree, '+ Add Producers').props.onClick();
  await new Promise(resolve => setImmediate(resolve)); tree = env.render(Page, props);
  const entries = cards(tree);
  assert.equal(entries.length, 3);
  assert.deepEqual(entries.map(item => item.props.producer.producerCode), ['PR00000001', 'PR00000002', 'PR00000003']);
  assert.equal(entries[0].props.producer.form.firstName, 'One');
  entries[1].props.onUpdate(entries[1].props.producer.id, { ...valid, firstName: 'Two' });
  entries[0].props.onToggleExpand(entries[0].props.producer.id);
  tree = env.render(Page, props);
  assert.deepEqual(cards(tree).map(item => item.props.producer.expanded), [false, true, true]);
  first = card(tree); first.props.onUpdate(first.props.producer.id, { firstName: 'One edited' });
  await cards(tree)[2].props.onValidateSave(cards(tree)[2].props.producer.id);
  tree = env.render(Page, props);
  assert.equal(cards(tree)[0].props.producer.form.firstName, 'One edited');
  assert.equal(cards(tree)[1].props.producer.form.firstName, 'Two');
  assert.equal(Object.keys(cards(tree)[0].props.producer.errors).length, 0);
  assert.ok(cards(tree)[2].props.producer.errors.firstName);
  await Promise.all(cards(tree).slice(0, 2).map(item => item.props.onValidateSave(item.props.producer.id)));
  assert.deepEqual(env.requests.map(row => row.first_name).sort(), ['One edited', 'Two']);
  assert.equal(new Set(env.requests.map(row => row.producer_draft_token)).size, 2);
  assert.deepEqual(cards(env.render(Page, props)).map(item => item.props.producer.dbId), [1, 2, undefined]);
});

test('Save uses the reservation and prevents duplicate creation', async () => {
  const env = setup(), Page = env.creation.default, props = { intermediaryId: 77, onBack() {} };
  let tree = await startPage(env, props), entry = card(tree);
  entry.props.onUpdate(entry.props.producer.id, valid);
  tree = env.render(Page, props); entry = card(tree);
  await Promise.all([entry.props.onValidateSave(entry.props.producer.id), entry.props.onValidateSave(entry.props.producer.id)]);
  assert.equal(env.requests.length, 1); assert.equal(env.requests[0].intermediary_id, 77);
  assert.equal(env.requests[0].producer_draft_token, 'reserved-1');
  assert.equal(env.requests[0].plcl_combined_license, '0123456789');
  assert.ok(!('id' in env.requests[0])); assert.ok(!('producer_code' in env.requests[0]));
  entry = card(env.render(Page, props));
  assert.equal(entry.props.producer.producerCode, 'PR00000001');
  await entry.props.onValidateSave(entry.props.producer.id); assert.equal(env.requests.length, 1);
});

test('Existing producer codes remain unchanged and existing cards are retained', async () => {
  const env = setup({ producers: { listByIntermediary: async () => [{ id: 77, producer_code: 'PR00000012', first_name: 'Existing', last_name: 'Producer', status: 'Active' }] } });
  const tree = await startPage(env, { intermediaryId: 77, onBack() {} });
  assert.equal(cards(tree).length, 2);
  assert.equal(cards(tree)[0].props.producer.producerCode, 'PR00000012');
  assert.equal(cards(tree)[0].props.producer.dbId, 77);
  assert.equal(cards(tree)[1].props.producer.producerCode, 'PR00000001');
});

test('Ten-digit combined/separate license validation remains enforced', () => {
  const env = setup();
  for (const bad of ['', '123456789', '12345678901', '12345abcde']) assert.ok(env.creation.getProducerErrors({ ...valid, combinedLicense: bad }).combinedLicense);
  assert.equal(Object.keys(env.creation.getProducerErrors(valid)).length, 0);
  const errors = env.creation.getProducerErrors({ ...valid, licReq: 'Separate', plLicense: '123', clLicense: '' });
  assert.ok(errors.plLicense); assert.ok(errors.clLicense);
});

test('Failed creation retains the same reserved ID and permits retry', async () => {
  let attempts = 0;
  const env = setup({ producers: { create: async payload => { assert.equal(payload.producer_draft_token, 'reserved-1'); if (++attempts === 1) throw new Error('offline'); return { id: 1, producer_code: 'PR00000001' }; } } });
  const Page = env.creation.default, props = { intermediaryId: 77, onBack() {} };
  let entry = card(await startPage(env, props)); entry.props.onUpdate(entry.props.producer.id, valid);
  entry = card(env.render(Page, props)); await entry.props.onValidateSave(entry.props.producer.id);
  entry = card(env.render(Page, props)); assert.equal(entry.props.producer.saved, false); assert.equal(entry.props.producer.producerCode, 'PR00000001');
  await entry.props.onValidateSave(entry.props.producer.id);
  assert.equal(card(env.render(Page, props)).props.producer.dbId, 1);
});

test('Partial address/state failures preserve the saved producer', async () => {
  const fail = async () => { throw new Error('unavailable'); };
  const env = setup({ producerAddress: { create: fail }, producerNrStates: { create: fail } });
  const result = await env.creation.createStandaloneProducer(77, { ...valid, addrLine1: '123 Test Street', nrRows: [{ id: 'draft', state: 'Alaska', license: '0123456789' }] }, 'reserved-1');
  assert.equal(result.created.id, 1); assert.equal(env.requests.length, 1); assert.equal(result.warnings.length, 2);
});

test('Wizard Save remains local with its existing navigation', async () => {
  const env = setup(), Page = env.creation.default, props = { onBack() {}, onNext() {} };
  let tree = env.render(Page, props), entry = card(tree); entry.props.onUpdate(entry.props.producer.id, valid);
  entry = card(env.render(Page, props)); await entry.props.onValidateSave(entry.props.producer.id);
  tree = env.render(Page, props); assert.equal(card(tree).props.producer.saved, true); assert.equal(env.requests.length, 0);
  assert.ok(button(tree, 'Previous')); assert.ok(button(tree, 'Save & Next'));
});
