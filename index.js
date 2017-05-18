
'use strict';

const fs = require('fs');
const path = require('path');

const type = require('./lib/get-type');



exports = module.exports = function pager(options){

  if (!options.collection){
    throw new Error('The "collection" setting must be specified')
  }

  if (!options.layoutName){
    throw new Error('The "layoutName" setting must be specified');
  }

  if (!options.paginationTemplatePath){
    throw new Error('The "paginationTemplatePath" setting must be specified');
  }

  if (type(options.elementsPerPage) != 'number'){
    throw new Error('The "elementsPerPage" setting must be specified as a number');
  }


  return function(files, metalsmith, done){

    const pagePattern = options.pagePattern || 'page/:PAGE/index.html';
    const elementsPerPage = options.elementsPerPage || 5;
    const pageLabel = options.pageLabel || ':PAGE';
    const metadata = metalsmith.metadata();
    const template = fs.readFileSync(path.join(metalsmith.source(), options.paginationTemplatePath));

    let groupedPosts;

    if (metadata.collections && metadata.collections[options.collection]){
      groupedPosts = metadata.collections[options.collection];
    }
    else {
      throw new Error(`The collection ${options.collection} does not exist.`);
    }

    const pageKeys = new Set();

    groupedPosts.forEach(function(post, i){

      const currentPage = Math.floor(i / elementsPerPage) + 1;
      const pageDist = options.index && currentPage == 1 ? options.index : pagePattern.replace(/:PAGE/, currentPage);

      if(!pageKeys.has(pageDist)){
        pageKeys.add(pageDist);
        files[pageDist] = Object.assign({}, files[pageDist], {
          canonical: pageDist,
          contents: template,
          layout: options.layoutName,
          pagination: {
            current: currentPage,
            files: []
          }
        });
      }

      files[pageDist].pagination.files.push(post);

    });

    const pagesInfo = [...pageKeys].map((el, i) => ({ path: el, index: i+1, label: pageLabel.replace(/:PAGE/, i+1) }));

    pagesInfo.forEach(function(el, i, all){
      files[el.path].pages = all;
      files[el.path].pagination.prev = i > 0 ? all[i-1].path : null;
      files[el.path].pagination.next = i < all.length-1 ? all[i+1].path : null;
    });

    done();

  };

};
