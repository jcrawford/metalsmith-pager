# metalsmith-pager

A Metalsmith plugin for paginating collections of file.

It's meant to be used with [metalsmith-collections](https://github.com/segmentio/metalsmith-collections).

## setup

[Metalsmith](http://www.metalsmith.io/) is pluggable static site generator. All of the logic in Metalsmith is handled by plugins. `metalsmith-pager` is a metalsmith plugin that allows to paginate collections of file; it can be installed via NPM:

```
npm i -s metalsmith-pager
```

Usage in the Metalsmith API:

```
var paginate = require('metalsmith-pager');

var build = Metalsmith(__dirname)
.use(paginate({
    collection: 'MYCOLLECTION',
    elementsPerPage: 5,
    pagePattern: 'pages/:PAGE/index.html',
    index: 'index.html',
    paginationTemplatePath: '../layouts/partials/blogPagination.html',
    layoutName: 'default.html'
  }))
```

You will need to use the [metalsmith-in-place](https://github.com/superwolff/metalsmith-in-place) plugin to transform your template into HTML. Take a look at [`build-collection-pagination.js`](https://github.com/brunoscopelliti/metalsmith-pager/blob/master/build-collection-pagination.js) to have a demo of the correct usage. The results are available under [`sample/dist-collection-pagination`](https://github.com/brunoscopelliti/metalsmith-pager/tree/master/sample/dist-collection-pagination) folder.

## results

`metalsmith-pager` add the file for the paginated content to the metalsmith files collection. The key of these files respects the pattern defined by the option `pagePattern`.

From the template used by the paginated files it's possible to access the following properties:

```
files = {

  'index.html': ... ,

  ...

  'page/1/index.html': {
    pagination: {

      // index of the current page.
      current: 1,

      // path of the previous paginated trunk.
      // it's null in case the current page is the first trunk.
      prev: null,

      // path of the next paginated trunk.
      // it's null in case the current page is the last trunk.
      next: 'page/2/index.html',

      // list of files belonging to this trunk.
      // it's an array of metalsmith file object.
      files: []
    },

    // list of all the pages created
    pages: [
      { path: 'page/1/index.html', index: 1, label: '[ 1 ]' },
      { path: 'page/2/index.html', index: 2, label: '[ 2 ]' },
      ...
    ]
  }

}
```

## options

`metalsmith-pager` accepts the following settings:

```

collection
---
The name of the collection the files belong

elementsPerPage
---
The maximum number of element that could be displayed in the same page.

pagePattern
---
The pattern for the path at which the page trunk should be available.
It must contain the :PAGE placeholder, that will be replaced with the page number.
Default value is "page/:PAGE/index.html".

pageLabel
---
The format in which the page number should be displayed in the page navigation bar.
It must contain the :PAGE placeholder.
Default value is simply :PAGE.

index
---
The name of the file that will be the homepage.
This file will have the same info of the page "page/1/index.html".
This parameter is not mandatory.

paginationTemplatePath
---
The path where the pagination template is located.
It should be relative to the path configured as "source" for metalsmith.

layoutName
---
The name of the layout that should be used to create the page.
```

If you need to reverse the collection, use the `sortBy` and `reverse` options that come as a part of `metalsmith-collections`.
