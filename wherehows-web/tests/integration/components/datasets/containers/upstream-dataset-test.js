import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { startMirage } from 'wherehows-web/initializers/ember-cli-mirage';
import { waitUntil, find, findAll, click } from 'ember-native-dom-helpers';
import { DatasetPlatform, PurgePolicy } from 'wherehows-web/constants';
import { hdfsUrn } from 'wherehows-web/mirage/fixtures/urn';

const upstreamElement = '.upstream-dataset';
const downstreamPolicyEditButton = '#downstream-purge-edit';
const purgePolicyClass = '.purge-policy-list__item';

moduleForComponent(
  'datasets/containers/upstream-dataset',
  'Integration | Component | datasets/containers/upstream dataset',
  {
    integration: true,

    beforeEach() {
      this.server = startMirage();
    },

    afterEach() {
      this.server.shutdown();
    }
  }
);

test('it renders', async function(assert) {
  assert.expect(1);
  const { server } = this;
  const { nativeName, platform, uri } = server.create('datasetView');

  this.set('urn', uri);
  this.set('platform', platform);

  this.render(hbs`{{datasets/containers/upstream-dataset urn=urn platform=platform}}`);

  await waitUntil(() => find(upstreamElement));

  assert.equal(find(upstreamElement).textContent.trim(), nativeName, 'renders the nativeName for the upstream element');
});

test('upstreams are rendered', async function(assert) {
  assert.expect(1);
  const { server } = this;
  const upstreamsCount = 4;
  const [{ uri, platform }] = server.createList('datasetView', upstreamsCount);

  this.set('urn', uri);
  this.set('platform', platform);

  this.render(hbs`{{datasets/containers/upstream-dataset urn=urn platform=platform}}`);

  await waitUntil(() => find(upstreamElement));

  assert.equal(
    findAll(upstreamElement).length,
    upstreamsCount,
    `renders ${upstreamsCount} elements for ${upstreamsCount} upstream datasets`
  );
});

test('Compliance Purge Policy', async function(assert) {
  assert.expect(3);

  const downstreamClass = '.downstream-purge-policy';
  const defaultMissingText = 'This dataset does not have a current compliance purge policy';
  const { server } = this;
  const { platform, uri } = server.create('datasetView');

  this.set('urn', uri);
  this.set('platform', platform);
  this.render(hbs`{{datasets/containers/upstream-dataset urn=urn platform=platform}}`);

  await waitUntil(() => find(downstreamClass));

  assert.equal(
    find(downstreamClass).textContent.trim(),
    defaultMissingText,
    'Shows the missing text string when there is no purge policy set'
  );

  assert.ok(find(downstreamPolicyEditButton), 'policy is editable');

  server.create('platform');
  server.create('retention');

  this.render(hbs`{{datasets/containers/upstream-dataset urn=urn platform=platform}}`);

  await waitUntil(() => find(purgePolicyClass) && find(purgePolicyClass).textContent.trim() !== defaultMissingText);

  assert.ok(find.bind(find, purgePolicyClass), 'purge policy radio is rendered');
});

test('Edit Compliance Purge Policy', async function(assert) {
  assert.expect(2);
  const { server } = this;
  const { platform, uri } = server.create('datasetView');
  const { supportedPurgePolicies } = server.create('platform');
  server.create('retention');

  this.set('urn', uri);
  this.set('platform', platform);
  this.render(hbs`{{datasets/containers/upstream-dataset urn=urn platform=platform}}`);

  await waitUntil(find.bind(find, downstreamPolicyEditButton));

  click(downstreamPolicyEditButton);

  assert.equal(findAll(purgePolicyClass).length, supportedPurgePolicies.length, 'renders all purge options on edit');
  assert.equal(
    find('.downstream-purge-policy__edit button').textContent.trim(),
    'Save',
    'clicking edit changes to edit mode'
  );
});
