
'use strict';

const fs = require('fs');
const path = require('path');


const fatal = require('./lib/log-fatal-error');
const filterObj = require('./lib/filter-object');
const type = require('./lib/get-type');


function validateSettings(settings){

  if (!settings.collection){
    throw new TypeError('The "collection" setting must be specified');
  }

  if (!settings.layoutName){
    throw new TypeError('The "layoutName" setting must be specified');
  }

  if (!settings.paginationTemplatePath){
    throw new TypeError('The "paginationTemplatePath" setting must be specified');
  }

  if (type(settings.elementsPerPage) != 'number'){
    throw new TypeError('The "elementsPerPage" setting must be specified as a number');
  }

}

exports = module.exports = function pager(options){

  try{
    validateSettings(options);
  } catch(err){
    return void fatal(err.message);
  }

  return function(files, metalsmith, done){

    const pagePattern = options.pagePattern || 'page/:PAGE/index.html';
    const elementsPerPage = options.elementsPerPage || 5;
    const pageLabel = options.pageLabel || ':PAGE';

    const paginationTemplatePath = path.join(metalsmith._source, options.paginationTemplatePath);

    try{
      // check the pagination template exists,
      // and the user has the rights to read its content
      fs.accessSync(paginationTemplatePath, fs.R_OK);
    }
    catch(err){
      return void fatal(err.message);
    }


    const template = fs.readFileSync(paginationTemplatePath);

    const groupedPosts = filterObj(files, function(all, k){
      return Array.isArray(all[k].collection) && all[k].collection.indexOf(options.collection) >= 0;
    });


    const pageKeys = new Set();

    //
    // enrich the metalsmith "files" collections with the pages
    // which contains the "paginated list of pages"
    groupedPosts.reduce(function(fileList, collectionEntry, index) {

      const currentPage = Math.floor(index / elementsPerPage) + 1;
      const pageDist = pagePattern.replace(/:PAGE/, currentPage);

      if (fileList[pageDist] == null){
        fileList[pageDist] = {
          contents: template,
          layout: options.layoutName,
          pagination: { current: currentPage, files: [] }
        }
      }

      pageKeys.add(pageDist);
      fileList[pageDist].pagination.files.push(collectionEntry);

      return fileList;

    }, files);


    const pagesInfo = [...pageKeys].map((el, i) => ({ path: el, index: i+1, label: pageLabel.replace(/:PAGE/, i+1) }));
    for (let key of pageKeys.values()){
      files[key].pages = pagesInfo;
    }


    done();

  };

};
