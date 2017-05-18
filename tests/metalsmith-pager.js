'use strict';

const fs = require('fs');
const tape = require('tape');
const sinon = require('sinon');
const sut = require('../index');

function metalSmithFromFiles(files) {

  const collections = {}
  Object.keys(files).forEach(function(key) {
    if(files[key].collection) {
      files[key].collection.forEach(function(col) {
        if(!collections[col]) {
          collections[col] = []
        }
        collections[col].push({
          path: key,
          contents: Buffer.from(files[key].contents)
        })
      })
    }
  })

  return {
    source: () => '',
    metadata: function() {
      return {
        collections: collections
      };
    }
  }
}

tape('metalsmith-pager.js:', function(t) { t.end(); });

tape('check settings are validated', function(t) {

  const options = {};

  t.throws(()=>sut(options), /The "collection" setting must be specified/i, 'check exception "collection"');

  options.collection = 'posts';
  t.throws(()=>sut(options), /The "layoutName" setting must be specified/i, 'check exception "layoutName"');

  options.layoutName = 'archive.html';
  t.throws(()=>sut(options), /The "paginationTemplatePath" setting must be specified/i, 'check exception "paginationTemplatePath"');

  options.paginationTemplatePath = '__partials/pager.html';
  t.throws(()=>sut(options), /The "elementsPerPage" setting must be specified/i, 'check exception "elementsPerPage"');

  options.elementsPerPage = 5;

  t.equal(typeof sut(options), 'function', 'returns the plugin function');

  t.end();

});

tape('metalsmith "done" callback is called when pager plugin terminates its execution', function(t) {

  const options = {
    collection: 'posts',
    elementsPerPage: 3,
    paginationTemplatePath: '__partials/pagination.html',
    layoutName: 'archive.html'
  };

  const pager = sut(options);


  const files = {
    '/post1': { collection: ['pages'], contents: new Buffer('Hello world!') },
    '/post2': { collection: ['posts'], contents: new Buffer('Latest is a post! YAHOO.') },
  }

  const metalsmith = metalSmithFromFiles(files)

  const doneSpy = sinon.spy();

  let readFileSync = sinon.stub(fs, 'readFileSync');

  pager(files, metalsmith, doneSpy);

  t.ok(doneSpy.calledOnce, 'When computation ends, the "done" callback is executed.');

  readFileSync.restore();

  t.end();

});

tape('the "pagination" property is populated with the paginated data (pagination by collection)', function(t) {

  const options = {
    collection: 'posts',
    elementsPerPage: 3,
    pagePattern: ':PAGE/index.html',
    pageLabel: '<:PAGE>',
    index: 'boom.html',
    paginationTemplatePath: '__partials/pagination.html',
    layoutName: 'archive.html'
  };

  const pager = sut(options);

  const files = {
    'boom.html': { contents: new Buffer('The index!') },
    '/post1': { collection: ['pages'], contents: new Buffer('Hello world!') },
    '/post2': { collection: ['posts', 'pages'], contents: new Buffer('This is both a post both a page.') },
    '/post3': { collection: ['pages', 'posts'], contents: new Buffer('This is both a page both a post. Strange.') },
    '/post4': { collection: ['posts'], contents: new Buffer('Yeah, really strange!') },
    '/post5': { collection: ['posts'], contents: new Buffer('Cool Stuff.') },
    '/post6': { collection: ['posts'], contents: new Buffer('The sixth post.') },
    '/post7': { collection: ['posts'], contents: new Buffer('Just another post.') },
    '/post8': { collection: ['posts'], contents: new Buffer('Almost done here.') },
    '/post9': { collection: [], contents: new Buffer('This is nothing.') },
    '/post10': { collection: ['posts'], contents: new Buffer('Latest is a post! YAHOO.') },
  }

  const metalsmith = metalSmithFromFiles(files)

  const doneSpy = sinon.spy();

  let readFileSync = sinon.stub(fs, 'readFileSync').returns('hbs contents');
  let pages = ['boom.html', '2/index.html', '3/index.html'];

  pager(files, metalsmith, doneSpy);

  pages.forEach(function(page, i){

    t.ok(files.hasOwnProperty(page, 'check props'));

    t.equal(files[page].pages.length, pages.length, 'check number of pages');
    t.equal(files[page].pages.map(x => x.label)[i], '<'+(i+1)+'>', 'check page label');

    t.equal(files[page].contents, 'hbs contents', 'check contents');
    t.equal(files[page].layout, 'archive.html', 'check layout');


    t.equal(files[page].pagination.files.length, i<2 ? 3 : 2, 'check files per page (page '+page+')');
    if(i > 0) t.equal(files[page].pagination.prev, pages[i-1], 'check previous');
    if(i < 2) t.equal(files[page].pagination.next, pages[i+1], 'check next');
  });

  t.ok(!files.hasOwnProperty('4/index.html'), 'check props missing');

  readFileSync.restore();

  t.end();

});

tape('an index.html page is not created with obmission of the index property', function(t) {

  const options = {
    collection: 'pages',
    elementsPerPage: 3,
    pagePattern: ':PAGE/index.html',
    pageLabel: '<:PAGE>',
    paginationTemplatePath: '__partials/pagination.html',
    layoutName: 'archive.html'
  };

  const pager = sut(options);

  const files = {
    '/post1': { collection: ['pages'], contents: new Buffer('Hello world!') },
    '/post2': { collection: ['pages'], contents: new Buffer('This is both a post both a page.') },
  }

  const metalsmith = metalSmithFromFiles(files)

  const doneSpy = sinon.spy();

  let readFileSync = sinon.stub(fs, 'readFileSync').returns('hbs contents');

  pager(files, metalsmith, doneSpy);

  t.ok(!files.hasOwnProperty('index.html'), 'check index.html missing');

  readFileSync.restore();

  t.end();

});
