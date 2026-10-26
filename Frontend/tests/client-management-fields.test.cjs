const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

let currentFrame;
const hookReact = {
  ...React,
  useState(initial) {
    const frame = currentFrame;
    const index = frame.cursor++;
    if (!(index in frame.state)) frame.state[index] = typeof initial === 'function' ? initial() : initial;
    return [frame.state[index], next => {
      frame.state[index] = typeof next === 'function' ? next(frame.state[index]) : next;
    }];
  },
  useRef(initial) {
    const frame = currentFrame;
    const index = frame.cursor++;
    if (!(index in frame.state)) frame.state[index] = { current: initial };
    return frame.state[index];
  },
  useEffect() { currentFrame.cursor++; },
};

const cache = new Map();
function load(file) {
  const filename = path.resolve(__dirname, '../src', file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const localRequire = request => {
    if (request === 'react') return hookReact;
    if (request.endsWith('.css')) return {};
    if (request.includes('SearchableSelect')) return { __esModule: true, default: () => null };
    if (request.includes('IntermediaryReferenceData')) {
      return { US_STATES: ['Alabama'], CANADA_PROVINCES: ['Ontario'] };
    }
    if (request.startsWith('.')) {
      const base = path.resolve(path.dirname(filename), request);
      const target = ['.ts', '.tsx'].map(extension => base + extension).find(fs.existsSync);
      if (!target) throw new Error(`Unknown local import: ${request}`);
      return load(path.relative(path.resolve(__dirname, '../src'), target));
    }
    return require(request);
  };
  vm.runInNewContext(`(function(require,module,exports){${compiled}\n})`, {
    console,
    window: { innerWidth: 1280, innerHeight: 800 },
    document: { addEventListener() {}, removeEventListener() {} },
  }, { filename })(localRequire, module, module.exports);
  return module.exports;
}

const fields = load('utils/fieldValidation.ts');
const validation = load('pages/ClientManagement/validation.ts');

function render(component, props, frame = { state: [], cursor: 0 }) {
  currentFrame = frame;
  frame.cursor = 0;
  return { tree: component(props), frame };
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

test('North American telephone values normalize and format without duplicating +1', () => {
  assert.equal(fields.normalizeNorthAmericanPhone('+1 (740) 283-3333'), '7402833333');
  assert.equal(fields.formatPhone('+1 (740) 283-3333'), '(740) 283-3333');
  assert.equal(fields.isValidPhone('+1 (740) 283-3333'), true);
  assert.equal(fields.isValidPhone('740283333'), false);
  assert.equal(fields.isValidPhone('+12 740 283-3333'), false);
});

test('Client contact validation rejects equal telephone numbers after normalization', () => {
  const errors = validation.validateContact({
    name: 'Alex Mercer', title: 'Admin', emailId: 'alex@example.com',
    telephoneNumber: '+1 (740) 283-3333', altTelephoneNumber: '740-283-3333',
  });
  assert.equal(errors.altTelephoneNumber, 'Telephone and Alternative Telephone must be different');
});

test('Year Business Started remains optional and validates a selected four-digit year', () => {
  const base = {
    companyName: 'Hudson Bailey Insurance', typeOfCompany: 'MGA', domicileCountry: 'United States',
    stateOfDomicile: 'Alabama', federalTaxId: '23-4567890', yearBusinessStarted: '',
  };
  assert.equal(validation.validateClientInfo(base, true).yearBusinessStarted, undefined);
  assert.equal(validation.validateClientInfo({ ...base, yearBusinessStarted: '1993' }, true).yearBusinessStarted, undefined);
  assert.ok(validation.validateClientInfo({ ...base, yearBusinessStarted: '1599' }, true).yearBusinessStarted);
});

test('Year picker exposes the #### input, opens from its calendar button, and selects a year directly', () => {
  const components = load('components/ui/DatePicker.tsx');
  let selected = '';
  const props = { mode: 'year', value: '', onChange: value => { selected = value; } };
  let view = render(components.default, props);
  assert.equal(nodes(view.tree).find(node => node.type === 'input').props.placeholder, '####');
  const trigger = nodes(view.tree).find(node => node.props?.['aria-label'] === 'Choose year');
  assert.equal(trigger.props['aria-expanded'], false);
  view.frame.state[4].current = { getBoundingClientRect: () => ({ left: 20, top: 20, bottom: 54 }) };
  trigger.props.onClick();
  view = render(components.default, props, view.frame);
  assert.ok(nodes(view.tree).some(node => node.props?.role === 'dialog' && node.props?.['aria-label'] === 'Choose Year'));
  const year = nodes(view.tree).find(node => node.type === 'button' && /^\d{4}$/.test(text(node)) && !node.props.disabled);
  year.props.onClick();
  assert.match(selected, /^\d{4}$/);
});

test('Phone input defaults to US, offers Canada, limits national digits, and formats view mode with one +1', () => {
  const components = load('pages/ClientManagement/ClientFormFields.tsx');
  const countries = load('components/ui/PhoneCountrySelect.tsx');
  let country;
  let phone;
  const props = {
    value: '+1 (740) 283-3333', cc: undefined,
    onChange: value => { phone = value; }, onCcChange: value => { country = value; },
  };
  const phoneView = render(components.PhoneInput, props);
  const selector = nodes(phoneView.tree).find(node => node.type === countries.default);
  assert.equal(selector.props.value, countries.PHONE_COUNTRY_US);
  assert.equal(nodes(phoneView.tree).find(node => node.type === 'input').props.value, '(740) 283-3333');

  let view = render(countries.default, selector.props);
  const countryButton = nodes(view.tree).find(node => node.props?.['aria-label'] === 'Phone country');
  assert.ok(nodes(countryButton).some(node => String(node.props?.className).includes('flag-us')));
  countryButton.props.onClick();
  view = render(countries.default, selector.props, view.frame);
  const options = nodes(view.tree).filter(node => node.props?.role === 'option');
  assert.deepEqual(options.map(option => text(option)), ['United States +1', 'Canada +1']);
  options[1].props.onMouseDown();
  assert.equal(country, components.PHONE_CC_CA);
  nodes(phoneView.tree).find(node => node.type === 'input').props.onChange({ target: { value: '74028333339' } });
  assert.equal(phone, '7402833333');
  assert.equal(components.formatPhoneWithFlag('+1 (740) 283-3333', components.PHONE_CC_CA), '+1 (740) 283-3333');
});
